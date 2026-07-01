import { describe, expect, it } from 'vitest'
import {
  extractPoolFormulaInner,
  hydrationFromWazaDef,
  normalizeLiberaFormulaText,
} from './hydrateWazaForm'
import { reflexesFromWazaStats, type WazaDef, type WazaStats } from './wazaPool'

describe('hydrateWazaForm', () => {
  it('normalizeLiberaFormulaText ripara floor2', () => {
    expect(normalizeLiberaFormulaText('floor2(REF + floor2(M))')).toBe('floor(REF + floor(M))')
  })

  it('estrae espressione interna da return Math.floor(…)', () => {
    const fn = (s: WazaStats) => {
      const floor = Math.floor
      return Math.floor(s.D * 2 + floor(s.M * 0.1))
    }
    const inner = extractPoolFormulaInner(fn)
    expect(inner).toBe('s.D * 2 + floor(s.M * 0.1)')
  })

  it('idrata Hōshutsu (vel con REF + dbw)', () => {
    const w: WazaDef = {
      id: 'hoshutsu-rilascio-della-fiamma',
      name: 'Hōshutsu',
      type: 'active',
      branch: 'proiezione',
      costJigo: () => 0,
      costJigoTipo: 'fisso',
      costCs: 0,
      velBonus: 0,
      velFormula: (s) => {
        const floor = Math.floor
        const REF = reflexesFromWazaStats(s)
        const { M, D } = s
        return floor(REF + floor(M * 0.2) + floor(D * 0.1))
      },
      dbw: (s) => {
        const floor = Math.floor
        const { E, D, LVL } = s
        return floor(5 + floor(E * 0.25) + floor(D * 0.15) + LVL)
      },
      hasVelocity: true,
      hasDamage: true,
      durata: 'utilizzo',
    }
    const h = hydrationFromWazaDef(w)
    expect(h.hasVelocity).toBe(true)
    expect(h.velMode).toBe('free')
    expect(h.velLibera).toContain('REF')
    expect(h.dannoLibera).toContain('LVL')
  })
})
