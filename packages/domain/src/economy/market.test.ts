import { describe, expect, it } from 'vitest'
import {
  BANCO_BUY_JUNK_REM,
  BANCO_SELL_COMMON_MATERIAL_REM,
  formatPiazzaTradeMessage,
  isMarketableCategory,
  piazzaCommission,
  piazzaSellerProceeds,
  resolveBancoBuyPrice,
  resolveBancoSellPrice,
} from './market'

describe('resolveBancoBuyPrice', () => {
  it('pays 2 for junk', () => {
    expect(resolveBancoBuyPrice({ category: 'junk' })).toBe(BANCO_BUY_JUNK_REM)
  })

  it('pays 5 for common material', () => {
    expect(resolveBancoBuyPrice({ category: 'materiale', materialId: 'stoffa' })).toBe(5)
  })

  it('pays 20 for rare material', () => {
    expect(resolveBancoBuyPrice({ category: 'materiale', materialId: 'erba_rara' })).toBe(20)
  })

  it('rejects broken equipment', () => {
    expect(
      resolveBancoBuyPrice({ category: 'equipaggiamento', isBroken: true }),
    ).toBeNull()
  })

  it('rejects oggetto_trama', () => {
    expect(resolveBancoBuyPrice({ category: 'oggetto_trama' })).toBeNull()
  })
})

describe('resolveBancoSellPrice', () => {
  it('sells common materials at 15', () => {
    expect(resolveBancoSellPrice('stoffa')).toBe(BANCO_SELL_COMMON_MATERIAL_REM)
  })

  it('does not sell rare materials', () => {
    expect(resolveBancoSellPrice('erba_rara')).toBeNull()
  })
})

describe('piazza commission', () => {
  it('takes 10%', () => {
    expect(piazzaCommission(100)).toBe(10)
    expect(piazzaSellerProceeds(100)).toBe(90)
  })
})

describe('formatPiazzaTradeMessage', () => {
  it('formats trade feed line', () => {
    expect(formatPiazzaTradeMessage('Kaede', 'Renji', 'Decotto', 2, 18)).toContain('Kaede')
  })
})

describe('isMarketableCategory', () => {
  it('blocks story items', () => {
    expect(isMarketableCategory('oggetto_trama')).toBe(false)
  })
})
