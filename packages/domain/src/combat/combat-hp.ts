export type CombatHpState = {
  hpCurrent: number
  hpMax: number
}

/** HP effettivo: null/undefined in DB = pieno (hpMax). */
export function resolveCombatHp(
  storedCurrent: number | null | undefined,
  hpMax: number,
): CombatHpState {
  const max = Math.max(0, hpMax)
  if (max <= 0) return { hpCurrent: 0, hpMax: 0 }
  const current =
    storedCurrent == null || !Number.isFinite(storedCurrent) ? max : storedCurrent
  return {
    hpCurrent: Math.max(0, Math.min(max, Math.round(current))),
    hpMax: max,
  }
}

/** Applica delta danno/cura e restituisce il nuovo valore da persistere. */
export function applyHpDelta(
  storedCurrent: number | null | undefined,
  hpMax: number,
  delta: number,
): number {
  const { hpCurrent } = resolveCombatHp(storedCurrent, hpMax)
  const { hpMax: max } = resolveCombatHp(storedCurrent, hpMax)
  return Math.max(0, Math.min(max, hpCurrent + Math.round(delta)))
}
