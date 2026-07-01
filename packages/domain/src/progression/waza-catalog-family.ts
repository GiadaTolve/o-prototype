import { isStyleId, type StyleId } from './style-hexagon'
import { MADOSHO_BY_ID, type MadoshoId } from './madosho'
import { groupWazaByStyle, resolveWazaStyleId } from './waza-grouping'
import { getSkiruPoints, type SkiruSheet } from '../skiru/progression'

export const WAZA_CATALOG_FAMILIES = [
  'generiche',
  'do',
  'madosho',
  'ordine',
  'oni-no-mori',
] as const

export type WazaCatalogFamily = (typeof WAZA_CATALOG_FAMILIES)[number]

export const WAZA_CATALOG_FAMILY_LABELS: Record<WazaCatalogFamily, string> = {
  generiche: 'Waza Generiche',
  do: 'Waza Dō',
  madosho: 'Madoshō',
  ordine: 'Ordine',
  'oni-no-mori': 'Oni no Mori',
}

export const WAZA_CATALOG_FAMILY_BLURBS: Record<WazaCatalogFamily, string> = {
  generiche:
    'Tecniche trasversali, acquistabili con EXP senza vincolo di Via o lignaggio.',
  do: 'Le sei Vie del Dō · sblocco tramite Esagono, keystone e Keys.',
  madosho:
    'Eredità di clan (Parte IV). Acquistabili solo con la Madoshō assegnata allo staff.',
  ordine:
    'Arsenale militare Mugen-Tai / Chisen-Tai · milestone Sentō Senshi e contenuti d\'ordine.',
  'oni-no-mori':
    'Waza legate alla regione Onimori · contenuto di zona e narrative speciali.',
}

function normalizeCatalogText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
}

export function resolveWazaCatalogFamily(skill: {
  styleId?: string | null
  madoshoId?: string | null
  description?: string | null
  name?: string | null
  poolId?: string | null
}): WazaCatalogFamily {
  if (skill.madoshoId) return 'madosho'

  const desc = normalizeCatalogText(skill.description ?? '')
  const name = normalizeCatalogText(skill.name ?? '')
  const pool = normalizeCatalogText(skill.poolId ?? '')

  if (
    desc.includes('oni no mori') ||
    desc.includes('onimori') ||
    desc.includes('## oni no mori') ||
    name.includes('oni no mori') ||
    pool.startsWith('onimori-') ||
    pool.startsWith('oni-no-mori-')
  ) {
    return 'oni-no-mori'
  }

  if (
    desc.includes('## ordine') ||
    desc.includes('[ordine]') ||
    desc.includes('arsenale d\'ordine') ||
    desc.includes('arsenale dell\'ordine') ||
    desc.includes('mugen-tai') ||
    desc.includes('chisen-tai') ||
    desc.includes('sentō senshi') ||
    desc.includes('sento senshi') ||
    pool.startsWith('ordine-')
  ) {
    return 'ordine'
  }

  if (skill.styleId && isStyleId(skill.styleId)) return 'do'

  if (
    desc.includes('## generiche') ||
    desc.includes('[generiche]') ||
    pool.startsWith('generiche-')
  ) {
    return 'generiche'
  }

  return 'generiche'
}

/** Waza del pool Generiche (EXP, senza Esagono) — non il fallback generico del catalogo. */
export function isGenericheCatalogWaza(skill: {
  styleId?: string | null
  madoshoId?: string | null
  description?: string | null
  poolId?: string | null
}): boolean {
  if (skill.madoshoId) return false
  const pool = normalizeCatalogText(skill.poolId ?? '')
  if (pool.startsWith('generiche-')) return true
  const desc = normalizeCatalogText(skill.description ?? '')
  return desc.includes('[generiche') || desc.includes('## generiche')
}

export function isOrdineCatalogWaza(skill: {
  styleId?: string | null
  madoshoId?: string | null
  description?: string | null
  poolId?: string | null
}): boolean {
  if (skill.madoshoId) return false
  const pool = normalizeCatalogText(skill.poolId ?? '')
  if (pool.startsWith('ordine-')) return true
  const desc = normalizeCatalogText(skill.description ?? '')
  return (
    desc.includes('## ordine') ||
    desc.includes('[ordine]') ||
    desc.includes('arsenale d\'ordine') ||
    desc.includes('arsenale dell\'ordine') ||
    desc.includes('mugen-tai') ||
    desc.includes('chisen-tai')
  )
}

export function isOnimoriCatalogWaza(skill: {
  styleId?: string | null
  madoshoId?: string | null
  description?: string | null
  poolId?: string | null
}): boolean {
  if (skill.madoshoId) return false
  const pool = normalizeCatalogText(skill.poolId ?? '')
  if (pool.startsWith('onimori-') || pool.startsWith('oni-no-mori-')) return true
  const desc = normalizeCatalogText(skill.description ?? '')
  return desc.includes('oni no mori') || desc.includes('onimori') || desc.includes('## oni no mori')
}

export function canPurchaseOrdineWaza(
  character: { order?: string | null },
  skiruSheet: SkiruSheet,
): { ok: boolean; reason?: string } {
  const order = character.order ?? 'NONE'
  if (order === 'NONE') {
    return { ok: false, reason: 'Richiede appartenenza a Mugen-Tai o Chisen-Tai.' }
  }
  if (getSkiruPoints(skiruSheet, 'sento-senshi') <= 0) {
    return { ok: false, reason: 'Richiede milestone Sentō Senshi nello Skiru Sheet.' }
  }
  return { ok: true }
}

export type WazaCatalogFamilyGroup<T> = {
  family: WazaCatalogFamily
  label: string
  items: T[]
}

export function groupWazaByCatalogFamily<T>(
  items: T[],
  resolveFamily: (item: T) => WazaCatalogFamily = (item) =>
    resolveWazaCatalogFamily(item as Parameters<typeof resolveWazaCatalogFamily>[0]),
): WazaCatalogFamilyGroup<T>[] {
  const buckets = new Map<WazaCatalogFamily, T[]>()

  for (const item of items) {
    const family = resolveFamily(item)
    const list = buckets.get(family) ?? []
    list.push(item)
    buckets.set(family, list)
  }

  return WAZA_CATALOG_FAMILIES.filter((f) => buckets.has(f)).map((family) => ({
    family,
    label: WAZA_CATALOG_FAMILY_LABELS[family],
    items: buckets.get(family) ?? [],
  }))
}

export type WazaOwnedFamilySection<T> =
  | { kind: 'flat'; family: WazaCatalogFamily; label: string; items: T[] }
  | {
      kind: 'do'
      family: 'do'
      label: string
      styleGroups: Array<{ styleId: StyleId | 'other'; label: string; items: T[] }>
    }
  | {
      kind: 'madosho'
      family: 'madosho'
      label: string
      ramoGroups: Array<{ madoshoId: MadoshoId | 'other'; label: string; items: T[] }>
    }

/** Registro waza possedute: famiglia → sotto-gruppi Dō / Madoshō. */
export function layoutOwnedWazaSections<T>(
  items: T[],
  resolve: (item: T) => {
    styleId?: string | null
    madoshoId?: string | null
    description?: string | null
  },
): WazaOwnedFamilySection<T>[] {
  const familyGroups = groupWazaByCatalogFamily(items, (item) =>
    resolveWazaCatalogFamily(resolve(item)),
  )

  return familyGroups.map((group) => {
    if (group.family === 'do') {
      return {
        kind: 'do' as const,
        family: 'do' as const,
        label: group.label,
        styleGroups: groupWazaByStyle(group.items, (item) => resolveWazaStyleId(resolve(item))),
      }
    }

    if (group.family === 'madosho') {
      const byRamo = new Map<MadoshoId | 'other', T[]>()
      for (const item of group.items) {
        const mid = resolve(item).madoshoId
        const key: MadoshoId | 'other' =
          mid && mid in MADOSHO_BY_ID ? (mid as MadoshoId) : 'other'
        const list = byRamo.get(key) ?? []
        list.push(item)
        byRamo.set(key, list)
      }
      const ramoGroups = [...byRamo.entries()].map(([madoshoId, ramoItems]) => ({
        madoshoId,
        label:
          madoshoId === 'other'
            ? 'Altro lignaggio'
            : (MADOSHO_BY_ID[madoshoId]?.name ?? madoshoId),
        items: ramoItems,
      }))
      return {
        kind: 'madosho' as const,
        family: 'madosho' as const,
        label: group.label,
        ramoGroups,
      }
    }

    return {
      kind: 'flat' as const,
      family: group.family,
      label: group.label,
      items: group.items,
    }
  })
}

export function countCatalogByFamily<T>(
  items: T[],
  resolveFamily: (item: T) => WazaCatalogFamily,
): Record<WazaCatalogFamily, number> {
  const out = Object.fromEntries(WAZA_CATALOG_FAMILIES.map((f) => [f, 0])) as Record<
    WazaCatalogFamily,
    number
  >
  for (const item of items) {
    out[resolveFamily(item)] += 1
  }
  return out
}
