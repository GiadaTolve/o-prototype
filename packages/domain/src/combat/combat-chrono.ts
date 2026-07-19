import type { StatusCombatModifiers } from './status/types'
import {
  CS_CAPACITY,
  applyTurnChronoGain,
  createChronoStackState,
  isOverheated,
  overheatDamagePerTurn,
  resolveChronoStackEndOfTurn,
  type ChronoStackState,
} from './chrono-stack'

/** Stato CS persistito sul personaggio (combattimento live). */
export type StoredChronoStackState = ChronoStackState & {
  /** Accumulo dichiarato (Tenkan / Corona aperta). */
  accumulating: boolean
}

export type CombatChronoVitals = {
  csCurrent: number
  csCapacity: number
  accumulating: boolean
  overheatTurns: number
  skipNextTurn: boolean
  isOverheated: boolean
  overheatDamagePerTurn: number
  stacksOverCapacity: number
}

const DEFAULT_STORED: StoredChronoStackState = {
  current: 0,
  accumulating: false,
  overheatTurns: 0,
  skipNextTurn: false,
}

export function createStoredChronoStackState(initial = 0): StoredChronoStackState {
  return { ...createChronoStackState(initial), accumulating: false }
}

export function normalizeStoredChronoStackState(
  raw: Partial<StoredChronoStackState> | null | undefined,
): StoredChronoStackState {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_STORED }
  return {
    current: Math.max(0, Math.round(Number(raw.current) || 0)),
    accumulating: Boolean(raw.accumulating),
    overheatTurns: Math.max(0, Math.round(Number(raw.overheatTurns) || 0)),
    skipNextTurn: Boolean(raw.skipNextTurn),
  }
}

export function toCombatChronoVitals(state: StoredChronoStackState): CombatChronoVitals {
  const current = Math.max(0, state.current)
  return {
    csCurrent: current,
    csCapacity: CS_CAPACITY,
    accumulating: state.accumulating,
    overheatTurns: state.overheatTurns,
    skipNextTurn: state.skipNextTurn,
    isOverheated: isOverheated(current),
    overheatDamagePerTurn: overheatDamagePerTurn(current),
    stacksOverCapacity: Math.max(0, current - CS_CAPACITY),
  }
}

/** Apre la Corona: inizia accumulo automatico CS. */
export function beginTenkanAccumulation(state: StoredChronoStackState): StoredChronoStackState {
  if (state.accumulating) return state
  return { ...state, accumulating: true }
}

/** Chiude la Corona (Tenkan: Off). */
export function endTenkanAccumulation(state: StoredChronoStackState): StoredChronoStackState {
  if (!state.accumulating) return state
  return { ...state, accumulating: false }
}

export type ProcessChronoChatMessageResult = {
  state: StoredChronoStackState
  csGained: number
  overheatHpDamage: number
  defatigueApplied: boolean
  tenkanOpened: boolean
  tenkanClosed: boolean
  turnApplied: boolean
  changed: boolean
}

/**
 * Elabora un messaggio chat per Tenkan ON/OFF e guadagno CS automatico a turno.
 * Ogni azione ≥500 caratteri con accumulo attivo → +3 (+ bonus status) + fine turno Overheat.
 */
export function processChronoChatMessage(
  state: StoredChronoStackState,
  content: string,
  totalChars: number,
  modifiers: Pick<StatusCombatModifiers, 'blockCsGain' | 'bonusCsPerTurn'>,
  options: {
    detectTenkanOn: (text: string) => boolean
    detectTenkanOff: (text: string) => boolean
    isQualifyingAction: (chars: number, text: string) => boolean
  },
): ProcessChronoChatMessageResult {
  let next = state
  let tenkanOpened = false
  let tenkanClosed = false
  let turnApplied = false
  let csGained = 0
  let overheatHpDamage = 0
  let defatigueApplied = false

  if (options.detectTenkanOff(content)) {
    if (next.accumulating) {
      next = endTenkanAccumulation(next)
      tenkanClosed = true
    }
    return {
      state: next,
      csGained: 0,
      overheatHpDamage: 0,
      defatigueApplied: false,
      tenkanOpened,
      tenkanClosed,
      turnApplied: false,
      changed: tenkanClosed,
    }
  }

  if (options.detectTenkanOn(content) && !next.accumulating) {
    next = beginTenkanAccumulation(next)
    tenkanOpened = true
  }

  if (next.accumulating && options.isQualifyingAction(totalChars, content)) {
    const tick = processChronoEndOfTurn(next, modifiers)
    next = tick.state
    csGained = tick.csGained
    overheatHpDamage = tick.overheatHpDamage
    defatigueApplied = tick.defatigueApplied
    turnApplied = true
  }

  return {
    state: next,
    csGained,
    overheatHpDamage,
    defatigueApplied,
    tenkanOpened,
    tenkanClosed,
    turnApplied,
    changed: tenkanOpened || tenkanClosed || turnApplied,
  }
}

export type ChronoTurnTickResult = {
  state: StoredChronoStackState
  csGained: number
  overheatHpDamage: number
  defatigueApplied: boolean
}

function chronoCore(state: StoredChronoStackState): ChronoStackState {
  return {
    current: state.current,
    overheatTurns: state.overheatTurns,
    skipNextTurn: state.skipNextTurn,
  }
}

/** Fine turno: guadagno CS (+3 se accumulo), Overheat tracking, Defaticamento. */
export function processChronoEndOfTurn(
  state: StoredChronoStackState,
  modifiers: Pick<StatusCombatModifiers, 'blockCsGain' | 'bonusCsPerTurn'>,
): ChronoTurnTickResult {
  const before = state.current
  let next = state

  if (state.accumulating && !modifiers.blockCsGain) {
    const gained = applyTurnChronoGain(chronoCore(next), {
      accumulatingDeclared: true,
      bonusCs: modifiers.bonusCsPerTurn,
    })
    next = { ...next, ...gained }
  }

  const beforeResolve = next.overheatTurns
  const resolved = resolveChronoStackEndOfTurn(chronoCore(next))
  next = { ...next, ...resolved }
  const defatigueApplied =
    resolved.skipNextTurn && !state.skipNextTurn && beforeResolve >= 1

  return {
    state: next,
    csGained: Math.max(0, next.current - before),
    overheatHpDamage: overheatDamagePerTurn(before),
    defatigueApplied,
  }
}

export type ChronoHitTakenResult = {
  state: StoredChronoStackState
  csGained: number
}

/** Colpo a segno subito: +1 CS al difensore (se accumulo attivo). */
export function processChronoHitTaken(
  state: StoredChronoStackState,
  modifiers: Pick<StatusCombatModifiers, 'blockCsGain'>,
): ChronoHitTakenResult {
  if (!state.accumulating || modifiers.blockCsGain) {
    return { state, csGained: 0 }
  }
  const before = state.current
  const gained = applyTurnChronoGain(chronoCore(state), {
    accumulatingDeclared: false,
    successfulHitTaken: true,
  })
  const next = { ...state, ...gained }
  return { state: next, csGained: Math.max(0, next.current - before) }
}

/** Consuma flag salta-turno (inizio turno difensore). */
export function consumeChronoSkipTurn(state: StoredChronoStackState): StoredChronoStackState {
  if (!state.skipNextTurn) return state
  return { ...state, skipNextTurn: false }
}

/** Master / Tulpa: ± CS (non scende sotto 0). */
export function applyCombatCsDelta(
  state: StoredChronoStackState,
  delta: number,
): StoredChronoStackState {
  const next = Math.max(0, Math.round(state.current + (Number(delta) || 0)))
  if (next === state.current) return state
  return { ...state, current: next }
}

/** Master / Tulpa: imposta CS assoluto. */
export function setCombatCsCurrent(
  state: StoredChronoStackState,
  value: number,
): StoredChronoStackState {
  const next = Math.max(0, Math.round(Number(value) || 0))
  if (next === state.current) return state
  return { ...state, current: next }
}
