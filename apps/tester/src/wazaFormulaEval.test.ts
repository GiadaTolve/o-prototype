import { describe, expect, it } from 'vitest'
import {
  formulaFromString,
  formulaToFn,
  normalizeFormula,
  safeEvalFormula,
  type FormulaEvalStats,
} from './wazaFormulaEval'

const SAMPLE: FormulaEvalStats = {
  F: 10,
  C: 10,
  D: 10,
  M: 10,
  E: 10,
  LVL: 2,
  Grado: 2,
}

describe('wazaFormulaEval — niente throw in digitazione / variabili stray', () => {
  it('lettera G sola non manda in crash la valutazione', () => {
    const fn = formulaFromString('G')
    expect(safeEvalFormula(fn, SAMPLE)).toBeNull()
  })

  it('formula incompleta restituisce null', () => {
    const fn = formulaToFn('D *')
    expect(safeEvalFormula(fn, SAMPLE)).toBeNull()
  })

  it('formula valida con D e Grado', () => {
    const fn = formulaFromString('D * 2 + Grado')
    expect(safeEvalFormula(fn, SAMPLE)).toBe(22)
  })

  it('REF è Riflessi: floor(0,4×M + 0,6×D) con Y=1', () => {
    const fn = formulaFromString('REF + floor(M * 0.2) + floor(D * 0.1)')
    expect(safeEvalFormula(fn, SAMPLE)).toBe(13)
  })

  it('solo numero', () => {
    const fn = formulaFromString('42')
    expect(safeEvalFormula(fn, SAMPLE)).toBe(42)
  })

  it('normalizeFormula gestisce × e virgola decimale', () => {
    expect(normalizeFormula('1,5 × 2')).toBe('1.5 * 2')
  })

  it('stringa vuota → null da safeEval', () => {
    const fn = formulaToFn('')
    expect(safeEvalFormula(fn, SAMPLE)).toBeNull()
  })
})
