/**
 * Costrutti persistenti sul campo —
 * Entità separate dal PG; resistenza da Genkai + tier × taglia.
 */

import {
  calculateConstructResistance,
  absorbDamageWithResistance,
  CONSTRUCT_SIZES,
  type ConstructSizeId,
} from './constructs'
import { CONSTRUCT_SIZE_IDS, type ConstructSizeId } from './constructs'
import { calculateMaxActiveConstructs, calculateConstructMaxSizeRankBonus } from '../skiru/sokaiju-combat'
import type { SkiruSheet } from '../skiru/types'
import { isWazaTier, type WazaTier } from './tier'

export type FieldConstruct = {
  id: string
  creatorCharacterId: string
  label: string
  size: ConstructSizeId
  wazaTier: WazaTier
  /** Punti Genkai del creatore al momento della creazione. */
  genkai: number
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
  genkai: number
  size?: ConstructSizeId
  stationary?: boolean
}): FieldConstruct {
  const tier = typeof input.wazaTier === 'number' && isWazaTier(input.wazaTier) ? input.wazaTier : 1
  const size = input.size ?? 'media'
  const maxResistance = calculateConstructResistance(input.genkai, tier, size)
  return {
    id: input.id,
    creatorCharacterId: input.creatorCharacterId,
    label: input.label.trim() || 'Costrutto',
    size,
    wazaTier: tier,
    genkai: Math.max(0, Math.floor(input.genkai)),
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

/** Chikō: cap al numero di costrutti attivi sul campo per creatore. */
export function canPlaceFieldConstruct(activeCount: number, creatorSheet: SkiruSheet): boolean {
  return activeCount < calculateMaxActiveConstructs(creatorSheet)
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
