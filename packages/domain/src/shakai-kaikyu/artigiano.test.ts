import { describe, expect, it } from 'vitest'
import { getSocialBlueprint } from './blueprint-catalog'
import {
  artigianoProjectCatalogKey,
  clampIntegrityRepair,
  inferArtigianoProjectOutput,
  isArtigianoCraftBlueprint,
} from './artigiano'

describe('artigiano', () => {
  it('catalog key progetto', () => {
    expect(artigianoProjectCatalogKey('artigiano-utensile-campo')).toBe(
      'proj-artigiano-utensile-campo',
    )
  })

  it('clamp riparazione integrità', () => {
    expect(
      clampIntegrityRepair({
        requested: 10,
        budgetRemaining: 15,
        integrityCurrent: 5,
        integrityMax: 20,
      }),
    ).toEqual({ applied: 10, budgetCost: 10 })
  })

  it('progetti craftabili', () => {
    const bp = getSocialBlueprint('artigiano-utensile-campo')
    expect(bp && isArtigianoCraftBlueprint(bp)).toBe(true)
  })

  it('inferisce integrità da descrizione', () => {
    const bp = getSocialBlueprint('artigiano-utensile-campo')
    expect(bp && inferArtigianoProjectOutput(bp)).toEqual({
      category: 'equipaggiamento',
      integrityMax: 10,
    })
  })
})
