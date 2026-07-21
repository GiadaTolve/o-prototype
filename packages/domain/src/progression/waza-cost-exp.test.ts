import { describe, expect, it } from 'vitest'
import {
  resolveDefaultWazaCostExp,
  WAZA_DEFAULT_COST_EXP_BY_TIER,
  WAZA_DEFAULT_PASSIVE_COST_EXP,
} from './waza-cost-exp'

describe('resolveDefaultWazaCostExp', () => {
  it('passive → 15 EXP', () => {
    expect(resolveDefaultWazaCostExp({ isPassive: true, rank: 'T4' })).toBe(
      WAZA_DEFAULT_PASSIVE_COST_EXP,
    )
  })

  it('active by rank T1–T5', () => {
    expect(resolveDefaultWazaCostExp({ rank: 'T1' })).toBe(15)
    expect(resolveDefaultWazaCostExp({ rank: 'T2' })).toBe(20)
    expect(resolveDefaultWazaCostExp({ rank: 'T3' })).toBe(25)
    expect(resolveDefaultWazaCostExp({ rank: 'T4' })).toBe(35)
    expect(resolveDefaultWazaCostExp({ rank: 'T5' })).toBe(40)
  })

  it('active by tier number', () => {
    expect(resolveDefaultWazaCostExp({ tier: 3 })).toBe(WAZA_DEFAULT_COST_EXP_BY_TIER[3])
  })

  it('fallback T1 when rank assente', () => {
    expect(resolveDefaultWazaCostExp({ isPassive: false, rank: null })).toBe(15)
  })
})
