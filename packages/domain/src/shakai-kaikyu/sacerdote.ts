import type { SocialBlueprintDef, SocialSubclassSheet } from './types'

export type OfudaStatus = 'active' | 'consumed'

/** Catalog key consumabile Ofuda prodotto da rito sacerdote. */
export function sacerdoteOfudaCatalogKey(blueprintId: string): string {
  return `ofuda-${blueprintId}`
}

export function isSacerdoteRiteBlueprint(blueprint: SocialBlueprintDef): boolean {
  return blueprint.classId === 'shisai' && blueprint.kind === 'rite'
}

export interface OfudaCraftLimits {
  maxPower: number
  maxActive: number
  activeCount: number
}

export interface OfudaCheck {
  ok: boolean
  reason?: string
}

export function requiresConsecratedPlaceForCraft(sheet: SocialSubclassSheet): boolean {
  return sheet['shisai-jareiba'] === true && sheet['shisai-yumetoki'] !== true
}

export function hasYumetokiPath(sheet: SocialSubclassSheet): boolean {
  return sheet['shisai-yumetoki'] === true
}

export function validateCraftOfuda(
  blueprint: SocialBlueprintDef,
  limits: OfudaCraftLimits,
  options: { consecratedPlace?: boolean; subclassSheet: SocialSubclassSheet },
): OfudaCheck {
  if (!isSacerdoteRiteBlueprint(blueprint)) {
    return { ok: false, reason: 'Rito non valido.' }
  }
  const power = blueprint.weightOrPower ?? 0
  if (power <= 0) {
    return { ok: false, reason: 'Ofuda senza Potere definito.' }
  }
  if (power > limits.maxPower) {
    return { ok: false, reason: `Potere ${power} oltre il tuo limite (${limits.maxPower}).` }
  }
  if (requiresConsecratedPlaceForCraft(options.subclassSheet) && !options.consecratedPlace) {
    return { ok: false, reason: 'Il sentiero Jareiba richiede un luogo consacrato per fabbricare Ofuda.' }
  }
  return { ok: true }
}

export function validateActivateOfuda(
  power: number,
  limits: OfudaCraftLimits,
): OfudaCheck {
  if (power > limits.maxPower) {
    return { ok: false, reason: `Potere ${power} oltre il tuo limite (${limits.maxPower}).` }
  }
  if (limits.activeCount >= limits.maxActive) {
    return { ok: false, reason: `Hai già ${limits.maxActive} Ofuda attivi (massimo).` }
  }
  return { ok: true }
}
