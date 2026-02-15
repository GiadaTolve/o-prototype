/**
 * Sistema Chrono Stack [cs] — costanti e calcoli
 */

/** Capacità naturale di carica (senza Overheat) */
export const CS_CAPACITY = 20

/** Stack ottenute a turno (dal turno d'iniziativa) */
export const CS_PER_TURN = 3

/** Stack ottenute per ogni colpo a segno subito (al difensore) */
export const CS_PER_HIT_TAKEN = 1

/** Limiti massimi di mosse per costo [cs] */
export const CS_MOVE_LIMITS: { cost: number; max: number }[] = [
  { cost: 1, max: 5 },
  { cost: 2, max: 4 },
  { cost: 3, max: 3 },
  { cost: 5, max: 3 },
  { cost: 10, max: 2 },
  { cost: 20, max: 1 },
]

/**
 * Calcola il danno Overheat per turno.
 * Ogni stack oltre la capacità viene sottratta ai PV.
 */
export function overheatDamagePerTurn(currentStacks: number, capacity: number = CS_CAPACITY): number {
  return Math.max(0, currentStacks - capacity)
}

/**
 * Verifica se si è in condizione Overheat.
 */
export function isOverheated(currentStacks: number, capacity: number = CS_CAPACITY): boolean {
  return currentStacks > capacity
}
