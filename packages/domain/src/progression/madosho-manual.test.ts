import { describe, expect, it } from 'bun:test'
import {
  MADOSHO_IDS,
  MANUAL_MADOSHO_POOL_IDS,
  totalManualMadoshoWazaCount,
} from './madosho'

describe('MANUAL_MADOSHO_POOL_IDS', () => {
  it('copre i 6 lignaggi (Komonoire vuoto nel PDF)', () => {
    for (const id of MADOSHO_IDS) {
      expect(Array.isArray(MANUAL_MADOSHO_POOL_IDS[id])).toBe(true)
    }
    expect(MANUAL_MADOSHO_POOL_IDS.komonoire).toEqual([])
  })

  it('55 waza totali nel manuale (11×5 lignaggi con elenco)', () => {
    expect(totalManualMadoshoWazaCount()).toBe(55)
    for (const id of MADOSHO_IDS) {
      if (id === 'komonoire') continue
      expect(MANUAL_MADOSHO_POOL_IDS[id].length).toBe(11)
    }
  })

  it('poolId univoci', () => {
    const all = MADOSHO_IDS.flatMap((id) => MANUAL_MADOSHO_POOL_IDS[id])
    expect(new Set(all).size).toBe(all.length)
  })
})
