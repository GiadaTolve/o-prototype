// apps/server/src/modules/characters/formulas.ts

export interface BaseStats {
  f: number
  c: number
  d: number
  m: number
  e: number
}

export interface DerivedStats {
  hp: number
  mana: number
  reflex: number
  speed: number
}

export {
  LEVEL_CAP,
  getLevelFromExp,
  getParagonFromExp,
  getLevelUpProgress,
  getGradeForLevel,
  getKeysAwardedAtLevel,
  formatLevelLabel,
  isParagonPlayer,
} from '@domain/progression'

export function calculateDerivedStats(stats: BaseStats, tierY: number = 1): DerivedStats {
  const { f, c, d, m, e } = stats

  return {
    hp: Math.floor((f * 0.20 + c * 0.80) * tierY),
    mana: Math.floor((m * 0.30 + e * 0.70) * tierY),
    reflex: Math.floor((m * 0.40 + d * 0.60) * tierY),
    speed: Math.floor((f * 0.30 + d * 0.70) * tierY),
  }
}
