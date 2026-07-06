import { describe, expect, it } from 'vitest'
import { buildHousingEffectText, getHousingCatalogDef, HOUSING_CATALOG } from './housing-catalog'

describe('HOUSING_CATALOG', () => {
  it('has 8 tipologie con codici univoci', () => {
    expect(HOUSING_CATALOG.length).toBe(8)
    const codes = new Set(HOUSING_CATALOG.map((h) => h.id))
    expect(codes.size).toBe(8)
  })

  it('buildHousingEffectText include bonus per container', () => {
    const def = getHousingCatalogDef('container')
    expect(def).toBeDefined()
    const text = buildHousingEffectText(def!)
    expect(text).toContain('+10 slot')
    expect(text).toContain('100 REM/mese')
  })
})
