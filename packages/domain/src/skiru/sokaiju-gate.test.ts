import { describe, expect, test } from 'bun:test'
import { canAffordSkiruRaise, isSkiruParentUnlocked, isSokaijuGateOpen } from './progression.ts'
import { SOKAIJU_GATE_SKIRU_ID } from './sokaiju-index.ts'

describe('sokaiju gate (tenkan)', () => {
  test('tenkan is not purchasable with EXP', () => {
    expect(canAffordSkiruRaise({}, SOKAIJU_GATE_SKIRU_ID, 1, 999)).toBe(false)
  })

  test('other sokaiju nodes require tenkan in sheet', () => {
    expect(isSkiruParentUnlocked({}, 'chiko')).toBe(false)
    expect(isSkiruParentUnlocked({ tenkan: 1 }, 'chiko')).toBe(true)
    expect(isSokaijuGateOpen({ tenkan: 1 })).toBe(true)
  })
})
