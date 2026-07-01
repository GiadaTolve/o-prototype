import {
  LEVEL_CAP,
  formatLevelLabel,
  getGradeForLevel,
  getKeysAwardedAtLevel,
  getLevelFromExp,
  getLevelUpProgress,
  getParagonFromExp,
} from './levels'

/** Stato progressione in `characters.ui_metadata`. */
export type PendingLevelUpBanner = {
  level: number
  paragon: number
  levelLabel: string
  grade: string
  keysAwarded: number
  /** EXP guadagnata nell'evento che ha scatenato il level-up (chat/quest). */
  expGained: number
  expIntoLevel: number
  expNeededForNext: number | null
}

export type ProgressionUiMeta = {
  /** Ultimo livello (cap 50) per cui le Key sono già state accreditate. Default implicito: 1. */
  lastLevelKeysApplied?: number
  pendingLevelUp?: PendingLevelUpBanner | null
}

export function sumKeysForLevelRange(
  fromLevelExclusive: number,
  toLevelInclusive: number,
): number {
  if (toLevelInclusive <= fromLevelExclusive) return 0
  const to = Math.min(toLevelInclusive, LEVEL_CAP)
  let sum = 0
  for (let level = fromLevelExclusive + 1; level <= to; level++) {
    sum += getKeysAwardedAtLevel(level)
  }
  return sum
}

/** Inizializza meta senza regalare Key retroattive (PG già avanzati pre-deploy). */
export function ensureProgressionMeta(
  meta: ProgressionUiMeta | null | undefined,
  expTotal: number,
): ProgressionUiMeta {
  const base = { ...(meta ?? {}) }
  if (base.lastLevelKeysApplied == null) {
    base.lastLevelKeysApplied = getLevelFromExp(expTotal)
  }
  return base
}

export function resolveExpGainProgression(input: {
  oldExpTotal: number
  expGained: number
  lastLevelKeysApplied: number
}): {
  newExpTotal: number
  newLevel: number
  newParagon: number
  keysDelta: number
  newLastLevelKeysApplied: number
  pendingLevelUp: PendingLevelUpBanner | null
  leveledUp: boolean
} {
  const newExpTotal = input.oldExpTotal + input.expGained
  const oldLevel = getLevelFromExp(input.oldExpTotal)
  const newLevel = getLevelFromExp(newExpTotal)
  const oldParagon = getParagonFromExp(input.oldExpTotal)
  const newParagon = getParagonFromExp(newExpTotal)
  const lastApplied = Math.max(1, input.lastLevelKeysApplied)

  const keysDelta = sumKeysForLevelRange(lastApplied, newLevel)
  const newLastLevelKeysApplied = Math.max(lastApplied, newLevel)
  const leveledUp = newLevel > oldLevel || newParagon > oldParagon

  let pendingLevelUp: PendingLevelUpBanner | null = null
  if (leveledUp) {
    const progress = getLevelUpProgress(newExpTotal)
    pendingLevelUp = {
      level: newLevel,
      paragon: newParagon,
      levelLabel: formatLevelLabel(newLevel, newParagon),
      grade: getGradeForLevel(newLevel),
      keysAwarded: keysDelta,
      expGained: input.expGained,
      expIntoLevel: newExpTotal - progress.expAtCurrentLevel,
      expNeededForNext: progress.expNeededForNext,
    }
  }

  return {
    newExpTotal,
    newLevel,
    newParagon,
    keysDelta,
    newLastLevelKeysApplied,
    pendingLevelUp,
    leveledUp,
  }
}
