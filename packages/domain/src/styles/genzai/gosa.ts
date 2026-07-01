/**
 * Meccanica Gosa (誤差) — Genzai-dō §3.2
 * Margine d'Errore: imprecisione narrativa nella materializzazione accumula penalità
 * su IR e resistenza costrutti finché non viene corretta.
 */

import { CONSTRUCT_SIZE_IDS, type ConstructSizeId } from '../../combat/constructs'

function isConstructSizeId(value: string): value is ConstructSizeId {
  return (CONSTRUCT_SIZE_IDS as readonly string[]).includes(value)
}

export const GOSA_STYLE_ID = 'genzai' as const
export const GOSA_MAX_STACKS = 5
/** CS spesi per azzerare 1 stack (correzione del sigillo). */
export const GOSA_CORRECTION_CS_PER_STACK = 1
/** Penalità IR per stack Gosa sulla prossima materializzazione. */
export const GOSA_IR_PENALTY_PER_STACK = 1
/** Riduzione % resistenza costrutto per stack (cumulativa). */
export const GOSA_RESISTANCE_PENALTY_PERCENT_PER_STACK = 5

export type GosaAccumulationInput = {
  /** Descrizione narrativa del costrutto/sigillo in chat. */
  descriptionChars: number
  wazaTier: number
  size?: ConstructSizeId | string
  /** Nuovo costrutto sul campo (non riuso forma memorizzata). */
  isNewForm?: boolean
}

export type GosaState = {
  stacks: number
  atCap: boolean
  styleId: typeof GOSA_STYLE_ID
  irPenalty: number
  resistancePenaltyPercent: number
}

export type GosaCorrectionResult = {
  stacksBefore: number
  stacksAfter: number
  csSpent: number
}

export function clampGosaStacks(stacks: number): number {
  return Math.max(0, Math.min(GOSA_MAX_STACKS, Math.floor(stacks)))
}

export function resolveGosaState(stacks: number): GosaState {
  const s = clampGosaStacks(stacks)
  return {
    stacks: s,
    atCap: s >= GOSA_MAX_STACKS,
    styleId: GOSA_STYLE_ID,
    irPenalty: s * GOSA_IR_PENALTY_PER_STACK,
    resistancePenaltyPercent: s * GOSA_RESISTANCE_PENALTY_PERCENT_PER_STACK,
  }
}

/** Soglia minima caratteri descrizione per tier (sotto soglia → +1 Gosa). */
export function gosaDescriptionThresholdForTier(tier: number): number {
  const t = Math.max(1, Math.min(5, Math.floor(tier)))
  return 40 + (t - 1) * 25
}

/**
 * Gosa guadagnata creando un costrutto/sigillo.
 * Base +1; +1 se descrizione corta; +1 se taglia grande/enorme; +1 se forma nuova.
 */
export function accumulateGosaOnConstruct(
  currentStacks: number,
  input: GosaAccumulationInput,
): number {
  let gain = 1
  const tier = Math.max(1, Math.min(5, Math.floor(input.wazaTier)))
  const threshold = gosaDescriptionThresholdForTier(tier)
  if (input.descriptionChars < threshold) gain += 1
  const size = input.size && isConstructSizeId(input.size) ? input.size : 'media'
  if (size === 'grande' || size === 'enorme') gain += 1
  if (input.isNewForm) gain += 1
  return clampGosaStacks(currentStacks + gain)
}

/** Applica penalità Gosa all'IR calcolato (non scende sotto 0). */
export function applyGosaIrPenalty(baseIr: number, stacks: number): number {
  const penalty = clampGosaStacks(stacks) * GOSA_IR_PENALTY_PER_STACK
  return Math.max(0, Math.floor(baseIr) - penalty)
}

/** Riduce resistenza costrutto per Gosa attiva. */
export function applyGosaResistancePenalty(baseResistance: number, stacks: number): number {
  const state = resolveGosaState(stacks)
  if (state.resistancePenaltyPercent <= 0) return Math.max(0, Math.floor(baseResistance))
  const mult = 1 - state.resistancePenaltyPercent / 100
  return Math.max(0, Math.floor(baseResistance * mult))
}

/** Correzione: spende CS per rimuovere stack (default 1 CS → -1 stack). */
export function correctGosaStacks(
  currentStacks: number,
  csAvailable: number,
  stacksToClear = 1,
): GosaCorrectionResult | null {
  const stacks = clampGosaStacks(currentStacks)
  if (stacks <= 0) {
    return { stacksBefore: 0, stacksAfter: 0, csSpent: 0 }
  }
  const clear = Math.max(1, Math.floor(stacksToClear))
  const csNeeded = clear * GOSA_CORRECTION_CS_PER_STACK
  if (csAvailable < csNeeded) return null
  const stacksAfter = clampGosaStacks(stacks - clear)
  return {
    stacksBefore: stacks,
    stacksAfter,
    csSpent: csNeeded,
  }
}

/** Tick fine turno: Gosa decade di 1 se non si materializza (opzionale narrativo). */
export function tickGosaDecay(currentStacks: number, materializedThisTurn: boolean): number {
  if (materializedThisTurn || currentStacks <= 0) return clampGosaStacks(currentStacks)
  return clampGosaStacks(currentStacks - 1)
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

/** Tag chat [Gosa:N] o [誤差:N]. */
export function formatGosaTagsInText(text: string): string {
  return text.replace(
    /\[(Gosa|誤差):(\d+)\]/gi,
    (_full, _label: string, nStr: string) => {
      const n = clampGosaStacks(Number(nStr))
      const state = resolveGosaState(n)
      return `<span class="gosa-tag" title="Gosa §3.2 — IR −${state.irPenalty}, resistenza −${state.resistancePenaltyPercent}%">Gosa ${n}</span>`
    },
  )
}
