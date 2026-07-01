/** Tensione (緊張) — Itō-dō §3.3: fili attivi sul campo aumentano pressione e rischio di snap. */

export const TENSIONE_STYLE_ID = 'ito' as const
/** Massimo fili controllabili senza esubero (§3.3 Itō-dō). */
export const TENSIONE_MAX = 8
/** A 8 fili: rischio snap (coincide con il cap). */
export const TENSIONE_SNAP_THRESHOLD = 8
export const TENSIONE_RELEASE_CS = 1
export const TENSIONE_IR_BONUS_PER_STACK = 1

export type TensioneState = {
  /** Livello efficace 0–8 (IR, UI barra). */
  level: number
  /** Valore salvato — può superare 8 (esubero). */
  rawLevel: number
  /** Punti oltre il cap 8 (→ Emorragia). */
  overflow: number
  atCap: boolean
  snapRisk: boolean
  styleId: typeof TENSIONE_STYLE_ID
  irBonus: number
}

export function clampTensione(level: number): number {
  return Math.max(0, Math.min(TENSIONE_MAX, Math.floor(level)))
}

export function tensioneOverflowPoints(rawLevel: number): number {
  return Math.max(0, Math.floor(rawLevel) - TENSIONE_MAX)
}

/** Stack Emorragia da applicare per punti di esubero appena guadagnati. */
export function emorragiaStacksFromTensioneOverflow(overflowPointsAdded: number): number {
  return Math.max(0, Math.floor(overflowPointsAdded))
}

export function overflowDeltaOnTensioneIncrease(beforeRaw: number, afterRaw: number): number {
  return Math.max(0, tensioneOverflowPoints(afterRaw) - tensioneOverflowPoints(beforeRaw))
}

export function resolveTensioneState(rawLevel: number): TensioneState {
  const raw = Math.max(0, Math.floor(rawLevel))
  const level = clampTensione(raw)
  const overflow = tensioneOverflowPoints(raw)
  return {
    level,
    rawLevel: raw,
    overflow,
    atCap: raw >= TENSIONE_MAX,
    snapRisk: level >= TENSIONE_SNAP_THRESHOLD,
    styleId: TENSIONE_STYLE_ID,
    irBonus: level * TENSIONE_IR_BONUS_PER_STACK,
  }
}

/** +1 tensione per filo/waza Itō dichiarata; +2 se controllo multiplo nello stesso turno. */
export function accumulateTensioneRaw(currentRaw: number, threadsUsed = 1): number {
  return Math.max(0, Math.floor(currentRaw) + Math.max(1, threadsUsed))
}

/** @deprecated Usare accumulateTensioneRaw — mantiene cap 8 per compat. */
export function accumulateTensione(current: number, threadsUsed = 1): number {
  return clampTensione(accumulateTensioneRaw(current, threadsUsed))
}

export function releaseTensione(currentRaw: number, amount = 2): number {
  return Math.max(0, Math.floor(currentRaw) - Math.max(1, amount))
}

export function applyTensioneIrBonus(baseIr: number, rawLevel: number): number {
  return Math.floor(baseIr) + clampTensione(rawLevel) * TENSIONE_IR_BONUS_PER_STACK
}

/** Fine turno: −1 se non hai usato fili Itō nel turno. */
export function tickTensioneDecay(currentRaw: number, usedItoWazaThisTurn: boolean): number {
  if (usedItoWazaThisTurn) return Math.max(0, Math.floor(currentRaw))
  return Math.max(0, Math.floor(currentRaw) - 1)
}

export function formatTensioneTag(rawLevel: number): string {
  const state = resolveTensioneState(rawLevel)
  if (state.overflow > 0) {
    return `[Tensione:${state.level}+${state.overflow}]`
  }
  return `[Tensione:${state.level}]`
}

export type TensioneAccumulateResult = {
  rawLevel: number
  overflowAdded: number
  emorragiaStacks: number
}

export function processTensioneManualAccumulate(
  currentRaw: number,
  threadsUsed: 1 | 2 = 1,
): TensioneAccumulateResult {
  const before = Math.max(0, Math.floor(currentRaw))
  const after = accumulateTensioneRaw(before, threadsUsed)
  const overflowAdded = overflowDeltaOnTensioneIncrease(before, after)
  return {
    rawLevel: after,
    overflowAdded,
    emorragiaStacks: emorragiaStacksFromTensioneOverflow(overflowAdded),
  }
}

export type TensioneEndOfTurnResult = {
  rawLevel: number
  decayed: number
  skippedDecay: boolean
}

export function processTensioneEndOfTurn(
  currentRaw: number,
  usedItoThisTurn: boolean,
): TensioneEndOfTurnResult {
  const before = Math.max(0, Math.floor(currentRaw))
  const after = tickTensioneDecay(before, usedItoThisTurn)
  return {
    rawLevel: after,
    decayed: Math.max(0, before - after),
    skippedDecay: usedItoThisTurn,
  }
}
