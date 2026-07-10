import { describe, expect, it } from 'vitest'
import {
  CONSTRUCT_SIZES,
  absorbDamageWithResistance,
  calculateConstructResistance,
  applyShieldToDamage,
  resolveDamageToHp,
} from '../../../packages/domain/src/combat/index.ts'

describe => {
  it('calcola resistenza (Kongen rank + numero tier) × taglia', () => {
    expect(calculateConstructResistance(3, 2, 'grande')).toBe(7)
    expect(calculateConstructResistance(5, 3, 'media')).toBe(8)
    expect(calculateConstructResistance(5, 3, 'grande')).toBe(12)
  })

  it('assorbe danno fino alla resistenza', () => {
    expect(absorbDamageWithResistance(10, 7)).toEqual({ absorbed: 7, remainder: 0 })
    expect(absorbDamageWithResistance(10, 15)).toEqual({ absorbed: 10, remainder: 5 })
  })

  it('costrutto salta mitigazione Itami', () => {
    const breakdown = resolveDamageToHp({
      tier: 3,
      shieldResistance: calculateConstructResistance(4, 3, 'media'),
      targetSheet: { itami: 10 },
      skipItamiMitigation: true,
    })
    expect(breakdown.shieldAbsorbed).toBe(7)
    expect(breakdown.afterShield).toBe(5)
    expect(breakdown.hpDamage).toBe(5)
    expect(breakdown.mitigationPercent).toBe(0)
  })

  it('espone moltiplicatori taglia', () => {
    expect(CONSTRUCT_SIZES.enorme.resistanceMult).toBe(2)
    expect(CONSTRUCT_SIZES.enorme.damageTierBonus).toBe(2)
  })

  it('applyShieldToDamage delega a absorbDamageWithResistance', () => {
    expect(applyShieldToDamage(12, 5)).toEqual({ afterShield: 7, shieldAbsorbed: 5 })
  })
})
