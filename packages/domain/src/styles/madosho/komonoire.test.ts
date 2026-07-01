import { describe, expect, it } from 'vitest'
import {
  extractKomonoireRoll,
  formatKomonoireSegment,
  hasKomonoireRefuseTag,
  komonoireWeaponLabel,
  setKomonoireWeapon,
} from './komonoire'

describe('Komonoire', () => {
  it('estrae tiro dado 1–6', () => {
    expect(extractKomonoireRoll('[komonoire:tira:4]')).toBe(4)
    expect(extractKomonoireRoll('[komonoire:dado:1]')).toBe(1)
    expect(extractKomonoireRoll('[komonoire:tira:7]')).toBeNull()
  })

  it('rifiuto e opposizione', () => {
    expect(hasKomonoireRefuseTag('[komonoire:rifiuta]')).toBe(true)
    expect(hasKomonoireRefuseTag('[komonoire:opposizione]')).toBe(true)
  })

  it('arma e segmento chat', () => {
    expect(komonoireWeaponLabel(3)).toBe('Shuriken arrugginita')
    const meta = setKomonoireWeapon({}, 3)
    expect(formatKomonoireSegment(meta)).toContain('Shuriken')
  })
})
