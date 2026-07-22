import { describe, expect, it } from 'vitest'
import { buildFullWazaLaunchLine } from './waza-launch.ts'
import {
  buildWazaTagIndex,
  normalizeWazaLookupKey,
  resolveWazaTagPreview,
} from './waza-tag-preview.ts'
import { mergeWazaTagCatalog } from './waza-catalog-merge.ts'
import { WAZA_TAG_CATALOG } from './waza-tag-index.ts'
import { resolveDefaultWazaCostCs } from '../progression/waza-cost-exp.ts'

const TOKA_MODIFIED: Array<{
  poolId: string
  name: string
  rank: string | null
  isPassive: boolean
  effect: string
}> = [
  {
    poolId: 'nokuribi-fuoco-residuo',
    name: 'Nokuribi · Cenere Rimasta (残り火)',
    rank: null,
    isPassive: true,
    effect:
      "Il [Tōrō] trattiene il residuo dell'ultima waza [Elementale] lanciata fino alla fine del turno successivo.",
  },
  {
    poolId: 'kakucho-espansione-della-luce',
    name: 'Kakuchō · Espansione (拡張)',
    rank: 'T1',
    isPassive: false,
    effect: 'Per 1 turno, il [Tōrō] sale di una taglia.',
  },
  {
    poolId: 'kaeribi-fiamma-del-ritorno',
    name: 'Kaeribi · Richiamo (返し火)',
    rank: 'T1',
    isPassive: false,
    effect: "L'analista richiama a sé un'arma entro 8 m.",
  },
  {
    poolId: 'hoshutsu-rilascio-della-fiamma',
    name: 'Hōshutsu · Scarica (放出)',
    rank: 'T2',
    isPassive: false,
    effect: "L'analista scarica la Jigo-Ka del [Tōrō] in un cono di 6 m.",
  },
  {
    poolId: 'omocha-il-giocattolo',
    name: 'Bannō · Qualunque Cosa (万能)',
    rank: 'T3',
    isPassive: false,
    effect: "Per 3 turni, qualsiasi oggetto fisico impugnato diventa [Tōrō].",
  },
  {
    poolId: 'gangushi-il-giocattolaio',
    name: 'Kishin no Tō · Il Fuoco che Porti Addosso (器心の灯)',
    rank: 'T4',
    isPassive: false,
    effect: "Per 4 turni, ogni oggetto nell'inventario acquisisce lo status di [Tōrō].",
  },
  {
    poolId: 'tomurai-no-to-rito-funebre',
    name: 'Tomurai no Tō · Rito Funebre (弔いの灯)',
    rank: 'T5',
    isPassive: false,
    effect: "Il [Tōrō] dell'analista assume la forma di una lanterna di ferro da rito funebre.",
  },
]

describe('Tōka-dō Lab → catalogo chat', () => {
  const merged = mergeWazaTagCatalog(WAZA_TAG_CATALOG, TOKA_MODIFIED)
  const index = buildWazaTagIndex(merged)

  for (const row of TOKA_MODIFIED) {
    it(`risolve ${row.poolId} per nome Lab`, () => {
      const preview = resolveWazaTagPreview(row.name, index)
      expect(preview.found, `lookup fallito per ${row.name}`).toBe(true)
      const entry = index.get(normalizeWazaLookupKey(row.name))
      expect(entry?.poolId).toBe(row.poolId)
      if (!row.isPassive) {
        expect(preview.tier).toBe(Number(row.rank?.replace(/^T/i, '')))
        expect(preview.csCost).toBe(
          resolveDefaultWazaCostCs({ isPassive: false, rank: row.rank }),
        )
      } else {
        expect(preview.isPassive).toBe(true)
        expect(preview.tier).toBeNull()
      }
    })
  }

  it('genera riga chat con tier e CS corretti (Hōshutsu T2 · 4 CS)', () => {
    const name = 'Hōshutsu · Scarica (放出)'
    const line = buildFullWazaLaunchLine(name, index, { declareHit: true })
    expect(line).toContain('[waza:')
    expect(line).toContain('[tier:2]')
    expect(line).toContain('[cs:4]')
    expect(index.has(normalizeWazaLookupKey(name))).toBe(true)
  })

  it('Tomurai T5 è nel catalogo merge anche se assente nel pool statico', () => {
    const hit = merged.find((e) => e.poolId === 'tomurai-no-to-rito-funebre')
    expect(hit?.name).toContain('Tomurai')
    const preview = resolveWazaTagPreview(hit!.name, index)
    expect(preview.tier).toBe(5)
    expect(preview.csCost).toBe(10)
  })
})
