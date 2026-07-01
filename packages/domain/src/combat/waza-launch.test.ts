import { describe, expect, it } from 'vitest'
import { WAZA_TAG_INDEX } from './waza-tag-index'
import { buildWazaLaunchInsertLine, normalizeWazaLookupKey } from './waza-tag-preview'
import {
  buildFullWazaLaunchLine,
  expandWazaLaunchInMessage,
  expandWazaSlashCommandInMessage,
  parseNaturalWazaLaunchLine,
  validateWazaChatPrerequisites,
  validateWazaChatCsAffordability,
  extractHitDeclaredFromText,
  extractLaunchSkiruId,
  extractLaunchTierFromText,
  extractWazaLaunchTargetSpec,
  parseWazaSlashCommand,
  resolveAutoLaunchSkiruId,
  resolveRelevantLaunchSkiruCandidates,
} from './waza-launch'
import { buildWazaLaunchExtraTags, messageDeclaresSurpriseAttack } from './waza-launch-extras'
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

  it('resolveRelevantLaunchSkiruCandidates limita a Skiru pertinenti', () => {
    const sheet = {
      seimitsu: 6,
      kensei: 4,
      'itten-kokan': 3,
      bakuryoku: 8,
      dokusei: 5,
      fudoshin: 4,
    }
    const entry = WAZA_TAG_INDEX.get(
      normalizeWazaLookupKey('Hōshutsu (放出) — Rilascio della Fiamma'),
    )
    expect(entry).toBeTruthy()
    const candidates = resolveRelevantLaunchSkiruCandidates(sheet, entry)
    expect(candidates).toContain('bakuryoku')
    expect(candidates).not.toContain('dokusei')
    expect(candidates).not.toContain('fudoshin')
  })

  it('resolveAutoLaunchSkiruId su proiettile preferisce la Skiru pertinente con più punti', () => {
    const sheet = { seimitsu: 6, kensei: 4, 'itten-kokan': 8, bakuryoku: 2 }
    const entry = WAZA_TAG_INDEX.get(
      normalizeWazaLookupKey('Shinya (心矢) — Dardo Psichico'),
    )
    const candidates = resolveRelevantLaunchSkiruCandidates(sheet, entry)
    expect(candidates).toContain('seimitsu')
    expect(candidates).toContain('itten-kokan')
    expect(resolveAutoLaunchSkiruId(sheet, entry)).toBe('itten-kokan')
  })

  it('expandWazaSlashCommandInMessage auto-skiru senza --skiru', () => {
    const expanded = expandWazaSlashCommandInMessage(
      '/waza Shinya',
      WAZA_TAG_INDEX,
      { skiruSheet: { seimitsu: 6, kensei: 4, 'itten-kokan': 3, bakuryoku: 2 } },
    )
    expect(expanded).toMatch(/\[skiru:seimitsu\]/)
    expect(expanded).toMatch(/\[cs:1\]/)
  })

  it('buildWazaLaunchExtraTags per Giurisdizione e Sorpresa', () => {
    const tags = buildWazaLaunchExtraTags(
      'kankatsu-giurisdizione',
      { giurisdizioneCategory: 'raggio', surpriseAttack: true },
      null,
    )
    expect(tags).toEqual(['[giurisdizione:raggio]', '[sorpresa:1]'])
    expect(messageDeclaresSurpriseAttack(tags.join(' '))).toBe(true)
  })

  it('buildFullWazaLaunchLine appende tag extra Hōgō', () => {
    const line = buildFullWazaLaunchLine('Hōgō (縫合) — Sutura dell\'Ego', WAZA_TAG_INDEX, {
      skiruSheet: { kensei: 5, 'itten-kokan': 4 },
      declaredSkiruId: 'kensei',
      poolId: 'hogo-sutura-ego',
      launchExtras: { suturaKind: 'offensiva' },
      target: { nameQuery: 'Aoi' },
    })
    expect(line).toMatch(/\[sutura:Aoi:offensiva\]/)
  })

  it('resolveAutoLaunchSkiruId usa Skiru mentali su Ubaiito', () => {
    const sheet = { fudoshin: 3, kansatsu: 7, kensei: 5 }
    const entry = WAZA_TAG_INDEX.get(
      normalizeWazaLookupKey('Ubaiito (奪い糸) — Filo Rubato'),
    )
    expect(resolveAutoLaunchSkiruId(sheet, entry)).toBe('kansatsu')
  })

  it('parseNaturalWazaLaunchLine estrae waza, skiru, cs e target', () => {
    const parsed = parseNaturalWazaLaunchLine('Lancio Hōshutsu con Seimitsu, 2 CS, contro Aoi.')
    expect(parsed?.wazaQuery).toMatch(/Hōshutsu/i)
    expect(parsed?.skiruId).toBe('seimitsu')
    expect(parsed?.cs).toBe(2)
    expect(parsed?.target).toBe('Aoi')
  })

  it('expandWazaLaunchInMessage espande frase naturale', () => {
    const expanded = expandWazaLaunchInMessage(
      'Lancio Hōshutsu con seimitsu, 1 cs, contro Aoi',
      WAZA_TAG_INDEX,
      { skiruSheet: { seimitsu: 5, kensei: 4 } },
    )
    expect(expanded).toMatch(/\[waza:/)
    expect(expanded).toMatch(/\[skiru:seimitsu\]/)
    expect(expanded).toMatch(/\[cs:1\]/)
    expect(expanded).toMatch(/\[target:Aoi\]/i)
  })

  it('validateWazaChatPrerequisites blocca waza non posseduta e CS insufficienti', () => {
    const entry = WAZA_TAG_INDEX.get(
      normalizeWazaLookupKey('Hōshutsu (放出) — Rilascio della Fiamma'),
    )
    expect(entry?.poolId).toBeTruthy()
    const noOwned = validateWazaChatPrerequisites({
      content: '[waza:Hōshutsu (放出) — Rilascio della Fiamma] [cs:5]',
      wazaIndex: WAZA_TAG_INDEX,
      chronoCsAvailable: 10,
      ownedWazaPoolIds: new Set<string>(),
    })
    expect(noOwned.ok).toBe(false)
    expect(noOwned.errors.some((e) => /non possiedi/i.test(e))).toBe(true)

    const noCs = validateWazaChatPrerequisites({
      content: '[waza:Hōshutsu (放出) — Rilascio della Fiamma] [cs:8]',
      wazaIndex: WAZA_TAG_INDEX,
      chronoCsAvailable: 3,
      ownedWazaPoolIds: new Set([entry!.poolId!]),
    })
    expect(noCs.ok).toBe(false)
    expect(noCs.errors.some((e) => /CS insufficienti/i.test(e))).toBe(true)

    expect(validateWazaChatCsAffordability(-6, 4)).toMatch(/CS insufficienti/)
    expect(validateWazaChatCsAffordability(-2, 5)).toBeNull()
  })
})
