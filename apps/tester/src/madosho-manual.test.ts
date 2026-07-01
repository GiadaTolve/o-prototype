import { describe, expect, it } from 'bun:test'
import { MANUAL_MADOSHO_POOL_IDS } from '@domain/progression/madosho'
import { MADOSHO_POOL } from './madoshoPool'

describe('madoshoPool vs MANUAL_MADOSHO_POOL_IDS', () => {
  it('poolId per lignaggio coincidono col catalogo domain', () => {
    const byRamo = MADOSHO_POOL.reduce<Record<string, string[]>>((acc, w) => {
      const list = acc[w.branch] ?? []
      list.push(w.id)
      acc[w.branch] = list
      return acc
    }, {})

    for (const [ramo, ids] of Object.entries(MANUAL_MADOSHO_POOL_IDS)) {
      expect(byRamo[ramo]?.sort() ?? []).toEqual([...ids].sort())
    }
  })
})
