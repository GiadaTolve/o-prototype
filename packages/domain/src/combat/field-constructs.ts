/**
 * Costrutti persistenti sul campo —
 * Resistenza da numero tier × taglia (senza bonus legacy Sōkaiju).
 */

import {
  calculateConstructResistance,
  absorbDamageWithResistance,
  CONSTRUCT_SIZES,
  CONSTRUCT_SIZE_IDS,
  type ConstructSizeId,
} from './constructs'
import { getSkiruPoints } from '../skiru/progression'
import type { SkiruSheet } from '../skiru/types'
import { isWazaTier, type WazaTier } from './tier'
import { isWithinGosaConstructLimit } from '../styles/genzai/gosa-construct-limit'

/** Tetto costrutti attivi senza bonus Chikō legacy. */
export const DEFAULT_MAX_ACTIVE_CONSTRUCTS = 1

export type FieldConstruct = {
  id: string
  creatorCharacterId: string
  label: string
  size: ConstructSizeId
  wazaTier: WazaTier
  /** Deprecato — mantenuto per compatibilità persistenza (sempre 0). */
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
  kongenRank?: number
  size?: ConstructSizeId
  stationary?: boolean
}): FieldConstruct {
  const tier = typeof input.wazaTier === 'number' && isWazaTier(input.wazaTier) ? input.wazaTier : 1
  const size = input.size ?? 'media'
  const maxResistance = calculateConstructResistance(0, tier, size)
  return {
    id: input.id,
    creatorCharacterId: input.creatorCharacterId,
    label: input.label.trim() || 'Costrutto',
    size,
    wazaTier: tier,
    kongenRank: 0,
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

export function fieldConstructToApi(
  construct: FieldConstruct,
  options?: { proprieta?: readonly string[] },
) {
  const sizeDef = CONSTRUCT_SIZES[construct.size]
  const proprieta = options?.proprieta?.length ? [...options.proprieta] : []
  return {
    ...construct,
    proprieta,
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

/** Limite Gosa (2 + Seimitsu): entrambi devono consentire un nuovo costrutto. */
export function canPlaceFieldConstruct(
  activeCount: number,
  creatorSheet: SkiruSheet,
  options?: { enforceGosaLimit?: boolean },
): boolean {
  if (activeCount >= DEFAULT_MAX_ACTIVE_CONSTRUCTS) return false
  if (options?.enforceGosaLimit === false) return true
  const seimitsu = getSkiruPoints(creatorSheet, 'seimitsu')
  return isWithinGosaConstructLimit(activeCount, seimitsu)
}

/** Taglia massima dichiarabile senza bonus Chikō legacy (Media). */
export function getMaxAllowedConstructSizeId(_sheet: SkiruSheet): ConstructSizeId {
  return 'media'
}

export function isConstructSizeAllowedForCreator(
  size: ConstructSizeId,
  sheet: SkiruSheet,
): boolean {
  const max = getMaxAllowedConstructSizeId(sheet)
  return CONSTRUCT_SIZE_IDS.indexOf(size) <= CONSTRUCT_SIZE_IDS.indexOf(max)
}
