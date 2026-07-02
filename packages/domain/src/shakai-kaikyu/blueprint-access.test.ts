import { describe, expect, it } from 'vitest'
import { canAccessSocialBlueprint, listAccessibleSocialBlueprints } from './blueprint-access'
import { SOCIAL_BLUEPRINTS } from './blueprint-catalog'
import { canDismantleJunkItem, JUNK_ITEMS } from './materials'

describe('SOCIAL_BLUEPRINTS', () => {
  it('has entries for all five class tags', () => {
    const tags = new Set(SOCIAL_BLUEPRINTS.map((b) => b.tag))
    expect(tags).toEqual(
      new Set(['#Medico', '#Artigiano', '#Cacciatore', '#Politico', '#Sacerdote']),
    )
  })
})

describe('canAccessSocialBlueprint', () => {
  it('unlocks path recipes with keystone + path only', () => {
    const sheet = { 'ishi-minarai': true, 'ishi-gekai': true }
    expect(canAccessSocialBlueprint('ishi', sheet, 'medico-kit-sutura')).toBe(true)
    expect(canAccessSocialBlueprint('ishi', sheet, 'medico-decotto')).toBe(false)
  })

  it('capstone unlocks all class craft blueprints', () => {
    const sheet = { 'ishi-minarai': true, 'ishi-gekai': true, 'ishi-iryo-no-oni': true }
    expect(canAccessSocialBlueprint('ishi', sheet, 'medico-decotto')).toBe(true)
    expect(canAccessSocialBlueprint('ishi', sheet, 'medico-panacea')).toBe(true)
  })

  it('gates pact templates by weight capacity', () => {
    const kojin = { 'seijika-kojin': true }
    expect(canAccessSocialBlueprint('seijika', kojin, 'politico-patto-peso-2')).toBe(true)
    expect(canAccessSocialBlueprint('seijika', kojin, 'politico-patto-peso-3')).toBe(false)

    const senseki = { 'seijika-kojin': true, 'seijika-senseki': true }
    expect(canAccessSocialBlueprint('seijika', senseki, 'politico-patto-peso-3')).toBe(true)
  })

  it('lists accessible blueprints for hunter gather', () => {
    const sheet = { 'ryoshi-michishirube': true }
    const list = listAccessibleSocialBlueprints('ryoshi', sheet)
    expect(list.some((b) => b.id === 'cacciatore-selvaggina-minuta')).toBe(true)
    expect(list.some((b) => b.id === 'cacciatore-predatore')).toBe(false)
  })
})

describe('JUNK_ITEMS', () => {
  it('lets artigiano dismantle everything', () => {
    for (const item of JUNK_ITEMS) {
      expect(canDismantleJunkItem('#Artigiano', item)).toBe(true)
    }
  })

  it('restricts medico junk to tagged items', () => {
    const orologio = JUNK_ITEMS.find((j) => j.id === 'junk-orologio')!
    const lattine = JUNK_ITEMS.find((j) => j.id === 'junk-lattine')!
    expect(canDismantleJunkItem('#Medico', orologio)).toBe(true)
    expect(canDismantleJunkItem('#Medico', lattine)).toBe(false)
  })
})
