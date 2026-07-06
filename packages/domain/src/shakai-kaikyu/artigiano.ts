import type { SocialBlueprintDef } from './types'

/** Catalog key oggetto prodotto da progetto artigiano. */
export function artigianoProjectCatalogKey(blueprintId: string): string {
  return `proj-${blueprintId}`
}

export interface IntegrityRepairClampInput {
  requested: number
  budgetRemaining: number
  integrityCurrent: number
  integrityMax: number
}

export interface IntegrityRepairClampResult {
  applied: number
  budgetCost: number
}

/** Riparazione: 1 pt budget = 1 pt integrità ripristinata. */
export function clampIntegrityRepair(input: IntegrityRepairClampInput): IntegrityRepairClampResult {
  const requested = Math.max(0, Math.floor(input.requested))
  const budgetRemaining = Math.max(0, Math.floor(input.budgetRemaining))
  const current = Math.max(0, Math.floor(input.integrityCurrent))
  const max = Math.max(0, Math.floor(input.integrityMax))
  const missing = Math.max(0, max - current)
  const applied = Math.min(requested, missing, budgetRemaining)
  return { applied, budgetCost: applied }
}

export function isArtigianoCraftBlueprint(blueprint: SocialBlueprintDef): boolean {
  return blueprint.classId === 'shokunin' && blueprint.kind === 'project'
}

export function artigianoProcedureIntegrityCost(blueprint: SocialBlueprintDef): number {
  if (blueprint.classId !== 'shokunin' || blueprint.kind !== 'procedure') return 0
  return Math.max(0, blueprint.dailyBudgetCost ?? 0)
}

export function inferArtigianoProjectOutput(blueprint: SocialBlueprintDef): {
  category: 'equipaggiamento' | 'costrutto_materiale' | 'consumabile'
  integrityMax: number | null
} {
  const text = `${blueprint.name} ${blueprint.description}`
  const intMatch = blueprint.description.match(/Integrità\s+(\d+)/i)
  if (intMatch) {
    return { category: 'equipaggiamento', integrityMax: parseInt(intMatch[1], 10) }
  }
  if (/trappola|serratura|grimaldello|balestra/i.test(text)) {
    return { category: 'costrutto_materiale', integrityMax: 5 }
  }
  if (/Kaen-bin|Molotov|torcia|contenitore|rammendo|consumabile/i.test(text)) {
    return { category: 'consumabile', integrityMax: null }
  }
  return { category: 'costrutto_materiale', integrityMax: 10 }
}

export function canRepairInventoryItem(input: {
  category: string
  integrityCurrent: number | null | undefined
  integrityMax: number | null | undefined
  isEquipped: boolean
}): { ok: boolean; reason?: string } {
  if (input.category !== 'equipaggiamento' && input.category !== 'costrutto_materiale') {
    return { ok: false, reason: 'Solo equipaggiamento e costrutti materiali sono riparabili.' }
  }
  if (input.isEquipped) {
    return { ok: false, reason: 'Smonta prima l\'oggetto equipaggiato.' }
  }
  const max = input.integrityMax ?? 0
  const current = input.integrityCurrent ?? max
  if (max <= 0) return { ok: false, reason: 'Oggetto senza integrità.' }
  if (current >= max) return { ok: false, reason: 'Integrità già al massimo.' }
  return { ok: true }
}
