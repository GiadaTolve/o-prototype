import { describe, expect, it } from 'vitest'
import { getSocialBlueprint } from './blueprint-catalog'
import { isCraftableBlueprint, socialBlueprintOutputCatalogKey } from './craft'

describe('craft', () => {
  it('output key per kind craftabile', () => {
    expect(socialBlueprintOutputCatalogKey(getSocialBlueprint('medico-bendaggio-semplice')!)).toBe(
      'prep-medico-bendaggio-semplice',
    )
    expect(socialBlueprintOutputCatalogKey(getSocialBlueprint('artigiano-utensile-campo')!)).toBe(
      'proj-artigiano-utensile-campo',
    )
    expect(socialBlueprintOutputCatalogKey(getSocialBlueprint('sacerdote-conforto')!)).toBe(
      'ofuda-sacerdote-conforto',
    )
  })

  it('esclude procedure e gather', () => {
    const gather = getSocialBlueprint('cacciatore-selvaggina-minuta')
    expect(gather && isCraftableBlueprint(gather)).toBe(false)
    const pact = getSocialBlueprint('politico-patto-peso-1')
    expect(pact && isCraftableBlueprint(pact)).toBe(false)
  })
})
