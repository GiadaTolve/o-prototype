import { and, eq } from 'drizzle-orm'
import {
  canAccessSocialBlueprint,
  canSpendGatherBudget,
  formatGatherYieldsPreview,
  getRemainingDailyBudget,
  isCacciatoreGatherBlueprint,
  listAccessibleSocialBlueprints,
  resolveGatherYields,
  type SocialDailyUsage,
  EMPTY_SOCIAL_DAILY_USAGE,
} from '@domain/shakai-kaikyu'
import { getSocialBlueprint } from '@domain/shakai-kaikyu/blueprint-catalog'
import type { SocialSubclassSheet } from '@domain/shakai-kaikyu/types'
import { db } from '../../plugins/db'
import { characters, socialClassDailyUsage } from '../../db/schema'
import { insertMessage, isValidRoom } from '../chat/chat.service'
import { addItemByCatalogKey, consumeMaterialsByCatalogKey } from '../inventory/inventory.service'
import { broadcastInventoryUpdated } from '../realtime/ws.routes'
import * as presence from '../realtime/presence.store'

const RYOSHI_SKIRU_ID = 'ryoshi' as const

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

function isRyoshiFromSkiruSheet(skiruSheet: Readonly<Record<string, number>>): boolean {
  return (skiruSheet[RYOSHI_SKIRU_ID] ?? 0) >= 1
}

async function loadCacciatoreCharacter(characterId: string) {
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
  const isCacciatore =
    char.socialClass === 'ryoshi' ||
    isRyoshiFromSkiruSheet((char.skiruSheet ?? {}) as Record<string, number>)
  if (!isCacciatore) {
    throw new Error('Solo i Cacciatori (Ryōshi) possono usare questo strumento.')
  }
  return char
}

function resolveCacciatoreSubclassSheet(char: {
  socialClass: string | null
  socialSubclassSheet: unknown
}): SocialSubclassSheet {
  if (char.socialClass === 'ryoshi') {
    return normalizeSubclassSheet(char.socialSubclassSheet as Record<string, boolean> | undefined)
  }
  return { 'ryoshi-michishirube': true }
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

async function incrementGatherUsed(characterId: string, dayKey: string, by: number): Promise<number> {
  const existing = await db.query.socialClassDailyUsage.findFirst({
    where: and(
      eq(socialClassDailyUsage.characterId, characterId),
      eq(socialClassDailyUsage.dayKey, dayKey),
    ),
  })
  if (existing) {
    const next = (existing.gatherUsed ?? 0) + by
    await db
      .update(socialClassDailyUsage)
      .set({ gatherUsed: next })
      .where(
        and(
          eq(socialClassDailyUsage.characterId, characterId),
          eq(socialClassDailyUsage.dayKey, dayKey),
        ),
      )
    return next
  }
  await db.insert(socialClassDailyUsage).values({ characterId, dayKey, gatherUsed: by })
  return by
}

function displayName(char: { name: string; surname?: string | null }): string {
  return [char.name, char.surname].filter(Boolean).join(' ')
}

function resolveCacciatoreRoom(characterId: string, roomId?: string): string | null {
  if (roomId?.trim() && isValidRoom(roomId.trim())) return roomId.trim()
  return presence.getRoomForCharacter(characterId)
}

function zoneLabel(roomId: string): string {
  return roomId.replace(/__/g, ' · ').replace(/_/g, ' ')
}

export async function getCacciatoreToolState(characterId: string) {
  const char = await loadCacciatoreCharacter(characterId)
  const dayKey = utcDayKey()
  const usage = await getDailyUsage(characterId, dayKey)
  const subclassSheet = resolveCacciatoreSubclassSheet(char)
  const dailyBudget = getRemainingDailyBudget('ryoshi', subclassSheet, usage)
  const tracks = listAccessibleSocialBlueprints('ryoshi', subclassSheet)
    .filter(isCacciatoreGatherBlueprint)
    .map((bp) => ({
      id: bp.id,
      name: bp.name,
      description: bp.description,
      gatherUnits: bp.gatherUnits ?? 0,
      gatherRequires: bp.gatherRequires ?? [],
      yieldsPreview: formatGatherYieldsPreview(bp.id),
      needsScene: bp.id === 'cacciatore-predatore' || bp.id === 'cacciatore-preda-leggendaria',
    }))

  return { dayKey, dailyBudget: dailyBudget.gather, tracks }
}

export async function executeCacciatoreGather(
  characterId: string,
  input: { blueprintId: string; roomId?: string },
) {
  const char = await loadCacciatoreCharacter(characterId)
  const blueprint = getSocialBlueprint(input.blueprintId)
  if (!blueprint || blueprint.classId !== 'ryoshi' || blueprint.kind !== 'gather') {
    throw new Error('Traccia cacciatore non trovata.')
  }

  const subclassSheet = resolveCacciatoreSubclassSheet(char)
  if (!canAccessSocialBlueprint('ryoshi', subclassSheet, input.blueprintId)) {
    throw new Error('Traccia non sbloccata nel tuo albero sottoclassi.')
  }

  const dayKey = utcDayKey()
  const usage = await getDailyUsage(characterId, dayKey)
  const budget = getRemainingDailyBudget('ryoshi', subclassSheet, usage)
  const check = canSpendGatherBudget(blueprint, budget.gather.remaining)
  if (!check.ok) throw new Error(check.reason ?? 'Budget Raccolta insufficiente.')

  const gatherRequires = blueprint.gatherRequires ?? []
  if (gatherRequires.length > 0) {
    await consumeMaterialsByCatalogKey(characterId, gatherRequires)
  }

  const yields = resolveGatherYields(blueprint.id)
  const granted: Array<{ materialId: string; quantity: number }> = []
  for (const y of yields) {
    if (y.quantity <= 0) continue
    await addItemByCatalogKey(characterId, `mat-${y.materialId}`, y.quantity, { origin: 'droppato' })
    granted.push({ materialId: y.materialId, quantity: y.quantity })
  }

  await incrementGatherUsed(characterId, dayKey, check.cost)
  const budgetAfter = budget.gather.remaining - check.cost

  const resolvedRoom = resolveCacciatoreRoom(characterId, input.roomId)
  const zone = resolvedRoom ? zoneLabel(resolvedRoom) : 'zona non indicata'
  const loot =
    granted.length > 0
      ? granted.map((g) => `${g.quantity}× ${g.materialId.replace(/_/g, ' ')}`).join(', ')
      : 'effetto narrativo'
  const sceneNote =
    blueprint.id === 'cacciatore-predatore' || blueprint.id === 'cacciatore-preda-leggendaria'
      ? ' [Possibile scena — Master]'
      : ''
  const line = `[Cacciatore] ${displayName(char)} — ${blueprint.name} a ${zone} (−${check.cost} Raccolta). Bottino: ${loot}.${sceneNote} Budget residuo: ${budgetAfter}/${budget.gather.max}.`

  let loggedToRoom: string | null = null
  if (resolvedRoom && isValidRoom(resolvedRoom)) {
    await insertMessage(resolvedRoom, characterId, line, null, false, null, null, false, true)
    loggedToRoom = resolvedRoom
  }

  broadcastInventoryUpdated(characterId)

  return {
    blueprintId: blueprint.id,
    name: blueprint.name,
    gatherCost: check.cost,
    budgetRemaining: budgetAfter,
    budgetMax: budget.gather.max,
    granted,
    loggedToRoom,
    needsScene: blueprint.id === 'cacciatore-predatore' || blueprint.id === 'cacciatore-preda-leggendaria',
  }
}
