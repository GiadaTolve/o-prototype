/** Junkan (循環) — Naikan-dō: circolazione Jigoka tra camere corporee / alleati. */

import { getSkiruPoints } from '../../skiru/progression'
import { SKIRU_ID_ITAMI } from '../../skiru/derived-stats'
import type { SkiruSheet } from '../../skiru/types'

export const JUNKAN_STYLE_ID = 'naikan' as const
export const JUNKAN_MAX_PHASE = 3
export const JUNKAN_SUPPORT_BONUS_PERCENT = 10

/** Bun simultanei sul corpo (unità Junkan) — capacità base. */
export const JUNKAN_BUN_BASE = 3

export type JunkanPhase = 0 | 1 | 2 | 3

export type JunkanState = {
  phase: JunkanPhase
  styleId: typeof JUNKAN_STYLE_ID
  supportBonusPercent: number
  canTransfer: boolean
}

export function clampJunkanPhase(phase: number): JunkanPhase {
  const p = Math.max(0, Math.min(JUNKAN_MAX_PHASE, Math.floor(phase)))
  return p as JunkanPhase
}

export function resolveJunkanState(phase: number): JunkanState {
  const p = clampJunkanPhase(phase)
  return {
    phase: p,
    styleId: JUNKAN_STYLE_ID,
    supportBonusPercent: p * JUNKAN_SUPPORT_BONUS_PERCENT,
    canTransfer: p >= 2,
  }
}

/** Avanza fase a fine turno se ha supportato un alleato o assorbito danno. */
export function advanceJunkanPhase(current: number, supportedAllyThisTurn: boolean): JunkanPhase {
  if (!supportedAllyThisTurn) return clampJunkanPhase(current)
  return clampJunkanPhase(current + 1)
}

export function resetJunkanCycle(): JunkanPhase {
  return 0
}

/** Capacità di Junkan = 3 + Itami (Bun simultanei sul corpo). */
export function resolveJunkanBunCapacity(sheet: SkiruSheet): number {
  const itami = getSkiruPoints(sheet, SKIRU_ID_ITAMI)
  return JUNKAN_BUN_BASE + itami
}
