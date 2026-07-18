import { describe, expect, it } from 'vitest'
import { isAmmoConsumable, isEquippableItem } from './items'

describe('isAmmoConsumable', () => {
  it('matches consumable with ammoKind', () => {
    expect(isAmmoConsumable('consumabile', 'pistola')).toBe(true)
    expect(isAmmoConsumable('consumabile', null)).toBe(false)
    expect(isAmmoConsumable('equipaggiamento', 'pistola')).toBe(false)
  })
})

describe('isEquippableItem', () => {
  it('allows ammo consumables', () => {
    expect(isEquippableItem('GENERIC', 'consumabile', 'pistola')).toBe(true)
  })
})
