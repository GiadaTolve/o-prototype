/**
 * Chronostack (CS) — UltimateManual §2.2
 * Il tempo (4/4) non è tracciato dal software: i giocatori lo gestiscono in autonomia.
 */

/** Capacità naturale senza ripercussioni (Overheat oltre questa soglia). */
export const CS_CAPACITY = 20

/** CS guadagnate a turno con accumulo dichiarato attivo (dal turno d'iniziativa). */
export const CS_PER_TURN = 3

/** CS extra al difensore per ogni colpo subito con successo. */
export const CS_PER_HIT_TAKEN = 1

/** PV persi per ogni stack oltre CS_CAPACITY, per turno in Overheat. */
export const OVERHEAT_PV_PER_STACK = 2

/** Turni massimi consecutivi in Overheat prima del Defaticamento (−50% stack). */
export const OVERHEAT_MAX_TURNS = 3

/**
 * Limite waza per turno in base al costo CS più alto usato nello stesso turno.
 * Costi 1–2: nessun limite aggiuntivo (solo il tempo narrato 4/4).
 */
export const WAZA_TURN_LIMITS: readonly { minCost: number; maxWaza: number }[] = [
  { minCost: 20, maxWaza: 1 },
  { minCost: 10, maxWaza: 2 },
  { minCost: 5, maxWaza: 2 },
  { minCost: 3, maxWaza: 3 },
] as const

export interface ChronoStackState {
  /** Pool CS corrente (può superare 20). */
  current: number
  /** Turni consecutivi trascorsi con stack > CS_CAPACITY. */
  overheatTurns: number
  /** Dopo Defaticamento: il personaggio salta il prossimo turno. */
  skipNextTurn: boolean
}

export function createChronoStackState(initial = 0): ChronoStackState {
  return {
    current: Math.max(0, initial),
    overheatTurns: 0,
    skipNextTurn: false,
  }
}

export function stacksOverCapacity(current: number, capacity = CS_CAPACITY): number {
  return Math.max(0, current - capacity)
}

export function isOverheated(current: number, capacity = CS_CAPACITY): boolean {
  return current > capacity
}

/** Danno PV da Overheat in un turno: 2 PV per stack oltre 20. */
export function overheatDamagePerTurn(current: number, capacity = CS_CAPACITY): number {
  return stacksOverCapacity(current, capacity) * OVERHEAT_PV_PER_STACK
}

/** Aggiunge CS al pool (non scende sotto 0). */
export function addChronoStack(state: ChronoStackState, amount: number): ChronoStackState {
  if (amount <= 0) return state
  return { ...state, current: state.current + amount }
}

/** Spende CS; restituisce null se insufficienti. */
export function spendChronoStack(state: ChronoStackState, amount: number): ChronoStackState | null {
  if (amount <= 0) return state
  if (state.current < amount) return null
  return { ...state, current: state.current - amount }
}

export interface TurnGainOptions {
  /** L'accumulo è stato dichiarato in azione (narrativo). */
  accumulatingDeclared: boolean
  /** Ha subito almeno un colpo con successo nel turno. */
  successfulHitTaken?: boolean
  /** Bonus/malus da Skiru o Waza (somma algebrica). */
  bonusCs?: number
}

/** Guadagno CS a inizio/fine turno (§ Guadagnare Chronostack). */
export function applyTurnChronoGain(
  state: ChronoStackState,
  options: TurnGainOptions,
): ChronoStackState {
  let next = state
  if (options.accumulatingDeclared) {
    next = addChronoStack(next, CS_PER_TURN)
  }
  if (options.successfulHitTaken) {
    next = addChronoStack(next, CS_PER_HIT_TAKEN)
  }
  const bonus = options.bonusCs ?? 0
  if (bonus > 0) next = addChronoStack(next, bonus)
  if (bonus < 0) {
    next = { ...next, current: Math.max(0, next.current + bonus) }
  }
  return next
}

/**
 * Fine turno: traccia Overheat e applica Defaticamento se necessario.
 * Defaticamento: metà CS (per difetto), salta il turno successivo, reset contatore Overheat.
 * Scatta al termine del 3° turno consecutivo sopra CS_CAPACITY.
 */
export function resolveChronoStackEndOfTurn(state: ChronoStackState): ChronoStackState {
  if (!isOverheated(state.current)) {
    return { ...state, overheatTurns: 0 }
  }

  const overheatTurns = state.overheatTurns + 1
  if (overheatTurns < OVERHEAT_MAX_TURNS) {
    return { ...state, overheatTurns }
  }

  return {
    current: Math.floor(state.current / 2),
    overheatTurns: 0,
    skipNextTurn: true,
  }
}

/** Consuma il flag «salta turno» del Defaticamento. */
export function consumeSkipTurn(state: ChronoStackState): ChronoStackState {
  if (!state.skipNextTurn) return state
  return { ...state, skipNextTurn: false }
}

/**
 * Limite waza nel turno in base al costo CS più alto già impiegato.
 * `null` = nessun limite aggiuntivo (solo costi 1–2 CS).
 */
export function maxWazaPerTurnFromCosts(costsThisTurn: readonly number[]): number | null {
  if (costsThisTurn.length === 0) return null
  const maxCost = Math.max(...costsThisTurn)
  if (maxCost <= 2) return null
  for (const row of WAZA_TURN_LIMITS) {
    if (maxCost >= row.minCost) return row.maxWaza
  }
  return null
}

/** Verifica se si può lanciare un'altra waza nel turno (conteggio + costo nuovo). */
export function canUseWazaThisTurn(
  costsAlreadyUsed: readonly number[],
  nextWazaCost: number,
): boolean {
  const allCosts = [...costsAlreadyUsed, nextWazaCost]
  const limit = maxWazaPerTurnFromCosts(allCosts)
  if (limit == null) return true
  return allCosts.length <= limit
}

export interface ChronoValidationResult {
  ok: boolean
  errors: string[]
}

export function validateWazaTurnUsage(costsThisTurn: readonly number[]): ChronoValidationResult {
  const limit = maxWazaPerTurnFromCosts(costsThisTurn)
  if (limit == null || costsThisTurn.length <= limit) {
    return { ok: true, errors: [] }
  }
  const maxCost = Math.max(...costsThisTurn)
  return {
    ok: false,
    errors: [
      `Limite waza per turno superato: costo CS massimo ${maxCost} consente al massimo ${limit} waza, usate ${costsThisTurn.length}.`,
    ],
  }
}
