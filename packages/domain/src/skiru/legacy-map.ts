import { SKIRU_MAX_POINTS } from './progression'
import type { SkiruSheet } from './types'

/** Stats legacy F/C/D/M/E → Skiru di avvio (finché non c'è editor Skiru dedicato). */
export interface LegacyBaseStats {
  strength: number
  constitution: number
  dexterity: number
  mind: number
  empathy: number
}

function capSkiruPoints(value: number): number {
  return Math.max(0, Math.min(SKIRU_MAX_POINTS, Math.round(value)))
}

export function legacyStatsToSkiruSheet(stats: LegacyBaseStats): SkiruSheet {
  return {
    kairiki: capSkiruPoints(stats.strength),
    konjou: capSkiruPoints(stats.constitution),
    undo: capSkiruPoints(stats.dexterity),
    kansatsu: capSkiruPoints(stats.mind),
    'shintai-kokan': capSkiruPoints(stats.empathy),
  }
}

export function isSkiruSheetEmpty(sheet: SkiruSheet | null | undefined): boolean {
  if (!sheet) return true
  return Object.values(sheet).every((v) => !v || v <= 0)
}
