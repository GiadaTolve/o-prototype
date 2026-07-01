import { getSkiruDef, SKIRU_CATALOG } from './catalog'
import { SOKAIJU_GATE_SKIRU_ID } from './sokaiju-index'
import type { SkiruSheet, SkiruValidationResult } from './types'

/** Affinità elementali sotto Gojū — mutuamente esclusive (max 1 attiva). */
export const GOJU_ELEMENTAL_SKIRU_IDS = [
  'goju-fuoco',
  'goju-fulmine',
  'goju-acqua',
  'goju-gravita',
  'goju-aria',
] as const

/** Tetto punti per singola Skiru (UltimateManual §2.7). */
export const SKIRU_MAX_POINTS = 10

/** Costo exp del primo punto acquistabile su un nodo. */
export const SKIRU_FIRST_POINT_EXP = 3

/**
 * Costo exp per acquistare il punto successivo.
 * Sequenza dal manuale: 3, 6, 12, 24, 48… (ogni incremento raddoppia).
 * @param currentPoints punti già posseduti (0–10)
 */
export function expCostForNextSkiruPoint(currentPoints: number): number | null {
  if (currentPoints < 0 || currentPoints >= SKIRU_MAX_POINTS) return null
  return SKIRU_FIRST_POINT_EXP * 2 ** currentPoints
}

/** Exp totale per portare una Skiru da 0 a `targetPoints`. */
export function totalExpForSkiruPoints(targetPoints: number): number {
  const capped = Math.max(0, Math.min(SKIRU_MAX_POINTS, targetPoints))
  let total = 0
  for (let p = 0; p < capped; p++) {
    const cost = expCostForNextSkiruPoint(p)
    if (cost != null) total += cost
  }
  return total
}

/** Exp per salire di un solo punto da `fromPoints` a `fromPoints + 1`. */
export function expCostToRaiseSkiru(fromPoints: number, by = 1): number | null {
  if (by < 1) return 0
  if (fromPoints + by > SKIRU_MAX_POINTS) return null
  let total = 0
  for (let i = 0; i < by; i++) {
    const cost = expCostForNextSkiruPoint(fromPoints + i)
    if (cost == null) return null
    total += cost
  }
  return total
}

export function getSkiruPoints(sheet: SkiruSheet, skiruId: string): number {
  return sheet[skiruId] ?? 0
}

export function getSkiruMaxPoints(skiruId: string): number {
  const def = getSkiruDef(skiruId)
  const raw = def?.maxPoints
  if (!Number.isInteger(raw) || (raw ?? 0) < 1) return SKIRU_MAX_POINTS
  return raw as number
}

/** true se il padre (se presente) ha abbastanza punti per sbloccare l'investimento. */
export function isSkiruParentUnlocked(sheet: SkiruSheet, skiruId: string): boolean {
  const def = getSkiruDef(skiruId)
  if (!def?.parentSkiruId) return true
  const min = def.minParentPoints ?? 1
  return getSkiruPoints(sheet, def.parentSkiruId) >= min
}

/** true se il Terzo Occhio (Tenkan accademica) è in scheda — prerequisito Sōkaiju. */
export function isSokaijuGateOpen(sheet: SkiruSheet): boolean {
  return getSkiruPoints(sheet, SOKAIJU_GATE_SKIRU_ID) >= 1
}

/** Messaggio UI se il nodo è bloccato dal prerequisito padre. */
export function getSkiruParentUnlockMessage(sheet: SkiruSheet, skiruId: string): string | null {
  if (isSkiruParentUnlocked(sheet, skiruId)) return null
  const def = getSkiruDef(skiruId)
  if (!def?.parentSkiruId) return null
  if (def.parentSkiruId === SOKAIJU_GATE_SKIRU_ID) {
    return 'Richiede Tenkan in scheda — l\'apertura accademica del Terzo Occhio.'
  }
  const parent = getSkiruDef(def.parentSkiruId)
  const min = def.minParentPoints ?? 1
  return `Richiede almeno ${min} punto/i in «${parent?.name ?? def.parentSkiruId}».`
}

export function totalSkiruPointsInvested(sheet: SkiruSheet): number {
  return Object.values(sheet).reduce((sum, n) => sum + n, 0)
}

export function countSkiruWithPoints(sheet: SkiruSheet, minPoints = 1): number {
  return SKIRU_CATALOG.filter((s) => getSkiruPoints(sheet, s.id) >= minPoints).length
}

/** Valida una scheda Skiru (anti-cheat lato server/domain). */
export function validateSkiruSheet(sheet: SkiruSheet): SkiruValidationResult {
  const errors: string[] = []

  for (const [id, points] of Object.entries(sheet)) {
    if (!Number.isInteger(points)) {
      errors.push(`Skiru «${id}»: i punti devono essere interi.`)
      continue
    }
    if (points < 0) {
      errors.push(`Skiru «${id}»: punti negativi non ammessi.`)
      continue
    }
    const maxPoints = getSkiruMaxPoints(id)
    if (points > maxPoints) {
      errors.push(`Skiru «${id}»: massimo ${maxPoints} punti.`)
      continue
    }
    const def = getSkiruDef(id)
    if (!def) {
      errors.push(`Skiru «${id}»: id sconosciuto.`)
      continue
    }
    if (points > 0 && def.parentSkiruId) {
      const min = def.minParentPoints ?? 1
      const parentPts = getSkiruPoints(sheet, def.parentSkiruId)
      if (parentPts < min) {
        errors.push(
          `Skiru «${id}»: prerequisito «${def.parentSkiruId}» (${min} pt) non soddisfatto.`,
        )
      }
    }
  }

  const activeGojuElements = GOJU_ELEMENTAL_SKIRU_IDS.filter((id) => getSkiruPoints(sheet, id) > 0)
  if (activeGojuElements.length > 1) {
    errors.push('Gojū: una sola affinità elementale può essere attiva.')
  }

  return { ok: errors.length === 0, errors }
}

/**
 * Normalizza una scheda persistita: clamp al tetto per nodo, scarta id sconosciuti e valori ≤ 0.
 * Evita che dati legacy/corrotti blocchino PATCH su altri nodi.
 */
export function normalizeSkiruSheet(sheet: SkiruSheet): SkiruSheet {
  const out: Record<string, number> = {}
  for (const [id, points] of Object.entries(sheet)) {
    if (!Number.isFinite(points) || points <= 0) continue
    const def = getSkiruDef(id)
    if (!def) continue
    const capped = Math.min(getSkiruMaxPoints(id), Math.max(0, Math.round(points)))
    if (capped > 0) out[id] = capped
  }
  return out
}

/** Verifica che l'exp spendibile copra l'incremento richiesto. */
export function canAffordSkiruRaise(
  sheet: SkiruSheet,
  skiruId: string,
  targetPoints: number,
  spendableExp: number,
): boolean {
  const def = getSkiruDef(skiruId)
  if (!def || def.kind === 'milestone' || def.expPurchasable === false) return false
  if (!isSkiruParentUnlocked(sheet, skiruId)) return false

  const current = getSkiruPoints(sheet, skiruId)
  const maxPoints = getSkiruMaxPoints(skiruId)
  if (targetPoints <= current || targetPoints > maxPoints) return false

  const cost = expCostToRaiseSkiru(current, targetPoints - current)
  return cost != null && spendableExp >= cost
}
