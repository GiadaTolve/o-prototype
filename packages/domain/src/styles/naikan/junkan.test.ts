import { describe, expect, it } from 'vitest'
import { JUNKAN_BUN_BASE, resolveJunkanBunCapacity } from './junkan'

describe('Junkan', () => {
  it('Capacità Bun = 3 + Itami', () => {
    expect(resolveJunkanBunCapacity({ itami: 5 })).toBe(JUNKAN_BUN_BASE + 5)
    expect(resolveJunkanBunCapacity({})).toBe(JUNKAN_BUN_BASE)
  })
})
