import { getSkiruPoints } from './progression'
import type { SkiruSheet } from './types'

export const GENKAI_SKIRU_ID = 'genkai'

/** @deprecated Sostituito da Genkai — lettura legacy per schede migrate. */
export const LEGACY_GUGENKA_SKIRU_ID = 'gugenka'

/** Punti Genkai per resistenza costrutti (§2.6). Fallback su gugenka legacy. */
export function resolveGenkaiPointsFromSheet(sheet: SkiruSheet): number {
  const genkai = getSkiruPoints(sheet, GENKAI_SKIRU_ID)
  if (genkai > 0) return genkai
  return getSkiruPoints(sheet, LEGACY_GUGENKA_SKIRU_ID)
}

/** Migra punti gugenka → genkai nello sheet (in memoria). */
export function migrateGugenkaToGenkaiInSheet(sheet: SkiruSheet): SkiruSheet {
  const raw = { ...sheet } as Record<string, number>
  if ((raw[GENKAI_SKIRU_ID] ?? 0) <= 0 && (raw[LEGACY_GUGENKA_SKIRU_ID] ?? 0) > 0) {
    raw[GENKAI_SKIRU_ID] = raw[LEGACY_GUGENKA_SKIRU_ID]
  }
  delete raw[LEGACY_GUGENKA_SKIRU_ID]
  return raw
}
