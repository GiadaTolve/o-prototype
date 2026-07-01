import { getSkiruDef, SKIRU_CATALOG } from '../skiru/catalog'
import { getSkiruPoints } from '../skiru/progression'
import { compareSokaijuInitiativeTieBreak, getSokaijuRank } from '../skiru/sokaiju-combat'
import type { SkiruSheet } from '../skiru/types'

/**
 * Dichiarazione di un'azione per il calcolo dell'Indice di Riuscita (UltimateManual §2.3).
 * Le Skiru sono scelte dalla descrizione narrata — non fissate per waza.
 */
export interface ActionIndexInput {
  /** Skiru Fisica (di norma dominio Chi). */
  physicalSkiruId: string
  /** Skiru di Incanalamento (di norma dominio Jin). */
  channelingSkiruId: string
  /** Quarti narrati spesi per l'azione (pareggio IR). Default 1. */
  quartersSpent?: number
  /** Bonus flat all'IR (oggetti, status, milestone +15% pre-calcolato, ecc.). */
  indexBonus?: number
}

export interface SuccessIndexBreakdown {
  physicalSkiruId: string
  channelingSkiruId: string
  physicalPoints: number
  channelingPoints: number
  /** Media aritmetica prima del bonus (es. 4,5). */
  rawAverage: number
  indexBonus: number
  /** IR finale arrotondato (es. 4,5 → 5). */
  successIndex: number
  quartersSpent: number
}

export type ConfrontationOutcome = 'actor_wins' | 'defender_wins' | 'stalemate'

export interface ConfrontationResult {
  outcome: ConfrontationOutcome
  actor: SuccessIndexBreakdown
  defender: SuccessIndexBreakdown
  /** true se IR e quarti spesi coincidono. */
  stalemate: boolean
}

export interface SkiruDomainHintResult {
  ok: boolean
  warnings: string[]
}

/** IR = (Skiru Fisica + Skiru Incanalamento) ÷ 2, arrotondato + bonus. */
export function calculateSuccessIndex(
  sheet: SkiruSheet,
  input: ActionIndexInput,
): SuccessIndexBreakdown {
  const physicalPoints = getSkiruPoints(sheet, input.physicalSkiruId)
  const channelingPoints = getSkiruPoints(sheet, input.channelingSkiruId)
  const rawAverage = (physicalPoints + channelingPoints) / 2
  const indexBonus = input.indexBonus ?? 0
  const successIndex = Math.round(rawAverage + indexBonus)

  return {
    physicalSkiruId: input.physicalSkiruId,
    channelingSkiruId: input.channelingSkiruId,
    physicalPoints,
    channelingPoints,
    rawAverage,
    indexBonus,
    successIndex,
    quartersSpent: Math.max(0, input.quartersSpent ?? 1),
  }
}

/**
 * IR indicativo al lancio waza: media arrotondata delle Skiru Chi e Jin più alte in scheda.
 * In gioco le Skiru dell'azione restano narrative; il tag [ir:N] può essere corretto a mano.
 */
export function computeIndicativeActionIr(sheet: SkiruSheet): number {
  let bestChi = 0
  let bestJin = 0
  for (const def of SKIRU_CATALOG) {
    const pts = getSkiruPoints(sheet, def.id)
    if (def.domain === 'chi') bestChi = Math.max(bestChi, pts)
    if (def.domain === 'jin') bestJin = Math.max(bestJin, pts)
  }
  return Math.round((bestChi + bestJin) / 2)
}

/** IR indicativo come ActionIndexInput (migliori Skiru Chi + Jin investite). */
export function buildIndicativeActionIndex(sheet: SkiruSheet): ActionIndexInput {
  let bestChiId = 'bakuryoku'
  let bestJinId = 'kensei'
  let bestChi = 0
  let bestJin = 0
  for (const def of SKIRU_CATALOG) {
    if (def.kind !== 'standard' || def.branchId === 'sokaiju') continue
    const pts = getSkiruPoints(sheet, def.id)
    if (def.domain === 'chi' && pts >= bestChi) {
      bestChi = pts
      bestChiId = def.id
    }
    if (def.domain === 'jin' && pts >= bestJin) {
      bestJin = pts
      bestJinId = def.id
    }
  }
  return { physicalSkiruId: bestChiId, channelingSkiruId: bestJinId, quartersSpent: 1 }
}

/** Bonus milestone Jiga no Shihaisha: +15% sull'IR (arrotondato). */
export function milestoneIrBonus(baseIndex: number): number {
  return Math.round(baseIndex * 0.15)
}

/**
 * Avviso se le Skiru non rispettano Chi/Jin tipici — non blocca (la descrizione comanda).
 * Es. difesa con Hansha + Kansatsu nel manuale.
 */
export function hintActionSkiruDomains(input: ActionIndexInput): SkiruDomainHintResult {
  const warnings: string[] = []
  const physical = getSkiruDef(input.physicalSkiruId)
  const channeling = getSkiruDef(input.channelingSkiruId)

  if (!physical) warnings.push(`Skiru fisica «${input.physicalSkiruId}» sconosciuta.`)
  else if (physical.domain !== 'chi') {
    warnings.push(`Skiru fisica «${physical.name}» non è del dominio Chi (ok se la descrizione lo giustifica).`)
  }

  if (!channeling) warnings.push(`Skiru incanalamento «${input.channelingSkiruId}» sconosciuta.`)
  else if (channeling.domain !== 'jin') {
    warnings.push(`Skiru incanalamento «${channeling.name}» non è del dominio Jin (ok se la descrizione lo giustifica).`)
  }

  return { ok: warnings.length === 0, warnings }
}

export interface SokaijuConfrontationOptions {
  actorKashinRank?: number
  defenderKashinRank?: number
  actorIsEnergetic?: boolean
  defenderIsEnergetic?: boolean
}

/** Waza con tag [Energetiche] / [Energetico] / [Energetica] — spareggio IR dopo Kashin. */
export function messageDeclaresEnergeticWaza(content: string): boolean {
  return /\[(Energetico|Energetica|Energetiche)\]/i.test(content)
}

export function buildSokaijuConfrontationFromSheets(
  sheetActor: SkiruSheet,
  sheetDefender: SkiruSheet,
  energeticActor = false,
  energeticDefender = false,
): SokaijuConfrontationOptions {
  return {
    actorKashinRank: getSokaijuRank(sheetActor, 'kashin'),
    defenderKashinRank: getSokaijuRank(sheetDefender, 'kashin'),
    actorIsEnergetic: energeticActor,
    defenderIsEnergetic: energeticDefender,
  }
}

/**
 * Due effetti nello stesso istante: risolve prima chi ha IR più alto (§2.3).
 * A parità IR → Kashin → quarti narrati.
 * @returns negative se B prima, positive se A prima, 0 se pari (poi spareggio quarti)
 */
export function compareResolutionPriority(
  indexA: number,
  quartersA: number,
  indexB: number,
  quartersB: number,
  sokaiju?: Pick<SokaijuConfrontationOptions, 'actorKashinRank' | 'defenderKashinRank' | 'actorIsEnergetic' | 'defenderIsEnergetic'>,
): number {
  if (indexA !== indexB) return indexA - indexB
  const kashinCmp = compareSokaijuInitiativeTieBreak(
    sokaiju?.actorKashinRank ?? 0,
    sokaiju?.defenderKashinRank ?? 0,
    sokaiju?.actorIsEnergetic ?? false,
    sokaiju?.defenderIsEnergetic ?? false,
  )
  if (kashinCmp !== 0) return kashinCmp
  return quartersB - quartersA
}

/**
 * Confronto binario tra due azioni (attacco vs parata, ecc.).
 * Pareggio IR → vince chi ha speso **meno** quarti; stesso quarto → Stallo.
 */
export function resolveConfrontation(
  sheetActor: SkiruSheet,
  actorInput: ActionIndexInput,
  sheetDefender: SkiruSheet,
  defenderInput: ActionIndexInput,
  sokaiju?: SokaijuConfrontationOptions,
): ConfrontationResult {
  const actor = calculateSuccessIndex(sheetActor, actorInput)
  const defender = calculateSuccessIndex(sheetDefender, defenderInput)

  if (actor.successIndex > defender.successIndex) {
    return { outcome: 'actor_wins', actor, defender, stalemate: false }
  }
  if (defender.successIndex > actor.successIndex) {
    return { outcome: 'defender_wins', actor, defender, stalemate: false }
  }

  const kashinCmp = compareSokaijuInitiativeTieBreak(
    sokaiju?.actorKashinRank ?? getSokaijuRank(sheetActor, 'kashin'),
    sokaiju?.defenderKashinRank ?? getSokaijuRank(sheetDefender, 'kashin'),
    sokaiju?.actorIsEnergetic ?? false,
    sokaiju?.defenderIsEnergetic ?? false,
  )
  if (kashinCmp > 0) {
    return { outcome: 'actor_wins', actor, defender, stalemate: false }
  }
  if (kashinCmp < 0) {
    return { outcome: 'defender_wins', actor, defender, stalemate: false }
  }

  if (actor.quartersSpent < defender.quartersSpent) {
    return { outcome: 'actor_wins', actor, defender, stalemate: false }
  }
  if (defender.quartersSpent < actor.quartersSpent) {
    return { outcome: 'defender_wins', actor, defender, stalemate: false }
  }

  return { outcome: 'stalemate', actor, defender, stalemate: true }
}

/** Il colpo o l'effetto offensivo passa solo se l'attaccante vince il confronto. */
export function didOffensiveActionLand(result: ConfrontationResult): boolean {
  return result.outcome === 'actor_wins'
}
