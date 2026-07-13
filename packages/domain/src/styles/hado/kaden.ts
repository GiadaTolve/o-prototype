/** Kaden (荷電) — Hadō-dō: carica da CS trattenuto / vicino a Overheat. */

export const KADEN_STYLE_ID = 'hado' as const
export const KADEN_METAMORPHOSIS_CS = 12
export const KADEN_MAX = 15
export const KADEN_VENT_AMOUNT = 4

export type KadenState = {
  pressure: number
  metamorphosisReady: boolean
  overheatBand: boolean
  styleId: typeof KADEN_STYLE_ID
  damageBonusPercent: number
}

export function clampKaden(pressure: number): number {
  return Math.max(0, Math.min(KADEN_MAX, Math.floor(pressure)))
}

export function resolveKadenState(pressure: number, currentCs = 0): KadenState {
  const p = clampKaden(pressure)
  return {
    pressure: p,
    metamorphosisReady: currentCs >= KADEN_METAMORPHOSIS_CS,
    overheatBand: p >= KADEN_MAX - 2,
    styleId: KADEN_STYLE_ID,
    damageBonusPercent: Math.min(30, p * 2),
  }
}

/** +1 kaden per CS non speso a fine turno; +2 se CS ≥ 12. */
export function accumulateKaden(current: number, csHeld: number): number {
  let gain = csHeld > 0 ? 1 : 0
  if (csHeld >= KADEN_METAMORPHOSIS_CS) gain += 1
  return clampKaden(current + gain)
}

export function ventKaden(current: number, amount = KADEN_VENT_AMOUNT): number {
  return clampKaden(current - amount)
}

export function applyKadenDamageBonus(baseDamage: number, pressure: number): number {
  const state = resolveKadenState(pressure)
  const mult = 1 + state.damageBonusPercent / 100
  return Math.floor(baseDamage * mult)
}
