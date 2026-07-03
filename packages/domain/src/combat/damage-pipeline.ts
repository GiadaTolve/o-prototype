import {
  applyMitigationToDamage,
  calculateMitigationPercentFromSkiru,
} from '../skiru/derived-stats'
import { resolveSokaijuFlatDamageBonus } from '../skiru/sokaiju-combat'
import type { SkiruSheet } from '../skiru/types'
import { absorbDamageWithResistance } from './constructs'
import { getTierValue, type WazaTier } from './tier'

/** Bonus/malus al danno base (UltimateManual). */
export interface DamageBonusInput {
  /** Somma al valore tier (status Ira +1 tier, oggetti, ecc. tradotti in flat dal chiamante). */
  flatBonus?: number
  /** Moltiplicatore percentuale sul totale (es. 0.15 = milestone Jiga no Shihaisha). */
  damagePercentBonus?: number
  /** Moltiplicatore generico (es. Tristezza dimezza → 0.5). */
  damageMultiplier?: number
}

export interface DamagePipelineInput {
  tier: WazaTier
  bonuses?: DamageBonusInput
  /** Scheda attaccante — floor Kongen (+ Gōjin se `isReactiveCounter`). */
  attackerSheet?: SkiruSheet
  isReactiveCounter?: boolean
  /** Resistenza [Scudo] o Costrutto sul bersaglio (0 se assente). */
  shieldResistance?: number
  targetSheet: SkiruSheet
  /** Costrutto sul campo: niente mitigazione Itami. */
  skipItamiMitigation?: boolean
  /** Kōmei armatura e simili — % aggiuntiva oltre Itami. */
  extraMitigationPercent?: number
}

export interface DamagePipelineBreakdown {
  tierValue: number
  baseDamage: number
  afterShield: number
  shieldAbsorbed: number
  mitigationPercent: number
  hpDamage: number
}

/** Milestone Jiga no Shihaisha: +15% danno waza pertinenti. */
export const MILESTONE_DAMAGE_PERCENT_BONUS = 0.15

export function milestoneDamageMultiplier(): number {
  return 1 + MILESTONE_DAMAGE_PERCENT_BONUS
}

/**
 * Danno base = Tier + bonus, poi moltiplicatori (UltimateManual).
 * Es. tier 3 (12) + milestone 15% → round(12 × 1,15) = 14
 */
export function calculateBaseDamage(tier: WazaTier, bonuses: DamageBonusInput = {}): number {
  const tierValue = getTierValue(tier)
  let total = tierValue + (bonuses.flatBonus ?? 0)

  if (bonuses.damagePercentBonus) {
    total *= 1 + bonuses.damagePercentBonus
  }
  if (bonuses.damageMultiplier != null) {
    total *= bonuses.damageMultiplier
  }

  return Math.max(0, Math.round(total))
}

/** Danno dopo assorbimento Scudo/Costrutto (Resistenza sottratta per prima). */
export function applyShieldToDamage(baseDamage: number, shieldResistance = 0): {
  afterShield: number
  shieldAbsorbed: number
} {
  const { absorbed, remainder } = absorbDamageWithResistance(shieldResistance, baseDamage)
  return { afterShield: remainder, shieldAbsorbed: absorbed }
}

/**
 * Pipeline completa: confronto IR vinto → danno base → Scudo → Itami → HP.
 * Danno HP = (Danno base − Scudo) × (1 − 0,03 × Itami)
 */
export function resolveDamageToHp(input: DamagePipelineInput): DamagePipelineBreakdown {
  const tierValue = getTierValue(input.tier)
  const sokaijuFlat =
    input.attackerSheet != null
      ? resolveSokaijuFlatDamageBonus(input.attackerSheet, {
          isReactive: input.isReactiveCounter,
        })
      : 0
  const bonuses: DamageBonusInput = {
    ...input.bonuses,
    flatBonus: (input.bonuses?.flatBonus ?? 0) + sokaijuFlat,
  }
  const baseDamage = calculateBaseDamage(input.tier, bonuses)
  const { afterShield, shieldAbsorbed } = applyShieldToDamage(
    baseDamage,
    input.shieldResistance ?? 0,
  )
  const mitigationPercent = input.skipItamiMitigation
    ? 0
    : Math.min(30, calculateMitigationPercentFromSkiru(input.targetSheet) + (input.extraMitigationPercent ?? 0))
  const hpDamage = input.skipItamiMitigation
    ? afterShield
    : applyMitigationToDamage(afterShield, input.targetSheet, input.extraMitigationPercent ?? 0)

  return {
    tierValue,
    baseDamage,
    afterShield,
    shieldAbsorbed,
    mitigationPercent,
    hpDamage,
  }
}
