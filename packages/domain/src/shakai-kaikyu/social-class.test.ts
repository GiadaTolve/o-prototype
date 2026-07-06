import { describe, expect, it } from 'vitest'
import {
  assignSocialClass,
  getActiveSocialClassTag,
  getRemainingDailyBudget,
  syncSkiruSheetForSocialClass,
  unlockSocialSubclass,
} from './social-class'

describe('assignSocialClass', () => {
  it('allows first class choice', () => {
    const result = assignSocialClass(null, 'ishi')
    expect(result.ok).toBe(true)
  })

  it('blocks re-choice without moderation', () => {
    const result = assignSocialClass('ishi', 'shokunin')
    expect(result.ok).toBe(false)
    expect(result.errors[0]).toMatch(/moderazione/i)
  })

  it('rejects unknown class id', () => {
    const result = assignSocialClass(null, 'ninja')
    expect(result.ok).toBe(false)
  })
})

describe('syncSkiruSheetForSocialClass', () => {
  it('sets one gate point on chosen class only', () => {
    const sheet = syncSkiruSheetForSocialClass({ undo: 2, ishi: 1, shokunin: 1 }, 'ryoshi')
    expect(sheet.ishi).toBe(0)
    expect(sheet.shokunin).toBe(0)
    expect(sheet.ryoshi).toBe(1)
    expect(sheet.undo).toBe(2)
  })
})

describe('unlockSocialSubclass', () => {
  it('spends XP on valid unlock', () => {
    const result = unlockSocialSubclass('ishi', {}, 'ishi-minarai', 10)
    expect(result.ok).toBe(true)
    expect(result.xpCost).toBe(5)
    expect(result.nextExpSpendable).toBe(5)
    expect(result.nextSheet?.['ishi-minarai']).toBe(true)
  })

  it('rejects unlock without enough XP', () => {
    const result = unlockSocialSubclass('ishi', {}, 'ishi-minarai', 2)
    expect(result.ok).toBe(false)
    expect(result.errors[0]).toMatch(/5 XP/)
  })
})

describe('getActiveSocialClassTag', () => {
  it('returns class tag for active class', () => {
    expect(getActiveSocialClassTag('shokunin')).toBe('#Artigiano')
    expect(getActiveSocialClassTag(null)).toBeNull()
  })
})

describe('getRemainingDailyBudget', () => {
  it('subtracts used heal budget from subclass cap', () => {
    const sheet = { 'ishi-minarai': true, 'ishi-gekai': true }
    const remaining = getRemainingDailyBudget('ishi', sheet, {
      healHpUsed: 12,
      integrityUsed: 0,
      gatherUsed: 0,
      pactWeightUsed: 0,
      ofudaPowerUsed: 0,
    })
    expect(remaining.healHp.max).toBe(30)
    expect(remaining.healHp.remaining).toBe(18)
  })
})
