import { describe, expect, it } from 'vitest'
import { calculateConstructResistance } from './constructs'
import {
  deriveConstructProfile,
  shouldDissolvePersonalConstruct,
} from './construct-profile'
import { calculateGosaMaxSimultaneousConstructs } from '../styles/genzai/gosa-construct-limit'

describe('calculateConstructResistance (Kongen)', () => {
  it('⌊(rank Kongen + numero tier) × mult taglia⌋', () => {
    expect(calculateConstructResistance(3, 2, 'grande')).toBe(7)
    expect(calculateConstructResistance(3, 2, 'media')).toBe(5)
    expect(calculateConstructResistance(5, 3, 'grande')).toBe(12)
  })
})

describe('deriveConstructProfile', () => {
  const sheet = { kongen: 3, undo: 4, seimitsu: 4 }

  it('resistenza Grande e movimento Media mobile', () => {
    const p = deriveConstructProfile({
      wazaTier: 2,
      taglia: 'Grande',
      comportamento: 'COMANDATO',
      creator: { sheet, styleGenitore: 'Itō-dō' },
    })
    expect(p.resistenza).toBe(7)
    expect(p.movimento_m).toBe(4) // 8 × 0.5 (Grande)
    expect(p.mei).toBeNull()
  })

  it('movimento Media ×0,75', () => {
    const p = deriveConstructProfile({
      wazaTier: 2,
      taglia: 'Media',
      comportamento: 'SEGUE',
      creator: { sheet },
    })
    expect(p.resistenza).toBe(5)
    expect(p.movimento_m).toBe(6)
  })

  it('Tōrō eredita danno assoluto arma', () => {
    const p = deriveConstructProfile({
      wazaTier: 2,
      taglia: 'Grande',
      proprieta: ['TORO'],
      toro_da_arma: true,
      armaSorgente: { dannoBase: 8, taglia: 'piccola' },
      creator: { sheet },
    })
    expect(p.danno).toBe(8)
    expect(p.taglia_effettiva).toBe('piccola')
    expect(p.flags.bersagliabile_manipolazione_altrui).toBe(false)
  })

  it('Mei solo Genzai-dō', () => {
    const p = deriveConstructProfile({
      wazaTier: 2,
      taglia: 'media',
      creator: { sheet, styleGenitore: 'Genzai-dō' },
      mei: { etichetta: 'Lanterna' },
    })
    expect(p.mei?.attivo).toBe(true)
    expect(p.mei?.etichetta).toBe('Lanterna')
    expect(p.limite_globale_costrutti_gosa).toBe(6)
  })

  it('Personale dissolve se analista KO', () => {
    const p = deriveConstructProfile({
      wazaTier: 1,
      taglia: 'media',
      proprieta: ['PERSONALE'],
      creator: { sheet },
    })
    expect(shouldDissolvePersonalConstruct(p, true)).toBe(false)
    expect(shouldDissolvePersonalConstruct(p, false)).toBe(true)
  })

  it('Batteria cap 5 CS', () => {
    const p = deriveConstructProfile({
      wazaTier: 2,
      taglia: 'media',
      proprieta: ['BATTERIA'],
      creator: { sheet },
    })
    expect(p.battery).toEqual({ cap_cs: 5, stored_cs: 0 })
  })
})

describe('gosa construct limit', () => {
  it('2 + Seimitsu', () => {
    expect(calculateGosaMaxSimultaneousConstructs(4)).toBe(6)
    expect(calculateGosaMaxSimultaneousConstructs(0)).toBe(2)
  })
})
