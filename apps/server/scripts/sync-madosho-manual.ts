/**
 * Sincronizza catalogo Madoshō da apps/tester madoshoPool (Parte IV PDF).
 * Esegui da apps/server:
 *   bun run scripts/add-skills-madosho-id-column.ts   (prima volta)
 *   bun run scripts/sync-madosho-manual.ts
 */
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '../../.env') })

import { eq } from 'drizzle-orm'
import { db } from '../src/plugins/db'
import { skills } from '../src/db/schema'
import { MADOSHO_POOL, type MadoshoDef } from '../../../apps/tester/src/madoshoPool'
import { SAMPLE_WAZA_STATS } from '../../../apps/tester/src/wazaPool'
import { MADOSHO_RAMO_LABELS, type MadoshoRamo } from '../../../apps/tester/src/madoshoTaxonomy'
import type { MadoshoId } from '@domain/progression/madosho'
import { resolveDefaultWazaCostExp } from '@domain/progression/waza-cost-exp'

type CatalogEntry = {
  poolId: string
  madoshoId: MadoshoId
  name: string
  isPassive: boolean
  description: string
  costExp: number
  costJigoka: number
  rank: string | null
}

function poolCostJigoka(w: MadoshoDef): number {
  if (typeof w.costJigo === 'function') {
    try {
      return w.costJigo(SAMPLE_WAZA_STATS)
    } catch {
      return 0
    }
  }
  return 0
}

function defaultRank(w: MadoshoDef): string | null {
  if (w.type === 'passive') return null
  const cs = w.costCs ?? 0
  if (cs <= 1) return 'T1'
  if (cs <= 3) return 'T2'
  if (cs <= 5) return 'T3'
  if (cs <= 6) return 'T4'
  return 'T5'
}

function formatDescription(ramo: MadoshoRamo, isPassive: boolean, body: string): string {
  const label = MADOSHO_RAMO_LABELS[ramo]
  const kind = isPassive ? 'Passiva lignaggio' : 'Waza attiva lignaggio'
  return `[${label} · ${kind}]\n\n${body}`
}

function poolDescription(w: MadoshoDef): string {
  const parts = [w.description?.trim(), w.effect?.trim()].filter(Boolean)
  return formatDescription(w.branch, w.type === 'passive', parts.join('\n\n'))
}

function buildPoolEntries(): CatalogEntry[] {
  return MADOSHO_POOL.map((w) => {
    const isPassive = w.type === 'passive'
    const rank = defaultRank(w)
    return {
      poolId: w.id,
      madoshoId: w.branch as MadoshoId,
      name: w.name,
      isPassive,
      description: poolDescription(w),
      costExp: resolveDefaultWazaCostExp({ isPassive, rank }),
      costJigoka: poolCostJigoka(w),
      rank,
    }
  })
}

async function upsertEntry(entry: CatalogEntry) {
  const existing = await db.query.skills.findFirst({
    where: eq(skills.poolId, entry.poolId),
    columns: { id: true },
  })

  const values = {
    name: entry.name,
    description: entry.description,
    type: 'WAZA' as const,
    costExp: entry.costExp,
    costKeys: 0,
    costJigoka: entry.costJigoka,
    rank: entry.rank,
    isPassive: entry.isPassive,
    poolId: entry.poolId,
    styleId: null,
    madoshoId: entry.madoshoId,
  }

  if (existing) {
    await db.update(skills).set(values).where(eq(skills.id, existing.id))
    return 'updated'
  }

  await db.insert(skills).values(values)
  return 'inserted'
}

async function main() {
  const entries = buildPoolEntries()
  let inserted = 0
  let updated = 0

  for (const entry of entries) {
    const result = await upsertEntry(entry)
    if (result === 'inserted') inserted++
    else updated++
  }

  console.log(`✓ Madoshō sync: ${entries.length} waza (${inserted} insert, ${updated} update)`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
