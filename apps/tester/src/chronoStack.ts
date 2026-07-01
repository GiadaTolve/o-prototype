/**
 * @deprecated Importare da `@domain/combat/chrono-stack`.
 * Re-export per compatibilità col tester.
 */
export {
  CS_CAPACITY,
  CS_PER_TURN,
  CS_PER_HIT_TAKEN,
  OVERHEAT_PV_PER_STACK,
  overheatDamagePerTurn,
  isOverheated,
  stacksOverCapacity,
} from '@domain/combat/chrono-stack'

/**
 * @deprecated Usare WAZA_TURN_LIMITS e maxWazaPerTurnFromCosts in @domain/combat.
 * Tabella aggiornata a v3 (UltimateManual §2.2): 1–2 cs nessun limite; rimossi slot 1cs/2cs separati.
 */
export const CS_MOVE_LIMITS: { cost: number; max: number }[] = [
  { cost: 3, max: 3 },
  { cost: 5, max: 2 },
  { cost: 10, max: 2 },
  { cost: 20, max: 1 },
]
