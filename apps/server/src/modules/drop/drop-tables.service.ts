import {
  DROP_POOL_JUNK_IDS,
  DROP_TABLES,
  type DropPoolCategory,
  type DropTableDef,
  rollDropTableJunkFromDefs,
} from '@domain/economy'
import { eq } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { economyDropPools, economyDropTables } from '../../db/schema'

export type DropTablesRuntime = {
  tables: readonly DropTableDef[]
  pools: Readonly<Record<string, readonly string[]>>
}

let runtimeCache: DropTablesRuntime | null = null

export function invalidateDropTablesCache() {
  runtimeCache = null
}

function domainFallback(): DropTablesRuntime {
  return { tables: DROP_TABLES, pools: DROP_POOL_JUNK_IDS }
}

export async function getDropTablesRuntime(): Promise<DropTablesRuntime> {
  if (runtimeCache) return runtimeCache

  const [tableRows, poolRows] = await Promise.all([
    db.query.economyDropTables.findMany(),
    db.query.economyDropPools.findMany(),
  ])

  if (tableRows.length === 0 || poolRows.length === 0) {
    runtimeCache = domainFallback()
    return runtimeCache
  }

  const pools = { ...DROP_POOL_JUNK_IDS } as Record<string, readonly string[]>
  for (const row of poolRows) {
    pools[row.id] = row.junkCatalogKeys ?? []
  }

  const tables: DropTableDef[] = tableRows.map((row) => ({
    id: row.id,
    label: row.label,
    entries: (row.entries ?? []).map((e) => ({
      pool: e.pool as DropPoolCategory,
      weight: e.weight,
    })),
  }))

  runtimeCache = { tables, pools }
  return runtimeCache
}

export async function rollDropTableJunkRuntime(
  tableId: string,
  rng: () => number = Math.random,
): Promise<string | null> {
  const { tables, pools } = await getDropTablesRuntime()
  return rollDropTableJunkFromDefs(tables, pools, tableId, rng)
}

export async function listDropTablesAdmin() {
  const [tableRows, poolRows] = await Promise.all([
    db.query.economyDropTables.findMany(),
    db.query.economyDropPools.findMany(),
  ])

  if (tableRows.length === 0 && poolRows.length === 0) {
    const fallback = domainFallback()
    return {
      tables: fallback.tables.map((t) => ({
        id: t.id,
        label: t.label,
        entries: t.entries.map((e) => ({ pool: e.pool, weight: e.weight })),
      })),
      pools: Object.entries(fallback.pools).map(([id, junkCatalogKeys]) => ({
        id,
        junkCatalogKeys: [...junkCatalogKeys],
      })),
    }
  }

  return {
    tables: tableRows.map((t) => ({
      id: t.id,
      label: t.label,
      entries: (t.entries ?? []).map((e) => ({ pool: e.pool, weight: e.weight })),
    })),
    pools: poolRows.map((p) => ({
      id: p.id,
      junkCatalogKeys: [...(p.junkCatalogKeys ?? [])],
    })),
  }
}

export async function upsertDropTable(
  id: string,
  label: string,
  entries: Array<{ pool: string; weight: number }>,
) {
  const normalizedId = id.trim().toLowerCase()
  if (!normalizedId) throw new Error('ID tabella obbligatorio.')
  if (!label.trim()) throw new Error('Etichetta obbligatoria.')
  if (!entries.length) throw new Error('Almeno una voce nella tabella.')

  const existing = await db.query.economyDropTables.findFirst({
    where: eq(economyDropTables.id, normalizedId),
  })

  const values = {
    label: label.trim(),
    entries,
    updatedAt: new Date(),
  }

  if (existing) {
    await db.update(economyDropTables).set(values).where(eq(economyDropTables.id, normalizedId))
  } else {
    await db.insert(economyDropTables).values({ id: normalizedId, ...values })
  }

  invalidateDropTablesCache()
  return { id: normalizedId, ...values }
}

export async function upsertDropPool(id: string, junkCatalogKeys: string[]) {
  const normalizedId = id.trim().toLowerCase()
  if (!normalizedId) throw new Error('ID pool obbligatorio.')

  const existing = await db.query.economyDropPools.findFirst({
    where: eq(economyDropPools.id, normalizedId),
  })

  const values = {
    junkCatalogKeys: junkCatalogKeys.map((k) => k.trim()).filter(Boolean),
    updatedAt: new Date(),
  }

  if (existing) {
    await db.update(economyDropPools).set(values).where(eq(economyDropPools.id, normalizedId))
  } else {
    await db.insert(economyDropPools).values({ id: normalizedId, ...values })
  }

  invalidateDropTablesCache()
  return { id: normalizedId, ...values }
}

export async function seedDropTablesFromDomain() {
  for (const [poolId, keys] of Object.entries(DROP_POOL_JUNK_IDS)) {
    await upsertDropPool(poolId, [...keys])
  }
  for (const table of DROP_TABLES) {
    await upsertDropTable(
      table.id,
      table.label,
      table.entries.map((e) => ({ pool: e.pool, weight: e.weight })),
    )
  }
}
