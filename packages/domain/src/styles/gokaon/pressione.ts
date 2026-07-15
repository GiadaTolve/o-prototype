export const PRESSIONE_MAX = 12
export const PRESSIONE_THRESHOLDS = [2, 5, 9] as const

export type GokaonPressioneState = {
  stacks: number
  threshold1: boolean
  threshold2: boolean
  threshold3: boolean
  /** Metamorfosi attiva quando si raggiunge la soglia 1 (≥ 2 stack). */
  hasMetamorfosi: boolean
}

export function resolveGokaonPressioneState(stacks: number): GokaonPressioneState {
  const s = Math.max(0, Math.min(PRESSIONE_MAX, stacks))
  return {
    stacks: s,
    threshold1: s >= 2,
    threshold2: s >= 5,
    threshold3: s >= 9,
    hasMetamorfosi: s >= 2,
  }
}
