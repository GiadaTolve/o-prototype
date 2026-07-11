/**
 * Limite Gosa — numero massimo di costrutti simultanei sostenibili.
 * Regola globale sul creatore: 2 + punti Seimitsu.
 */

export const GOSA_CONSTRUCT_BASE_SLOTS = 2

export function calculateGosaMaxSimultaneousConstructs(seimitsuPoints: number): number {
  return GOSA_CONSTRUCT_BASE_SLOTS + Math.max(0, Math.floor(seimitsuPoints))
}

export function isWithinGosaConstructLimit(
  activeConstructCount: number,
  seimitsuPoints: number,
): boolean {
  return activeConstructCount < calculateGosaMaxSimultaneousConstructs(seimitsuPoints)
}
