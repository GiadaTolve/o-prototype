import { describe, expect, it } from 'vitest'
import { getSocialBlueprint } from './blueprint-catalog'
import {
  canSpendGatherBudget,
  formatGatherYieldsPreview,
  isCacciatoreGatherBlueprint,
  resolveGatherYields,
} from './cacciatore'

describe('cacciatore', () => {
  it('riconosce blueprint gather', () => {
    const bp = getSocialBlueprint('cacciatore-erbe-campo')
    expect(bp && isCacciatoreGatherBlueprint(bp)).toBe(true)
  })

  it('resa erbe da campo', () => {
    expect(resolveGatherYields('cacciatore-erbe-campo')).toEqual([
      { materialId: 'erba_comune', quantity: 1 },
    ])
  })

  it('budget gather', () => {
    const bp = getSocialBlueprint('cacciatore-selvaggina-minuta')!
    expect(canSpendGatherBudget(bp, 10)).toEqual({ ok: true, cost: 3 })
    expect(canSpendGatherBudget(bp, 2).ok).toBe(false)
  })

  it('anteprima resa', () => {
    expect(formatGatherYieldsPreview('cacciatore-legname')).toContain('legno')
    expect(formatGatherYieldsPreview('cacciatore-ricognizione')).toBe('Effetto narrativo')
  })
})
