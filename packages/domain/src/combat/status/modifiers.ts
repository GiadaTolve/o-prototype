import type { DamageBonusInput } from '../damage-pipeline'
import { calculateSuccessIndex, type ActionIndexInput, type SuccessIndexBreakdown } from '../resolution'
import { getSkiruPoints } from '../../skiru/progression'
import type { SkiruSheet } from '../../skiru/types'
import { getTierValue, type WazaTier } from '../tier'
import { getStatusDefinition } from './catalog'
import type { StatusCombatModifiers, StatusContainer } from './types'
import type { DoMechanicsUiMeta } from '../../styles/do-mechanics'
import { compileKomeiModifiers, readKomeiState } from '../../styles/naikan/komei'
import { compileNagoriCollateralModifiers } from '../../styles/hensei/nagori'
import { compileSuturaModifiers } from '../../styles/naikan/hogo'

const EMPTY_MODIFIERS: StatusCombatModifiers = {
  offensiveTierBonus: 0,
  damageTakenTierBonus: 0,
  damageMultiplier: 1,
  rangeMultiplier: 1,
  csCostMultiplier: 1,
  csCostMin: 1,
  blockCsGain: false,
  blockHealing: false,
  blockWaza: false,
  blockAllyBuff: false,
  blockStatusDecay: false,
  movementMultiplier: 1,
  movementTowardEnemyOnly: false,
  bonusCsPerTurn: 0,
  indexBonus: 0,
  forceLowestSkiruInIndex: false,
  bonusMovementMeters: 0,
  movementPenaltyMeters: 0,
  tranceOnirica: false,
  metamorphosisActive: false,
  mitigationBonusPercent: 0,
  komeiRovente: false,
  bonusRangeMeters: 0,
  bonusDurationTurns: 0,
  shieldPenetrationTier: 0,
  nagoriElementalStackBonus: 0,
}

/** Delta danno flat equivalente a ±N tier rispetto al tier base. */
export function tierStepsToFlatBonus(baseTier: WazaTier, steps: number): number {
  if (steps === 0) return 0
  const shifted = Math.min(5, Math.max(1, baseTier + steps)) as WazaTier
  return getTierValue(shifted) - getTierValue(baseTier)
}

/** Compila tutti i modificatori attivi da stack cumulati. */
export function compileStatusModifiers(container: StatusContainer): StatusCombatModifiers {
  const out: StatusCombatModifiers = { ...EMPTY_MODIFIERS }

  for (const instance of container.statuses) {
    const def = getStatusDefinition(instance.id)
    const m = def.modifiers
    const stacks = instance.stacks

    if (m.offensiveTierBonus) out.offensiveTierBonus += m.offensiveTierBonus
    if (m.damageTakenTierBonus) out.damageTakenTierBonus += m.damageTakenTierBonus
    if (m.damageMultiplier != null) out.damageMultiplier *= m.damageMultiplier
    if (m.rangeMultiplier != null) out.rangeMultiplier *= m.rangeMultiplier
    if (m.csCostMultiplier != null) out.csCostMultiplier *= m.csCostMultiplier
    if (m.csCostMin != null) out.csCostMin = Math.max(out.csCostMin, m.csCostMin)
    if (m.blockCsGain) out.blockCsGain = true
    if (m.blockHealing) out.blockHealing = true
    if (m.blockWaza) out.blockWaza = true
    if (m.blockAllyBuff) out.blockAllyBuff = true
    if (m.blockStatusDecay) out.blockStatusDecay = true
    if (m.movementMultiplier != null) out.movementMultiplier *= m.movementMultiplier
    if (m.movementTowardEnemyOnly) out.movementTowardEnemyOnly = true
    if (m.bonusCsPerTurn) out.bonusCsPerTurn += m.bonusCsPerTurn
    if (m.indexBonus) out.indexBonus += m.indexBonus
    if (m.forceLowestSkiruInIndex) out.forceLowestSkiruInIndex = true
    if (m.tranceOnirica) out.tranceOnirica = true
    if (m.metamorphosisActive) out.metamorphosisActive = true

    if (m.bonusMovementPerTwoStacks) {
      out.bonusMovementMeters += Math.floor(stacks / 2) * m.bonusMovementPerTwoStacks
    }
    if (m.movementPenaltyMeters) {
      out.movementPenaltyMeters += m.movementPenaltyMeters
    }
    if (m.bonusOffensiveTierPerFourStacks) {
      out.offensiveTierBonus += Math.floor(stacks / 4) * m.bonusOffensiveTierPerFourStacks
    }
  }

  return out
}

function mergeModifierPartial(
  base: StatusCombatModifiers,
  partial: Partial<StatusCombatModifiers>,
): StatusCombatModifiers {
  const out = { ...base }
  if (partial.offensiveTierBonus) out.offensiveTierBonus += partial.offensiveTierBonus
  if (partial.damageTakenTierBonus) out.damageTakenTierBonus += partial.damageTakenTierBonus
  if (partial.bonusCsPerTurn) out.bonusCsPerTurn += partial.bonusCsPerTurn
  if (partial.indexBonus) out.indexBonus += partial.indexBonus
  if (partial.mitigationBonusPercent) out.mitigationBonusPercent += partial.mitigationBonusPercent
  if (partial.komeiRovente) out.komeiRovente = true
  if (partial.bonusRangeMeters) out.bonusRangeMeters += partial.bonusRangeMeters
  if (partial.bonusDurationTurns) out.bonusDurationTurns += partial.bonusDurationTurns
  if (partial.shieldPenetrationTier) out.shieldPenetrationTier += partial.shieldPenetrationTier
  if (partial.blockAllyBuff) out.blockAllyBuff = true
  if (partial.blockStatusDecay) out.blockStatusDecay = true
  if (partial.nagoriElementalStackBonus) {
    out.nagoriElementalStackBonus += partial.nagoriElementalStackBonus
  }
  if (partial.damageMultiplier != null) out.damageMultiplier *= partial.damageMultiplier
  if (partial.rangeMultiplier != null) out.rangeMultiplier *= partial.rangeMultiplier
  return out
}

/** Status + buff meta (Kōmei, Nagori, …). */
export function compileCombatModifiers(
  container: StatusContainer,
  uiMeta?: DoMechanicsUiMeta | null,
): StatusCombatModifiers {
  const base = compileStatusModifiers(container)
  const komei = compileKomeiModifiers(readKomeiState(uiMeta ?? undefined))
  const nagori = compileNagoriCollateralModifiers(uiMeta ?? undefined)
  const sutura = compileSuturaModifiers(uiMeta ?? undefined)
  return mergeModifierPartial(mergeModifierPartial(mergeModifierPartial(base, komei), nagori), sutura)
}

/** Adatta costo CS waza (Tristezza ÷2 min 1, Disperazione ×2). */
export function adjustCsCostFromStatus(baseCost: number, container: StatusContainer): number {
  const m = compileStatusModifiers(container)
  let cost = Math.ceil(baseCost * m.csCostMultiplier)
  if (m.csCostMultiplier < 1) cost = Math.max(m.csCostMin, Math.floor(baseCost * m.csCostMultiplier))
  else cost = Math.max(m.csCostMin, cost)
  return Math.max(1, cost)
}

/** Modificatori status → input pipeline danno offensiva. */
export function statusToOffensiveDamageBonuses(
  container: StatusContainer,
  wazaTier: WazaTier,
  uiMeta?: DoMechanicsUiMeta | null,
): DamageBonusInput {
  const m = uiMeta
    ? compileCombatModifiers(container, uiMeta)
    : compileStatusModifiers(container)
  return {
    flatBonus: tierStepsToFlatBonus(wazaTier, m.offensiveTierBonus),
    damageMultiplier: m.damageMultiplier !== 1 ? m.damageMultiplier : undefined,
  }
}

/** Modificatori status → bonus flat al danno subito (Ira, Incendiato…). */
export function statusToDamageTakenFlatBonus(
  container: StatusContainer,
  incomingTier: WazaTier,
): number {
  const m = compileStatusModifiers(container)
  return tierStepsToFlatBonus(incomingTier, m.damageTakenTierBonus)
}

/** IR con bonus/malus status (es. Sovraccarico, Debitore). */
export function calculateSuccessIndexWithStatus(
  sheet: SkiruSheet,
  input: ActionIndexInput,
  container: StatusContainer,
): SuccessIndexBreakdown {
  const m = compileStatusModifiers(container)
  let physicalSkiruId = input.physicalSkiruId
  let channelingSkiruId = input.channelingSkiruId

  if (m.forceLowestSkiruInIndex) {
    const p = getSkiruPoints(sheet, physicalSkiruId)
    const c = getSkiruPoints(sheet, channelingSkiruId)
    const lowerId = p <= c ? physicalSkiruId : channelingSkiruId
    physicalSkiruId = lowerId
    channelingSkiruId = lowerId
  }

  return calculateSuccessIndex(sheet, {
    ...input,
    physicalSkiruId,
    channelingSkiruId,
    indexBonus: (input.indexBonus ?? 0) + m.indexBonus,
  })
}
