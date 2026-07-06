import type { SocialBlueprintDef, SocialSubclassSheet } from './types'

export type PactLeverage = 'formale' | 'popolare' | 'sotterranea' | 'neutro'
export type PactStatus = 'active' | 'spent' | 'expired'

export function isPoliticoPactTemplate(blueprint: SocialBlueprintDef): boolean {
  return blueprint.classId === 'seijika' && blueprint.kind === 'pact_template'
}

export function inferAllowedLeverages(sheet: SocialSubclassSheet): readonly PactLeverage[] {
  if (sheet['seijika-kuromaku']) {
    return ['formale', 'popolare', 'sotterranea', 'neutro'] as const
  }
  const out: PactLeverage[] = ['neutro']
  if (sheet['seijika-meishi']) out.push('formale')
  if (sheet['seijika-senseki']) out.push('popolare')
  if (sheet['seijika-kagenui']) out.push('sotterranea')
  return out
}

export interface PactCreateLimits {
  maxWeight: number
  maxActive: number
  activeCount: number
}

export interface PactCreateCheck {
  ok: boolean
  reason?: string
}

export function validateNewPact(
  blueprint: SocialBlueprintDef,
  limits: PactCreateLimits,
  leverage: PactLeverage,
  allowedLeverages: readonly PactLeverage[],
): PactCreateCheck {
  if (!isPoliticoPactTemplate(blueprint)) {
    return { ok: false, reason: 'Modello Patto non valido.' }
  }
  const weight = blueprint.weightOrPower ?? 0
  if (weight <= 0) {
    return { ok: false, reason: 'Patto senza peso definito.' }
  }
  if (weight > limits.maxWeight) {
    return { ok: false, reason: `Peso ${weight} oltre il tuo limite (${limits.maxWeight}).` }
  }
  if (limits.activeCount >= limits.maxActive) {
    return { ok: false, reason: `Hai già ${limits.maxActive} Patti attivi (massimo).` }
  }
  if (!allowedLeverages.includes(leverage)) {
    return { ok: false, reason: 'Leva non disponibile con le tue sottoclassi.' }
  }
  return { ok: true }
}

export function leverageLabel(leverage: PactLeverage): string {
  switch (leverage) {
    case 'formale':
      return 'Formale'
    case 'popolare':
      return 'Popolare'
    case 'sotterranea':
      return 'Sotterranea'
    default:
      return 'Neutro'
  }
}
