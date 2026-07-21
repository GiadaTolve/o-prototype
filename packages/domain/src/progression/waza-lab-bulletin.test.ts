import { describe, expect, it } from 'vitest'
import { buildWazaLabBulletin } from './waza-lab-bulletin'

describe('buildWazaLabBulletin', () => {
  it('conta passiva e tier per Via Dō', () => {
    const bulletin = buildWazaLabBulletin([
      { poolId: 'toka-a', name: 'A', styleId: 'toka', isPassive: true },
      { poolId: 'toka-b', name: 'B', styleId: 'toka', rank: 'T2' },
      { poolId: 'ito-c', name: 'C', styleId: 'ito', rank: 'T3' },
    ])

    const doFam = bulletin.families.find((f) => f.family === 'do')
    expect(doFam).toBeTruthy()
    const toka = doFam!.parents.find((p) => p.id === 'do-toka')
    expect(toka?.counts.passive).toBe(1)
    expect(toka?.counts.t2).toBe(1)
    expect(toka?.counts.total).toBe(2)
    expect(bulletin.totals.t3).toBe(1)
  })

  it('include genitori futuri anche a zero', () => {
    const bulletin = buildWazaLabBulletin([], [{ family: 'do', label: 'Nuova-Via-dō' }])
    const doFam = bulletin.families.find((f) => f.family === 'do')
    expect(doFam?.parents.some((p) => p.label === 'Nuova-Via-dō')).toBe(true)
  })
})
