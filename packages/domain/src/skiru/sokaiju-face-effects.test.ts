import { describe, expect, test } from 'bun:test'
import {
  calculateSokaijuMeijuIrMultiplier,
  calculateSokaijuShijuDamagePercentBonus,
  formatSokaijuFaceLiveLine,
  getSokaijuFacePoints,
  SOKAIJU_FACE_PERCENT_PER_POINT,
} from './sokaiju-face-effects.ts'

describe('sokaiju-face-effects', () => {
  test('solo chiavi split meiju/shiju', () => {
    const sheet = { 'kongen:meiju': 2, 'kongen:shiju': 4 }
    expect(getSokaijuFacePoints(sheet, 'kongen', 'meiju')).toBe(2)
    expect(getSokaijuFacePoints(sheet, 'kongen', 'shiju')).toBe(4)
    expect(getSokaijuFacePoints(sheet, 'kongen', 'meiju')).not.toBe(5)
  })

  test('Kongen +3 pt su waza Costrutto → +4.5% IR e +4.5% danno', () => {
    const sheet = { 'kongen:meiju': 3, 'kongen:shiju': 3 }
    const tags = ['Costrutto', 'Solido']
    expect(calculateSokaijuMeijuIrMultiplier(sheet, tags)).toBeCloseTo(
      1 + 3 * SOKAIJU_FACE_PERCENT_PER_POINT,
    )
    expect(calculateSokaijuShijuDamagePercentBonus(sheet, tags)).toBeCloseTo(
      3 * SOKAIJU_FACE_PERCENT_PER_POINT,
    )
  })

  test('nessun bonus se i tag non matchano la categoria papabile', () => {
    const sheet = { 'kongen:meiju': 5, 'kongen:shiju': 5 }
    expect(calculateSokaijuMeijuIrMultiplier(sheet, ['Proiettile'])).toBe(1)
    expect(calculateSokaijuShijuDamagePercentBonus(sheet, ['Proiettile'])).toBe(0)
  })

  test('format live line Kongen', () => {
    const line = formatSokaijuFaceLiveLine('kongen', { 'kongen:meiju': 2, 'kongen:shiju': 2 })
    expect(line).toContain('[Costrutto]')
    expect(line).toContain('3%')
  })
})
