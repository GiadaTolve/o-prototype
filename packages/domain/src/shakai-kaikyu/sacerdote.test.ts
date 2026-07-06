import { describe, expect, it } from 'vitest'
import { getSocialBlueprint } from './blueprint-catalog'
import {
  isSacerdoteRiteBlueprint,
  requiresConsecratedPlaceForCraft,
  sacerdoteOfudaCatalogKey,
  validateActivateOfuda,
  validateCraftOfuda,
} from './sacerdote'

describe('sacerdote', () => {
  it('catalog key ofuda', () => {
    expect(sacerdoteOfudaCatalogKey('sacerdote-conforto')).toBe('ofuda-sacerdote-conforto')
  })

  it('riconosce rito', () => {
    const bp = getSocialBlueprint('sacerdote-conforto')
    expect(bp && isSacerdoteRiteBlueprint(bp)).toBe(true)
  })

  it('jareiba richiede luogo consacrato senza yumetoki', () => {
    expect(requiresConsecratedPlaceForCraft({ 'shisai-jareiba': true })).toBe(true)
    expect(
      requiresConsecratedPlaceForCraft({ 'shisai-jareiba': true, 'shisai-yumetoki': true }),
    ).toBe(false)
  })

  it('valida fabbricazione e attivazione', () => {
    const bp = getSocialBlueprint('sacerdote-veglia')!
    expect(
      validateCraftOfuda(
        bp,
        { maxPower: 2, maxActive: 2, activeCount: 0 },
        { subclassSheet: { 'shisai-minarai-miko': true }, consecratedPlace: false },
      ).ok,
    ).toBe(true)
    expect(
      validateActivateOfuda(2, { maxPower: 2, maxActive: 2, activeCount: 2 }).ok,
    ).toBe(false)
  })
})
