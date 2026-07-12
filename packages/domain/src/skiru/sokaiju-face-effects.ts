/**
 * Sōkaiju — effetti Meiju (Vita) / Shiju (Morte) per categoria waza.
 * Appendice Skiru: ogni ancoraggio (tranne Tenkan) premia la categoria papabile collegata.
 */
import {
  SOKAIJU_ANCHOR_WAZA_CATEGORIA,
  SOKAIJU_GATE_SKIRU_ID,
  sokaijuFaceSheetKey,
  type SokaijuFace,
} from './sokaiju-categoria-map'
import { getSkiruPoints } from './progression'
import type { SkiruSheet } from './types'
import type { WazaCategoriaPapabile } from './waza-categoria-papabile'
import { isWazaCategoriaPapabile } from './waza-categoria-papabile'

export type { SokaijuFace }
export { sokaijuFaceSheetKey, parseSokaijuFaceSheetKey, isSokaijuFaceSheetKey } from './sokaiju-categoria-map'

/** +1,5 % per punto investito sul volto (Vita → IR, Morte → Danno). */
export const SOKAIJU_FACE_PERCENT_PER_POINT = 0.015

/** Punti sul volto Meiju o Shiju (`anchorId:meiju` / `anchorId:shiju`). */
export function getSokaijuFacePoints(
  sheet: SkiruSheet,
  anchorId: string,
  face: SokaijuFace,
): number {
  return Math.max(0, getSkiruPoints(sheet, sokaijuFaceSheetKey(anchorId, face)))
}

export function formatSokaijuFacePercent(points: number): string {
  const pct = points * SOKAIJU_FACE_PERCENT_PER_POINT * 100
  const rounded = Math.round(pct * 10) / 10
  return rounded % 1 === 0 ? `${rounded}%` : `${rounded.toFixed(1)}%`
}

export function meijuMechanicForCategory(categoria: WazaCategoriaPapabile): string {
  return `Vita: ogni punto assegnato incrementa l'IR del lancio delle waza [${categoria}] di +1,5%.`
}

export function shijuMechanicForCategory(categoria: WazaCategoriaPapabile): string {
  return `Morte: ogni punto assegnato incrementa il Danno delle waza [${categoria}] di +1,5%.`
}

export function combinedFaceFormula(categoria: WazaCategoriaPapabile): string {
  return `${meijuMechanicForCategory(categoria)} ${shijuMechanicForCategory(categoria)}`
}

/** Id ancoraggio la cui categoria papabile compare nei tag waza. */
export function findSokaijuAnchorIdForWazaTags(tags: readonly string[]): string | undefined {
  const normalized = new Set(tags.map((t) => t.trim()))
  for (const [anchorId, categoria] of Object.entries(SOKAIJU_ANCHOR_WAZA_CATEGORIA)) {
    if (normalized.has(categoria)) return anchorId
  }
  return undefined
}

/** Moltiplicatore IR (es. 1.045 = +4.5%) da Meiju sulla categoria della waza. */
export function calculateSokaijuMeijuIrMultiplier(
  sheet: SkiruSheet,
  wazaTags: readonly string[],
): number {
  const anchorId = findSokaijuAnchorIdForWazaTags(wazaTags)
  if (!anchorId) return 1
  const points = getSokaijuFacePoints(sheet, anchorId, 'meiju')
  return 1 + points * SOKAIJU_FACE_PERCENT_PER_POINT
}

/** Applica Meiju all'IR già calcolato. */
export function applySokaijuMeijuToIr(
  sheet: SkiruSheet,
  baseIr: number,
  wazaTags: readonly string[],
): number {
  const mult = calculateSokaijuMeijuIrMultiplier(sheet, wazaTags)
  return Math.max(0, Math.round(baseIr * mult))
}

/** Bonus percentuale danno (es. 0.045 = +4.5%) da Shiju sulla categoria della waza. */
export function calculateSokaijuShijuDamagePercentBonus(
  sheet: SkiruSheet,
  wazaTags: readonly string[],
): number {
  const anchorId = findSokaijuAnchorIdForWazaTags(wazaTags)
  if (!anchorId) return 0
  const points = getSokaijuFacePoints(sheet, anchorId, 'shiju')
  return points * SOKAIJU_FACE_PERCENT_PER_POINT
}

export function formatSokaijuFaceLiveLine(
  anchorId: string,
  sheet: SkiruSheet,
  categoria?: WazaCategoriaPapabile,
): string {
  if (anchorId === SOKAIJU_GATE_SKIRU_ID) {
    return getSkiruPoints(sheet, 'tenkan') >= 1
      ? 'Terzo Occhio aperto · [tenkan] in chat'
      : 'Accademica — non in scheda'
  }
  const cat = categoria ?? SOKAIJU_ANCHOR_WAZA_CATEGORIA[anchorId]
  if (!cat || !isWazaCategoriaPapabile(cat)) {
    return '—'
  }
  const meiju = getSokaijuFacePoints(sheet, anchorId, 'meiju')
  const shiju = getSokaijuFacePoints(sheet, anchorId, 'shiju')
  return `[${cat}] Vita +${formatSokaijuFacePercent(meiju)} IR · Morte +${formatSokaijuFacePercent(shiju)} danno`
}
