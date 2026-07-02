import { describe, expect, it } from 'vitest'
import { computeIndicativeActionIr } from './resolution.ts'
import {
  buildWazaTagIndex,
  buildWazaLaunchInsertLine,
  enrichWazaTagPreviewWithSkiru,
  extractIrTagFromText,
  extractWazaTagNames,
  formatWazaTagsInText,
  normalizeWazaLookupKey,
  removeWazaTagsFromText,
  resolveWazaTagPreview,
} from './waza-tag-preview.ts'
import { WAZA_TAG_CATALOG, WAZA_TAG_INDEX } from './waza-tag-index.ts'

describe('waza tag preview', () => {
  it('normalizza nomi per lookup accent-insensitive', () => {
    expect(normalizeWazaLookupKey('Tōrō — Lanterna Incisa')).toBe(
      normalizeWazaLookupKey('Toro - Lanterna Incisa'),
    )
  })

  it('risolve tier, CS e descrizione da catalogo PDF', () => {
    const preview = resolveWazaTagPreview('Hōshutsu (放出) — Rilascio della Fiamma', WAZA_TAG_INDEX)
    expect(preview.found).toBe(true)
    expect(preview.isPassive).toBe(false)
    expect(preview.tier).toBeGreaterThan(0)
    expect(preview.csCost).toBeGreaterThan(0)
    expect(preview.description).toBeTruthy()
  })

  it('passive Dō senza tier', () => {
    const preview = resolveWazaTagPreview('Tōrō (灯籠) — Lanterna Incisa', WAZA_TAG_INDEX)
    expect(preview.found).toBe(true)
    expect(preview.isPassive).toBe(true)
    expect(preview.tier).toBeNull()
    expect(preview.description).toBeTruthy()
  })

  it('formatta [waza:Nome] con meta tier/CS', () => {
    const html = formatWazaTagsInText(
      'Attacco [waza:Hōshutsu (放出) — Rilascio della Fiamma]!',
      WAZA_TAG_INDEX,
    )
    expect(html).toContain('waza-tag')
    expect(html).toContain('waza-tag-meta')
    expect(html).toContain('CS')
  })

  it('estrae nomi waza, IR e costruisce riga lancio', () => {
    const line =
      '«Colpo» [waza:Tōrō (灯籠) — Lanterna Incisa] poi [waza:Hōshutsu (放出) — Rilascio della Fiamma] [ir:7]'
    expect(extractWazaTagNames(line)).toHaveLength(2)
    expect(extractIrTagFromText(line)).toBe(7)
    expect(removeWazaTagsFromText(line)).not.toContain('[waza:')
    expect(removeWazaTagsFromText(line)).not.toContain('[ir:')
    const insert = buildWazaLaunchInsertLine('Hōshutsu (放出) — Rilascio della Fiamma', WAZA_TAG_INDEX, {
      skiruSheet: { kensei: 8, 'itten-kokan': 6 },
    })
    expect(insert).toMatch(/\[waza:/)
    expect(insert).toMatch(/\[tier:\d+\]/)
    expect(insert).toMatch(/\[cs:\d+\]/)
    expect(insert).toMatch(/\[ir:7\]/)
  })

  it('IR indicativo da scheda Skiru', () => {
    expect(computeIndicativeActionIr({ kensei: 8, 'itten-kokan': 6 })).toBe(7)
  })

  it('lancio Ubaiito usa IR mentale max', () => {
    const sheet = { fudoshin: 3, kansatsu: 6, kensei: 8, 'itten-kokan': 4 }
    const insert = buildWazaLaunchInsertLine('Ubaiito (奪い糸) — Filo Rubato', WAZA_TAG_INDEX, {
      skiruSheet: sheet,
    })
    expect(extractIrTagFromText(insert)).toBe(6)
  })

  it('arricchisce tooltip con valori Skiru', () => {
    const entry = WAZA_TAG_CATALOG.find((w) => w.poolId === 'michishirube-luce-guida')
    expect(entry).toBeTruthy()
    const base = resolveWazaTagPreview(entry!.name, WAZA_TAG_INDEX)
    const enriched = enrichWazaTagPreviewWithSkiru(base, entry, { seimitsu: 5 })
    expect(enriched.personalHint).toContain('13 m')
  })

  it('lancio con Pressione Hadō (CS 14)', () => {
    const entry = WAZA_TAG_CATALOG.find((w) => w.poolId === 'hosha-raffica-psichica')
    expect(entry).toBeTruthy()
    const insert = buildWazaLaunchInsertLine(entry!.name, WAZA_TAG_INDEX, {
      skiruSheet: { kensei: 8, 'itten-kokan': 6 },
      currentCs: 14,
    })
    expect(insert).toMatch(/\[ir:7\]/)
  })

  it('catalogo generato ha poolId ed effect', () => {
    expect(WAZA_TAG_CATALOG.length).toBe(161)
    expect(buildWazaTagIndex(WAZA_TAG_CATALOG).size).toBe(161)
    const hari = WAZA_TAG_CATALOG.find((w) => w.poolId === 'hari-tsume-carico-trattenuto')
    expect(hari?.effect).toContain('Potenziamento')
  })
})
