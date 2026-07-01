import {
  STYLE_HEX_ORDER,
  STYLE_LABELS,
  isStyleId,
  styleIdFromSkillDescription,
  type StyleId,
} from './style-hexagon'

export type WazaStyleGroup<T> = {
  styleId: StyleId | 'other'
  label: string
  items: T[]
}

export function resolveWazaStyleId(skill: {
  styleId?: string | null
  description?: string | null
}): StyleId | null {
  if (skill.styleId && isStyleId(skill.styleId)) return skill.styleId
  return styleIdFromSkillDescription(skill.description)
}

/** Ordina passiva prima di attiva, poi per nome. */
export function sortWazaByKindAndName<T>(
  items: T[],
  opts: {
    isPassive: (item: T) => boolean
    getName: (item: T) => string
  },
): T[] {
  return [...items].sort((a, b) => {
    const pa = opts.isPassive(a) ? 0 : 1
    const pb = opts.isPassive(b) ? 0 : 1
    if (pa !== pb) return pa - pb
    return opts.getName(a).localeCompare(opts.getName(b), 'it')
  })
}

/** Keystone in cima; sotto passiva → attiva (esclusa la keystone dalla lista). */
export function layoutCatalogWazaList<T>(
  items: T[],
  opts: {
    isPassive: (item: T) => boolean
    getName: (item: T) => string
    getPoolId: (item: T) => string | null | undefined
    keystonePoolId?: string | null
  },
): { keystone: T | null; list: T[] } {
  let keystone: T | null = null
  const others: T[] = []
  for (const item of items) {
    if (opts.keystonePoolId && opts.getPoolId(item) === opts.keystonePoolId) {
      keystone = item
    } else {
      others.push(item)
    }
  }
  return {
    keystone,
    list: sortWazaByKindAndName(others, {
      isPassive: opts.isPassive,
      getName: opts.getName,
    }),
  }
}

/** Raggruppa waza per Via (Esagono), ordine Tōka → … → Hadō; non mappate in «Altro». */
export function groupWazaByStyle<T>(
  items: T[],
  resolveStyle: (item: T) => StyleId | null,
): WazaStyleGroup<T>[] {
  const buckets = new Map<StyleId | 'other', T[]>()

  for (const item of items) {
    const sid = resolveStyle(item)
    const key: StyleId | 'other' = sid ?? 'other'
    const list = buckets.get(key) ?? []
    list.push(item)
    buckets.set(key, list)
  }

  const groups: WazaStyleGroup<T>[] = []

  for (const styleId of STYLE_HEX_ORDER) {
    const list = buckets.get(styleId)
    if (!list?.length) continue
    groups.push({ styleId, label: STYLE_LABELS[styleId], items: list })
    buckets.delete(styleId)
  }

  const other = buckets.get('other')
  if (other?.length) {
    groups.push({ styleId: 'other', label: 'Altro', items: other })
  }

  return groups
}
