import { describe, expect, it } from 'vitest'
import { canDismantleAsArtigiano, yieldFromBrokenEquipment } from './dismantle'
import { DROP_TABLE_DAILY_CAP_PER_PLAYER, getDropTable, rollDropTableJunk } from './drop-tables'
import { isMarketableCategory, piazzaCommission, piazzaSellerProceeds } from './market'

describe('dismantle', () => {
  it('allows only artigiano', () => {
    expect(canDismantleAsArtigiano('#Artigiano')).toBe(true)
    expect(canDismantleAsArtigiano('#Medico')).toBe(false)
  })

  it('yields 50% recipe materials floored for broken equipment', () => {
    const yields = yieldFromBrokenEquipment([
      { materialId: 'rottame_metallico', quantity: 3 },
      { materialId: 'legno', quantity: 1 },
    ])
    expect(yields).toEqual([{ materialId: 'rottame_metallico', quantity: 1 }])
  })
})

describe('drop-tables', () => {
  it('defines rovine_urbane weights', () => {
    const t = getDropTable('rovine_urbane')
    expect(t?.entries.reduce((s, e) => s + e.weight, 0)).toBe(100)
  })

  it('rolls junk from table with deterministic rng', () => {
    const id = rollDropTableJunk('rovine_urbane', () => 0)
    expect(id).toBeTruthy()
  })

  it('caps table drops per player per day', () => {
    expect(DROP_TABLE_DAILY_CAP_PER_PLAYER).toBe(3)
  })
})

describe('market', () => {
  it('blocks story items from market', () => {
    expect(isMarketableCategory('oggetto_trama')).toBe(false)
    expect(isMarketableCategory('consumabile')).toBe(true)
  })

  it('applies 10% piazza commission', () => {
    expect(piazzaCommission(100)).toBe(10)
    expect(piazzaSellerProceeds(100)).toBe(90)
  })
})
