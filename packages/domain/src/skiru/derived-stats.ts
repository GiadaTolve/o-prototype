import { getSkiruPoints } from './progression'
import type { SkiruSheet } from './types'

/** Parametri derivati da Skiru (UltimateManual). */
export interface SkiruDerivedStats {
  /** HP massimi: 20 + 5 × (Dokusei + Konjou) */
  hpMax: number
  /** Riduzione danno in percentuale (0–30): 3% × Itami */
  mitigationPercent: number
  /** Metri per quarto: 2 + 1,5 × Undō */
  movementMetersPerQuarter: number
  /** Danno corpo a corpo: 1 × Bakuryoku */
  cac: number
  /** Danno colpo a distanza (armi bianche e da fuoco): 1 × Seimitsu */
  cad: number
}

export const DERIVED_HP_BASE = 20
export const DERIVED_HP_PER_POINT = 5
export const DERIVED_MITIGATION_PER_ITAMI = 3
export const DERIVED_MITIGATION_CAP = 30
export const DERIVED_MOVEMENT_BASE = 2
export const DERIVED_MOVEMENT_PER_UNDO = 1.5

/** Skiru id nel catalogo (Nintai / Binshō). */
export const SKIRU_ID_DOKUSEI = 'dokusei'
export const SKIRU_ID_KONJOU = 'konjou'
export const SKIRU_ID_ITAMI = 'itami'
export const SKIRU_ID_UNDO = 'undo'
export const SKIRU_ID_BAKURYOKU = 'bakuryoku'
export const SKIRU_ID_SEIMITSU = 'seimitsu'

function roundMovement(value: number): number {
  return Math.round(value * 10) / 10
}

export function calculateHpMaxFromSkiru(sheet: SkiruSheet): number {
  const dokusei = getSkiruPoints(sheet, SKIRU_ID_DOKUSEI)
  const konjou = getSkiruPoints(sheet, SKIRU_ID_KONJOU)
  return DERIVED_HP_BASE + DERIVED_HP_PER_POINT * (dokusei + konjou)
}

/** Percentuale di mitigazione (0–30). */
export function calculateMitigationPercentFromSkiru(sheet: SkiruSheet): number {
  const itami = getSkiruPoints(sheet, SKIRU_ID_ITAMI)
  return Math.min(DERIVED_MITIGATION_CAP, DERIVED_MITIGATION_PER_ITAMI * itami)
}

/** Fattore moltiplicativo danno dopo mitigazione: 1 − mitigazione%. Es. Itami 10 → 0.7 */
export function mitigationDamageFactor(mitigationPercent: number): number {
  const capped = Math.max(0, Math.min(DERIVED_MITIGATION_CAP, mitigationPercent))
  return 1 - capped / 100
}

export function calculateMovementMetersPerQuarterFromSkiru(sheet: SkiruSheet): number {
  const undo = getSkiruPoints(sheet, SKIRU_ID_UNDO)
  return roundMovement(DERIVED_MOVEMENT_BASE + DERIVED_MOVEMENT_PER_UNDO * undo)
}

/** Danno corpo a corpo (CAC): 1 per punto Bakuryoku. */
export function calculateCacFromSkiru(sheet: SkiruSheet): number {
  return getSkiruPoints(sheet, SKIRU_ID_BAKURYOKU)
}

/** Danno colpo a distanza (CAD): 1 per punto Seimitsu. */
export function calculateCadFromSkiru(sheet: SkiruSheet): number {
  return getSkiruPoints(sheet, SKIRU_ID_SEIMITSU)
}

/** Calcola tutti i parametri derivati da una scheda Skiru. */
export function calculateSkiruDerivedStats(sheet: SkiruSheet): SkiruDerivedStats {
  const mitigationPercent = calculateMitigationPercentFromSkiru(sheet)
  return {
    hpMax: calculateHpMaxFromSkiru(sheet),
    mitigationPercent,
    movementMetersPerQuarter: calculateMovementMetersPerQuarterFromSkiru(sheet),
    cac: calculateCacFromSkiru(sheet),
    cad: calculateCadFromSkiru(sheet),
  }
}

/**
 * Applica mitigazione Itami al danno (post-Scudo).
 * Danno HP = danno × (1 − 0,03 × Itami)
 */
export function applyMitigationToDamage(
  baseDamage: number,
  sheet: SkiruSheet,
  extraMitigationPercent = 0,
): number {
  if (baseDamage <= 0) return 0
  const total = Math.min(30, calculateMitigationPercentFromSkiru(sheet) + extraMitigationPercent)
  const factor = 1 - total / 100
  return Math.max(0, Math.floor(baseDamage * factor))
}
