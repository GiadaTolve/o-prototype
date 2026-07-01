import { describe, expect, it } from 'vitest'
import {
  applyKyoshinVibration,
  consumeKyoshinOnWazaUse,
  KYOSHIN_CS_PENALTY,
  tickKyoshinEndOfTurn,
} from './kyoshin'

describe('Kyōshin', () => {
  it('applica vibrazione e la consuma con penale CS', () => {
    let meta = applyKyoshinVibration({})
    const used = consumeKyoshinOnWazaUse(meta)
    expect(used.csPenalty).toBe(KYOSHIN_CS_PENALTY)
    expect(used.meta.genericheKyoshin).toBeNull()
  })

  it('fine turno senza scarica infligge danno = tier', () => {
    const meta = applyKyoshinVibration({}, 2)
    const tick = tickKyoshinEndOfTurn(meta)
    expect(tick.damage).toBeGreaterThan(0)
    expect(tick.meta.genericheKyoshin).toBeNull()
  })
})
