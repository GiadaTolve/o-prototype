/**
 * Leveling — curva EXP (LEVELING_DESIGN / tabella manuale 1–50).
 * Δ EXP livello L (L ≥ 2): 50 + 39 × (L − 2).
 * Premi v3 (Key + EXP spendibile): tabella manuale 1–15; oltre cap 50 → Paragon.
 */

/** Cap livello PG (tabella canonica 1–50). */
export const LEVEL_CAP = 50

/** EXP per salire al livello 2. */
export const EXP_DELTA_BASE = 50

/** Incremento Δ EXP per ogni livello successivo. */
export const EXP_DELTA_STEP = 39

export type Phase = 'EARLY-GAME' | 'MID-GAME' | 'CORE' | null

export interface ManualLevelRow {
  level: number
  expTotal: number
  /** Key guadagnata raggiungendo questo livello; 0 se nessuna. */
  keysAwarded: number
  /** Grado indicativo al manuale (Consiglio assegna discrezionalmente). */
  grade: string
}

/** Premi livelli 1–15 — UltimateManual (solo Key/grado; curva EXP da formula). */
export const MANUAL_LEVEL_REWARDS: readonly ManualLevelRow[] = [
  { level: 1, expTotal: 0, keysAwarded: 0, grade: 'Nemuribito' },
  { level: 2, expTotal: 50, keysAwarded: 1, grade: 'Nemuribito' },
  { level: 3, expTotal: 139, keysAwarded: 1, grade: 'Nemuribito' },
  { level: 4, expTotal: 267, keysAwarded: 1, grade: 'Hakyō' },
  { level: 5, expTotal: 434, keysAwarded: 1, grade: 'Hakyō' },
  { level: 6, expTotal: 640, keysAwarded: 0, grade: 'Hakyō' },
  { level: 7, expTotal: 885, keysAwarded: 1, grade: 'Hakyō' },
  { level: 8, expTotal: 1169, keysAwarded: 0, grade: 'Hakyō' },
  { level: 9, expTotal: 1492, keysAwarded: 1, grade: 'Hakyō' },
  { level: 10, expTotal: 1854, keysAwarded: 0, grade: 'Hakyō' },
  { level: 11, expTotal: 2255, keysAwarded: 1, grade: 'Bunsekikan' },
  { level: 12, expTotal: 2695, keysAwarded: 0, grade: 'Bunsekikan' },
  { level: 13, expTotal: 3174, keysAwarded: 1, grade: 'Bunsekikan' },
  { level: 14, expTotal: 3692, keysAwarded: 0, grade: 'Bunsekikan' },
  { level: 15, expTotal: 4249, keysAwarded: 0, grade: 'Bunsekikan' },
]

/** @deprecated Alias — usare MANUAL_LEVEL_REWARDS. */
export const MANUAL_LEVEL_ROWS = MANUAL_LEVEL_REWARDS

export interface LevelRow {
  level: number
  expDelta: number | null
  expTotal: number
  phase: Phase
  grade: string
  keysAwarded: number
}

/** Δ EXP per raggiungere il livello indicato (null al livello 1). */
export function getExpDeltaForLevel(level: number): number | null {
  if (level <= 1) return null
  return EXP_DELTA_BASE + EXP_DELTA_STEP * (level - 2)
}

/** EXP totale cumulativa per essere al livello indicato. */
export function getExpTotalForLevel(level: number): number {
  if (level <= 1) return 0
  const capped = Math.min(level, LEVEL_CAP)
  let total = 0
  for (let l = 2; l <= capped; l++) {
    total += getExpDeltaForLevel(l)!
  }
  return total
}

/** Fase di gioco (LEVELING_DESIGN). */
export function getPhaseForLevel(level: number): Phase {
  if (level <= 6) return 'EARLY-GAME'
  if (level <= 25) return 'MID-GAME'
  if (level <= LEVEL_CAP) return 'CORE'
  return null
}

function extendedGradeForLevel(level: number): string {
  if (level <= 3) return 'Nemuribito'
  if (level <= 10) return 'Hakyō'
  if (level <= 18) return 'Bunsekikan'
  if (level <= 28) return 'Sentatsu Bunsekikan'
  if (level <= 38) return 'Kanteikan'
  if (level <= 48) return "Shin'enkan"
  return 'Akumu Zankyō'
}

function keysAwardedForLevel(level: number): number {
  const manual = MANUAL_LEVEL_REWARDS.find((r) => r.level === level)
  if (manual) return manual.keysAwarded
  if (level <= 1) return 0
  return 1
}

function gradeForLevel(level: number): string {
  return MANUAL_LEVEL_REWARDS.find((r) => r.level === level)?.grade ?? extendedGradeForLevel(level)
}

function buildLevelTable(): LevelRow[] {
  const rows: LevelRow[] = []
  for (let level = 1; level <= LEVEL_CAP; level++) {
    rows.push({
      level,
      expDelta: getExpDeltaForLevel(level),
      expTotal: getExpTotalForLevel(level),
      phase: getPhaseForLevel(level),
      grade: gradeForLevel(level),
      keysAwarded: keysAwardedForLevel(level),
    })
  }
  return rows
}

export const LEVELS: readonly LevelRow[] = buildLevelTable()

export function getExpAtLevel(level: number): number {
  return getExpTotalForLevel(level)
}

export function getLevelFromExp(expTotal: number): number {
  let level = 1
  for (const row of LEVELS) {
    if (row.expTotal <= expTotal) level = row.level
    else break
  }
  return Math.min(level, LEVEL_CAP)
}

export function getLevelRow(level: number): LevelRow | undefined {
  if (level < 1 || level > LEVEL_CAP) return undefined
  return LEVELS[level - 1]
}

export function getGradeForLevel(level: number): string {
  return gradeForLevel(Math.min(Math.max(level, 1), LEVEL_CAP))
}

export function getKeysAwardedAtLevel(level: number): number {
  if (level <= 0 || level > LEVEL_CAP) return 0
  return keysAwardedForLevel(level)
}

/** Soglie Paragon oltre il cap 50 (stessa formula Δ EXP). */
export interface ParagonRow {
  paragon: number
  expDelta: number
  /** EXP totale cumulativa per raggiungere questo paragon (include soglia lv.50). */
  expTotal: number
}

function buildParagonTable(maxParagon = 100): ParagonRow[] {
  const capRow = getLevelRow(LEVEL_CAP)
  if (!capRow) return []
  let expTotal = capRow.expTotal
  let expDelta = capRow.expDelta ?? EXP_DELTA_BASE + EXP_DELTA_STEP * (LEVEL_CAP - 2)
  const rows: ParagonRow[] = []
  for (let paragon = 1; paragon <= maxParagon; paragon++) {
    expDelta += EXP_DELTA_STEP
    expTotal += expDelta
    rows.push({ paragon, expDelta, expTotal })
  }
  return rows
}

const PARAGON_LEVELS: readonly ParagonRow[] = buildParagonTable()

export function getParagonFromExp(expTotal: number): number {
  const capExp = getExpAtLevel(LEVEL_CAP)
  if (expTotal < capExp) return 0
  let paragon = 0
  for (const row of PARAGON_LEVELS) {
    if (row.expTotal <= expTotal) paragon = row.paragon
    else break
  }
  return paragon
}

export function getParagonRow(paragon: number): ParagonRow | undefined {
  return PARAGON_LEVELS.find((r) => r.paragon === paragon)
}

export interface LevelUpProgress {
  currentLevel: number
  expTotal: number
  expAtCurrentLevel: number
  expNeededForNext: number | null
  progressPct: number | null
  nextLevel: number | null
  phase: Phase
  grade: string
  /** Paragon oltre cap 50 (0 se non ancora paragon). */
  paragon: number
  atLevelCap: boolean
}

export function getLevelUpProgress(expTotal: number): LevelUpProgress {
  const currentLevel = getLevelFromExp(expTotal)
  const paragon = getParagonFromExp(expTotal)
  const row = getLevelRow(currentLevel)
  const atLevelCap = currentLevel >= LEVEL_CAP

  if (!row) {
    return {
      currentLevel: 1,
      expTotal,
      expAtCurrentLevel: 0,
      expNeededForNext: EXP_DELTA_BASE,
      progressPct: Math.min(100, (expTotal / EXP_DELTA_BASE) * 100),
      nextLevel: 2,
      phase: 'EARLY-GAME',
      grade: 'Nemuribito',
      paragon: 0,
      atLevelCap: false,
    }
  }

  if (atLevelCap) {
    const capExp = row.expTotal
    const nextParagonRow = getParagonRow(paragon + 1)
    if (!nextParagonRow) {
      return {
        currentLevel: LEVEL_CAP,
        expTotal,
        expAtCurrentLevel: capExp,
        expNeededForNext: null,
        progressPct: null,
        nextLevel: null,
        phase: row.phase,
        grade: row.grade,
        paragon,
        atLevelCap: true,
      }
    }
    const prevParagonExp = paragon > 0 ? (getParagonRow(paragon)?.expTotal ?? capExp) : capExp
    const expNeededForNext = nextParagonRow.expTotal - prevParagonExp
    const expIntoParagon = expTotal - prevParagonExp
    return {
      currentLevel: LEVEL_CAP,
      expTotal,
      expAtCurrentLevel: prevParagonExp,
      expNeededForNext,
      progressPct: Math.min(100, (expIntoParagon / expNeededForNext) * 100),
      nextLevel: null,
      phase: row.phase,
      grade: row.grade,
      paragon,
      atLevelCap: true,
    }
  }

  const nextRow = getLevelRow(currentLevel + 1)
  if (!nextRow) {
    return {
      currentLevel: LEVEL_CAP,
      expTotal,
      expAtCurrentLevel: row.expTotal,
      expNeededForNext: null,
      progressPct: null,
      nextLevel: null,
      phase: row.phase,
      grade: row.grade,
      paragon: 0,
      atLevelCap: true,
    }
  }

  const expAtCurrentLevel = row.expTotal
  const expNeededForNext = nextRow.expTotal - row.expTotal
  const expIntoCurrentLevel = expTotal - expAtCurrentLevel
  const progressPct = (expIntoCurrentLevel / expNeededForNext) * 100

  return {
    currentLevel,
    expTotal,
    expAtCurrentLevel,
    expNeededForNext,
    progressPct: Math.min(100, progressPct),
    nextLevel: nextRow.level,
    phase: row.phase,
    grade: row.grade,
    paragon: 0,
    atLevelCap: false,
  }
}

/** Etichetta UI livello (es. "42" o "50 ★3"). */
export function formatLevelLabel(level: number, paragon = 0): string {
  const lv = Math.min(Math.max(level, 1), LEVEL_CAP)
  if (paragon > 0) return `${lv} ★${paragon}`
  return String(lv)
}

export function isParagonPlayer(expTotal: number): boolean {
  return getParagonFromExp(expTotal) > 0
}
