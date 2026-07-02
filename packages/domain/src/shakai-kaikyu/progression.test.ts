import { describe, expect, it } from 'vitest'
import { canUnlockSocialSubclass, resolveDailyLimitFromSubclasses } from './progression'

describe('canUnlockSocialSubclass', () => {
  it('allows keystone when class is assigned', () => {
    const result = canUnlockSocialSubclass('ishi', {}, 'ishi-minarai')
    expect(result.ok).toBe(true)
  })

  it('blocks a second path on the same class', () => {
    const sheet = { 'ishi-minarai': true, 'ishi-gekai': true }
    const result = canUnlockSocialSubclass('ishi', sheet, 'ishi-yakushi')
    expect(result.ok).toBe(false)
    expect(result.errors).toContain('È consentito un solo sentiero per classe.')
  })

  it('requires keystone + one path before capstone', () => {
    const onlyKeystone = { 'ishi-minarai': true }
    const result = canUnlockSocialSubclass('ishi', onlyKeystone, 'ishi-iryo-no-oni')
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.includes('sentiero'))).toBe(true)
  })

  it('allows capstone with keystone and one path', () => {
    const sheet = { 'ishi-minarai': true, 'ishi-gekai': true }
    const result = canUnlockSocialSubclass('ishi', sheet, 'ishi-iryo-no-oni')
    expect(result.ok).toBe(true)
  })
})

describe('resolveDailyLimitFromSubclasses', () => {
  it('picks the highest daily heal from unlocked subclasses', () => {
    const sheet = { 'ishi-minarai': true, 'ishi-gekai': true }
    expect(resolveDailyLimitFromSubclasses('ishi', sheet, 'dailyHealHpMax')).toBe(30)
  })
})
