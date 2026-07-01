import { describe, expect, it } from 'vitest'
import { WAZA_TAG_INDEX } from './waza-tag-index'
import { buildWazaLaunchInsertLine } from './waza-tag-preview'
import {
  buildFullWazaLaunchLine,
  expandWazaSlashCommandInMessage,
  extractHitDeclaredFromText,
  extractLaunchSkiruId,
  extractLaunchTierFromText,
  extractWazaLaunchTargetSpec,
  parseWazaSlashCommand,
} from './waza-launch'
import {
  computeDeclaredActionIr,
  computeLaunchDamagePreview,
  computeSkiruRiderDefenderIrPenalty,
  computeSkiruRiderFlatBonus,
  getSkiruRider,
} from './waza-skiru-riders'
import { computeIndicativeActionIr, buildIndicativeActionIndex, calculateSuccessIndex } from './resolution'

describe('waza launch', () => {
  it('parseWazaSlashCommand estrae skiru, cs e target', () => {
    const parsed = parseWazaSlashCommand('/waza Hōshutsu --skiru seimitsu --cs 2 --target Aoi')
    expect(parsed?.wazaQuery).toBe('Hōshutsu')
    expect(parsed?.skiruId).toBe('seimitsu')
    expect(parsed?.cs).toBe(2)
    expect(parsed?.target).toBe('Aoi')
  })

  it('buildFullWazaLaunchLine include skiru e target', () => {
    const line = buildFullWazaLaunchLine('Hōshutsu (放出) — Rilascio della Fiamma', WAZA_TAG_INDEX, {
      skiruSheet: { seimitsu: 5, kensei: 6, 'itten-kokan': 4 },
      declaredSkiruId: 'seimitsu',
      csOverride: 2,
      target: { nameQuery: 'Aoi' },
    })
    expect(line).toMatch(/\[waza:/)
    expect(line).toMatch(/\[skiru:seimitsu\]/)
    expect(line).toMatch(/\[cs:2\]/)
    expect(line).toMatch(/\[target:Aoi\]/)
    expect(line).toMatch(/\[generiche:colpito:Aoi\]/)
    expect(extractLaunchSkiruId(line)).toBe('seimitsu')
    expect(extractWazaLaunchTargetSpec(line)?.nameQuery).toBe('Aoi')
  })

  it('IR con Skiru dichiarata usa media con complementare', () => {
    const ir = computeDeclaredActionIr(
      { seimitsu: 6, kensei: 4, 'itten-kokan': 8 },
      'seimitsu',
    )
    expect(ir).toBe(7)
  })

  it('expandWazaSlashCommandInMessage risolve waza da catalogo', () => {
    const entry = [...WAZA_TAG_INDEX.values()].find((e) => e.poolId === 'hosha-raffica-psichica')
    expect(entry).toBeTruthy()
    const shortName = entry!.name.split('—')[0]?.trim() ?? entry!.name
    const expanded = expandWazaSlashCommandInMessage(
      `/waza ${shortName} --skiru bakuryoku --cs 3`,
      WAZA_TAG_INDEX,
      { skiruSheet: { bakuryoku: 5, kensei: 3, 'itten-kokan': 3 } },
    )
    expect(expanded).toMatch(/\[waza:/)
    expect(expanded).toMatch(/\[skiru:bakuryoku\]/)
    expect(expanded).toMatch(/\[cs:3\]/)
  })

  it('buildWazaLaunchInsertLine con declaredSkiruId usa IR dichiarato', () => {
    const insert = buildWazaLaunchInsertLine('Hōshutsu (放出) — Rilascio della Fiamma', WAZA_TAG_INDEX, {
      skiruSheet: { seimitsu: 6, kensei: 4, 'itten-kokan': 8 },
      declaredSkiruId: 'seimitsu',
    })
    expect(insert).toMatch(/\[ir:7\]/)
  })

  it('rider bakuryoku +2 danno', () => {
    expect(getSkiruRider('bakuryoku')?.label).toContain('+2')
  })

  it('computeLaunchDamagePreview include Kongen e rider', () => {
    const dmg = computeLaunchDamagePreview({
      tier: 3,
      attackerSheet: { kongen: 4, bakuryoku: 5 },
      declaredSkiruId: 'bakuryoku',
      wazaEffectText: 'Attiva · [Contatto]',
    })
    expect(dmg?.tierValue).toBe(12)
    expect(dmg?.kongenFloor).toBe(6)
    expect(dmg?.riderBonus).toBe(2)
    expect(dmg?.totalBeforeMitigation).toBe(20)
  })

  it('shintai-kokan rider solo su Contatto', () => {
    expect(
      computeSkiruRiderFlatBonus('shintai-kokan', 'Attiva · [Contatto]'),
    ).toBe(2)
    expect(computeSkiruRiderFlatBonus('shintai-kokan', 'Attiva · [Proiettile]')).toBe(0)
  })

  it('buildFullWazaLaunchLine con hit e tier', () => {
    const line = buildFullWazaLaunchLine('Hōshutsu (放出) — Rilascio della Fiamma', WAZA_TAG_INDEX, {
      skiruSheet: { seimitsu: 5, kensei: 6 },
      declaredSkiruId: 'seimitsu',
      target: { nameQuery: 'Aoi' },
      declareHit: true,
    })
    expect(line).toMatch(/\[hit:1\]/)
    expect(extractHitDeclaredFromText(line)).toBe(true)
    expect(extractLaunchTierFromText(line)).toBeGreaterThan(0)
  })

  it('computeSkiruRiderDefenderIrPenalty penalizza evasione con Seimitsu', () => {
    expect(computeSkiruRiderDefenderIrPenalty('seimitsu')).toBe(-2)
    expect(computeSkiruRiderDefenderIrPenalty('bakuryoku')).toBe(0)
    expect(computeSkiruRiderDefenderIrPenalty(null)).toBe(0)
  })

  it('buildIndicativeActionIndex allinea computeIndicativeActionIr', () => {
    const sheet = { seimitsu: 5, kensei: 6, bakuryoku: 3 }
    const input = buildIndicativeActionIndex(sheet)
    expect(calculateSuccessIndex(sheet, input).successIndex).toBe(computeIndicativeActionIr(sheet))
  })
})
