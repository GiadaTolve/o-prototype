import { describe, expect, it } from 'vitest'
import {
  applyShokushinReading,
  consumeShokushinOffensiveBonus,
  getShokushinOffensiveTierBonus,
  processShokushinHitExchange,
} from './shokushin.ts'

describe('Shokushin combat exchange', () => {
  it('consuma bonus tier al colpo sul bersaglio letto', () => {
    let attacker = applyShokushinReading({}, { characterId: 'v', displayName: 'Victor' })
    expect(getShokushinOffensiveTierBonus(attacker, 'v')).toBe(1)

    const exchange = processShokushinHitExchange(attacker, {}, 'a', 'v')
    expect(exchange.offensiveBonusConsumed).toBe(true)
    expect(getShokushinOffensiveTierBonus(exchange.attackerMeta, 'v')).toBe(0)
  })

  it('approfondisce lettura quando il lettore subisce dal bersaglio', () => {
    const reader = applyShokushinReading({}, { characterId: 'v', displayName: 'Victor' })
    const exchange = processShokushinHitExchange({}, reader, 'v', 'r')
    expect(exchange.readingDeepened).toBe(true)
    expect(exchange.defenderMeta.naikanReadTarget?.depth).toBe(2)
  })

  it('consumeShokushinOffensiveBonus azzera bonus senza rimuovere lettura', () => {
    let meta = applyShokushinReading({}, { characterId: 'v', displayName: 'Victor' })
    meta = consumeShokushinOffensiveBonus(meta)
    expect(meta.naikanReadTarget?.bonusTierNextHit).toBe(0)
    expect(meta.naikanReadTarget?.depth).toBe(1)
  })
})
