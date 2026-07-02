import { describe, expect, it } from 'vitest'
import {
  canDismantleInventoryItem,
  isArtigianoFromSkiruSheet,
  materialCatalogKey,
  resolveJunkDismantleYields,
  yieldFromBrokenEquipment,
} from './dismantle'

describe('canDismantleInventoryItem', () => {
  it('allows junk with template', () => {
    expect(
      canDismantleInventoryItem({
        category: 'junk',
        junkTemplateId: 'junk-abiti',
      }).ok,
    ).toBe(true)
  })

  it('blocks intact equipment', () => {
    const r = canDismantleInventoryItem({
      category: 'equipaggiamento',
      integrityCurrent: 10,
      integrityMax: 30,
      blueprintId: 'artigiano-arma-bianca',
    })
    expect(r.ok).toBe(false)
  })

  it('allows broken equipment with blueprint', () => {
    expect(
      canDismantleInventoryItem({
        category: 'equipaggiamento',
        integrityCurrent: 0,
        integrityMax: 30,
        blueprintId: 'artigiano-arma-bianca',
      }).ok,
    ).toBe(true)
  })
})

describe('resolveJunkDismantleYields', () => {
  it('returns stoffa from abiti', () => {
    const yields = resolveJunkDismantleYields('junk-abiti')
    expect(yields).toContainEqual({ materialId: 'stoffa', quantity: 2 })
  })
})

describe('isArtigianoFromSkiruSheet', () => {
  it('requires shokunin point', () => {
    expect(isArtigianoFromSkiruSheet({ shokunin: 1 })).toBe(true)
    expect(isArtigianoFromSkiruSheet({})).toBe(false)
  })
})

describe('materialCatalogKey', () => {
  it('prefixes mat-', () => {
    expect(materialCatalogKey('stoffa')).toBe('mat-stoffa')
  })
})

describe('yieldFromBrokenEquipment', () => {
  it('floors 50% recipe', () => {
    const yields = yieldFromBrokenEquipment([
      { materialId: 'rottame_metallico', quantity: 3 },
      { materialId: 'legno', quantity: 1 },
    ])
    expect(yields).toEqual([{ materialId: 'rottame_metallico', quantity: 1 }])
  })
})
