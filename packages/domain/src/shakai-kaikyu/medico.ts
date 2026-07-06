import type { SocialBlueprintDef } from './types'

/** Catalog key consumabile prodotto da ricetta medico. */
export function medicoBlueprintCatalogKey(blueprintId: string): string {
  return `prep-${blueprintId}`
}

export interface HealClampInput {
  requested: number
  budgetRemaining: number
  targetHpCurrent: number
  targetHpMax: number
}

export interface HealClampResult {
  applied: number
  budgetCost: number
}

/** Applica cura entro ferite mancanti e budget giornaliero. */
export function clampMedicoHeal(input: HealClampInput): HealClampResult {
  const requested = Math.max(0, Math.floor(input.requested))
  const budgetRemaining = Math.max(0, Math.floor(input.budgetRemaining))
  const missing = Math.max(0, Math.floor(input.targetHpMax) - Math.floor(input.targetHpCurrent))
  const applied = Math.min(requested, missing, budgetRemaining)
  return { applied, budgetCost: applied }
}

export function isMedicoCraftBlueprint(blueprint: SocialBlueprintDef): boolean {
  return blueprint.classId === 'ishi' && blueprint.kind === 'recipe' && blueprint.isProcedure !== true
}

export function medicoProcedureBudgetCost(blueprint: SocialBlueprintDef): number {
  if (blueprint.classId !== 'ishi' || blueprint.kind !== 'procedure') return 0
  return Math.max(0, blueprint.dailyBudgetCost ?? 0)
}
