/**
 * Genera catalogo lookup tag [waza:Nome] da wazaPool (Oyasumi_Manuale_Completo.pdf).
 * Esegui da apps/server:
 *   bun run scripts/generate-waza-tag-catalog.ts
 */
import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { WAZA_POOL } from '../../../apps/tester/src/wazaPool'
import { MADOSHO_WAZA_POOL } from '../../../apps/tester/src/pools/madosho-waza-pool'
import {
  styleIdForWazaBranch,
  type WazaTagCatalogEntry,
} from '../../../packages/domain/src/combat/waza-tag-preview.ts'

type PoolEntry = { id: string; name: string; type: string; branch: string; costCs?: number; description?: string; effect?: string }

function defaultRank(w: PoolEntry, isPassive: boolean): string | null {
  if (isPassive) return null
  const cs = w.costCs ?? 0
  if (cs <= 2) return 'T1'
  if (cs <= 4) return 'T2'
  if (cs <= 6) return 'T3'
  if (cs <= 8) return 'T4'
  return 'T5'
}

function catalogDescription(w: PoolEntry): string | undefined {
  const raw = (w.description || w.effect || '').trim()
  if (!raw) return undefined
  return raw.length > 500 ? `${raw.slice(0, 497)}…` : raw
}

const ALL_POOL: PoolEntry[] = [...(WAZA_POOL as unknown as PoolEntry[]), ...(MADOSHO_WAZA_POOL as unknown as PoolEntry[])]

const entries: WazaTagCatalogEntry[] = ALL_POOL.map((w) => ({
  name: w.name.trim(),
  rank: defaultRank(w, w.type === 'passive'),
  styleId: styleIdForWazaBranch(w.branch),
  isPassive: w.type === 'passive',
  description: catalogDescription(w),
  poolId: w.id,
  effect: w.effect?.trim() || undefined,
})).filter((e) => e.name.length > 0)

const outPath = resolve(
  process.cwd(),
  '../../packages/domain/src/combat/waza-tag-catalog.generated.ts',
)

const body = `/** Auto-generated — non modificare a mano. Fonte: wazaPool + Oyasumi_Manuale_Completo.pdf */
import type { WazaTagCatalogEntry } from './waza-tag-preview.ts'

export const WAZA_TAG_CATALOG: readonly WazaTagCatalogEntry[] = ${JSON.stringify(entries, null, 2)} as const
`

writeFileSync(outPath, body, 'utf8')
console.log(`[Waza Tag Catalog] ${entries.length} voci → ${outPath}`)
