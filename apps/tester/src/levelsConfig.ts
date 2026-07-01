/**
 * Configurazione Livelli — re-export da @domain/progression.
 * Curva EXP: LEVELING_DESIGN (cap 50) · Premi: UltimateManual v3 (Key, EXP spendibile).
 */

export type { Phase, LevelRow, ManualLevelRow, LevelUpProgress, ParagonRow } from '@domain/progression'
export {
  LEVEL_CAP,
  LEVELS,
  MANUAL_LEVEL_ROWS,
  MANUAL_LEVEL_REWARDS,
  getLevelFromExp,
  getLevelRow,
  getGradeForLevel,
  getKeysAwardedAtLevel,
  getLevelUpProgress,
  getExpAtLevel,
  getParagonFromExp,
  getParagonRow,
  formatLevelLabel,
  isParagonPlayer,
} from '@domain/progression'

import { getKeysAwardedAtLevel } from '@domain/progression'

/** @deprecated Gems non previste nel manuale v3 — solo tester legacy. */
export function getGemsPerLevel(level: number): number {
  return level % 5 === 0 ? 3 : 1
}

/** Keys al level-up: tabella manuale livelli 1–15, +1 default oltre. */
export function getKeysPerLevel(level: number): number {
  return getKeysAwardedAtLevel(level) || (level > 1 ? 1 : 0)
}

export function getTotalKeysAtLevel(level: number): number {
  let total = 0
  for (let l = 1; l <= level; l++) total += getKeysAwardedAtLevel(l)
  return total
}

/** @deprecated Gems legacy. */
export function getTotalGemsAtLevel(level: number): number {
  const multipleOf5 = Math.floor(level / 5)
  const others = level - multipleOf5
  return multipleOf5 * 3 + others
}
