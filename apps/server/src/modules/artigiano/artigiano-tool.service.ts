import { and, eq } from 'drizzle-orm'
import {
  artigianoProcedureIntegrityCost,
  artigianoProjectCatalogKey,
  canAccessSocialBlueprint,
  canRepairInventoryItem,
  clampIntegrityRepair,
  getRemainingDailyBudget,
  isArtigianoCraftBlueprint,
  listAccessibleSocialBlueprints,
  type SocialDailyUsage,
  EMPTY_SOCIAL_DAILY_USAGE,
} from '@domain/shakai-kaikyu'
import { getSocialBlueprint } from '@domain/shakai-kaikyu/blueprint-catalog'
import type { ItemCategory } from '@domain/economy/types'
import { usesIntegrity } from '@domain/economy/items'
import type { SocialSubclassSheet } from '@domain/shakai-kaikyu/types'
import { db } from '../../plugins/db'
import { characters, inventory, socialClassDailyUsage } from '../../db/schema'
import { insertMessage, isValidRoom } from '../chat/chat.service'
import {
  addItemByCatalogKey,
  consumeMaterialsByCatalogKey,
  getCharacterInventory,
} from '../inventory/inventory.service'
import { broadcastInventoryUpdated } from '../realtime/ws.routes'
import * as presence from '../realtime/presence.store'
import { isArtigianoFromSkiruSheet } from '@domain/economy/dismantle'

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

async function loadArtigianoCharacter(characterId: string) {
  const char = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
    columns: {
      id: true,
      name: true,
      surname: true,
      socialClass: true,
      socialSubclassSheet: true,
      skiruSheet: true,
    },
  })
  if (!char) throw new Error('Personaggio non trovato.')
  const isArtigiano =
    char.socialClass === 'shokunin' ||
    isArtigianoFromSkiruSheet((char.skiruSheet ?? {}) as Record<string, number>)
  if (!isArtigiano) {
    throw new Error('Solo gli Artigiani (Shokunin) possono usare questo strumento.')
  }
  return char
}

function resolveArtigianoSubclassSheet(char: {
  socialClass: string | null
  socialSubclassSheet: unknown
  skiruSheet: unknown
}): SocialSubclassSheet {
  if (char.socialClass === 'shokunin') {
    return normalizeSubclassSheet(char.socialSubclassSheet as Record<string, boolean> | undefined)
  }
  // Legacy gate Skiru: budget keystone minimo
  return { 'shokunin-minarai': true }
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

async function incrementIntegrityUsed(characterId: string, dayKey: string, by: number): Promise<number> {
  const existing = await db.query.socialClassDailyUsage.findFirst({
    where: and(
      eq(socialClassDailyUsage.characterId, characterId),
      eq(socialClassDailyUsage.dayKey, dayKey),
    ),
  })
  if (existing) {
    const next = (existing.integrityUsed ?? 0) + by
    await db
      .update(socialClassDailyUsage)
      .set({ integrityUsed: next })
      .where(
        and(
          eq(socialClassDailyUsage.characterId, characterId),
          eq(socialClassDailyUsage.dayKey, dayKey),
        ),
      )
    return next
  }
  await db.insert(socialClassDailyUsage).values({ characterId, dayKey, integrityUsed: by })
  return by
}

function displayName(char: { name: string; surname?: string | null }): string {
  return [char.name, char.surname].filter(Boolean).join(' ')
}

function resolveArtigianoRoom(characterId: string): string | null {
  const online = presence.getAllOnlineUsers().find((u) => u.characterId === characterId)
  if (!online) return null
  return presence.getRoom(online.wsId)
}

async function logArtigianoAction(characterId: string, line: string, roomId?: string) {
  const resolved = roomId?.trim() || resolveArtigianoRoom(characterId)
  if (resolved && isValidRoom(resolved)) {
    await insertMessage(resolved, characterId, line, null, false, null, null, false, true)
  }
  return resolved && isValidRoom(resolved) ? resolved : null
}

export async function getArtigianoToolState(characterId: string) {
  const char = await loadArtigianoCharacter(characterId)
  const dayKey = utcDayKey()
  const usage = await getDailyUsage(characterId, dayKey)
  const subclassSheet = resolveArtigianoSubclassSheet(char)
  const dailyBudget = getRemainingDailyBudget('shokunin', subclassSheet, usage)
  const blueprints = listAccessibleSocialBlueprints('shokunin', subclassSheet)
    .filter((bp) => bp.kind === 'project' || (bp.kind === 'procedure' && bp.isProcedure))
    .map((bp) => ({
      id: bp.id,
      name: bp.name,
      description: bp.description,
      kind: bp.kind,
      materials: bp.materials ?? [],
      dailyBudgetCost: bp.dailyBudgetCost ?? 0,
      catalogKey: bp.kind === 'project' ? artigianoProjectCatalogKey(bp.id) : undefined,
      isProcedure: bp.isProcedure === true,
    }))

  return { dayKey, dailyBudget: dailyBudget.integrity, blueprints }
}

export async function getArtigianoRepairInventory(characterId: string) {
  await loadArtigianoCharacter(characterId)
  const inv = await getCharacterInventory(characterId)
  const items = inv.items
    .filter((row) => row.location === 'CARRY')
    .map((row) => {
      const eco = row.economy
      const integrityMax = eco.integrityMax ?? 0
      const integrityCurrent = eco.integrityCurrent ?? integrityMax
      const check = canRepairInventoryItem({
        category: eco.category,
        integrityCurrent,
        integrityMax,
        isEquipped: row.isEquipped,
      })
      return {
        ...row,
        canRepair: check.ok,
        repairBlockReason: check.ok ? undefined : check.reason,
        integrityCurrent,
        integrityMax,
      }
    })
  const status = await getArtigianoToolState(characterId)
  return { items, repair: status.dailyBudget }
}

export async function repairInventoryItem(
  characterId: string,
  input: { inventoryId: string; amount?: number; roomId?: string },
) {
  const char = await loadArtigianoCharacter(characterId)
  const dayKey = utcDayKey()
  const usage = await getDailyUsage(characterId, dayKey)
  const subclassSheet = resolveArtigianoSubclassSheet(char)
  const budget = getRemainingDailyBudget('shokunin', subclassSheet, usage)

  const inv = await db.query.inventory.findFirst({
    where: and(eq(inventory.id, input.inventoryId), eq(inventory.characterId, characterId)),
    with: { item: true },
  })
  if (!inv?.item) throw new Error('Oggetto non trovato nell\'inventario.')

  const category = (inv.item.category ?? 'junk') as ItemCategory
  const integrityMax = inv.item.integrityMax ?? 0
  const integrityCurrent = inv.integrityCurrent ?? integrityMax

  const check = canRepairInventoryItem({
    category,
    integrityCurrent,
    integrityMax,
    isEquipped: inv.isEquipped ?? false,
  })
  if (!check.ok) throw new Error(check.reason ?? 'Oggetto non riparabile.')

  const requested = input.amount ?? integrityMax - integrityCurrent
  const { applied, budgetCost } = clampIntegrityRepair({
    requested,
    budgetRemaining: budget.integrity.remaining,
    integrityCurrent,
    integrityMax,
  })
  if (applied <= 0) {
    throw new Error('Nessuna riparazione applicabile (integrità piena o budget esaurito).')
  }

  const nextIntegrity = integrityCurrent + applied
  await db.update(inventory).set({ integrityCurrent: nextIntegrity }).where(eq(inventory.id, inv.id))
  await incrementIntegrityUsed(characterId, dayKey, budgetCost)

  const budgetAfter = budget.integrity.remaining - budgetCost
  const line = `[Artigiano] ${displayName(char)} ripara ${inv.item.name} (+${applied} INT → ${nextIntegrity}/${integrityMax}). Budget residuo: ${budgetAfter}/${budget.integrity.max}.`
  const loggedToRoom = await logArtigianoAction(characterId, line, input.roomId)

  broadcastInventoryUpdated(characterId)

  return {
    inventoryId: inv.id,
    itemName: inv.item.name,
    applied,
    integrityCurrent: nextIntegrity,
    integrityMax,
    budgetCost,
    budgetRemaining: budgetAfter,
    budgetMax: budget.integrity.max,
    loggedToRoom,
  }
}

export async function craftArtigianoProject(
  characterId: string,
  input: { blueprintId: string; inventoryId?: string; roomId?: string },
) {
  const char = await loadArtigianoCharacter(characterId)
  const blueprint = getSocialBlueprint(input.blueprintId)
  if (!blueprint || blueprint.classId !== 'shokunin') {
    throw new Error('Progetto artigiano non trovato.')
  }

  const subclassSheet = resolveArtigianoSubclassSheet(char)
  if (!canAccessSocialBlueprint('shokunin', subclassSheet, input.blueprintId)) {
    throw new Error('Progetto non sbloccato nel tuo albero sottoclassi.')
  }

  const materials = blueprint.materials ?? []
  if (materials.length === 0) throw new Error('Progetto senza materiali.')

  await consumeMaterialsByCatalogKey(characterId, materials)

  const dayKey = utcDayKey()
  const usage = await getDailyUsage(characterId, dayKey)
  const budget = getRemainingDailyBudget('shokunin', subclassSheet, usage)

  if (blueprint.kind === 'procedure' && blueprint.isProcedure) {
    if (!input.inventoryId) {
      throw new Error('Seleziona l\'oggetto da rifornire per questa procedura.')
    }
    const procedureCost = artigianoProcedureIntegrityCost(blueprint)
    if (procedureCost > budget.integrity.remaining) {
      throw new Error(`Budget integrità insufficiente (${procedureCost} richiesti).`)
    }

    const inv = await db.query.inventory.findFirst({
      where: and(eq(inventory.id, input.inventoryId), eq(inventory.characterId, characterId)),
      with: { item: true },
    })
    if (!inv?.item) throw new Error('Oggetto non trovato.')
    const category = (inv.item.category ?? 'junk') as ItemCategory
    if (!usesIntegrity(category)) throw new Error('Procedura valida solo su oggetti con integrità.')
    const integrityMax = inv.item.integrityMax ?? 0
    if (integrityMax <= 0) throw new Error('Oggetto senza integrità.')

    await db.update(inventory).set({ integrityCurrent: integrityMax }).where(eq(inventory.id, inv.id))
    await incrementIntegrityUsed(characterId, dayKey, procedureCost)

    const budgetAfter = budget.integrity.remaining - procedureCost
    const line = `[Artigiano] ${displayName(char)} esegue ${blueprint.name} su ${inv.item.name} (INT ${integrityMax}/${integrityMax}). Budget residuo: ${budgetAfter}/${budget.integrity.max}.`
    const loggedToRoom = await logArtigianoAction(characterId, line, input.roomId)
    broadcastInventoryUpdated(characterId)

    return {
      blueprintId: blueprint.id,
      name: blueprint.name,
      procedure: true,
      inventoryId: inv.id,
      budgetCost: procedureCost,
      budgetRemaining: budgetAfter,
      loggedToRoom,
    }
  }

  if (!isArtigianoCraftBlueprint(blueprint)) {
    throw new Error('Questa voce non è un progetto craftabile.')
  }

  const catalogKey = artigianoProjectCatalogKey(input.blueprintId)
  await addItemByCatalogKey(characterId, catalogKey, 1, {
    origin: 'craftato',
    craftedByCharacterId: characterId,
    craftedByName: displayName(char),
    blueprintId: input.blueprintId,
  })

  const line = `[Artigiano] ${displayName(char)} costruisce ${blueprint.name}.`
  const loggedToRoom = await logArtigianoAction(characterId, line, input.roomId)
  broadcastInventoryUpdated(characterId)

  return {
    blueprintId: blueprint.id,
    name: blueprint.name,
    catalogKey,
    procedure: false,
    loggedToRoom,
  }
}
