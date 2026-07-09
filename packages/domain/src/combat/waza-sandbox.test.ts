import { describe, expect, it } from 'vitest'
import {
  buildSandboxSkiruSheet,
  evaluateSandboxCondizione,
  resolveSkiruSlug,
  resolveValoreNumerico,
  runWazaSandbox,
} from './waza-sandbox'

describe('waza-sandbox', () => {
  it('resolveSkiruSlug accetta nome romaji (Seimitsu → seimitsu)', () => {
    expect(resolveSkiruSlug('Seimitsu')).toBe('seimitsu')
    expect(resolveSkiruSlug('Kensei')).toBe('kensei')
  })

  it('resolveValoreNumerico FORMULA: 8 + Seimitsu con 2 punti → 10', () => {
    const sheet = buildSandboxSkiruSheet({ Seimitsu: 2 })
    const result = resolveValoreNumerico(
      { tipo: 'FORMULA', base: 8, skiru: 'Seimitsu', per_punto: 1 },
      2,
      sheet,
    )
    expect(result.value).toBe(10)
    expect(result.detail).toContain('10')
  })

  it('IR: media arrotondata delle due Skiru papabili', () => {
    const result = runWazaSandbox({
      effetti: [],
      tier: 2,
      skiruIr: ['kensei', 'seimitsu'],
      contesto: {
        lanciatore: {
          skiru: { kensei: 3, seimitsu: 2 },
          skiruIrFisica: 'kensei',
          skiruIrIncanalamento: 'seimitsu',
        },
        bersaglio: { hp: 35 },
      },
    })
    expect(result.ir?.indice).toBe(3) // (3+2)/2 = 2.5 → 3
    expect(result.righe.some((r) => r.text.includes('IR:'))).toBe(true)
  })

  it('pipeline danno: tier 2, scudo 0, itami 2 → 11 HP', () => {
    const result = runWazaSandbox({
      effetti: [
        {
          tipo: 'DANNO',
          trigger: 'AL_LANCIO',
          bersaglio: 'BERSAGLIO_SINGOLO',
          durata: { tipo: 'ISTANTANEA' },
          valore: { tipo: 'TIER' },
        },
      ],
      tier: 2,
      skiruIr: ['kensei', 'seimitsu'],
      contesto: {
        lanciatore: { skiru: { kensei: 3, seimitsu: 2 } },
        bersaglio: { hp: 35, scudo: 0, itami: 2 },
      },
    })
    expect(result.dannoBase).toBe(8)
    expect(result.dannoFinaleHp).toBe(7) // 8 * (1 - 0.06) = 7.52 → 7
    expect(result.hpBersaglioDopo).toBe(28)
  })

  it('MOD_DANNO +1 tier con toro.batteria attiva', () => {
    const result = runWazaSandbox({
      effetti: [
        {
          tipo: 'DANNO',
          trigger: 'AL_LANCIO',
          bersaglio: 'BERSAGLIO_SINGOLO',
          durata: { tipo: 'ISTANTANEA' },
          valore: { tipo: 'TIER' },
        },
        {
          tipo: 'MOD_DANNO',
          trigger: 'AL_LANCIO',
          valore: { tipo: 'TIER_DELTA', n: 1 },
          condizione: 'toro.batteria == true',
        },
      ],
      tier: 2,
      contesto: {
        lanciatore: { skiru: { kensei: 2 }, stato: { 'toro.batteria': true } },
        bersaglio: { hp: 35, itami: 0 },
      },
    })
    expect(result.dannoBase).toBe(12) // tier 3
    expect(result.righe.some((r) => r.text.includes('MOD_DANNO'))).toBe(true)
  })

  it('MOD_GITTATA con formula 8 + Seimitsu', () => {
    const result = runWazaSandbox({
      effetti: [
        {
          tipo: 'MOD_GITTATA',
          valore: { tipo: 'FORMULA', base: 8, skiru: 'Seimitsu', per_punto: 1 },
        },
      ],
      tier: 2,
      contesto: {
        lanciatore: { skiru: { Seimitsu: 2 } },
        bersaglio: { hp: 20 },
      },
    })
    expect(result.gittataM).toBe(10)
    expect(result.righe.some((r) => r.text.startsWith('Gittata:'))).toBe(true)
  })

  it('evaluateSandboxCondizione grado_pg', () => {
    expect(
      evaluateSandboxCondizione(
        'grado_pg == Bunsekikan',
        { skiru: {}, grado: 'Bunsekikan' },
        { hp: 10 },
      ),
    ).toBe(true)
    expect(
      evaluateSandboxCondizione(
        'grado_pg == Bunsekikan',
        { skiru: {}, grado: 'Hakyō' },
        { hp: 10 },
      ),
    ).toBe(false)
  })

  it('confronto IR perso blocca il danno', () => {
    const result = runWazaSandbox({
      effetti: [
        {
          tipo: 'DANNO',
          valore: { tipo: 'TIER' },
        },
      ],
      tier: 2,
      contesto: {
        lanciatore: { skiru: {} },
        bersaglio: { hp: 35 },
        opzioni: { vinciConfrontoIndice: false },
      },
    })
    expect(result.dannoFinaleHp).toBeNull()
    expect(result.hpBersaglioDopo).toBe(35)
  })
})
