import { describe, expect, it } from 'vitest'
import {
  groupWazaByStyle,
  layoutCatalogWazaList,
  resolveWazaStyleId,
  sortWazaByKindAndName,
} from '../../../packages/domain/src/progression/waza-grouping.ts'

describe('waza grouping by Dō', () => {
  it('risolve stile da descrizione', () => {
    expect(
      resolveWazaStyleId({ description: '[Genzai-Dō · Waza attiva]\n\nTest' }),
    ).toBe('genzai')
  })

  it('raggruppa per esagono', () => {
    const items = [
      { id: '1', description: '[Tōka-dō · Waza attiva]\n\nA', name: 'A', isPassive: false },
      { id: '2', description: '[Genzai-Dō · Dō passiva]\n\nB', name: 'B', isPassive: true },
      { id: '3', description: '[Tōka-dō · Dō passiva]\n\nC', name: 'C', isPassive: true },
    ]
    const groups = groupWazaByStyle(items, (i) => resolveWazaStyleId(i))
    expect(groups.map((g) => g.styleId)).toEqual(['toka', 'genzai'])
    expect(groups[0]?.items).toHaveLength(2)
  })

  it('ordina passiva prima di attiva', () => {
    const sorted = sortWazaByKindAndName(
      [
        { name: 'Z attiva', isPassive: false },
        { name: 'A passiva', isPassive: true },
      ],
      { isPassive: (i) => i.isPassive, getName: (i) => i.name },
    )
    expect(sorted[0]?.isPassive).toBe(true)
  })

  it('mette keystone sopra e poi passiva → attiva', () => {
    const { keystone, list } = layoutCatalogWazaList(
      [
        { poolId: 'b-attiva', name: 'B attiva', isPassive: false },
        { poolId: 'ks', name: 'Keystone', isPassive: true },
        { poolId: 'a-passiva', name: 'A passiva', isPassive: true },
      ],
      {
        keystonePoolId: 'ks',
        getPoolId: (i) => i.poolId,
        isPassive: (i) => i.isPassive,
        getName: (i) => i.name,
      },
    )
    expect(keystone?.poolId).toBe('ks')
    expect(list.map((i) => i.poolId)).toEqual(['a-passiva', 'b-attiva'])
  })
})

describe('Genzai pool size', () => {
  it('contiene 23 waza Genzai-dō', async () => {
    const { GENZAI_WAZA_POOL } = await import('../../../apps/tester/src/pools/genzai-waza-pool.ts')
    expect(GENZAI_WAZA_POOL).toHaveLength(23)
    expect(GENZAI_WAZA_POOL.every((w) => w.branch === 'materializzazione')).toBe(true)
  })
})
