import { getSkiruDef, SKIRU_CATALOG } from './catalog'
import type { SkiruDef, SkiruDomain } from './types'
import { isWazaCategoriaPapabile, type WazaCategoriaPapabile } from './waza-categoria-papabile'

/** Shape di vocabolari.extra per categoria `skiru`. */
export type SkiruVocabExtra = {
  ramo?: string
  dominio?: string
  label?: string
  labelRomaji?: string
  parent?: string
  categoria_waza?: string
}

function isSkiruDomain(value: string): value is SkiruDomain {
  return value === 'ten' || value === 'chi' || value === 'jin'
}

/** Costruisce una SkiruDef minima da vocabolario quando il catalogo domain non è ancora deployato. */
export function skiruDefFromVocab(
  slug: string,
  extra: SkiruVocabExtra | null | undefined,
): SkiruDef | undefined {
  const existing = getSkiruDef(slug)
  if (existing) return existing

  const branchId = extra?.ramo?.trim()
  const domainRaw = extra?.dominio?.trim()
  if (!branchId || !domainRaw || !isSkiruDomain(domainRaw)) return undefined

  const categoriaRaw = extra?.categoria_waza
  const wazaCategoriaPapabile =
    typeof categoriaRaw === 'string' && isWazaCategoriaPapabile(categoriaRaw)
      ? (categoriaRaw as WazaCategoriaPapabile)
      : undefined

  return {
    id: slug,
    name: extra?.label?.trim() || slug,
    nameRomaji: extra?.labelRomaji?.trim() || undefined,
    domain: domainRaw,
    branchId,
    description: '',
    kind: 'standard',
    parentSkiruId: extra?.parent?.trim() || undefined,
    wazaCategoriaPapabile,
  }
}

/** Unisce catalogo domain e voci vocab attive (seed su Neon prima del redeploy client). */
export function mergeCatalogWithSkiruVocab(
  allowedSlugs: readonly string[],
  vocabEntries: ReadonlyArray<{ valore: string; extra?: Record<string, unknown> | null }>,
): SkiruDef[] {
  const byId = new Map(SKIRU_CATALOG.map((s) => [s.id, s]))

  for (const slug of allowedSlugs) {
    if (byId.has(slug)) continue
    const row = vocabEntries.find((v) => v.valore === slug)
    const def = skiruDefFromVocab(slug, row?.extra as SkiruVocabExtra | undefined)
    if (def) byId.set(slug, def)
  }

  return [...byId.values()]
}
