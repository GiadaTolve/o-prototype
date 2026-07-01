import { describe, expect, test } from 'bun:test'
import {
  applySokaijuEffectDuration,
  applySokaijuEmotionalStacks,
  applySokaijuSupportValue,
  calculateKongenDamageFloor,
  calculateMaxActiveConstructs,
  checkHikanSurpriseBypass,
  compareSokaijuInitiativeTieBreak,
  getSokaijuRank,
  resolveGojuElementalAutoApply,
  resolveSokaijuFlatDamageBonus,
} from './sokaiju-combat.ts'
import {
  getMaxAllowedConstructSizeId,
  isConstructSizeAllowedForCreator,
} from '../combat/field-constructs.ts'

describe('sokaiju-combat', () => {
  test('rank capped at 5', () => {
    expect(getSokaijuRank({ kongen: 10 }, 'kongen')).toBe(5)
    expect(getSokaijuRank({ kongen: 3 }, 'kongen')).toBe(3)
  })

  test('kongen damage floor', () => {
    expect(calculateKongenDamageFloor({ kongen: 4 })).toBe(6)
    expect(calculateKongenDamageFloor({ kongen: 5 })).toBe(8)
  })

  test('chiko construct cap', () => {
    expect(calculateMaxActiveConstructs({ chiko: 0 })).toBe(1)
    expect(calculateMaxActiveConstructs({ chiko: 3 })).toBe(4)
  })

  test('chiko max construct size', () => {
    expect(getMaxAllowedConstructSizeId({ chiko: 0 })).toBe('media')
    expect(getMaxAllowedConstructSizeId({ chiko: 2 })).toBe('grande')
    expect(getMaxAllowedConstructSizeId({ chiko: 4 })).toBe('enorme')
    expect(isConstructSizeAllowedForCreator('grande', { chiko: 0 })).toBe(false)
    expect(isConstructSizeAllowedForCreator('media', { chiko: 0 })).toBe(true)
  })

  test('goju elemental auto-apply', () => {
    expect(resolveGojuElementalAutoApply({ 'goju-fuoco': 1 })).toEqual({
      statusId: 'incendiato',
      durationTurns: 3,
      stacks: 1,
    })
    expect(resolveGojuElementalAutoApply({})).toBeNull()
    expect(resolveGojuElementalAutoApply({ 'goju-fuoco': 1, 'goju-acqua': 1 })).toBeNull()
  })

  test('shodo eiga jikai modifiers', () => {
    expect(applySokaijuEffectDuration(3, { shodo: 5 })).toBe(5)
    expect(applySokaijuEmotionalStacks(1, { eiga: 4 })).toBe(3)
    expect(applySokaijuSupportValue(5, { jikai: 2 })).toBe(7)
  })

  test('reactive damage includes gojin', () => {
    expect(resolveSokaijuFlatDamageBonus({ kongen: 2, gojin: 3 })).toBe(3)
    expect(resolveSokaijuFlatDamageBonus({ kongen: 2, gojin: 3 }, { isReactive: true })).toBe(6)
  })

  test('hikan surprise', () => {
    expect(checkHikanSurpriseBypass({ hikan: 4 }, { chokaku: 2 }, false)).toBe(true)
    expect(checkHikanSurpriseBypass({ hikan: 2 }, { chokaku: 4 }, false)).toBe(false)
    expect(checkHikanSurpriseBypass({ hikan: 5 }, { chokaku: 1 }, true)).toBe(false)
  })

  test('kashin tie-break', () => {
    expect(compareSokaijuInitiativeTieBreak(3, 2, false, false)).toBe(1)
    expect(compareSokaijuInitiativeTieBreak(2, 2, true, false)).toBe(1)
    expect(compareSokaijuInitiativeTieBreak(2, 2, false, false)).toBe(0)
  })
})
