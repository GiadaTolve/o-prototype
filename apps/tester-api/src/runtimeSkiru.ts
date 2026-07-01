import type { ContributionRow } from './catalog'

function asRow(r: unknown): ContributionRow | null {
  return r && typeof r === 'object' ? (r as ContributionRow) : null
}

function sortByCreatedAt(rows: ContributionRow[]): ContributionRow[] {
  return [...rows].sort((a, b) => String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? '')))
}

export function latestSkiruPoolSnapshot(rows: unknown[]): {
  hasSnapshot: boolean
  entries?: unknown[]
  contributionId?: string
  createdAt?: string
} {
  const list = sortByCreatedAt(rows.map(asRow).filter(Boolean) as ContributionRow[])
  for (let i = list.length - 1; i >= 0; i--) {
    const r = list[i]!
    if (r.type !== 'skiru_pool_snapshot' || !r.payload || typeof r.payload !== 'object') continue
    const e = (r.payload as Record<string, unknown>).entries
    if (Array.isArray(e) && e.length > 0) {
      return {
        hasSnapshot: true,
        entries: e,
        contributionId: r.id != null ? String(r.id) : undefined,
        createdAt: r.createdAt != null ? String(r.createdAt) : undefined,
      }
    }
  }
  return { hasSnapshot: false }
}

export function latestSkiruCategoriesSnapshot(rows: unknown[]): {
  hasSnapshot: boolean
  order?: string[]
  labels?: Record<string, string>
  contributionId?: string
  createdAt?: string
} {
  const list = sortByCreatedAt(rows.map(asRow).filter(Boolean) as ContributionRow[])
  for (let i = list.length - 1; i >= 0; i--) {
    const r = list[i]!
    if (r.type !== 'skiru_categories_snapshot' || !r.payload || typeof r.payload !== 'object') continue
    const p = r.payload as Record<string, unknown>
    const order = p.order
    const labels = p.labels
    if (Array.isArray(order) && order.length > 0 && labels && typeof labels === 'object' && labels !== null) {
      const lab: Record<string, string> = {}
      for (const [k, v] of Object.entries(labels as Record<string, unknown>)) {
        if (typeof v === 'string') lab[k] = v
      }
      return {
        hasSnapshot: true,
        order: order.filter((x): x is string => typeof x === 'string'),
        labels: lab,
        contributionId: r.id != null ? String(r.id) : undefined,
        createdAt: r.createdAt != null ? String(r.createdAt) : undefined,
      }
    }
  }
  return { hasSnapshot: false }
}
