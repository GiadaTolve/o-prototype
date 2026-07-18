import { describe, expect, it } from 'vitest'
import {
  BROKEN_EQUIP_SCRAP_JUNK,
  canDismantleInventoryItem,
  CONSUMABLE_SCRAP_JUNK,
  isArtigianoFromSkiruSheet,
  materialCatalogKey,
  resolveDismantleYields,
  resolveJunkDismantleYields,
  parseDismantleCatalogYields,
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

  it('allows consumables', () => {
    expect(canDismantleInventoryItem({ category: 'consumabile' }).ok).toBe(true)
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

  it('allows broken equipment with or without blueprint', () => {
    expect(
      canDismantleInventoryItem({
        category: 'equipaggiamento',
        integrityCurrent: 0,
        integrityMax: 30,
        blueprintId: 'artigiano-arma-bianca',
      }).ok,
    ).toBe(true)
    expect(
      canDismantleInventoryItem({
        category: 'equipaggiamento',
        integrityCurrent: 0,
        integrityMax: 30,
      }).ok,
    ).toBe(true)
  })

  it('blocks trama and materiali', () => {
    expect(canDismantleInventoryItem({ category: 'oggetto_trama' }).ok).toBe(false)
    expect(canDismantleInventoryItem({ category: 'materiale' }).ok).toBe(false)
  })
})

describe('resolveJunkDismantleYields', () => {
  it('returns stoffa from abiti', () => {
    const yields = resolveJunkDismantleYields('junk-abiti')
    expect(yields).toContainEqual({ materialId: 'stoffa', quantity: 2 })
  })
})

describe('parseDismantleCatalogYields', () => {
  it('parses junk + materials', () => {
    expect(
      parseDismantleCatalogYields({
        junkCatalogKey: 'junk-flaconi',
        junkQuantity: 2,
        materials: { reagente: 1 },
      }),
    ).toEqual({
      junkCatalogKey: 'junk-flaconi',
      junkQuantity: 2,
      materials: { reagente: 1 },
    })
  })

  it('rejects invalid material ids', () => {
    expect(parseDismantleCatalogYields({ materials: { foo: 1 } })).toBeNull()
  })
})

describe('resolveDismantleYields', () => {
  it('uses catalog override for junk materials', () => {
    const r = resolveDismantleYields({
      category: 'junk',
      junkTemplateId: 'junk-abiti',
      catalogYields: { materials: { stoffa: 5 } },
    })
    expect(r.materials).toEqual([{ materialId: 'stoffa', quantity: 5 }])
  })

  it('uses catalog override for consumable', () => {
    const r = resolveDismantleYields({
      category: 'consumabile',
      catalogYields: {
        junkCatalogKey: 'junk-batterie',
        materials: { reagente: 3 },
      },
    })
    expect(r.junk).toEqual([{ catalogKey: 'junk-batterie', quantity: 1 }])
    expect(r.materials).toEqual([{ materialId: 'reagente', quantity: 3 }])
  })
  it('returns materials only for junk', () => {
    const r = resolveDismantleYields({
      category: 'junk',
      junkTemplateId: 'junk-abiti',
    })
    expect(r.junk).toEqual([])
    expect(r.materials).toContainEqual({ materialId: 'stoffa', quantity: 2 })
  })

  it('returns scrap junk + reagente for consumables', () => {
    const r = resolveDismantleYields({ category: 'consumabile' })
    expect(r.junk).toEqual([{ catalogKey: CONSUMABLE_SCRAP_JUNK, quantity: 1 }])
    expect(r.materials).toContainEqual({ materialId: 'reagente', quantity: 1 })
  })

  it('returns scrap junk + 50% recipe for broken equip', () => {
    const r = resolveDismantleYields({
      category: 'equipaggiamento',
      integrityCurrent: 0,
      integrityMax: 10,
      blueprintId: 'artigiano-arma-bianca',
      itemType: 'WEAPON',
    })
    expect(r.junk).toEqual([{ catalogKey: BROKEN_EQUIP_SCRAP_JUNK, quantity: 1 }])
    expect(r.materials.length).toBeGreaterThan(0)
  })

  it('falls back to generic materials when blueprint missing', () => {
    const r = resolveDismantleYields({
      category: 'equipaggiamento',
      integrityCurrent: 0,
      integrityMax: 10,
      itemType: 'ARMOR',
    })
    expect(r.materials).toContainEqual({ materialId: 'stoffa', quantity: 1 })
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
