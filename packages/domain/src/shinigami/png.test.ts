import { describe, expect, it } from 'vitest'
import { emptyPngDraft, rollPngByTier, TIER_RANDOM_RANGES, type PngTier } from './png'

describe('shinigami png', () => {
  it('rollPngByTier rispetta i range della spec §3A', () => {
    for (const tier of [1, 2, 3, 4, 5] as PngTier[]) {
      const ranges = TIER_RANDOM_RANGES[tier]
      for (let i = 0; i < 20; i++) {
        const rolled = rollPngByTier(tier, 'mob')
        expect(rolled.hp_max).toBeGreaterThanOrEqual(ranges.hp[0])
        expect(rolled.hp_max).toBeLessThanOrEqual(ranges.hp[1])
        expect(rolled.ir_attacco).toBeGreaterThanOrEqual(ranges.ir[0])
        expect(rolled.ir_attacco).toBeLessThanOrEqual(ranges.ir[1])
        expect(rolled.cs_max).toBeGreaterThanOrEqual(ranges.cs[0])
        expect(rolled.cs_max).toBeLessThanOrEqual(ranges.cs[1])
        expect(rolled.tier).toBe(tier)
      }
    }
  })

  it('emptyPngDraft parte con nome vuoto e HP a metà fascia', () => {
    const d = emptyPngDraft(2, 'umano')
    expect(d.nome).toBe('')
    expect(d.tipo).toBe('umano')
    expect(d.hp_max).toBe(Math.round((61 + 100) / 2))
  })
})
