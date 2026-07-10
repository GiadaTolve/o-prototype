/** Costrutti, Scudo, taglie — Ultimate Manual */

import { getTierValue, isWazaTier, type WazaTier } from './tier'

export const CONSTRUCT_SIZE_IDS = ['piccola', 'media', 'grande', 'enorme'] as const

export type ConstructSizeId = (typeof CONSTRUCT_SIZE_IDS)[number]

export type ConstructSizeDef = {
  id: ConstructSizeId
  label: string
  maxMeters: number | null
  resistanceMult: number
  movementMult: number
  /** Bonus tier al danno inflitto dal costrutto. */
  damageTierBonus: number
}

/** Taglie costrutto/scudo — tabella manuale. */
export const CONSTRUCT_SIZES: Record<ConstructSizeId, ConstructSizeDef> = {
  piccola: {
    id: 'piccola',
    label: 'Piccola',
    maxMeters: 0.5,
    resistanceMult: 0.5,
    movementMult: 1,
    damageTierBonus: 0,
  },
  media: {
    id: 'media',
    label: 'Media',
    maxMeters: 2,
    resistanceMult: 1,
    movementMult: 0.75,
    damageTierBonus: 0,
  },
  grande: {
    id: 'grande',
    label: 'Grande',
    maxMeters: 5,
    resistanceMult: 1.5,
    movementMult: 0.5,
    damageTierBonus: 1,
  },
  enorme: {
    id: 'enorme',
    label: 'Enorme',
    maxMeters: null,
    resistanceMult: 2,
    movementMult: 0.25,
    damageTierBonus: 2,
  },
}

/**
 * Resistenza costrutto = ⌊(rank Kongen + numero tier waza) × moltiplicatore taglia⌋.
 * Kongen = nodo Sōkaiju Costrutti (ex-Gugenka). Genkai governa gli Scudi, non i costrutti.
 */
export function calculateConstructResistance(
  kongenRank: number,
  wazaTier: WazaTier | number,
  size: ConstructSizeId = 'media',
): number {
  const tier = typeof wazaTier === 'number' && isWazaTier(wazaTier) ? wazaTier : 1
  const mult = CONSTRUCT_SIZES[size]?.resistanceMult ?? 1
  return Math.floor((Math.max(0, Math.floor(kongenRank)) + tier) * mult)
}

/**
 * Resistenza Scudo energetico = valore tier (T1=4 … T5=23).
 * Genkai (nodo Scudo) — da collegare in fase Scudo dedicata.
 */
export function calculateShieldResistanceFromTier(wazaTier: WazaTier | number): number {
  const tier = typeof wazaTier === 'number' && isWazaTier(wazaTier) ? wazaTier : 1
  return getTierValue(tier)
}

/** @deprecated Usare calculateConstructResistance con rank Kongen */
export const calculateConstructResistanceFromGugenka = calculateConstructResistance

/** Assorbimento danno da Scudo/Costrutto (Resistenza sottratta per prima). */
export function absorbDamageWithResistance(
  resistance: number,
  incomingDamage: number,
): { absorbed: number; remainder: number } {
  const absorbed = Math.min(Math.max(0, resistance), Math.max(0, incomingDamage))
  return { absorbed, remainder: Math.max(0, incomingDamage - absorbed) }
}

/** Costrutti non hanno Itami — danno pieno oltre la resistenza (salvo Scudo proprio). */
export function constructDamageToHp(remainderAfterShield: number): number {
  return Math.max(0, remainderAfterShield)
}
