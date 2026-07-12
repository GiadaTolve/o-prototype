import { describe, expect, test } from 'bun:test'
import {
  computeSokaijuCombatSummary,
  formatSokaijuAnchorLiveValue,
  resolveGojuElementalAutoApply,
} from './sokaiju-combat.ts'
import {
  getMaxAllowedConstructSizeId,
  isConstructSizeAllowedForCreator,
  DEFAULT_MAX_ACTIVE_CONSTRUCTS,
  canPlaceFieldConstruct,
} from '../combat/field-constructs.ts'

describe('sokaiju-combat', () => {
  test('face bonus summary from split keys', () => {
    const summary = computeSokaijuCombatSummary({
      tenkan: 1,
      'kongen:meiju': 2,
      'kongen:shiju': 3,
    })
    expect(summary.faceBonuses).toEqual([
      { anchorId: 'kongen', categoria: 'Costrutto', meijuPoints: 2, shijuPoints: 3 },
    ])
    expect(formatSokaijuAnchorLiveValue('kongen', { 'kongen:meiju': 2, 'kongen:shiju': 3 })).toContain(
      '3%',
    )
  })

  test('goju elemental auto-apply', () => {
    expect(resolveGojuElementalAutoApply({ 'goju-fuoco': 1 })).toEqual({
      statusId: 'incendiato',
      durationTurns: 3,
      stacks: 1,
    })
    expect(resolveGojuElementalAutoApply({})).toBeNull()
    expect(resolveGojuElementalAutoApply({ 'goju-fuoco': 1, 'goju-acqua': 1 })).toBeNull()
  })

  test('construct limits without legacy Chikō', () => {
    expect(DEFAULT_MAX_ACTIVE_CONSTRUCTS).toBe(1)
    expect(canPlaceFieldConstruct(0, {})).toBe(true)
    expect(canPlaceFieldConstruct(1, {})).toBe(false)
    expect(getMaxAllowedConstructSizeId({ chiko: 5 })).toBe('media')
    expect(isConstructSizeAllowedForCreator('grande', { chiko: 5 })).toBe(false)
    expect(isConstructSizeAllowedForCreator('media', { chiko: 5 })).toBe(true)
  })
})
