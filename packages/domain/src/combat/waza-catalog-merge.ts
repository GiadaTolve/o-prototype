import type { WazaTagCatalogEntry } from './waza-tag-preview'

export type WazaDbAuthoringRow = {
  poolId: string
  name?: string | null
  description?: string | null
  effect?: string | null
  rank?: string | null
  isPassive?: boolean | null
  styleId?: string | null
  launchSkiruIds?: string[] | null
}

function normalizeLaunchSkiruIds(ids: string[] | null | undefined): string[] | undefined {
  if (!ids?.length) return undefined
  const out = [...new Set(ids.map((id) => id.trim().toLowerCase()).filter(Boolean))]
  return out.length > 0 ? out : undefined
}

/** Applica override DB su una voce catalogo (per poolId). */
export function applyWazaDbOverride(
  base: WazaTagCatalogEntry,
  row: WazaDbAuthoringRow,
): WazaTagCatalogEntry {
  const launchSkiruIds =
    normalizeLaunchSkiruIds(row.launchSkiruIds) ?? base.launchSkiruIds

  return {
    ...base,
    name: row.name?.trim() || base.name,
    description:
      row.description != null && row.description.trim() !== ''
        ? row.description.trim()
        : base.description,
    effect:
      row.effect != null && row.effect.trim() !== '' ? row.effect.trim() : base.effect,
    rank: row.rank?.trim() || base.rank,
    isPassive: row.isPassive ?? base.isPassive,
    styleId: (row.styleId as WazaTagCatalogEntry['styleId']) ?? base.styleId,
    launchSkiruIds,
  }
}

/**
 * Unisce catalogo generato (wazaPool) con righe skills DB.
 * Le voci DB senza corrispondenza nel catalogo vengono aggiunte in coda.
 */
export function mergeWazaTagCatalog(
  baseCatalog: readonly WazaTagCatalogEntry[],
  dbRows: readonly WazaDbAuthoringRow[],
): WazaTagCatalogEntry[] {
  const byPoolId = new Map<string, WazaDbAuthoringRow>()
  for (const row of dbRows) {
    const pid = row.poolId?.trim()
    if (!pid) continue
    byPoolId.set(pid, row)
  }

  const merged = baseCatalog.map((entry) => {
    const pid = entry.poolId?.trim()
    if (!pid) return { ...entry }
    const row = byPoolId.get(pid)
    if (!row) return { ...entry }
    byPoolId.delete(pid)
    return applyWazaDbOverride(entry, row)
  })

  for (const row of byPoolId.values()) {
    const pid = row.poolId.trim()
    if (!pid) continue
    merged.push({
      name: row.name?.trim() || pid,
      rank: row.rank?.trim() || null,
      styleId: (row.styleId as WazaTagCatalogEntry['styleId']) ?? null,
      isPassive: row.isPassive ?? false,
      description: row.description?.trim() || undefined,
      poolId: pid,
      effect: row.effect?.trim() || undefined,
      launchSkiruIds: normalizeLaunchSkiruIds(row.launchSkiruIds),
    })
  }

  return merged
}
