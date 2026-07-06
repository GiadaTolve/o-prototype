import type { SocialBlueprintDef, SocialMaterialId } from './types'

export interface GatherMaterialYield {
  readonly materialId: SocialMaterialId
  readonly quantity: number
}

/** Resa materiali per traccia/gather — vedi `SHAKAI_KAIKYU_TOOLS_BLUEPRINTS.md`. */
export const CACCIATORE_GATHER_YIELDS: Readonly<Record<string, readonly GatherMaterialYield[]>> = {
  'cacciatore-selvaggina-minuta': [{ materialId: 'carne', quantity: 1 }],
  'cacciatore-erbe-campo': [{ materialId: 'erba_comune', quantity: 1 }],
  'cacciatore-legname': [{ materialId: 'legno', quantity: 1 }],
  'cacciatore-acqua-pulita': [],
  'cacciatore-grossa-selvaggina': [
    { materialId: 'carne_pregiata', quantity: 2 },
    { materialId: 'cuoio', quantity: 1 },
  ],
  'cacciatore-predatore': [
    { materialId: 'carne_pregiata', quantity: 1 },
    { materialId: 'cuoio', quantity: 2 },
    { materialId: 'trofeo', quantity: 1 },
  ],
  'cacciatore-abbattimento-commissione': [{ materialId: 'trofeo', quantity: 1 }],
  'cacciatore-erba-rara': [{ materialId: 'erba_rara', quantity: 1 }],
  'cacciatore-residuo-onirico': [{ materialId: 'frammento_onirico', quantity: 1 }],
  'cacciatore-ricognizione': [],
  'cacciatore-recupero': [],
  'cacciatore-linea-trappole': [{ materialId: 'carne', quantity: 3 }],
  'cacciatore-sentiero-sicuro': [],
  'cacciatore-nascondiglio': [],
  'cacciatore-preda-leggendaria': [
    { materialId: 'trofeo_maggiore', quantity: 1 },
    { materialId: 'carne_pregiata', quantity: 2 },
  ],
}

export function isCacciatoreGatherBlueprint(blueprint: SocialBlueprintDef): boolean {
  return blueprint.classId === 'ryoshi' && blueprint.kind === 'gather'
}

export function resolveGatherYields(blueprintId: string): readonly GatherMaterialYield[] {
  return CACCIATORE_GATHER_YIELDS[blueprintId] ?? []
}

export function gatherBudgetCost(blueprint: SocialBlueprintDef): number {
  return Math.max(0, blueprint.gatherUnits ?? 0)
}

export interface GatherBudgetCheck {
  ok: boolean
  reason?: string
  cost: number
}

export function canSpendGatherBudget(
  blueprint: SocialBlueprintDef,
  budgetRemaining: number,
): GatherBudgetCheck {
  const cost = gatherBudgetCost(blueprint)
  if (cost <= 0) return { ok: false, reason: 'Traccia senza costo Raccolta.', cost: 0 }
  if (budgetRemaining < cost) {
    return {
      ok: false,
      reason: `Servono ${cost} unità Raccolta (disponibili: ${budgetRemaining}).`,
      cost,
    }
  }
  return { ok: true, cost }
}

export function formatGatherYieldsPreview(blueprintId: string): string {
  const yields = resolveGatherYields(blueprintId)
  if (yields.length === 0) return 'Effetto narrativo'
  return yields.map((y) => `${y.quantity}× ${y.materialId.replace(/_/g, ' ')}`).join(', ')
}
