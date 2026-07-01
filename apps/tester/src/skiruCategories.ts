/**
 * Categorie Skiru — alias dei rami domain (UltimateManual §2.7).
 * Fonte canonica: packages/domain/src/skiru/catalog.ts
 */

import { SKIRU_BRANCHES } from '@domain/skiru/catalog'

export type SkiruCategory = string

export const SKIRU_CATEGORY_ORDER: string[] = SKIRU_BRANCHES.map((b) => b.id)

export const SKIRU_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  SKIRU_BRANCHES.map((b) => [b.id, b.label]),
)
