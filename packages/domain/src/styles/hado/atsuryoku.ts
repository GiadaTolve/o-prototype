/** Atsuryoku (圧力) — Hadō-dō §3.6: pressione da CS trattenuto / vicino a Overheat. */

export const ATSURYOKU_STYLE_ID = 'hado' as const
export const ATSURYOKU_METAMORPHOSIS_CS = 12
export const ATSURYOKU_MAX = 15
export const ATSURYOKU_VENT_AMOUNT = 4

export type AtsuryokuState = {
  pressure: number
  metamorphosisReady: boolean
  overheatBand: boolean
  styleId: typeof ATSURYOKU_STYLE_ID
  damageBonusPercent: number
}

export function clampAtsuryoku(pressure: number): number {
  return Math.max(0, Math.min(ATSURYOKU_MAX, Math.floor(pressure)))
}

export function resolveAtsuryokuState(pressure: number, currentCs = 0): AtsuryokuState {
  const p = clampAtsuryoku(pressure)
  return {
    pressure: p,
    metamorphosisReady: currentCs >= ATSURYOKU_METAMORPHOSIS_CS,
    overheatBand: p >= ATSURYOKU_MAX - 2,
    styleId: ATSURYOKU_STYLE_ID,
    damageBonusPercent: Math.min(30, p * 2),
  }
}

/** +1 pressione per CS non speso a fine turno; +2 se CS ≥ 12. */
export function accumulateAtsuryoku(current: number, csHeld: number): number {
  let gain = csHeld > 0 ? 1 : 0
  if (csHeld >= ATSURYOKU_METAMORPHOSIS_CS) gain += 1
  return clampAtsuryoku(current + gain)
}

export function ventAtsuryoku(current: number, amount = ATSURYOKU_VENT_AMOUNT): number {
  return clampAtsuryoku(current - amount)
}

export function applyAtsuryokuDamageBonus(baseDamage: number, pressure: number): number {
  const state = resolveAtsuryokuState(pressure)
  const mult = 1 + state.damageBonusPercent / 100
  return Math.floor(baseDamage * mult)
}
