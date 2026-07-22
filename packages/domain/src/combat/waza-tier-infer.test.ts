import { describe, expect, it } from 'vitest'
import {
  inferWazaRankLabelFromCs,
  inferWazaTierFromCs,
  getWazaManualTierSummary,
} from './waza-tier-infer.ts'

describe('waza tier infer (authoring / sync)', () => {
  it('mappa costCs a tier sui default T1–T5 (2/4/6/8/10)', () => {
    expect(inferWazaTierFromCs(0)).toBeNull()
    expect(inferWazaTierFromCs(2)).toBe(1)
    expect(inferWazaTierFromCs(4)).toBe(2)
    expect(inferWazaTierFromCs(6)).toBe(3)
    expect(inferWazaTierFromCs(8)).toBe(4)
    expect(inferWazaTierFromCs(10)).toBe(5)
    expect(inferWazaRankLabelFromCs(4)).toBe('T2')
  })

  it('passive senza tier', () => {
    const s = getWazaManualTierSummary(3, true)
    expect(s.tier).toBeNull()
    expect(s.note).toContain('passiva')
  })

  it('attiva: CS intermedio → tier e costo di tabella', () => {
    const s = getWazaManualTierSummary(4, false)
    expect(s.rankLabel).toBe('T2')
    expect(s.csCost).toBe(4)
    expect(s.damage).toBe(8)
  })
})
