import { and, desc, eq } from 'drizzle-orm'
import {
  canAccessSocialBlueprint,
  getRemainingDailyBudget,
  hasYumetokiPath,
  isSacerdoteRiteBlueprint,
  listAccessibleSocialBlueprints,
  resolveDailyLimitFromSubclasses,
  sacerdoteOfudaCatalogKey,
  validateActivateOfuda,
  validateCraftOfuda,
  type SocialDailyUsage,
  EMPTY_SOCIAL_DAILY_USAGE,
} from '@domain/shakai-kaikyu'
import { getSocialBlueprint } from '@domain/shakai-kaikyu/blueprint-catalog'
import type { SocialSubclassSheet } from '@domain/shakai-kaikyu/types'
import { db } from '../../plugins/db'
import { characters, inventory, socialClassDailyUsage, socialOfuda } from '../../db/schema'
import { insertMessage, isValidRoom } from '../chat/chat.service'
import {
  addItemByCatalogKey,
  consumeMaterialsByCatalogKey,
  consumeStackableByCatalogKey,
} from '../inventory/inventory.service'
import { broadcastInventoryUpdated } from '../realtime/ws.routes'
import * as presence from '../realtime/presence.store'

const SHISAI_SKIRU_ID = 'shisai' as const

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

function isShisaiFromSkiruSheet(skiruSheet: Readonly<Record<string, number>>): boolean {
  return (skiruSheet[SHISAI_SKIRU_ID] ?? 0) >= 1
}

async function loadSacerdoteCharacter(characterId: string) {
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
  const isSacerdote =
    char.socialClass === 'shisai' ||
    isShisaiFromSkiruSheet((char.skiruSheet ?? {}) as Record<string, number>)
  if (!isSacerdote) {
    throw new Error('Solo i Sacerdoti (Shisai) possono usare il Reliquiario.')
  }
  return char
}

function resolveSacerdoteSubclassSheet(char: {
  socialClass: string | null
  socialSubclassSheet: unknown
}): SocialSubclassSheet {
  if (char.socialClass === 'shisai') {
    return normalizeSubclassSheet(char.socialSubclassSheet as Record<string, boolean> | undefined)
  }
  return { 'shisai-minarai-miko': true }
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

function displayName(char: { name: string; surname?: string | null }): string {
  return [char.name, char.surname].filter(Boolean).join(' ')
}

function resolveSacerdoteRoom(characterId: string, roomId?: string): string | null {
  if (roomId?.trim() && isValidRoom(roomId.trim())) return roomId.trim()
  return presence.getRoomForCharacter(characterId)
}

async function countActiveOfuda(crafterCharacterId: string): Promise<number> {
  const rows = await db.query.socialOfuda.findMany({
    where: and(
      eq(socialOfuda.crafterCharacterId, crafterCharacterId),
      eq(socialOfuda.status, 'active'),
    ),
    columns: { id: true },
  })
  return rows.length
}

async function countInventoryOfuda(characterId: string): Promise<Record<string, number>> {
  const rows = await db.query.inventory.findMany({
    where: and(eq(inventory.characterId, characterId), eq(inventory.location, 'CARRY')),
    with: { item: true },
  })
  const counts: Record<string, number> = {}
  for (const row of rows) {
    const key = row.item.catalogKey
    if (!key?.startsWith('ofuda-')) continue
    counts[key] = (counts[key] ?? 0) + (row.quantity ?? 0)
  }
  return counts
}

export async function getSacerdoteToolState(characterId: string) {
  const char = await loadSacerdoteCharacter(characterId)
  const subclassSheet = resolveSacerdoteSubclassSheet(char)
  const dayKey = utcDayKey()
  const usage = await getDailyUsage(characterId, dayKey)
  const baseBudget = getRemainingDailyBudget('shisai', subclassSheet, usage)
  const activeCount = await countActiveOfuda(characterId)
  const maxActive = resolveDailyLimitFromSubclasses('shisai', subclassSheet, 'ofudaActiveMax')
  const maxPower = resolveDailyLimitFromSubclasses('shisai', subclassSheet, 'ofudaPowerMax')
  const inventoryCounts = await countInventoryOfuda(characterId)

  const rites = listAccessibleSocialBlueprints('shisai', subclassSheet)
    .filter(isSacerdoteRiteBlueprint)
    .map((bp) => {
      const catalogKey = sacerdoteOfudaCatalogKey(bp.id)
      return {
        id: bp.id,
        name: bp.name,
        description: bp.description,
        power: bp.weightOrPower ?? 0,
        materials: bp.materials ?? [],
        inInventory: inventoryCounts[catalogKey] ?? 0,
      }
    })

  const ofuda = await db.query.socialOfuda.findMany({
    where: eq(socialOfuda.crafterCharacterId, characterId),
    orderBy: [desc(socialOfuda.createdAt)],
    limit: 30,
  })

  return {
    dayKey,
    pathHints: {
      requiresConsecratedPlace: requiresConsecratedPlaceHint(subclassSheet),
      yumetokiDoubleTime: hasYumetokiPath(subclassSheet),
    },
    limits: { maxPower, maxActive, activeCount },
    dailyBudget: {
      ofudaActive: {
        max: maxActive,
        used: activeCount,
        remaining: Math.max(0, maxActive - activeCount),
      },
      ofudaPower: baseBudget.ofudaPower,
    },
    rites,
    ofuda: ofuda.map((o) => ({
      id: o.id,
      blueprintId: o.blueprintId,
      blueprintName: o.blueprintName,
      bearerCharacterId: o.bearerCharacterId,
      power: o.power,
      status: o.status,
      notes: o.notes,
      createdAt: o.createdAt?.toISOString() ?? null,
      consumedAt: o.consumedAt?.toISOString() ?? null,
    })),
  }
}

function requiresConsecratedPlaceHint(sheet: SocialSubclassSheet): boolean {
  return sheet['shisai-jareiba'] === true && sheet['shisai-yumetoki'] !== true
}

export async function craftSacerdoteOfuda(
  characterId: string,
  input: { blueprintId: string; consecratedPlace?: boolean; roomId?: string },
) {
  const char = await loadSacerdoteCharacter(characterId)
  const subclassSheet = resolveSacerdoteSubclassSheet(char)
  const blueprint = getSocialBlueprint(input.blueprintId)
  if (!blueprint || !canAccessSocialBlueprint('shisai', subclassSheet, input.blueprintId)) {
    throw new Error('Rito non sbloccato.')
  }

  const activeCount = await countActiveOfuda(characterId)
  const maxActive = resolveDailyLimitFromSubclasses('shisai', subclassSheet, 'ofudaActiveMax')
  const maxPower = resolveDailyLimitFromSubclasses('shisai', subclassSheet, 'ofudaPowerMax')

  const check = validateCraftOfuda(
    blueprint,
    { maxPower, maxActive, activeCount },
    { subclassSheet, consecratedPlace: input.consecratedPlace },
  )
  if (!check.ok) throw new Error(check.reason ?? 'Fabbricazione non valida.')

  const materials = blueprint.materials ?? []
  if (materials.length === 0) throw new Error('Rito senza materiali.')

  await consumeMaterialsByCatalogKey(characterId, materials)
  const catalogKey = sacerdoteOfudaCatalogKey(blueprint.id)
  await addItemByCatalogKey(characterId, catalogKey, 1, {
    craftedByCharacterId: characterId,
    craftedByName: displayName(char),
    blueprintId: blueprint.id,
  })
  broadcastInventoryUpdated(characterId)

  const resolvedRoom = resolveSacerdoteRoom(characterId, input.roomId)
  const yumetokiNote = hasYumetokiPath(subclassSheet) ? ' (tempo doppio — Yumetoki)' : ''
  const line = `[Sacerdote] ${displayName(char)} fabbrica un Ofuda: «${blueprint.name}» (Potere ${blueprint.weightOrPower ?? 1})${yumetokiNote}`
  if (resolvedRoom && isValidRoom(resolvedRoom)) {
    await insertMessage(resolvedRoom, characterId, line, null, false, null, null, false, true)
  }

  return { catalogKey, blueprintId: blueprint.id, loggedToRoom: resolvedRoom }
}

export async function activateSacerdoteOfuda(
  characterId: string,
  input: {
    blueprintId: string
    bearerCharacterId?: string
    notes?: string
    roomId?: string
  },
) {
  const char = await loadSacerdoteCharacter(characterId)
  const subclassSheet = resolveSacerdoteSubclassSheet(char)
  const blueprint = getSocialBlueprint(input.blueprintId)
  if (!blueprint || !isSacerdoteRiteBlueprint(blueprint)) {
    throw new Error('Ofuda non valido.')
  }

  const bearerId = input.bearerCharacterId ?? characterId
  const bearer = await db.query.characters.findFirst({
    where: eq(characters.id, bearerId),
    columns: { id: true, name: true, surname: true },
  })
  if (!bearer) throw new Error('Detentore non trovato.')

  const activeCount = await countActiveOfuda(characterId)
  const maxActive = resolveDailyLimitFromSubclasses('shisai', subclassSheet, 'ofudaActiveMax')
  const maxPower = resolveDailyLimitFromSubclasses('shisai', subclassSheet, 'ofudaPowerMax')
  const power = blueprint.weightOrPower ?? 1

  const check = validateActivateOfuda(power, { maxPower, maxActive, activeCount })
  if (!check.ok) throw new Error(check.reason ?? 'Attivazione non valida.')

  const catalogKey = sacerdoteOfudaCatalogKey(blueprint.id)
  await consumeStackableByCatalogKey(characterId, catalogKey, 1)

  const [row] = await db
    .insert(socialOfuda)
    .values({
      crafterCharacterId: characterId,
      bearerCharacterId: bearerId,
      blueprintId: blueprint.id,
      blueprintName: blueprint.name,
      power,
      status: 'active',
      notes: input.notes?.trim() || null,
    })
    .returning()

  broadcastInventoryUpdated(characterId)

  const resolvedRoom = resolveSacerdoteRoom(characterId, input.roomId)
  const bearerName = displayName(bearer)
  const line = `[Sacerdote] ${displayName(char)} attiva «${blueprint.name}» (Potere ${power}) su ${bearerId === characterId ? 'sé stessə' : bearerName}`
  if (resolvedRoom && isValidRoom(resolvedRoom)) {
    await insertMessage(resolvedRoom, characterId, line, null, false, null, null, false, true)
  }

  return { ofuda: row, loggedToRoom: resolvedRoom }
}

export async function consumeSacerdoteOfuda(
  characterId: string,
  input: { ofudaId: string; roomId?: string; note?: string },
) {
  const char = await loadSacerdoteCharacter(characterId)
  const ofuda = await db.query.socialOfuda.findFirst({
    where: and(eq(socialOfuda.id, input.ofudaId), eq(socialOfuda.crafterCharacterId, characterId)),
  })
  if (!ofuda) throw new Error('Ofuda non trovato.')
  if (ofuda.status !== 'active') throw new Error('Ofuda non attivo.')

  const consumedAt = new Date()
  await db
    .update(socialOfuda)
    .set({ status: 'consumed', consumedAt })
    .where(eq(socialOfuda.id, ofuda.id))

  const resolvedRoom = resolveSacerdoteRoom(characterId, input.roomId)
  const note = input.note?.trim()
  const line = `[Sacerdote] ${displayName(char)} consuma l'Ofuda attivo «${ofuda.blueprintName}» (Potere ${ofuda.power})${note ? ` — ${note}` : ''}`
  if (resolvedRoom && isValidRoom(resolvedRoom)) {
    await insertMessage(resolvedRoom, characterId, line, null, false, null, null, false, true)
  }

  return {
    ofudaId: ofuda.id,
    status: 'consumed' as const,
    consumedAt: consumedAt.toISOString(),
    loggedToRoom: resolvedRoom,
  }
}
