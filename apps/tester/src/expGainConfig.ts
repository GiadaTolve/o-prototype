/**
 * Configurazione EXP Gain — modalità "crociera"
 *
 * - 1 EXP ogni 500 caratteri totali mandati in chat
 * - 1 azione = messaggio con >500 caratteri totali
 * - Esempio: 6 azioni × 1000 char = 12 EXP/giocata
 * - Exp-cap giornaliero: 100 EXP
 * - Simulazione giocatore maturo: 3 sere/settimana × 24 EXP = 72 EXP/settimana
 */

export const EXP_PER_500_CHARS = 1
export const CHARS_FOR_1_EXP = 500
export const DAILY_EXP_CAP = 100
export const EXAMPLE_CHARS_PER_ACTION = 1000
export const EXAMPLE_ACTIONS_PER_GAME = 6
export const EXAMPLE_EXP_PER_GAME = 12
export const EXAMPLE_GAMES_PER_WEEK = 3
export const EXAMPLE_EXP_PER_WEEK = 36

/**
 * Calcola EXP guadagnata da caratteri totali (pre-cap).
 * Formula: floor(chars / 500) EXP
 */
export function expFromChars(chars: number): number {
  return Math.floor(chars / CHARS_FOR_1_EXP)
}

/**
 * Applica il cap giornaliero.
 */
export function applyDailyCap(expGained: number, alreadyGainedToday: number = 0): number {
  const remaining = Math.max(0, DAILY_EXP_CAP - alreadyGainedToday)
  return Math.min(expGained, remaining)
}
