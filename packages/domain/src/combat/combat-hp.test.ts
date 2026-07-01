import { describe, expect, it } from 'vitest'
import { applyHpDelta, resolveCombatHp } from './combat-hp.ts'

describe('combat hp', () => {
  it('null stored = HP pieni', () => {
    expect(resolveCombatHp(null, 45)).toEqual({ hpCurrent: 45, hpMax: 45 })
  })

  it('applica danno e cura con cap', () => {
    expect(applyHpDelta(45, 45, -3)).toBe(42)
    expect(applyHpDelta(42, 45, 10)).toBe(45)
    expect(applyHpDelta(5, 45, -20)).toBe(0)
  })
})
