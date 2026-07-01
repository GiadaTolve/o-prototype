import { describe, expect, it } from 'vitest'
import {
  IAI_POOL,
  KAJIBA_POOL,
  onActorHpCrossedBelowHalf,
  resolvePassiveLaunchTierBonus,
  tickGenericheIaiEndOfTurn,
} from './passive-triggers.ts'

describe('passive-triggers', () => {
  it('Kajiba si attiva al primo passaggio sotto 50% HP', () => {
    const r = onActorHpCrossedBelowHalf({}, 60, 40, 100, true)
    expect(r.triggered).toBe(true)
    expect(r.meta.genericheKajibaTierBonusPending).toBe(true)
  })

  it('Kajiba non si ripete', () => {
    const r = onActorHpCrossedBelowHalf(
      { genericheKajibaHalfHpTriggered: true },
      60,
      40,
      100,
      true,
    )
    expect(r.triggered).toBe(false)
  })

  it('Iai pronto dopo turno senza waza', () => {
    const next = tickGenericheIaiEndOfTurn({ genericheTurnWazaUsed: false }, false)
    expect(next.genericheIaiReady).toBe(true)
  })

  it('applica bonus tier Kajiba + Iai al lancio', () => {
    const r = resolvePassiveLaunchTierBonus(
      {
        genericheKajibaTierBonusPending: true,
        genericheIaiReady: true,
        genericheIaiWazaLaunchesThisTurn: 0,
        genericheIaiDamagedTargetIds: [],
      },
      'victim-1',
      [KAJIBA_POOL, IAI_POOL],
    )
    expect(r.tierSteps).toBe(2)
    expect(r.sources).toEqual(['Kajiba', 'Iai'])
  })
})
