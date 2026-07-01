import { describe, expect, it } from 'vitest'
import { stripCombatTagsFromNarrative } from './combat-chat-display.ts'

describe('combat chat display', () => {
  it('stripCombatTagsFromNarrative rimuove tag waza/lancio', () => {
    const line = '[waza:Test] [tier:2] [cs:2] [ir:5] resto'
    expect(stripCombatTagsFromNarrative(line)).toBe('resto')
  })
})
