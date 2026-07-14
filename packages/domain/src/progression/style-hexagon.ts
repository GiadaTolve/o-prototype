/** Esagono degli Stili — Ultimate Manual (ordine: Tōka → Genzai → Itō → Naikan → Hensei → Hadō). */

export const STYLE_HEX_ORDER = [
  'toka',
  'genzai',
  'ito',
  'naikan',
  'hensei',
  'hado',
] as const

export type StyleId = (typeof STYLE_HEX_ORDER)[number]

export type StyleRelation = 'primary' | 'adjacent' | 'distant' | 'opposite'

export const STYLE_LABELS: Record<StyleId, string> = {
  toka: 'Tōka-dō',
  genzai: 'Genzai-dō',
  ito: 'Itō-dō',
  naikan: 'Naikan-dō',
  hensei: 'Hensei-dō',
  hado: 'Hadō-dō',
}

export const STYLE_OPPOSITE_PAIRS: ReadonlyArray<[StyleId, StyleId]> = [
  ['genzai', 'hensei'],
  ['ito', 'hado'],
  ['toka', 'naikan'],
]

/** Adiacenze sull'esagono (2 per stile). */
export const STYLE_HEX_ADJACENT: Record<StyleId, readonly [StyleId, StyleId]> = {
  toka: ['genzai', 'hado'],
  genzai: ['toka', 'ito'],
  ito: ['genzai', 'naikan'],
  naikan: ['ito', 'hensei'],
  hensei: ['naikan', 'hado'],
  hado: ['hensei', 'toka'],
}

export const STYLE_HEX_OPPOSITE: Record<StyleId, StyleId> = {
  toka: 'naikan',
  genzai: 'hensei',
  ito: 'hado',
  naikan: 'toka',
  hensei: 'genzai',
  hado: 'ito',
}

export const STYLE_UNLOCK_KEY_COST = 1

export type StyleHexUiMeta = {
  primaryStyleId?: StyleId
  /** Stili sbloccati con Key (include sempre il principale). */
  unlockedStyleIds?: StyleId[]
}

/** Chiavi ramo waza (apps/tester wazaBranches) → stile esagono. */
export const WAZA_BRANCH_TO_STYLE: Record<string, StyleId> = {
  proiezione: 'toka',
  materializzazione: 'genzai',
  manipolazione: 'ito',
  supporto: 'naikan',
  trasformazione: 'hensei',
  emissione: 'hado',
}

const BRANCH_TO_STYLE: Record<string, StyleId> = {
  'tōka-dō': 'toka',
  'toka-dō': 'toka',
  'toka-do': 'toka',
  'genzai-dō': 'genzai',
  'genzai-do': 'genzai',
  'ito-do': 'ito',
  'itō-dō': 'ito',
  'ito-dō': 'ito',
  'hō-do': 'hado',
  'ho-do': 'hado',
  'hadō-dō': 'hado',
  'hensei-dō': 'hensei',
  'hensei-do': 'hensei',
  'naikan-do': 'naikan',
  'naikan-dō': 'naikan',
}

export function isStyleId(value: string | null | undefined): value is StyleId {
  return STYLE_HEX_ORDER.includes(value as StyleId)
}

export function getStyleRelation(primary: StyleId, target: StyleId): StyleRelation {
  if (primary === target) return 'primary'
  if (STYLE_HEX_OPPOSITE[primary] === target) return 'opposite'
  if (STYLE_HEX_ADJACENT[primary].includes(target)) return 'adjacent'
  return 'distant'
}

export function styleIdFromBranchLabel(branch: string): StyleId | null {
  const key = branch.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const fromWazaBranch = WAZA_BRANCH_TO_STYLE[key]
  if (fromWazaBranch) return fromWazaBranch
  for (const [k, id] of Object.entries(BRANCH_TO_STYLE)) {
    const nk = k.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (key === nk || key.startsWith(nk) || nk.startsWith(key.split(' ')[0] ?? '')) {
      return id
    }
  }
  if (key.includes('toka') || key.includes('toro') || key.includes('lanterna')) return 'toka'
  if (key.includes('genzai') || key.includes('sigillo') || key.includes('scrittura')) return 'genzai'
  if (key.includes('ito') || key.includes('filo') || key.includes('manipol')) return 'ito'
  if (key.includes('naikan') || key.includes('supporto')) return 'naikan'
  if (key.includes('hensei') || key.includes('deform')) return 'hensei'
  if (key.includes('hado') || key.includes('hō') || key.includes('emission') || key.includes('collasso')) {
    return 'hado'
  }
  return null
}

export function styleIdFromSkillDescription(description: string | null | undefined): StyleId | null {
  if (!description?.trim()) return null
  const m = description.match(/^\[([^\·]+)/)
  if (!m) return null
  return styleIdFromBranchLabel(m[1].trim())
}

export function readStyleHexMeta(meta: StyleHexUiMeta | null | undefined): {
  primaryStyleId: StyleId | null
  unlockedStyleIds: StyleId[]
} {
  const primary = meta?.primaryStyleId && isStyleId(meta.primaryStyleId) ? meta.primaryStyleId : null
  const raw = meta?.unlockedStyleIds ?? []
  const unlocked = raw.filter((id): id is StyleId => isStyleId(id))
  if (primary && !unlocked.includes(primary)) unlocked.unshift(primary)
  return { primaryStyleId: primary, unlockedStyleIds: [...new Set(unlocked)] }
}

export function canLearnWazaFromStyle(
  primary: StyleId | null,
  unlocked: readonly StyleId[],
  targetStyle: StyleId,
): { ok: boolean; error?: string } {
  if (!primary) {
    return { ok: false, error: 'Scegli prima lo stile principale (Esagono).' }
  }
  if (!unlocked.includes(targetStyle)) {
    return { ok: false, error: `Sblocca ${STYLE_LABELS[targetStyle]} con ${STYLE_UNLOCK_KEY_COST} Key.` }
  }
  return { ok: true }
}
