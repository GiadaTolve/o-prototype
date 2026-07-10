/**
 * Costrutti persistenti sul campo —
 * Resistenza da rank Kongen + numero tier × taglia.
 */

import {
  calculateConstructResistance,
  absorbDamageWithResistance,
  CONSTRUCT_SIZES,
  CONSTRUCT_SIZE_IDS,
  type ConstructSizeId,
} from './constructs'
import { calculateMaxActiveConstructs, calculateConstructMaxSizeRankBonus } from '../skiru/sokaiju-combat'
import { getSkiruPoints } from '../skiru/progression'
import type { SkiruSheet } from '../skiru/types'
import { isWazaTier, type WazaTier } from './tier'
import { isWithinGosaConstructLimit } from '../styles/genzai/gosa-construct-limit'

export type FieldConstruct = {
  id: string
  creatorCharacterId: string
  label: string
  size: ConstructSizeId
  wazaTier: WazaTier
  /** Rank Kongen del creatore al momento della creazione. */
  kongenRank: number
  maxResistance: number
  remainingResistance: number
  /** Stazionario: nessun IR proprio. */
  stationary: boolean
  createdAt?: string
}

export function createFieldConstruct(input: {
  id: string
  creatorCharacterId: string
  label: string
  wazaTier: WazaTier | number
  kongenRank: number
  size?: ConstructSizeId
  stationary?: boolean
}): FieldConstruct {
  const tier = typeof input.wazaTier === 'number' && isWazaTier(input.wazaTier) ? input.wazaTier : 1
  const size = input.size ?? 'media'
  const maxResistance = calculateConstructResistance(input.kongenRank, tier, size)
  return {
    id: input.id,
    creatorCharacterId: input.creatorCharacterId,
    label: input.label.trim() || 'Costrutto',
    size,
    wazaTier: tier,
    kongenRank: Math.max(0, Math.floor(input.kongenRank)),
    maxResistance,
    remainingResistance: maxResistance,
    stationary: input.stationary ?? true,
  }
}

export function applyDamageToFieldConstruct(
  construct: FieldConstruct,
  incomingDamage: number,
): {
  construct: FieldConstruct
  absorbed: number
  remainder: number
  destroyed: boolean
} {
  const { absorbed, remainder } = absorbDamageWithResistance(
    construct.remainingResistance,
    incomingDamage,
  )
  const remainingResistance = Math.max(0, construct.remainingResistance - absorbed)
  const next: FieldConstruct = { ...construct, remainingResistance }
  return {
    construct: next,
    absorbed,
    remainder,
    destroyed: remainingResistance <= 0,
  }
}

export function fieldConstructToApi(construct: FieldConstruct) {
  const sizeDef = CONSTRUCT_SIZES[construct.size]
  return {
    ...construct,
    sizeLabel: sizeDef.label,
    resistanceMult: sizeDef.resistanceMult,
    pctRemaining:
      construct.maxResistance > 0
        ? Math.round((construct.remainingResistance / construct.maxResistance) * 100)
        : 0,
  }
}

export function isConstructSizeId(value: string): value is ConstructSizeId {
  return value in CONSTRUCT_SIZES
}

/** Chikō + limite Gosa (2 + Seimitsu): entrambi devono consentire un nuovo costrutto. */
export function canPlaceFieldConstruct(
  activeCount: number,
  creatorSheet: SkiruSheet,
  options?: { enforceGosaLimit?: boolean },
): boolean {
  if (activeCount >= calculateMaxActiveConstructs(creatorSheet)) return false
  if (options?.enforceGosaLimit === false) return true
  const seimitsu = getSkiruPoints(creatorSheet, 'seimitsu')
  return isWithinGosaConstructLimit(activeCount, seimitsu)
}

/** Taglia massima dichiarabile: Media + floor(Chikō/2) gradi (Piccola→Enorme). */
export function getMaxAllowedConstructSizeId(sheet: SkiruSheet): ConstructSizeId {
  const maxIndex = Math.min(
    CONSTRUCT_SIZE_IDS.length - 1,
    1 + calculateConstructMaxSizeRankBonus(sheet),
  )
  return CONSTRUCT_SIZE_IDS[maxIndex]!
}

export function isConstructSizeAllowedForCreator(
  size: ConstructSizeId,
  sheet: SkiruSheet,
): boolean {
  const max = getMaxAllowedConstructSizeId(sheet)
  return CONSTRUCT_SIZE_IDS.indexOf(size) <= CONSTRUCT_SIZE_IDS.indexOf(max)
}
