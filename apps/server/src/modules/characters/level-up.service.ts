import { eq } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { characters } from '../../db/schema'
import {
  ensureProgressionMeta,
  resolveExpGainProgression,
  type PendingLevelUpBanner,
  type ProgressionUiMeta,
} from '@domain/progression/level-up'

export type ApplyExpGainResult = {
  levelUp: PendingLevelUpBanner | null
  newExpTotal: number
  newKeys: number
}

/**
 * Accredita EXP (totale + spendibile), Key ai nuovi livelli, imposta banner pending.
 */
export async function applyCharacterExpGain(
  characterId: string,
  expGained: number,
): Promise<ApplyExpGainResult | null> {
  if (expGained <= 0) return null

  const char = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
  })
  if (!char) return null

  const meta = ensureProgressionMeta(
    char.uiMetadata as ProgressionUiMeta | null,
    char.experienceTotal,
  )
  const lastApplied = meta.lastLevelKeysApplied ?? 1

  const result = resolveExpGainProgression({
    oldExpTotal: char.experienceTotal,
    expGained,
    lastLevelKeysApplied: lastApplied,
  })

  const newMeta: ProgressionUiMeta = {
    ...meta,
    lastLevelKeysApplied: result.newLastLevelKeysApplied,
    pendingLevelUp: result.pendingLevelUp ?? meta.pendingLevelUp ?? null,
  }

  const newKeys = char.keys + result.keysDelta

  await db
    .update(characters)
    .set({
      experienceTotal: result.newExpTotal,
      experienceSpendable: char.experienceSpendable + expGained,
      keys: newKeys,
      uiMetadata: newMeta,
    })
    .where(eq(characters.id, characterId))

  return {
    levelUp: result.pendingLevelUp,
    newExpTotal: result.newExpTotal,
    newKeys,
  }
}

export async function dismissLevelUpBanner(characterId: string): Promise<void> {
  const char = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
    columns: { uiMetadata: true },
  })
  if (!char) return
  const meta = (char.uiMetadata ?? {}) as ProgressionUiMeta
  if (!meta.pendingLevelUp) return
  // Salta: il pending resta — il client lo mostra di nuovo al prossimo caricamento pagina.
}

export async function acknowledgeLevelUpBanner(characterId: string): Promise<void> {
  const char = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
    columns: { uiMetadata: true },
  })
  if (!char) return
  const meta = { ...(char.uiMetadata as ProgressionUiMeta) }
  delete meta.pendingLevelUp
  await db
    .update(characters)
    .set({ uiMetadata: meta })
    .where(eq(characters.id, characterId))
}

export function readPendingLevelUp(
  uiMetadata: unknown,
): PendingLevelUpBanner | null {
  const meta = uiMetadata as ProgressionUiMeta | null
  return meta?.pendingLevelUp ?? null
}
