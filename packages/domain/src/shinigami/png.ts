/**
 * Scheda PNG / Bestiario — Oyasumi_Spec_Tulpa_Shinigami.md §§4–5
 */
export type PngTipo = 'umano' | 'kyofu' | 'kizu' | 'holic' | 'boss' | 'mob'

export const PNG_TIPI: readonly PngTipo[] = [
  'umano',
  'kyofu',
  'kizu',
  'holic',
  'boss',
  'mob',
] as const

export const PNG_TIPO_LABELS: Record<PngTipo, string> = {
  umano: 'Umano',
  kyofu: 'Kyōfu',
  kizu: 'Kizu',
  holic: 'Holic',
  boss: 'Boss',
  mob: 'Mob',
}

export type PngTier = 1 | 2 | 3 | 4 | 5

export type PngWazaEntry = {
  nome: string
  descrizione?: string
  danno?: number
  tier?: number
}

export type PngStatusEntry = {
  slug: string
  stack: number
}

export type PngDropEntry = {
  item_id: string
  item_nome?: string
  quantita?: number
  quantita_min?: number
  quantita_max?: number
  probabilita: number
}

/** Scheda PNG (§4). */
export type PngScheda = {
  id?: string
  nome: string
  tipo: PngTipo
  tier: PngTier
  hp_max: number
  hp_correnti: number
  cs_max: number
  cs_correnti: number
  ir_attacco: number
  ir_difesa: number
  waza: PngWazaEntry[]
  status_attivi: PngStatusEntry[]
  note: string
  drop_table?: PngDropEntry[]
  onimori?: string
  creato_da?: string | null
  salvato_in_albo?: boolean
}

/** Scheda Bestiario (§5). */
export type BestiarioScheda = PngScheda & {
  name_jp?: string | null
  name_kanji?: string | null
  habitat?: string | null
  comportamento?: string | null
  tag_caccia?: boolean
  lore?: string | null
  immagine?: string | null
}

export type TierRandomRanges = {
  hp: readonly [number, number]
  ir: readonly [number, number]
  cs: readonly [number, number]
}

/** Tabella random §3A. */
export const TIER_RANDOM_RANGES: Record<PngTier, TierRandomRanges> = {
  1: { hp: [30, 60], ir: [3, 5], cs: [5, 10] },
  2: { hp: [61, 100], ir: [5, 7], cs: [8, 14] },
  3: { hp: [101, 160], ir: [7, 9], cs: [12, 18] },
  4: { hp: [161, 240], ir: [9, 11], cs: [16, 22] },
  5: { hp: [241, 400], ir: [11, 14], cs: [20, 30] },
}

function rnd(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

const TIER_NAMES: Record<PngTier, string[]> = {
  1: ['Errante', 'Ombra', 'Presenza'],
  2: ['Sentinella', 'Bruma', 'Artiglio'],
  3: ['Predatore', 'Vortice', 'Corona'],
  4: ['Tiranno', 'Abisso', 'Fulmine'],
  5: ['Cataclisma', 'Vuoto', 'Sovrano'],
}

/** Genera parametri plausibili per tier (§3A). */
export function rollPngByTier(
  tier: PngTier,
  tipo: PngTipo = 'mob',
): Omit<PngScheda, 'id' | 'creato_da' | 'salvato_in_albo'> {
  const ranges = TIER_RANDOM_RANGES[tier]
  const hp = rnd(ranges.hp[0], ranges.hp[1])
  const ir = rnd(ranges.ir[0], ranges.ir[1])
  const cs = rnd(ranges.cs[0], ranges.cs[1])
  const names = TIER_NAMES[tier]
  const nome = `${names[rnd(0, names.length - 1)]} T${tier}`
  return {
    nome,
    tipo,
    tier,
    hp_max: hp,
    hp_correnti: hp,
    cs_max: cs,
    cs_correnti: Math.min(cs, rnd(0, Math.ceil(cs / 2))),
    ir_attacco: ir,
    ir_difesa: Math.max(1, ir - rnd(0, 2)),
    waza: [
      {
        nome: 'Attacco base',
        descrizione: `Colpo di fascia T${tier}`,
        danno: rnd(ir, ir + tier * 2),
        tier,
      },
    ],
    status_attivi: [],
    note: `Generato random T${tier}`,
  }
}

export function emptyPngDraft(tier: PngTier = 1, tipo: PngTipo = 'mob'): Omit<PngScheda, 'id'> {
  const ranges = TIER_RANDOM_RANGES[tier]
  const hp = Math.round((ranges.hp[0] + ranges.hp[1]) / 2)
  const ir = Math.round((ranges.ir[0] + ranges.ir[1]) / 2)
  const cs = Math.round((ranges.cs[0] + ranges.cs[1]) / 2)
  return {
    nome: '',
    tipo,
    tier,
    hp_max: hp,
    hp_correnti: hp,
    cs_max: cs,
    cs_correnti: 0,
    ir_attacco: ir,
    ir_difesa: ir,
    waza: [],
    status_attivi: [],
    note: '',
    salvato_in_albo: false,
  }
}
