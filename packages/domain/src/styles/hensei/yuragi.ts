/** Yuragi (揺らぎ) — Hensei-dō: oscillazione consistenza → parità IR al cambio. */

export const YURAGI_STYLE_ID = 'hensei' as const
export const YURAGI_IR_PARITY_BONUS = 2

export const YURAGI_PHASES = ['neutro', 'solido', 'fluido', 'gassoso'] as const
export type YuragiPhase = (typeof YURAGI_PHASES)[number]

export type YuragiState = {
  phase: YuragiPhase
  styleId: typeof YURAGI_STYLE_ID
  /** Bonus IR se la prossima waza cambia consistenza rispetto all'ultima. */
  parityIrBonus: number
  lastConsistency?: string
}

export function isYuragiPhase(value: string): value is YuragiPhase {
  return (YURAGI_PHASES as readonly string[]).includes(value)
}

export function resolveYuragiState(phase: string, lastConsistency?: string): YuragiState {
  const p = isYuragiPhase(phase) ? phase : 'neutro'
  return {
    phase: p,
    styleId: YURAGI_STYLE_ID,
    parityIrBonus: p === 'neutro' ? 0 : YURAGI_IR_PARITY_BONUS,
    lastConsistency,
  }
}

/** Se consistenza dichiarata differisce dall'ultima, applica bonus parità. */
export function applyYuragiParityIr(
  baseIr: number,
  declaredConsistency: string,
  lastConsistency: string | undefined,
): { ir: number; shifted: boolean; newLast: string } {
  const shifted =
    !!lastConsistency &&
    lastConsistency.trim().toLowerCase() !== declaredConsistency.trim().toLowerCase()
  const bonus = shifted ? YURAGI_IR_PARITY_BONUS : 0
  return {
    ir: Math.floor(baseIr) + bonus,
    shifted,
    newLast: declaredConsistency,
  }
}

export function nextYuragiPhase(current: YuragiPhase, newConsistency: string): YuragiPhase {
  const c = newConsistency.toLowerCase()
  if (c.includes('solid')) return 'solido'
  if (c.includes('liqu') || c.includes('fluid')) return 'fluido'
  if (c.includes('gass')) return 'gassoso'
  return current === 'neutro' ? 'solido' : 'neutro'
}
