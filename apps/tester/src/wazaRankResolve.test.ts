import { describe, expect, it } from 'vitest'
import { formulaFromString } from './wazaFormulaEval'
import type { WazaDef, WazaStats } from './wazaPool'
import {
  evalDbwAtRank,
  evalGittataAtRank,
  evalVelAtRank,
} from './wazaRankResolve'

const STATS: WazaStats = {
  F: 10,
  C: 10,
  D: 10,
  M: 10,
  E: 10,
  LVL: 1,
  Grado: 1,
}

function minimalWaza(over: Partial<WazaDef>): WazaDef {
  return {
    id: 't',
    name: 'Test',
    type: 'active',
    branch: 'proiezione',
    costJigo: () => 0,
    costCs: 0,
    velBonus: 0,
    quadranteCalcoli: [{ label: 'Gittata', formula: 'D' }],
    dbw: formulaFromString('D') as WazaDef['dbw'],
    velFormula: formulaFromString('D') as WazaDef['velFormula'],
    hasVelocity: true,
    hasDamage: true,
    ...over,
  }
}

describe('wazaRankResolve — variazioni II/III e valutazione sicura', () => {
  it('LVL 2 usa velFormulaRank2 se presente', () => {
    const base = formulaFromString('D') as WazaDef['velFormula']
    const r2 = formulaFromString('M * 2') as WazaDef['velFormula']
    const w = minimalWaza({ velFormula: base, velFormulaRank2: r2 })
    expect(evalVelAtRank(w, 1, STATS)).toBe(10)
    expect(evalVelAtRank(w, 2, STATS)).toBe(20)
  })

  it('LVL 3 preferisce rank3 al rank2 su velocità', () => {
    const w = minimalWaza({
      velFormula: formulaFromString('1') as WazaDef['velFormula'],
      velFormulaRank2: formulaFromString('2') as WazaDef['velFormula'],
      velFormulaRank3: formulaFromString('3') as WazaDef['velFormula'],
    })
    expect(evalVelAtRank(w, 3, STATS)).toBe(3)
  })

  it('formula parziale Gittata rango 2 non lancia', () => {
    const w = minimalWaza({
      gittataFormulaRank2: formulaFromString('G') as WazaDef['gittataFormulaRank2'],
    })
    expect(evalGittataAtRank(w, 2, STATS)).toBeNull()
  })

  it('dbw numerico per rango 2', () => {
    const w = minimalWaza({ dbw: 1, dbwRank2: 99 })
    expect(evalDbwAtRank(w, 1, STATS)).toBe(1)
    expect(evalDbwAtRank(w, 2, STATS)).toBe(99)
  })
})
