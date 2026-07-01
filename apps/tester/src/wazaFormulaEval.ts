/**
 * Valutazione sicura formule waza (tester). Nessun throw verso React durante digitazione.
 */

import { reflexesFromWazaStats } from './wazaPool'

export type FormulaEvalStats = {
  F: number
  C: number
  D: number
  M: number
  E: number
  LVL: number
  Grado: number
}

export function normalizeFormula(formula: string): string {
  return formula
    .replace(/×/g, '*')
    .replace(/·/g, '*')
    .replace(/([a-zA-Z0-9.)])x([a-zA-Z0-9.(])/gi, '$1*$2')
    .replace(/\s+x\s+/g, ' * ')
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/\s+/g, ' ')
    .trim()
}

export function formulaToFn(formula: string): (s: FormulaEvalStats) => number {
  const normalized = normalizeFormula(formula)
  const sanitized = normalized.replace(/[^0-9a-zA-Z.\+\-\*\/\(\)\s]/g, '')
  if (!sanitized) return () => NaN
  let fn: (
    f: number,
    c: number,
    d: number,
    m: number,
    e: number,
    lvl: number,
    grado: number,
    floor: (n: number) => number,
    ref: number,
  ) => number
  try {
    fn = new Function(
      'F',
      'C',
      'D',
      'M',
      'E',
      'LVL',
      'Grado',
      'floor',
      'REF',
      `return Math.floor(${sanitized})`,
    ) as typeof fn
  } catch {
    return () => NaN
  }
  return (s: FormulaEvalStats) => {
    try {
      const REF = reflexesFromWazaStats(s)
      const v = fn(s.F, s.C, s.D, s.M, s.E, s.LVL, s.Grado, Math.floor, REF)
      return typeof v === 'number' && Number.isFinite(v) ? v : NaN
    } catch {
      return NaN
    }
  }
}

export function formulaFromString(input: string): (s: FormulaEvalStats) => number {
  const n = parseInt(input, 10)
  if (!isNaN(n) && input.trim() === String(n)) return () => n
  return formulaToFn(input)
}

export function safeEvalFormula(
  fn: (s: FormulaEvalStats) => number,
  stats: FormulaEvalStats,
): number | null {
  try {
    const v = fn(stats)
    if (typeof v !== 'number' || !Number.isFinite(v)) return null
    return v
  } catch {
    return null
  }
}

/** DBW numerico o formula */
export function safeEvalDbw(
  dbw: number | ((s: FormulaEvalStats) => number),
  stats: FormulaEvalStats,
): number | null {
  try {
    const v = typeof dbw === 'function' ? dbw(stats) : dbw
    if (typeof v !== 'number' || !Number.isFinite(v)) return null
    return v
  } catch {
    return null
  }
}
