import { describe, expect, it } from 'vitest'
import {
  calculateDodgeIrFromSkiru,
  calculateParryIrFromSkiru,
  calculateSkiruDerivedStats,
} from './derived-stats'
import type { SkiruSheet } from './types'

describe('calculateDodgeIrFromSkiru', () => {
  it('Hansha 5 + Chōkaku 4 → IR 7', () => {
    const sheet: SkiruSheet = { hansha: 5, chokaku: 4 }
    expect(calculateDodgeIrFromSkiru(sheet)).toBe(7)
  })

  it('arrotonda per eccesso con mezzi punti bonus', () => {
    const sheet: SkiruSheet = { hansha: 5, chokaku: 3 }
    expect(calculateDodgeIrFromSkiru(sheet)).toBe(7)
  })
})

describe('calculateParryIrFromSkiru', () => {
  it('Konjō 5 + Kairiki 4 → IR 7', () => {
    const sheet: SkiruSheet = { konjou: 5, kairiki: 4 }
    expect(calculateParryIrFromSkiru(sheet)).toBe(7)
  })

  it('arrotonda per eccesso con mezzi punti bonus', () => {
    const sheet: SkiruSheet = { konjou: 5, kairiki: 3 }
    expect(calculateParryIrFromSkiru(sheet)).toBe(7)
  })
})

describe('calculateSkiruDerivedStats', () => {
  it('espone dodgeIr e parryIr insieme agli altri derivati', () => {
    const sheet: SkiruSheet = {
      hansha: 5,
      chokaku: 4,
      konjou: 5,
      kairiki: 4,
    }
    const derived = calculateSkiruDerivedStats(sheet)
    expect(derived.dodgeIr).toBe(7)
    expect(derived.parryIr).toBe(7)
  })
})
