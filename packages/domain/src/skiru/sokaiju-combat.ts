import { GOJU_ELEMENTAL_SKIRU_IDS, getSkiruPoints } from './progression'
import type { SkiruSheet } from './types'
import type { StatusId } from '../combat/status/types'

/** Rank Sōkaiju effettivo in combattimento (spec: 0–5). */
export const SOKAIJU_RANK_CAP = 5

export const SOKAIJU_NODE_IDS = [
  'tenkan',
  'chiko',
  'goju',
  'jikai',
  'gojin',
  'kashin',
  'shodo',
  'eiga',
  'kongen',
  'hikan',
  'genkai',
] as const

export type SokaijuNodeId = (typeof SOKAIJU_NODE_IDS)[number]

const GOJU_ELEMENTAL_STATUS: Record<string, StatusId> = {
  'goju-fuoco': 'incendiato',
  'goju-fulmine': 'sovraccarico',
  'goju-acqua': 'torpore',
  'goju-gravita': 'appesantimento',
  'goju-aria': 'vertigini',
}

const GOJU_ELEMENTAL_DURATION_TURNS = 3
const GOJU_ELEMENTAL_STACKS = 1

export function getSokaijuRank(sheet: SkiruSheet, nodeId: string): number {
  return Math.min(SOKAIJU_RANK_CAP, Math.max(0, getSkiruPoints(sheet, nodeId)))
}

/** Floor danno Kongen: +round(rank × 1,5) su ogni waza. */
export function calculateKongenDamageFloor(sheet: SkiruSheet): number {
  return Math.round(getSokaijuRank(sheet, 'kongen') * 1.5)
}

/** Bonus danno Gōjin su contrattacchi / risposte reattive. */
export function calculateGojinCounterBonus(sheet: SkiruSheet): number {
  return getSokaijuRank(sheet, 'gojin')
}

/** Costrutti attivi max = 1 + rank Chikō. */
export function calculateMaxActiveConstructs(sheet: SkiruSheet): number {
  return 1 + getSokaijuRank(sheet, 'chiko')
}

/** +1 grado taglia massima ogni 2 rank Chikō. */
export function calculateConstructMaxSizeRankBonus(sheet: SkiruSheet): number {
  return Math.floor(getSokaijuRank(sheet, 'chiko') / 2)
}

/** +floor(Shōdō/2) turni su effetti a tempo. */
export function calculateShodoDurationBonus(sheet: SkiruSheet): number {
  return Math.floor(getSokaijuRank(sheet, 'shodo') / 2)
}

/** +floor(Eiga/2) stack su status emotivi. */
export function calculateEigaEmotionalStackBonus(sheet: SkiruSheet): number {
  return Math.floor(getSokaijuRank(sheet, 'eiga') / 2)
}

/** +rank Jikai su cure e buff applicati. */
export function calculateJikaiSupportBonus(sheet: SkiruSheet): number {
  return getSokaijuRank(sheet, 'jikai')
}

export function getActiveGojuElementalSkiruId(sheet: SkiruSheet): string | null {
  const active = GOJU_ELEMENTAL_SKIRU_IDS.filter((id) => getSkiruPoints(sheet, id) > 0)
  return active.length === 1 ? active[0]! : null
}

/** Affinità Gojū attiva → status elementale (3 turni). */
export function resolveGojuElementalAutoApply(sheet: SkiruSheet): {
  statusId: StatusId
  durationTurns: number
  stacks: number
} | null {
  const elementalId = getActiveGojuElementalSkiruId(sheet)
  if (!elementalId) return null
  const statusId = GOJU_ELEMENTAL_STATUS[elementalId]
  if (!statusId) return null
  return {
    statusId,
    durationTurns: GOJU_ELEMENTAL_DURATION_TURNS,
    stacks: GOJU_ELEMENTAL_STACKS,
  }
}

export function applySokaijuEffectDuration(baseTurns: number, sheet: SkiruSheet): number {
  return Math.max(0, baseTurns + calculateShodoDurationBonus(sheet))
}

export function applySokaijuEmotionalStacks(baseStacks: number, sheet: SkiruSheet): number {
  return Math.max(0, baseStacks + calculateEigaEmotionalStackBonus(sheet))
}

export function applySokaijuSupportValue(base: number, sheet: SkiruSheet): number {
  return Math.max(0, base + calculateJikaiSupportBonus(sheet))
}

/** Hikan vs Chōkaku — bypass schivata reattiva se il bersaglio non poteva percepire il colpo. */
export function checkHikanSurpriseBypass(
  attackerSheet: SkiruSheet,
  defenderSheet: SkiruSheet,
  targetCouldPerceive: boolean,
): boolean {
  if (targetCouldPerceive) return false
  return getSokaijuRank(attackerSheet, 'hikan') > getSkiruPoints(defenderSheet, 'chokaku')
}

/**
 * Tie-break IR a parità: Kashin più alto → poi waza [Energetiche] → poi attaccante (caller).
 * Ritorno positivo se A vince il tie-break.
 */
export function compareSokaijuInitiativeTieBreak(
  kashinA: number,
  kashinB: number,
  actorAIsEnergetic: boolean,
  actorBIsEnergetic: boolean,
): number {
  if (kashinA !== kashinB) return kashinA - kashinB
  if (actorAIsEnergetic === actorBIsEnergetic) return 0
  return actorAIsEnergetic ? 1 : -1
}

export interface SokaijuCombatSummary {
  kongenDamageFloor: number
  gojinCounterBonus: number
  maxActiveConstructs: number
  constructMaxSizeRankBonus: number
  shodoDurationBonus: number
  eigaEmotionalStackBonus: number
  jikaiSupportBonus: number
  kashinRank: number
  hikanRank: number
  gojuElemental: ReturnType<typeof resolveGojuElementalAutoApply>
}

export function computeSokaijuCombatSummary(sheet: SkiruSheet): SokaijuCombatSummary {
  return {
    kongenDamageFloor: calculateKongenDamageFloor(sheet),
    gojinCounterBonus: calculateGojinCounterBonus(sheet),
    maxActiveConstructs: calculateMaxActiveConstructs(sheet),
    constructMaxSizeRankBonus: calculateConstructMaxSizeRankBonus(sheet),
    shodoDurationBonus: calculateShodoDurationBonus(sheet),
    eigaEmotionalStackBonus: calculateEigaEmotionalStackBonus(sheet),
    jikaiSupportBonus: calculateJikaiSupportBonus(sheet),
    kashinRank: getSokaijuRank(sheet, 'kashin'),
    hikanRank: getSokaijuRank(sheet, 'hikan'),
    gojuElemental: resolveGojuElementalAutoApply(sheet),
  }
}

/** Bonus flat Sōkaiju da sommare al danno base (Kongen + Gōjin se reattivo). */
export function resolveSokaijuFlatDamageBonus(
  sheet: SkiruSheet,
  options: { isReactive?: boolean } = {},
): number {
  let bonus = calculateKongenDamageFloor(sheet)
  if (options.isReactive) bonus += calculateGojinCounterBonus(sheet)
  return bonus
}

/** Valore live per il riquadro formule UI, per ancoraggio. */
export function formatSokaijuAnchorLiveValue(
  anchorId: SokaijuNodeId,
  sheet: SkiruSheet,
  summary?: SokaijuCombatSummary,
): string {
  const s = summary ?? computeSokaijuCombatSummary(sheet)
  const rank = getSokaijuRank(sheet, anchorId)

  switch (anchorId) {
    case 'tenkan':
      return getSkiruPoints(sheet, 'tenkan') >= 1
        ? 'Terzo Occhio aperto · [tenkan] in chat'
        : 'Accademica — non in scheda'
    case 'chiko':
      return `rank ${rank} · max ${s.maxActiveConstructs} costrutti · taglia +${s.constructMaxSizeRankBonus}`
    case 'goju':
      return s.gojuElemental
        ? `rank ${rank} · [${s.gojuElemental.statusId}] · ${s.gojuElemental.durationTurns} turni`
        : `rank ${rank} · nessuna affinità attiva`
    case 'jikai':
      return `rank ${rank} · +${s.jikaiSupportBonus} cure/buff`
    case 'gojin':
      return `rank ${rank} · +${s.gojinCounterBonus} danno reattivo`
    case 'kashin':
      return `rank ${rank} · tie-break IR`
    case 'shodo':
      return `rank ${rank} · +${s.shodoDurationBonus} turni durata`
    case 'eiga':
      return `rank ${rank} · +${s.eigaEmotionalStackBonus} stack emotivi`
    case 'kongen':
      return `rank ${rank} · +${s.kongenDamageFloor} danno base`
    case 'hikan':
      return `rank ${rank} · sorpresa vs Chōkaku`
    case 'genkai':
      return `rank ${rank} · res. costrutti (genkai + tier × taglia)`
    default:
      return `rank ${rank}`
  }
}
