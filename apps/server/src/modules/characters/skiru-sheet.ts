import {
  calculateSkiruDerivedStats,
  calculateSkiruDomainIndices,
  isSkiruSheetEmpty,
  legacyStatsToSkiruSheet,
  migrateGugenkaToGenkaiInSheet,
  normalizeSkiruSheet,
  type SkiruSheet,
} from '@domain/skiru'
import type { BaseStats } from '@domain/stats/calculator'

export function resolveCharacterSkiruSheet(
  stored: SkiruSheet | null | undefined,
  baseStats: BaseStats,
): SkiruSheet {
  if (!isSkiruSheetEmpty(stored)) {
    return normalizeSkiruSheet(migrateGugenkaToGenkaiInSheet(stored as SkiruSheet))
  }
  return legacyStatsToSkiruSheet(baseStats)
}

export function buildSkiruCharacterComputed(
  sheet: SkiruSheet,
  hpModifier = 0,
) {
  const derived = calculateSkiruDerivedStats(sheet)
  const skiruDomains = calculateSkiruDomainIndices(sheet)

  return {
    computed: {
      hpMax: Math.max(1, derived.hpMax + hpModifier),
      mitigationPercent: derived.mitigationPercent,
      movementMetersPerQuarter: derived.movementMetersPerQuarter,
      cac: derived.cac,
      cad: derived.cad,
    },
    skiruSheet: sheet,
    skiruDomains,
  }
}

/**
 * Contratto API Skiru — usato da GET/PATCH /characters/me/skiru
 *
 * PATCH body: { skiruId: string, targetPoints: number }  // 1–10, > punti attuali
 * Response:   { skiruSheet, expSpendable, expCostNextByNode, derived, skiruDomains }
 */
