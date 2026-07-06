import { and, desc, eq } from 'drizzle-orm'
import {
  canAccessSocialBlueprint,
  getRemainingDailyBudget,
  inferAllowedLeverages,
  isPoliticoPactTemplate,
  leverageLabel,
  listAccessibleSocialBlueprints,
  resolveDailyLimitFromSubclasses,
  validateNewPact,
  type PactLeverage,
  type SocialDailyUsage,
  EMPTY_SOCIAL_DAILY_USAGE,
} from '@domain/shakai-kaikyu'
import { getSocialBlueprint } from '@domain/shakai-kaikyu/blueprint-catalog'
import type { SocialSubclassSheet } from '@domain/shakai-kaikyu/types'
import { db } from '../../plugins/db'
import { characters, socialClassDailyUsage, socialPacts } from '../../db/schema'
import { insertMessage, isValidRoom } from '../chat/chat.service'
import * as presence from '../realtime/presence.store'

const SEIJIKA_SKIRU_ID = 'seijika' as const

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

function isSeijikaFromSkiruSheet(skiruSheet: Readonly<Record<string, number>>): boolean {
  return (skiruSheet[SEIJIKA_SKIRU_ID] ?? 0) >= 1
}

async function loadPoliticoCharacter(characterId: string) {
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
  const isPolitico =
    char.socialClass === 'seijika' ||
    isSeijikaFromSkiruSheet((char.skiruSheet ?? {}) as Record<string, number>)
  if (!isPolitico) {
    throw new Error('Solo i Politici (Seijika) possono usare il Registro Patti.')
  }
  return char
}

function resolvePoliticoSubclassSheet(char: {
  socialClass: string | null
  socialSubclassSheet: unknown
}): SocialSubclassSheet {
  if (char.socialClass === 'seijika') {
    return normalizeSubclassSheet(char.socialSubclassSheet as Record<string, boolean> | undefined)
  }
  return { 'seijika-kojin': true }
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

function resolvePoliticoRoom(characterId: string, roomId?: string): string | null {
  if (roomId?.trim() && isValidRoom(roomId.trim())) return roomId.trim()
  return presence.getRoomForCharacter(characterId)
}

async function countActivePacts(holderCharacterId: string): Promise<number> {
  const rows = await db.query.socialPacts.findMany({
    where: and(
      eq(socialPacts.holderCharacterId, holderCharacterId),
      eq(socialPacts.status, 'active'),
    ),
    columns: { id: true },
  })
  return rows.length
}

export async function getPoliticoToolState(characterId: string) {
  const char = await loadPoliticoCharacter(characterId)
  const subclassSheet = resolvePoliticoSubclassSheet(char)
  const dayKey = utcDayKey()
  const usage = await getDailyUsage(characterId, dayKey)
  const baseBudget = getRemainingDailyBudget('seijika', subclassSheet, usage)
  const activeCount = await countActivePacts(characterId)
  const maxActive = resolveDailyLimitFromSubclasses('seijika', subclassSheet, 'pactActiveMax')
  const maxWeight = resolveDailyLimitFromSubclasses('seijika', subclassSheet, 'pactWeightMax')

  const templates = listAccessibleSocialBlueprints('seijika', subclassSheet)
    .filter(isPoliticoPactTemplate)
    .map((bp) => ({
      id: bp.id,
      name: bp.name,
      description: bp.description,
      weight: bp.weightOrPower ?? 0,
    }))

  const pacts = await db.query.socialPacts.findMany({
    where: eq(socialPacts.holderCharacterId, characterId),
    orderBy: [desc(socialPacts.createdAt)],
    limit: 30,
  })

  return {
    dayKey,
    allowedLeverages: [...inferAllowedLeverages(subclassSheet)],
    limits: { maxWeight, maxActive, activeCount },
    dailyBudget: {
      pactActive: {
        max: maxActive,
        used: activeCount,
        remaining: Math.max(0, maxActive - activeCount),
      },
      pactWeight: baseBudget.pactWeight,
    },
    templates,
    pacts: pacts.map((p) => ({
      id: p.id,
      templateId: p.templateId,
      templateName: p.templateName,
      counterpartyName: p.counterpartyName,
      counterpartyCharacterId: p.counterpartyCharacterId,
      weight: p.weight,
      leverage: p.leverage,
      status: p.status,
      notes: p.notes,
      createdAt: p.createdAt?.toISOString() ?? null,
      spentAt: p.spentAt?.toISOString() ?? null,
    })),
  }
}

export async function createPoliticoPact(
  characterId: string,
  input: {
    templateId: string
    counterpartyName: string
    counterpartyCharacterId?: string
    leverage?: PactLeverage
    notes?: string
    roomId?: string
  },
) {
  const char = await loadPoliticoCharacter(characterId)
  const subclassSheet = resolvePoliticoSubclassSheet(char)
  const blueprint = getSocialBlueprint(input.templateId)
  if (!blueprint || !canAccessSocialBlueprint('seijika', subclassSheet, input.templateId)) {
    throw new Error('Modello Patto non sbloccato.')
  }

  const activeCount = await countActivePacts(characterId)
  const maxActive = resolveDailyLimitFromSubclasses('seijika', subclassSheet, 'pactActiveMax')
  const maxWeight = resolveDailyLimitFromSubclasses('seijika', subclassSheet, 'pactWeightMax')
  const leverage = input.leverage ?? 'neutro'
  const allowed = inferAllowedLeverages(subclassSheet)

  const check = validateNewPact(
    blueprint,
    { maxWeight, maxActive, activeCount },
    leverage,
    allowed,
  )
  if (!check.ok) throw new Error(check.reason ?? 'Patto non valido.')

  const counterpartyName = input.counterpartyName.trim()
  if (!counterpartyName) throw new Error('Indica la controparte del Patto.')

  const weight = blueprint.weightOrPower ?? 1
  const [row] = await db
    .insert(socialPacts)
    .values({
      holderCharacterId: characterId,
      templateId: blueprint.id,
      templateName: blueprint.name,
      counterpartyName,
      counterpartyCharacterId: input.counterpartyCharacterId ?? null,
      weight,
      leverage,
      status: 'active',
      notes: input.notes?.trim() || null,
    })
    .returning()

  const resolvedRoom = resolvePoliticoRoom(characterId, input.roomId)
  const line = `[Politico] ${displayName(char)} stringe un Patto (Peso ${weight}, ${leverageLabel(leverage)}) con ${counterpartyName}: «${blueprint.name}» — ${blueprint.description}`
  if (resolvedRoom && isValidRoom(resolvedRoom)) {
    await insertMessage(resolvedRoom, characterId, line, null, false, null, null, false, true)
  }

  return { pact: row, loggedToRoom: resolvedRoom }
}

export async function invokePoliticoPact(
  characterId: string,
  input: { pactId: string; roomId?: string; invocationNote?: string },
) {
  const char = await loadPoliticoCharacter(characterId)
  const pact = await db.query.socialPacts.findFirst({
    where: and(eq(socialPacts.id, input.pactId), eq(socialPacts.holderCharacterId, characterId)),
  })
  if (!pact) throw new Error('Patto non trovato.')
  if (pact.status !== 'active') throw new Error('Patto non attivo.')

  const spentAt = new Date()
  await db
    .update(socialPacts)
    .set({ status: 'spent', spentAt })
    .where(eq(socialPacts.id, pact.id))

  const note = input.invocationNote?.trim()
  const resolvedRoom = resolvePoliticoRoom(characterId, input.roomId)
  const line = `[Politico] ${displayName(char)} richiama il Patto con ${pact.counterpartyName} (Peso ${pact.weight}, ${leverageLabel(pact.leverage)}): «${pact.templateName}»${note ? ` — ${note}` : ''}`
  if (resolvedRoom && isValidRoom(resolvedRoom)) {
    await insertMessage(resolvedRoom, characterId, line, null, false, null, null, false, true)
  }

  return {
    pactId: pact.id,
    status: 'spent' as const,
    spentAt: spentAt.toISOString(),
    loggedToRoom: resolvedRoom,
  }
}
