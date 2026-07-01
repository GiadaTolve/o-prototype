/**
 * Risoluzione formule Vel / DBW / Gittata per rango Waza (I–III).
 */

import type { WazaDef, WazaStats } from './wazaPool'
import { formulaFromString, safeEvalDbw, safeEvalFormula, type FormulaEvalStats } from './wazaFormulaEval'

export function statsAtRank(base: WazaStats, rank: 1 | 2 | 3): FormulaEvalStats {
  return { ...base, LVL: rank }
}

export function resolveVelFn(
  w: Pick<WazaDef, 'velFormula' | 'velFormulaRank2' | 'velFormulaRank3'>,
  rank: 1 | 2 | 3,
): ((s: FormulaEvalStats) => number) | undefined {
  if (rank >= 3 && w.velFormulaRank3) return w.velFormulaRank3 as (s: FormulaEvalStats) => number
  if (rank >= 2 && w.velFormulaRank2) return w.velFormulaRank2 as (s: FormulaEvalStats) => number
  return w.velFormula as ((s: FormulaEvalStats) => number) | undefined
}

export function resolveDbw(
  w: Pick<WazaDef, 'dbw' | 'dbwRank2' | 'dbwRank3'>,
  rank: 1 | 2 | 3,
): number | ((s: FormulaEvalStats) => number) {
  if (rank >= 3 && w.dbwRank3 !== undefined) return w.dbwRank3
  if (rank >= 2 && w.dbwRank2 !== undefined) return w.dbwRank2
  return w.dbw
}

function gittataFormulaString(w: WazaDef): string | undefined {
  const row = w.quadranteCalcoli?.find((c) => c.label === 'Gittata')
  return row?.formula?.trim() || undefined
}

export function resolveGittataFn(
  w: Pick<WazaDef, 'quadranteCalcoli' | 'gittataFormulaRank2' | 'gittataFormulaRank3'>,
  rank: 1 | 2 | 3,
): ((s: FormulaEvalStats) => number) | undefined {
  if (rank >= 3 && w.gittataFormulaRank3) {
    return w.gittataFormulaRank3 as (s: FormulaEvalStats) => number
  }
  if (rank >= 2 && w.gittataFormulaRank2) {
    return w.gittataFormulaRank2 as (s: FormulaEvalStats) => number
  }
  const expr = gittataFormulaString(w as WazaDef)
  if (!expr) return undefined
  return formulaFromString(expr)
}

export function evalVelAtRank(w: WazaDef, rank: 1 | 2 | 3, stats: WazaStats): number | null {
  const fn = resolveVelFn(w, rank)
  if (!fn) return null
  return safeEvalFormula(fn, statsAtRank(stats, rank))
}

export function evalDbwAtRank(w: WazaDef, rank: 1 | 2 | 3, stats: WazaStats): number | null {
  const dbw = resolveDbw(w, rank)
  return safeEvalDbw(dbw as number | ((s: FormulaEvalStats) => number), statsAtRank(stats, rank))
}

export function evalGittataAtRank(w: WazaDef, rank: 1 | 2 | 3, stats: WazaStats): number | null {
  const fn = resolveGittataFn(w, rank)
  if (!fn) return null
  return safeEvalFormula(fn, statsAtRank(stats, rank))
}
