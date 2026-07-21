import { parseWazaTierFromRank } from '../combat/waza-rank'
import { isWazaTier } from '../combat/tier'
import {
  resolveWazaCatalogFamily,
  WAZA_CATALOG_FAMILY_LABELS,
  type WazaCatalogFamily,
} from './waza-catalog-family'
import { resolveWazaStyleId } from './waza-grouping'
import {
  MADOSHO_BY_ID,
  MADOSHO_CATALOG,
  resolveMadoshoIdFromPoolId,
  type MadoshoId,
} from './madosho'
import { STYLE_HEX_ORDER, STYLE_LABELS, type StyleId } from './style-hexagon'

/** Campi minimi necessari al bollettino Lab. */
export type WazaLabBulletinItem = {
  poolId: string
  name?: string | null
  description?: string | null
  effect?: string | null
  rank?: string | null
  isPassive?: boolean
  styleId?: string | null
  madoshoId?: string | null
  tier?: number | null
  genitore?: string | null
}

export type WazaLabBulletinCounts = {
  total: number
  passive: number
  t1: number
  t2: number
  t3: number
  t4: number
  t5: number
  /** Attive senza rank T1–T5 riconoscibile */
  other: number
}

export type WazaLabBulletinParent = {
  id: string
  label: string
  counts: WazaLabBulletinCounts
}

export type WazaLabBulletinFamily = {
  family: WazaCatalogFamily
  label: string
  counts: WazaLabBulletinCounts
  parents: WazaLabBulletinParent[]
}

export type WazaLabBulletin = {
  generatedAt: string
  totals: WazaLabBulletinCounts
  families: WazaLabBulletinFamily[]
}

function emptyCounts(): WazaLabBulletinCounts {
  return { total: 0, passive: 0, t1: 0, t2: 0, t3: 0, t4: 0, t5: 0, other: 0 }
}

function addItem(counts: WazaLabBulletinCounts, item: WazaLabBulletinItem): void {
  counts.total += 1
  if (item.isPassive) {
    counts.passive += 1
    return
  }
  const tier =
    parseWazaTierFromRank(item.rank) ??
    (item.tier != null && isWazaTier(item.tier) ? item.tier : null)
  switch (tier) {
    case 1:
      counts.t1 += 1
      break
    case 2:
      counts.t2 += 1
      break
    case 3:
      counts.t3 += 1
      break
    case 4:
      counts.t4 += 1
      break
    case 5:
      counts.t5 += 1
      break
    default:
      counts.other += 1
  }
}

function sumCounts(parts: WazaLabBulletinCounts[]): WazaLabBulletinCounts {
  const out = emptyCounts()
  for (const c of parts) {
    out.total += c.total
    out.passive += c.passive
    out.t1 += c.t1
    out.t2 += c.t2
    out.t3 += c.t3
    out.t4 += c.t4
    out.t5 += c.t5
    out.other += c.other
  }
  return out
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
}

function resolveOrdineSubgroup(item: WazaLabBulletinItem): string {
  const text = normalizeText(`${item.description ?? ''} ${item.effect ?? ''} ${item.poolId}`)
  if (text.includes('mugen-tai') || text.includes('mugen tai')) return 'mugen-tai'
  if (text.includes('chisen-tai') || text.includes('chisen tai')) return 'chisen-tai'
  return 'comune'
}

function parentKeyForItem(
  item: WazaLabBulletinItem,
  family: WazaCatalogFamily,
): { id: string; label: string } {
  if (family === 'do') {
    const style = resolveWazaStyleId(item)
    if (style) return { id: `do-${style}`, label: STYLE_LABELS[style] }
    if (item.genitore?.trim()) {
      return { id: `do-gen:${item.genitore.trim()}`, label: item.genitore.trim() }
    }
    return { id: 'do-other', label: 'Altro (Dō)' }
  }

  if (family === 'madosho') {
    const mid =
      (item.madoshoId && item.madoshoId in MADOSHO_BY_ID ? (item.madoshoId as MadoshoId) : null) ??
      resolveMadoshoIdFromPoolId(item.poolId)
    if (mid) return { id: `madosho-${mid}`, label: MADOSHO_BY_ID[mid].name }
    if (item.genitore?.trim()) {
      return { id: `madosho-gen:${item.genitore.trim()}`, label: item.genitore.trim() }
    }
    return { id: 'madosho-other', label: 'Altro lignaggio' }
  }

  if (family === 'ordine') {
    const sub = resolveOrdineSubgroup(item)
    const labels: Record<string, string> = {
      'mugen-tai': 'Mugen-Tai',
      'chisen-tai': 'Chisen-Tai',
      comune: 'Arsenale comune',
    }
    return { id: `ordine-${sub}`, label: labels[sub] ?? sub }
  }

  if (family === 'oni-no-mori') {
    return { id: 'oni-no-mori', label: WAZA_CATALOG_FAMILY_LABELS['oni-no-mori'] }
  }

  if (item.genitore?.trim()) {
    return { id: `generiche-gen:${item.genitore.trim()}`, label: item.genitore.trim() }
  }
  return { id: 'generiche', label: WAZA_CATALOG_FAMILY_LABELS.generiche }
}

/**
 * Bollettino: per ogni famiglia e genitore, conteggi Passiva / T1–T5.
 * Include i genitori canonicici (Vie Dō, clan Madōshō) anche se a zero,
 * più eventuali genitori futuri passati in `extraParents`.
 */
export function buildWazaLabBulletin(
  items: WazaLabBulletinItem[],
  extraParents: Array<{ family: 'do' | 'madosho' | 'generiche'; label: string }> = [],
): WazaLabBulletin {
  const buckets = new Map<
    string,
    {
      family: WazaCatalogFamily
      label: string
      parentId: string
      parentLabel: string
      counts: WazaLabBulletinCounts
    }
  >()

  const ensure = (
    family: WazaCatalogFamily,
    parentId: string,
    parentLabel: string,
  ): WazaLabBulletinCounts => {
    const key = `${family}::${parentId}`
    let row = buckets.get(key)
    if (!row) {
      row = {
        family,
        label: WAZA_CATALOG_FAMILY_LABELS[family],
        parentId,
        parentLabel,
        counts: emptyCounts(),
      }
      buckets.set(key, row)
    }
    return row.counts
  }

  for (const styleId of STYLE_HEX_ORDER) {
    ensure('do', `do-${styleId}`, STYLE_LABELS[styleId as StyleId])
  }
  for (const m of MADOSHO_CATALOG) {
    ensure('madosho', `madosho-${m.id}`, m.name)
  }
  ensure('generiche', 'generiche', WAZA_CATALOG_FAMILY_LABELS.generiche)

  for (const extra of extraParents) {
    const id =
      extra.family === 'do'
        ? `do-gen:${extra.label}`
        : extra.family === 'madosho'
          ? `madosho-gen:${extra.label}`
          : `generiche-gen:${extra.label}`
    ensure(extra.family, id, extra.label)
  }

  for (const item of items) {
    const family = resolveWazaCatalogFamily({
      styleId: item.styleId,
      madoshoId: item.madoshoId,
      description: item.description,
      name: item.name,
      poolId: item.poolId,
    })
    const parent = parentKeyForItem(item, family)
    addItem(ensure(family, parent.id, parent.label), item)
  }

  const familyOrder: WazaCatalogFamily[] = ['do', 'madosho', 'ordine', 'generiche', 'oni-no-mori']
  const families: WazaLabBulletinFamily[] = []

  for (const family of familyOrder) {
    const parents = [...buckets.values()]
      .filter((b) => b.family === family)
      .map((b) => ({
        id: b.parentId,
        label: b.parentLabel,
        counts: b.counts,
      }))
      .sort((a, b) => {
        if (family === 'do') {
          const order = STYLE_HEX_ORDER.map((s) => `do-${s}`)
          const ai = order.indexOf(a.id as (typeof order)[number])
          const bi = order.indexOf(b.id as (typeof order)[number])
          if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
        }
        if (family === 'madosho') {
          const order = MADOSHO_CATALOG.map((m) => `madosho-${m.id}`)
          const ai = order.indexOf(a.id as (typeof order)[number])
          const bi = order.indexOf(b.id as (typeof order)[number])
          if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
        }
        return a.label.localeCompare(b.label, 'it')
      })

    if (parents.length === 0) continue
    const familyCounts = sumCounts(parents.map((p) => p.counts))
    if (
      familyCounts.total === 0 &&
      family !== 'do' &&
      family !== 'madosho' &&
      family !== 'generiche'
    ) {
      continue
    }

    families.push({
      family,
      label: WAZA_CATALOG_FAMILY_LABELS[family],
      counts: familyCounts,
      parents,
    })
  }

  return {
    generatedAt: new Date().toISOString(),
    totals: sumCounts(families.map((f) => f.counts)),
    families,
  }
}

export function formatBulletinLine(counts: WazaLabBulletinCounts): string {
  const parts = [
    `Tot ${counts.total}`,
    `Pass ${counts.passive}`,
    `T1 ${counts.t1}`,
    `T2 ${counts.t2}`,
    `T3 ${counts.t3}`,
    `T4 ${counts.t4}`,
    `T5 ${counts.t5}`,
  ]
  if (counts.other > 0) parts.push(`? ${counts.other}`)
  return parts.join(' · ')
}
