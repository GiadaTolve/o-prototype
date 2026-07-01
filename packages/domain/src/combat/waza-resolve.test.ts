import { describe, expect, it } from 'vitest'
import {
  DEFAULT_MENTAL_INDEX_MODE,
  resolveAyatsuriConstructMovementMeters,
  resolveConstructResistanceFromSheet,
  resolveExplicitSkiruIndex,
  resolveMentalSkiruIndex,
  resolveMichishirubeProjectileRangeMeters,
  resolveReactiveTierBonus,
  resolveWazaLaunchIr,
  resolveWazaPersonalValues,
  SKIRU_ID_KONJOU,
  UBAIITO_MENTAL_SKIRU_IDS,
} from './waza-resolve'
import { computeIndicativeActionIr } from './resolution'
import { resolveJunkanPotenziamentoCapacity } from '../styles/naikan/junkan'

describe('waza-resolve', () => {
  const sheet = {
    seimitsu: 4,
    genkai: 5,
    fudoshin: 3,
    kansatsu: 6,
    konjou: 7,
    undo: 4,
    itami: 5,
  }

  it('Michishirube: 8 m + Seimitsu', () => {
    expect(resolveMichishirubeProjectileRangeMeters(sheet)).toBe(12)
    const v = resolveWazaPersonalValues('michishirube-luce-guida', { sheet })
    expect(v?.lines[0]).toMatchObject({ value: '12 m' })
  })

  it('Resistenza costrutto: (Genkai + tier value) × taglia', () => {
    expect(resolveConstructResistanceFromSheet(sheet, 3, 'media')).toBe(17)
    expect(resolveConstructResistanceFromSheet(sheet, 3, 'grande')).toBe(25)
    const v = resolveWazaPersonalValues('ukabu-toro-lanterna-fluttuante', {
      sheet,
      wazaTier: 2,
      isConstructWaza: true,
      constructSize: 'media',
    })
    expect(v?.lines[0]?.value).toBe('13')
  })

  it('Ubaiito: Skiru mentali e IR max (regola A)', () => {
    expect(DEFAULT_MENTAL_INDEX_MODE).toBe('best')
    expect(resolveMentalSkiruIndex(sheet, UBAIITO_MENTAL_SKIRU_IDS)).toBe(6)
    const v = resolveWazaPersonalValues('ubaiito-filo-rubato', { sheet })
    expect(v?.lines[2]?.value).toBe('6')
  })

  it('Junkan: Capacità 3 + Itami su Naikan generico', () => {
    expect(resolveJunkanPotenziamentoCapacity(sheet)).toBe(8)
    const v = resolveWazaPersonalValues('jiga-hoki-ego-traboccante', {
      sheet,
      styleId: 'naikan',
    })
    expect(v?.lines[0]?.value).toBe('8 pt Potenziamento')
  })

  it('Junnō: bonus resistenza da tier colpo', () => {
    const v = resolveWazaPersonalValues('junno-pelle-apprende', {
      sheet,
      lastReceivedHitTier: 3,
    })
    expect(v?.lines[0]?.value).toBe('+12')
  })

  it('Hibiki-Gaeshi: danno eco da tier colpo', () => {
    const v = resolveWazaPersonalValues('hibiki-gaeshi-eco-risposta', {
      sheet,
      lastReceivedHitTier: 2,
    })
    expect(v?.lines[0]?.value).toBe('+8')
  })

  it('Hadō: Pressione e Atsuryoku', () => {
    const v = resolveWazaPersonalValues('howa-saturazione', {
      sheet,
      styleId: 'hado',
      currentCs: 14,
      atsuryokuPressure: 5,
    })
    expect(v?.lines.some((l) => l.label === 'Pressione attiva')).toBe(true)
    expect(v?.lines.some((l) => l.label === 'Atsuryoku')).toBe(true)
  })

  it('Kaatsu: soglia CS 12', () => {
    const v = resolveWazaPersonalValues('kaatsu-sovrapressione', { sheet, currentCs: 13 })
    expect(v?.lines[0]?.value).toBe('+1 tier')
  })

  it('Hensei: parità Yuragi', () => {
    const v = resolveWazaPersonalValues('ishi-volere', {
      sheet,
      styleId: 'hensei',
    })
    expect(v?.lines[0]?.label).toBe('Parità Yuragi')
  })

  it('Renkin-Soku: regola Yuragi', () => {
    const v = resolveWazaPersonalValues('renkin-soku-regole-alchemiche', { sheet })
    expect(v?.lines.some((l) => l.label === 'Regola Yuragi')).toBe(true)
  })

  it('Teishūha: gittata sfera', () => {
    const v = resolveWazaPersonalValues('teishuha-onda-bassa', { sheet })
    expect(v?.lines[0]?.value).toBe('8 m')
  })

  it('resolveWazaLaunchIr: bonus Yuragi', () => {
    const ir = resolveWazaLaunchIr(
      { sheet, yuragiParityNext: true },
      'ishi-volere',
    )
    expect(ir).toBe(computeIndicativeActionIr(sheet) + 2)
  })

  it('resolveWazaLaunchIr: bonus Tensione Itō', () => {
    const ir = resolveWazaLaunchIr({ sheet, itoIrBonus: 4 }, 'ubaiito-filo-rubato')
    expect(ir).toBe(6 + 4)
  })

  it('Itō generico: riga Tensione in Valori per te', () => {
    const v = resolveWazaPersonalValues('someito-filo-tinto', {
      sheet,
      styleId: 'ito',
      itoIrBonus: 3,
    })
    expect(v?.lines.some((l) => l.label === 'Tensione Itō' && l.value === '+3 IR')).toBe(true)
  })

  it('Shōka: Capacità Junkan esplicita', () => {
    const v = resolveWazaPersonalValues('shoka-sublimazione', { sheet })
    expect(v?.lines[0]?.label).toBe('Capacità Junkan')
    expect(v?.lines[0]?.value).toBe('8 pt Potenziamento')
  })

  it('Ayatsuri: movimento costrutto da Undō', () => {
    expect(resolveAyatsuriConstructMovementMeters(sheet, 'piccola')).toBe(8)
    expect(resolveAyatsuriConstructMovementMeters(sheet, 'media')).toBe(6)
    const v = resolveWazaPersonalValues('ayatsuri-filo-burattinaio', { sheet })
    expect(v?.lines.some((l) => l.label === 'Movimento costrutto Media')).toBe(true)
  })

  it('Kyōmei: colpi ogni 2 m', () => {
    const v = resolveWazaPersonalValues('kyomei-risonanza-della-fiamma', { sheet })
    expect(v?.lines.find((l) => l.label.startsWith('Colpi Kyōmei'))?.value).toBe('4')
  })

  it('Tobi-Kake: slancio doppio movimento', () => {
    const v = resolveWazaPersonalValues('tobi-kake-slancio-carica', { sheet })
    expect(v?.lines.find((l) => l.label === 'Slancio minimo (turno)')?.value).toBe('16 m')
  })

  it('Konjou: IR esplicito da descrizione', () => {
    expect(resolveExplicitSkiruIndex(sheet, SKIRU_ID_KONJOU)).toBe(7)
    const v = resolveWazaPersonalValues('some-madosho-waza', {
      sheet,
      description:
        "Attiva · ogni essere vivente deve vincere un confronto d'Indice (Konjou) o subisce danno.",
    })
    expect(v?.lines[0]?.value).toBe('7')
  })

  it('ritorna null senza registry né costrutto', () => {
    expect(resolveWazaPersonalValues('shoka-fiamma-docile', { sheet, styleId: 'toka' })).toBeNull()
  })

  it('Hari-Tsume: +3 pt entro Junkan', () => {
    const v = resolveWazaPersonalValues('hari-tsume-carico-trattenuto', { sheet })
    expect(v?.lines.find((l) => l.label === 'Potenziamento colpo')?.value).toBe('+3 pt')
    expect(v?.lines.find((l) => l.label === 'Capacità Junkan')?.value).toBe('8 pt Potenziamento')
  })

  it('Sen\'i-Gake: opzioni fibra +2', () => {
    const v = resolveWazaPersonalValues('seni-gake-avvolgimento-fibre', { sheet })
    expect(v?.lines.find((l) => l.label === 'Fibre Bianche')?.value).toBe('+2 Kairyoku')
  })

  it('Tsubo-Uchi: scala danno extra', () => {
    const v = resolveWazaPersonalValues('tsubo-uchi-colpo-punto', { sheet })
    expect(v?.lines[0]?.value).toBe('+2 → +4 → +6')
  })
})
