/**
 * Simulatore combattimento v3 — IR + Tier + CS.
 * Niente Reflexes, Jigoka, né stats legacy F/C/D/M/E.
 * Refs: COMBAT_SPEC.md v3, ROADMAP.md §5
 *
 * Iniziativa: coin flip (in v3 il Master la gestisce narrativamente;
 * nel simulatore usiamo randomizzazione per rappresentare parità di partenza).
 */

import {
  calculateHpMaxFromSkiru,
  type SkiruSheet,
} from '@domain/skiru'
import {
  resolveDamageToHp,
  getTierCsCost,
  CS_PER_HIT_TAKEN,
  overheatDamagePerTurn,
  resolveChronoStackEndOfTurn,
  applyTurnChronoGain,
  createStatusContainer,
  applyStatus,
  tickStatusEndOfCharacterTurn,
  onSuccessfulHitTaken,
  onConfrontationStatusEvent,
  calculateSuccessIndexWithStatus,
  adjustCsCostFromStatus,
  statusToOffensiveDamageBonuses,
  statusToDamageTakenFlatBonus,
  compileStatusModifiers,
  type WazaTier,
  type ChronoStackState,
  type StatusContainer,
  type StatusId,
} from '@domain/combat'

// ─── Skiru di default per azioni tipiche ────────────────────────────────────
// Possono essere sovrascritti nel CombatBuild.
const DEFAULT_ATK_PHYSICAL = 'kensei'           // Tōsō · Chi
const DEFAULT_ATK_CHANNELING = 'itten-kokan'    // Shinka no Nagare · Jin
const DEFAULT_DEF_PHYSICAL = 'hansha'           // Binshō · Chi
const DEFAULT_DEF_CHANNELING = 'shintai-kokan'  // Shinka no Nagare · Jin

// ─── Tipi pubblici ───────────────────────────────────────────────────────────

export interface CombatBuild {
  name: string
  skiruSheet: SkiruSheet
  /** Tier massimo delle waza che il build può usare. */
  wazaTier: WazaTier
  /** Skiru fisica per l'IR offensivo (dominio Chi). Default: kensei. */
  physicalSkiruId?: string
  /** Skiru incanalamento per l'IR offensivo (dominio Jin). Default: itten-kokan. */
  channelingSkiruId?: string
  /** Skiru fisica per l'IR difensivo (dominio Chi). Default: hansha. */
  defensePhysicalSkiruId?: string
  /** Skiru incanalamento per l'IR difensivo (dominio Jin). Default: shintai-kokan. */
  defenseChannelingSkiruId?: string
  /** Status attivi all'inizio del combattimento. */
  initialStatusIds?: StatusId[]
}

/** Stato interno di un combattente durante la simulazione. */
export interface CombatState {
  hp: number
  cs: number
  overheatTurns: number
  skipNextTurn: boolean
  statuses: StatusContainer
}

export type LogEntry =
  | { type: 'initiative'; firstWho: string; secondWho: string }
  | { type: 'turn_start'; who: string; turn: number; csBefore: number; overheatDmg?: number; statusDot?: number }
  | { type: 'status_tick'; who: string; selfDamage: number; messages: string[] }
  | { type: 'defaticamento'; who: string }
  | { type: 'pass'; who: string; reason: string }
  | {
      type: 'waza'
      who: string
      wazaTier: WazaTier
      costCs: number
      irAttacker: number
      irDefender: number
      outcome: 'hit' | 'miss' | 'stalemate'
      dmg: number
      target: string
      pipeline?: {
        baseDamage: number
        shieldAbsorbed: number
        afterShield: number
        mitigationPercent: number
      }
    }
  | { type: 'hit'; who: string; target: string; dmg: number; targetHpAfter: number }
  | { type: 'miss'; who: string; target: string }
  | { type: 'ko'; who: string }
  | { type: 'timeout' }

export interface CombatResult {
  winner: string | null
  turnCount: number
  log: LogEntry[]
}

// ─── Logica interna ──────────────────────────────────────────────────────────

const MAX_TURNS = 150

type Side = 'A' | 'B'

/**
 * Scende dal tier massimo fino a trovare il primo tier che il combattente
 * può permettersi in CS. Ritorna null se nemmeno T1 è accessibile.
 */
function chooseBestAffordableTier(
  maxTier: WazaTier,
  cs: number,
  statuses: StatusContainer,
): WazaTier | null {
  for (let t = maxTier; t >= 1; t--) {
    const cost = adjustCsCostFromStatus(getTierCsCost(t as WazaTier), statuses)
    if (cs >= cost) return t as WazaTier
  }
  return null
}

function stateToChronoState(s: CombatState): ChronoStackState {
  return { current: s.cs, overheatTurns: s.overheatTurns, skipNextTurn: s.skipNextTurn }
}

function buildInitialStatuses(ids: StatusId[] | undefined): StatusContainer {
  let container = createStatusContainer('character')
  for (const id of ids ?? []) {
    container = applyStatus(container, id)
  }
  return container
}

function applyChronoTurnGain(state: CombatState, options: { accumulatingDeclared: boolean; successfulHitTaken?: boolean }): void {
  const mods = compileStatusModifiers(state.statuses)
  if (mods.blockCsGain) return
  const next = applyTurnChronoGain(stateToChronoState(state), {
    accumulatingDeclared: options.accumulatingDeclared,
    successfulHitTaken: options.successfulHitTaken,
    bonusCs: mods.bonusCsPerTurn,
  })
  state.cs = next.current
}

// ─── Simulazione principale ───────────────────────────────────────────────────

export function runCombat(buildA: CombatBuild, buildB: CombatBuild): CombatResult {
  const hpA = Math.max(1, calculateHpMaxFromSkiru(buildA.skiruSheet))
  const hpB = Math.max(1, calculateHpMaxFromSkiru(buildB.skiruSheet))

  const stateA: CombatState = {
    hp: hpA,
    cs: 0,
    overheatTurns: 0,
    skipNextTurn: false,
    statuses: buildInitialStatuses(buildA.initialStatusIds),
  }
  const stateB: CombatState = {
    hp: hpB,
    cs: 0,
    overheatTurns: 0,
    skipNextTurn: false,
    statuses: buildInitialStatuses(buildB.initialStatusIds),
  }

  // Iniziativa: coin flip (nessun Reflexes in v3)
  const first: Side = Math.random() < 0.5 ? 'A' : 'B'
  const second: Side = first === 'A' ? 'B' : 'A'

  const builds: Record<Side, CombatBuild> = { A: buildA, B: buildB }
  const states: Record<Side, CombatState> = { A: stateA, B: stateB }
  const nameOf = (s: Side) => builds[s].name
  const oppSide = (s: Side): Side => (s === 'A' ? 'B' : 'A')

  const order: [Side, Side] = [first, second]
  const log: LogEntry[] = []

  log.push({ type: 'initiative', firstWho: nameOf(first), secondWho: nameOf(second) })

  let turnCount = 0

  outer: for (let t = 0; t < MAX_TURNS; t++) {
    for (const who of order) {
      const opp = oppSide(who)
      const build = builds[who]
      const oppBuild = builds[opp]
      const state = states[who]
      const oppState = states[opp]

      if (state.hp <= 0 || oppState.hp <= 0) break outer

      turnCount++

      // 1. Danno Overheat: −2 PV per ogni stack oltre 20
      const ovhDmg = overheatDamagePerTurn(state.cs)
      if (ovhDmg > 0) {
        state.hp = Math.max(0, state.hp - ovhDmg)
        log.push({ type: 'turn_start', who: nameOf(who), turn: turnCount, csBefore: state.cs, overheatDmg: ovhDmg })
        if (state.hp <= 0) {
          log.push({ type: 'ko', who: nameOf(who) })
          return { winner: nameOf(opp), turnCount, log }
        }
      } else {
        log.push({ type: 'turn_start', who: nameOf(who), turn: turnCount, csBefore: state.cs })
      }

      // 2. Defaticamento: se il flag è settato, salta il turno
      if (state.skipNextTurn) {
        state.skipNextTurn = false
        log.push({ type: 'defaticamento', who: nameOf(who) })
        continue
      }

      // 3. Guadagno CS turno (+3 + bonus status, rispetta Disperazione)
      applyChronoTurnGain(state, { accumulatingDeclared: true })

      if (compileStatusModifiers(state.statuses).blockWaza) {
        log.push({ type: 'pass', who: nameOf(who), reason: 'Status blocca l\'uso di Waza' })
        const next = resolveChronoStackEndOfTurn(stateToChronoState(state))
        state.cs = next.current
        state.overheatTurns = next.overheatTurns
        state.skipNextTurn = next.skipNextTurn
        continue
      }

      // 4. Scegli il miglior tier accessibile (costo CS modificato da status)
      const tier = chooseBestAffordableTier(build.wazaTier, state.cs, state.statuses)
      if (tier == null) {
        log.push({ type: 'pass', who: nameOf(who), reason: 'CS insufficienti per qualsiasi Waza' })
        const next = resolveChronoStackEndOfTurn(stateToChronoState(state))
        state.cs = next.current
        state.overheatTurns = next.overheatTurns
        state.skipNextTurn = next.skipNextTurn
        continue
      }

      const costCs = adjustCsCostFromStatus(getTierCsCost(tier), state.statuses)

      const actionInput = {
        physicalSkiruId: build.physicalSkiruId ?? DEFAULT_ATK_PHYSICAL,
        channelingSkiruId: build.channelingSkiruId ?? DEFAULT_ATK_CHANNELING,
        quartersSpent: 1,
      }
      const defenseInput = {
        physicalSkiruId: oppBuild.defensePhysicalSkiruId ?? DEFAULT_DEF_PHYSICAL,
        channelingSkiruId: oppBuild.defenseChannelingSkiruId ?? DEFAULT_DEF_CHANNELING,
        quartersSpent: 1,
      }

      const irAtk = calculateSuccessIndexWithStatus(build.skiruSheet, actionInput, state.statuses)
      const irDef = calculateSuccessIndexWithStatus(oppBuild.skiruSheet, defenseInput, oppState.statuses)

      state.cs -= costCs

      if (irAtk.successIndex > irDef.successIndex) {
        const offensiveBonuses = statusToOffensiveDamageBonuses(state.statuses, tier)
        const takenFlat = statusToDamageTakenFlatBonus(oppState.statuses, tier)
        const pipeline = resolveDamageToHp({
          tier,
          targetSheet: oppBuild.skiruSheet,
          bonuses: {
            ...offensiveBonuses,
            flatBonus: (offensiveBonuses.flatBonus ?? 0) + takenFlat,
          },
        })
        const dmg = pipeline.hpDamage

        if (!compileStatusModifiers(oppState.statuses).blockCsGain) {
          oppState.cs += CS_PER_HIT_TAKEN
        }
        oppState.hp = Math.max(0, oppState.hp - dmg)
        oppState.statuses = onSuccessfulHitTaken(oppState.statuses)
        state.statuses = onConfrontationStatusEvent(state.statuses, { won: true, tookDamage: false })
        oppState.statuses = onConfrontationStatusEvent(oppState.statuses, { won: false, tookDamage: true })

        log.push({
          type: 'waza',
          who: nameOf(who),
          wazaTier: tier,
          costCs,
          irAttacker: irAtk.successIndex,
          irDefender: irDef.successIndex,
          outcome: 'hit',
          dmg,
          target: nameOf(opp),
          pipeline: {
            baseDamage: pipeline.baseDamage,
            shieldAbsorbed: pipeline.shieldAbsorbed,
            afterShield: pipeline.afterShield,
            mitigationPercent: pipeline.mitigationPercent,
          },
        })
        log.push({ type: 'hit', who: nameOf(who), target: nameOf(opp), dmg, targetHpAfter: oppState.hp })

        if (oppState.hp <= 0) {
          log.push({ type: 'ko', who: nameOf(opp) })
          return { winner: nameOf(who), turnCount, log }
        }
      } else if (irAtk.successIndex === irDef.successIndex) {
        state.statuses = onConfrontationStatusEvent(state.statuses, { won: false, tookDamage: false })
        oppState.statuses = onConfrontationStatusEvent(oppState.statuses, { won: false, tookDamage: false })
        log.push({
          type: 'waza',
          who: nameOf(who),
          wazaTier: tier,
          costCs,
          irAttacker: irAtk.successIndex,
          irDefender: irDef.successIndex,
          outcome: 'stalemate',
          dmg: 0,
          target: nameOf(opp),
        })
      } else {
        state.statuses = onConfrontationStatusEvent(state.statuses, { won: false, tookDamage: false })
        oppState.statuses = onConfrontationStatusEvent(oppState.statuses, { won: true, tookDamage: false })
        log.push({
          type: 'waza',
          who: nameOf(who),
          wazaTier: tier,
          costCs,
          irAttacker: irAtk.successIndex,
          irDefender: irDef.successIndex,
          outcome: 'miss',
          dmg: 0,
          target: nameOf(opp),
        })
        log.push({ type: 'miss', who: nameOf(who), target: nameOf(opp) })
      }

      // 5. Fine turno: status (DoT + decay) + Overheat → eventuale Defaticamento
      const statusTick = tickStatusEndOfCharacterTurn(state.statuses, { currentCs: state.cs })
      state.statuses = statusTick.container
      if (statusTick.selfDamage > 0) {
        state.hp = Math.max(0, state.hp - statusTick.selfDamage)
        log.push({
          type: 'status_tick',
          who: nameOf(who),
          selfDamage: statusTick.selfDamage,
          messages: statusTick.log,
        })
        if (state.hp <= 0) {
          log.push({ type: 'ko', who: nameOf(who) })
          return { winner: nameOf(opp), turnCount, log }
        }
      }

      const next = resolveChronoStackEndOfTurn(stateToChronoState(state))
      state.cs = next.current
      state.overheatTurns = next.overheatTurns
      state.skipNextTurn = next.skipNextTurn
    }
  }

  log.push({ type: 'timeout' })
  return { winner: null, turnCount, log }
}

// ─── Helper ─────────────────────────────────────────────────────────────────

/** Build vuota per test rapidi (sheet vuota = HP base 20, IR 0). */
export function createDefaultBuild(name: string, tier: WazaTier = 2): CombatBuild {
  return { name, skiruSheet: {}, wazaTier: tier }
}
