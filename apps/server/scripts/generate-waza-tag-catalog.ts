/**
 * Genera catalogo lookup tag [waza:Nome] da wazaPool (Oyasumi_Manuale_Completo.pdf).
 * Esegui da apps/server:
 *   bun run scripts/generate-waza-tag-catalog.ts
 */
import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { WAZA_POOL, type WazaDef } from '../../../apps/tester/src/wazaPool'
import {
  styleIdForWazaBranch,
  type WazaTagCatalogEntry,
} from '../../../packages/domain/src/combat/waza-tag-preview.ts'

function defaultRank(w: WazaDef, isPassive: boolean): string | null {
  if (isPassive) return null
  const cs = w.costCs ?? 0
  if (cs <= 1) return 'T1'
  if (cs <= 3) return 'T2'
  if (cs <= 5) return 'T3'
  return 'T4'
}

function catalogDescription(w: WazaDef): string | undefined {
  const raw = (w.description || w.effect || '').trim()
  if (!raw) return undefined
  return raw.length > 500 ? `${raw.slice(0, 497)}…` : raw
}

const entries: WazaTagCatalogEntry[] = WAZA_POOL.map((w) => ({
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
