import { and, eq } from 'drizzle-orm'
import { resolveCombatHp } from '@domain/combat/combat-hp'
import {
  canAccessSocialBlueprint,
  clampMedicoHeal,
  getRemainingDailyBudget,
  isMedicoCraftBlueprint,
  listAccessibleSocialBlueprints,
  medicoBlueprintCatalogKey,
  medicoProcedureBudgetCost,
  type SocialDailyUsage,
  EMPTY_SOCIAL_DAILY_USAGE,
} from '@domain/shakai-kaikyu'
import { getSocialBlueprint } from '@domain/shakai-kaikyu/blueprint-catalog'
import type { SocialSubclassSheet } from '@domain/shakai-kaikyu/types'
import { db } from '../../plugins/db'
import { characters, socialClassDailyUsage } from '../../db/schema'
import { characterService } from '../characters/characters.service'
import { insertMessage, isValidRoom } from '../chat/chat.service'
import {
  addItemByCatalogKey,
  consumeMaterialsByCatalogKey,
  getCharacterInventory,
} from '../inventory/inventory.service'
import { broadcastCharacterHpUpdated, broadcastInventoryUpdated } from '../realtime/ws.routes'
import * as presence from '../realtime/presence.store'

function utcDayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10)
}

function normalizeSubclassSheet(raw: Record<string, boolean> | null | undefined): SocialSubclassSheet {
  if (!raw || typeof raw !== 'object') return {}
  const sheet: Record<string, boolean> = {}
  for (const [id, value] of Object.entries(raw)) {
    if (value === true) sheet[id] = true
  }
  return sheet
}

async function loadMedicoCharacter(characterId: string) {
  const char = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
    columns: {
      id: true,
      name: true,
      surname: true,
      socialClass: true,
      socialSubclassSheet: true,
      currentHp: true,
    },
  })
  if (!char || char.socialClass !== 'ishi') {
    throw new Error('Solo i Medici (Ishi) possono usare questo strumento.')
  }
  return char
}

async function getDailyUsage(characterId: string, dayKey: string): Promise<SocialDailyUsage> {
  const row = await db.query.socialClassDailyUsage.findFirst({
    where: and(
      eq(socialClassDailyUsage.characterId, characterId),
      eq(socialClassDailyUsage.dayKey, dayKey),
    ),
  })
  if (!row) return { ...EMPTY_SOCIAL_DAILY_USAGE }
  return {
    healHpUsed: row.healHpUsed ?? 0,
    integrityUsed: row.integrityUsed ?? 0,
    gatherUsed: row.gatherUsed ?? 0,
    pactWeightUsed: row.pactWeightUsed ?? 0,
    ofudaPowerUsed: row.ofudaPowerUsed ?? 0,
  }
}

async function incrementHealHpUsed(characterId: string, dayKey: string, by: number): Promise<number> {
  const existing = await db.query.socialClassDailyUsage.findFirst({
    where: and(
      eq(socialClassDailyUsage.characterId, characterId),
      eq(socialClassDailyUsage.dayKey, dayKey),
    ),
  })
  if (existing) {
    const next = (existing.healHpUsed ?? 0) + by
    await db
      .update(socialClassDailyUsage)
      .set({ healHpUsed: next })
      .where(
        and(
          eq(socialClassDailyUsage.characterId, characterId),
          eq(socialClassDailyUsage.dayKey, dayKey),
        ),
      )
    return next
  }
  await db.insert(socialClassDailyUsage).values({
    characterId,
    dayKey,
    healHpUsed: by,
  })
  return by
}

function displayName(char: { name: string; surname?: string | null }): string {
  return [char.name, char.surname].filter(Boolean).join(' ')
}

async function resolveHpVitals(characterId: string) {
  const bundle = await characterService.getSkiruBundleForCharacter(characterId)
  if (!bundle) throw new Error('Personaggio non trovato')
  const char = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
    columns: { currentHp: true },
  })
  const hpMax = bundle.computed.hpMax ?? 0
  return resolveCombatHp(char?.currentHp, hpMax)
}

function resolveMedicoRoom(characterId: string): string | null {
  const online = presence.getAllOnlineUsers().find((u) => u.characterId === characterId)
  if (!online) return null
  return presence.getRoom(online.wsId)
}

export async function getMedicoToolState(healerCharacterId: string) {
  const healer = await loadMedicoCharacter(healerCharacterId)
  const dayKey = utcDayKey()
  const usage = await getDailyUsage(healerCharacterId, dayKey)
  const subclassSheet = normalizeSubclassSheet(
    healer.socialSubclassSheet as Record<string, boolean> | undefined,
  )
  const dailyBudget = getRemainingDailyBudget('ishi', subclassSheet, usage)
  const blueprints = listAccessibleSocialBlueprints('ishi', subclassSheet)
    .filter(isMedicoCraftBlueprint)
    .map((bp) => ({
      id: bp.id,
      name: bp.name,
      description: bp.description,
      materials: bp.materials ?? [],
      catalogKey: medicoBlueprintCatalogKey(bp.id),
    }))

  return {
    dayKey,
    dailyBudget: dailyBudget.healHp,
    blueprints,
  }
}

export async function getMedicoHealTargets(healerCharacterId: string) {
  await loadMedicoCharacter(healerCharacterId)
  const selfVitals = await resolveHpVitals(healerCharacterId)
  const healer = await db.query.characters.findFirst({
    where: eq(characters.id, healerCharacterId),
    columns: { name: true, surname: true },
  })

  const targets: Array<{
    id: string
    name: string
    hpCurrent: number
    hpMax: number
    isSelf: boolean
  }> = [
    {
      id: healerCharacterId,
      name: healer ? displayName(healer) : 'Tu',
      hpCurrent: selfVitals.hpCurrent,
      hpMax: selfVitals.hpMax,
      isSelf: true,
    },
  ]

  const online = presence.getAllOnlineUsers()
  const seen = new Set<string>([healerCharacterId])

  for (const user of online) {
    if (seen.has(user.characterId)) continue
    seen.add(user.characterId)
    const vitals = await resolveHpVitals(user.characterId)
    targets.push({
      id: user.characterId,
      name: user.name,
      hpCurrent: vitals.hpCurrent,
      hpMax: vitals.hpMax,
      isSelf: false,
    })
  }

  return { targets }
}

export async function medicoHealCharacter(
  healerCharacterId: string,
  input: { targetCharacterId: string; amount: number; roomId?: string },
) {
  const healer = await loadMedicoCharacter(healerCharacterId)
  const dayKey = utcDayKey()
  const usage = await getDailyUsage(healerCharacterId, dayKey)
  const subclassSheet = normalizeSubclassSheet(
    healer.socialSubclassSheet as Record<string, boolean> | undefined,
  )
  const budget = getRemainingDailyBudget('ishi', subclassSheet, usage)

  const target = await db.query.characters.findFirst({
    where: eq(characters.id, input.targetCharacterId),
    columns: { id: true, name: true, surname: true, currentHp: true },
  })
  if (!target) throw new Error('Bersaglio non trovato.')

  const targetVitals = await resolveHpVitals(target.id)
  const { applied, budgetCost } = clampMedicoHeal({
    requested: input.amount,
    budgetRemaining: budget.healHp.remaining,
    targetHpCurrent: targetVitals.hpCurrent,
    targetHpMax: targetVitals.hpMax,
  })

  if (applied <= 0) {
    throw new Error('Nessuna cura applicabile (bersaglio pieno o budget esaurito).')
  }

  const vitals = await characterService.applyCombatHpDelta(target.id, applied, {
    supporterCharacterId: healerCharacterId,
  })

  await incrementHealHpUsed(healerCharacterId, dayKey, budgetCost)
  broadcastCharacterHpUpdated({ characterId: target.id, ...vitals })

  const healerName = displayName(healer)
  const targetName = displayName(target)
  const budgetAfter = budget.healHp.remaining - budgetCost
  const logLine = `[Medico] ${healerName} cura ${healerCharacterId === target.id ? 'sé stessə' : targetName} per ${applied} HP. Budget residuo: ${budgetAfter}/${budget.healHp.max}.`

  const roomId = input.roomId?.trim() || resolveMedicoRoom(healerCharacterId)
  if (roomId && isValidRoom(roomId)) {
    await insertMessage(roomId, healerCharacterId, logLine, null, false, null, null, false, true)
  }

  return {
    applied,
    budgetCost,
    budgetRemaining: budgetAfter,
    budgetMax: budget.healHp.max,
    target: { id: target.id, name: targetName, ...vitals },
    loggedToRoom: roomId && isValidRoom(roomId) ? roomId : null,
  }
}

export async function medicoCraftPreparation(healerCharacterId: string, blueprintId: string) {
  const healer = await loadMedicoCharacter(healerCharacterId)
  const blueprint = getSocialBlueprint(blueprintId)
  if (!blueprint || blueprint.classId !== 'ishi') {
    throw new Error('Ricetta medico non trovata.')
  }

  const subclassSheet = normalizeSubclassSheet(
    healer.socialSubclassSheet as Record<string, boolean> | undefined,
  )
  if (!canAccessSocialBlueprint('ishi', subclassSheet, blueprintId)) {
    throw new Error('Ricetta non sbloccata nel tuo albero sottoclassi.')
  }

  const materials = blueprint.materials ?? []
  if (materials.length === 0) {
    throw new Error('Ricetta senza materiali.')
  }

  await consumeMaterialsByCatalogKey(healerCharacterId, materials)

  if (blueprint.kind === 'procedure' || blueprint.isProcedure) {
    const dayKey = utcDayKey()
    const usage = await getDailyUsage(healerCharacterId, dayKey)
    const budget = getRemainingDailyBudget('ishi', subclassSheet, usage)
    const procedureCost = medicoProcedureBudgetCost(blueprint)
    if (procedureCost > budget.healHp.remaining) {
      throw new Error(`Budget cura insufficiente (${procedureCost} HP richiesti).`)
    }
    await incrementHealHpUsed(healerCharacterId, dayKey, procedureCost)
    broadcastInventoryUpdated(healerCharacterId)
    return {
      blueprintId,
      name: blueprint.name,
      procedure: true,
      budgetCost: procedureCost,
    }
  }

  if (!isMedicoCraftBlueprint(blueprint)) {
    throw new Error('Questa voce non è una ricetta craftabile.')
  }

  const catalogKey = medicoBlueprintCatalogKey(blueprintId)
  await addItemByCatalogKey(healerCharacterId, catalogKey, 1, {
    origin: 'craftato',
    craftedByCharacterId: healerCharacterId,
    craftedByName: displayName(healer),
    blueprintId,
  })

  broadcastInventoryUpdated(healerCharacterId)

  return {
    blueprintId,
    name: blueprint.name,
    catalogKey,
    procedure: false,
  }
}

export async function getMedicoCraftInventory(healerCharacterId: string) {
  await loadMedicoCharacter(healerCharacterId)
  const inv = await getCharacterInventory(healerCharacterId)
  const materials = inv.items.filter(
    (row) => row.economy.category === 'materiale' && row.location === 'CARRY',
  )
  return { materials }
}
