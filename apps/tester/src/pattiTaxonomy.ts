/**
 * Patti (premio) — rami e sottocategorie.
 * Modificabile dal tester: Idee → Tassonomia Patti → Salva su disco.
 */

export const PATTI_RAMI_IDS = ['patto'] as const

export type PattiRamo = (typeof PATTI_RAMI_IDS)[number]

export const PATTI_RAMO_LABELS: Record<PattiRamo, string> = {
  patto: 'Patto base',
}

export interface PattiSubcategoryDef {
  id: string
  ramo: PattiRamo
  name: string
  description?: string
}

export const PATTI_SUBCATEGORIES: PattiSubcategoryDef[] = []
