/**
 * Madoshō (clan) — eredità di sangue, scelta obbligatoria in creazione PG.
 * UltimateManual Parte IV · MECHANICS_ROADMAP
 */

export const MADOSHO_IDS = [
  'ringai-janjae',
  'gokaon',
  'komonoire',
  'nakigara',
  'ikiryo',
  'hataori',
] as const

export type MadoshoId = (typeof MADOSHO_IDS)[number]

export interface MadoshoDef {
  id: MadoshoId
  name: string
  nameJa?: string
  tagline: string
}

export const MADOSHO_CATALOG: MadoshoDef[] = [
  {
    id: 'ringai-janjae',
    name: "Rin'gai / Janjae",
    nameJa: '輪廻',
    tagline: 'Soglia tra vita e morte · Hyakki Yagyō',
  },
  {
    id: 'gokaon',
    name: 'Gōkaon',
    nameJa: '業火音',
    tagline: 'Trasformazione oni · pressione e calore',
  },
  {
    id: 'komonoire',
    name: 'Komonoire',
    nameJa: '小物入れ',
    tagline: 'Patto sbagliato · dado demoniaco',
  },
  {
    id: 'nakigara',
    name: 'Nakigara',
    nameJa: '亡骸',
    tagline: 'Eredità del sangue · legami di progenie',
  },
  {
    id: 'ikiryo',
    name: 'Ikiryō',
    nameJa: '生霊',
    tagline: 'Giardino nero · emozioni fuori corpo',
  },
  {
    id: 'hataori',
    name: 'Hataori',
    nameJa: '機織り',
    tagline: 'Telaio e nodi · sigilli portafortuna',
  },
]

export const MADOSHO_BY_ID: Record<MadoshoId, MadoshoDef> = Object.fromEntries(
  MADOSHO_CATALOG.map((m) => [m.id, m]),
) as Record<MadoshoId, MadoshoDef>

export function isMadoshoId(value: string): value is MadoshoId {
  return (MADOSHO_IDS as readonly string[]).includes(value)
}

export function getMadoshoDef(id: string | null | undefined): MadoshoDef | null {
  if (!id || !isMadoshoId(id)) return null
  return MADOSHO_BY_ID[id]
}

/** Fonte canonica waza Madoshō — Parte IV PDF (Komonoire: elenco assente). */
export const MANUAL_MADOSHO_POOL_IDS: Record<MadoshoId, readonly string[]> = {
  'ringai-janjae': [
    'zanei', 'kegare', 'kokurui', 'hando', 'magai-jigoku', 'hedo', 'tamashii-no-hake',
    'yobimodoshi', 'butto', 'kugutsushi', 'uzu',
  ],
  gokaon: [
    'yasei', 'gashin', 'oni-no-kyukaku', 'oni-no-mezame', 'oni-no-ago', 'jushi',
    'oni-no-hoko', 'moshin', 'kotsudan', 'jiware', 'doka',
  ],
  komonoire: [],
  nakigara: [
    'chi-ni-somaru', 'chi-no-kehai', 'matsugo-no-chi', 'ketsumyaku-no-yaiba',
    'chi-no-hoyo', 'hirui', 'chi-no-kizuna', 'yuketsu', 'kaketsu', 'soketsu-no-minamoto',
    'yume-ga-nijimu',
  ],
  ikiryo: [
    'aku-no-hana', 'dokushu', 'jagan-no-niwashi', 'chokafun', 'himawari-no-kushi',
    'ibara-no-batsu', 'bara-no-shokei', 'tanpopo-no-noroi', 'chokafunso', 'bochi-no-hasami',
    'yume-ga-saku',
  ],
  hataori: [
    'kinu-no-hada', 'sokubakukan', 'nodoshibari', 'hishi-musubi', 'kanmusubi',
    'juji-musubi', 'mitsuba-musubi', 'kiku-musubi', 'sosen-musubi', 'ai-no-musubi',
    'ori-no-moho',
  ],
}

export function totalManualMadoshoWazaCount(): number {
  return MADOSHO_IDS.reduce((n, id) => n + MANUAL_MADOSHO_POOL_IDS[id].length, 0)
}
