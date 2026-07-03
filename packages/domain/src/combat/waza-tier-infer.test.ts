import { describe, expect, it } from 'vitest'
import {
  getWazaManualTierSummary,
  inferWazaRankLabelFromCs,
  inferWazaTierFromCs,
} from './waza-tier-infer.ts'

describe('waza tier infer (authoring / sync)', () => {
  it('maappa costCs a tier come sync-waza-manual', () => {
    expect(inferWazaTierFromCs(0)).toBeNull()
    expect(inferWazaTierFromCs(1)).toBe(1)
    expect(inferWazaTierFromCs(2)).toBe(2)
    expect(inferWazaTierFromCs(3)).toBe(2)
    expect(inferWazaTierFromCs(5)).toBe(3)
    expect(inferWazaTierFromCs(7)).toBe(4)
    expect(inferWazaRankLabelFromCs(3)).toBe('T2')
  })

  it('passive senza tier', () => {
    const s = getWazaManualTierSummary(3, true)
    expect(s.tier).toBeNull()
    expect(s.note).toContain('passiva')
  })

  it => {
    const s = getWazaManualTierSummary(3, false)
    expect(s.rankLabel).toBe('T2')
    expect(s.csCost).toBe(2)
    expect(s.damage).toBe(8)
  })
})
