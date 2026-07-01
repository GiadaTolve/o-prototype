/**
 * Pool Skiru — vista tester allineata al catalogo domain.
 * Fonte canonica: packages/domain/src/skiru/catalog.ts (non sovrascrivere questo file).
 */

export type { SkiruCategory } from './skiruCategories'
export { SKIRU_CATEGORY_LABELS, SKIRU_CATEGORY_ORDER } from './skiruCategories'

import { SKIRU_CATALOG, SKIRU_BRANCHES } from '@domain/skiru/catalog'
import type { SkiruDef as DomainSkiruDef } from '@domain/skiru/types'

/** Path relativo repo — destinazione per nuove voci Skiru. */
export const CANONICAL_SKIRU_CATALOG_PATH = 'packages/domain/src/skiru/catalog.ts'

/** Alias `category` = branchId per compat UI tester legacy. */
export type SkiruDef = DomainSkiruDef & { category: string }

export const SKIRU_POOL: SkiruDef[] = SKIRU_CATALOG.map((s) => ({
  ...s,
  category: s.branchId,
}))

export function domainForSkiruBranch(branchId: string): DomainSkiruDef['domain'] {
  return SKIRU_BRANCHES.find((b) => b.id === branchId)?.domain ?? 'ten'
}
