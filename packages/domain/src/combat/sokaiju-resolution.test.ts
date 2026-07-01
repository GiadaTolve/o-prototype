import { describe, expect, test } from 'bun:test'
import {
  buildSokaijuConfrontationFromSheets,
  messageDeclaresEnergeticWaza,
  resolveConfrontation,
} from './resolution.ts'

describe('sokaiju confrontation wiring', () => {
  test('energetic tag detection', () => {
    expect(messageDeclaresEnergeticWaza('[Energetico] lancio')).toBe(true)
    expect(messageDeclaresEnergeticWaza('[Elementale] lancio')).toBe(false)
  })

  test('kashin tie-break via resolveConfrontation', () => {
    const actor = { kashin: 4, seimitsu: 3, bakuryoku: 3 }
    const defender = { kashin: 2, hansha: 3, kansatsu: 3 }
    const input = {
      physicalSkiruId: 'bakuryoku',
      channelingSkiruId: 'seimitsu',
      quartersSpent: 1,
    }
    const defInput = {
      physicalSkiruId: 'hansha',
      channelingSkiruId: 'kansatsu',
      quartersSpent: 1,
    }
    const sokaiju = buildSokaijuConfrontationFromSheets(actor, defender, false, false)
    const result = resolveConfrontation(actor, input, defender, defInput, sokaiju)
    expect(result.actor.successIndex).toBe(result.defender.successIndex)
    expect(result.outcome).toBe('actor_wins')
  })
})
