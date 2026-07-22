/**
 * Automazione chat: waza avanzate + tag combattimento tracciabili.
 * Master arbitra il resto; qui si applicano effetti su meta/status/CS.
 */
import type { WazaTagCatalogEntry } from '../combat/waza-tag-preview'
import { extractWazaTagNames, normalizeWazaLookupKey } from '../combat/waza-tag-preview'
import type { StatusContainer, StatusId } from '../combat/status/types'
import type { DoMechanicsUiMeta } from '../styles/do-mechanics'
import { accumulateItoTensionInMeta } from '../styles/do-mechanics'
import {
  cashOutInvestimento,
  clearInvestimentoPayout,
  depositInvestimento,
  INVESTIMENTO_DURATION_TURNS,
  INVESTIMENTO_OPEN_CS_COST,
  openInvestimento,
  readInvestimentoFromMeta,
  tickInvestimentoEndOfTurn,
} from '../styles/hado/investimento'
import {
  collectShakkinDebts,
  openShakkinDebt,
  readShakkinDebts,
  repayShakkinDebt,
  applyShakkinInterest,
  SHAKKIN_INITIAL_STACKS,
} from '../styles/hado/debito-shakkin'
import {
  activateKomei,
  formatKomeiSegment,
  KOMEI_CS_COST,
  readKomeiState,
  tickKomeiEndOfTurn,
} from '../styles/naikan/komei'
import {
  applyShokushinReading,
  extractLetturaTargetSpec,
  formatShokushinSegment,
  SHOKUSHIN_CS_COST,
} from '../styles/naikan/shokushin'
import {
  activateNagori,
  clearNagoriCollateral,
  compileNagoriCollateralModifiers,
  extractConsistencyShift,
  formatNagoriSegment,
  NAGORI_CS_COST,
  NAGORI_DURATION_TURNS,
  nagoriCollateralLabel,
  readNagoriState,
  recordNagoriShift,
  tickNagoriEndOfTurn,
} from '../styles/hensei/nagori'
import {
  activateGiurisdizione,
  extractGiurisdizioneCategory,
  formatGiurisdizioneSegment,
  GIURISDICTION_CLAIM_CS_COST,
  GIURISDICTION_CS_COST,
  hasGiurisdizioneClaimTag,
  readGiurisdizioneState,
  tickGiurisdizioneEndOfTurn,
  tryGiurisdizioneClaim,
} from '../styles/ito/giurisdizione'
import {
  canImposeDecreto,
  CHOKUREI_CS_COST,
  extractDecretoText,
  formatDecretoSegment,
  hasDecretoApplyTag,
  imposeDecreto,
  readDecretoState,
  tickDecretoEndOfTurn,
  tryApplyDecreto,
  type DecretoEffectKind,
} from '../styles/ito/chokurei'
import {
  activateMugenShihai,
  breakMugenShihai,
  formatMugenShihaiSegment,
  hasDominioClaimTag,
  MUGEN_SHIHAI_CS_COST,
  readMugenShihaiState,
  tickMugenShihaiEndOfTurn,
} from '../styles/ito/mugen-shihai'
import {
  activateEden,
  consumeEdenRegenConstructs,
  extractEdenRegenCount,
  formatEdenSegment,
  RAKUEN_CS_COST,
  RAKUEN_REGEN_CS_PER_CONSTRUCT,
  readEdenState,
  tickEdenEndOfTurn,
  type EdenDestroyedConstructSnapshot,
} from '../styles/genzai/rakuen'
import {
  activateMeisaku,
  clearMeisaku,
  extractMeisakuLabel,
  formatMeisakuSegment,
  MEISAKU_CS_COST,
  MEISAKU_CONSTRUCT_SIZE,
  MEISAKU_WAZA_TIER,
  readMeisakuState,
} from '../styles/genzai/meisaku'
import {
  breakSutura,
  extractSuturaSpec,
  formatSuturaSegment,
  hasSuturaBreakTag,
  HOGO_BREAK_CS_COST,
  HOGO_CS_COST,
  readSuturaState,
  tickSuturaEndOfTurn,
} from '../styles/naikan/hogo'
import {
  activateOmocha,
  extractOmochaObjectLabel,
  formatOmochaSegment,
  OMOCHA_CS_COST,
  readOmochaState,
  tickOmochaEndOfTurn,
} from '../styles/toka/omocha'
import {
  activateGangushi,
  formatGangushiSegment,
  GANGUSHI_CS_COST,
  readGangushiState,
  tickGangushiEndOfTurn,
} from '../styles/toka/gangushi'
import {
  defaultShinryakuConstructLabel,
  extractShinryakuContactSpec,
  extractShinryakuLabel,
  SHINRYAKU_CONTACT_DAMAGE,
  SHINRYAKU_CS_COST,
} from '../styles/genzai/shinryaku'
import {
  extractIgyoForceSpec,
  formatIgyoSegment,
  IGYO_RENSEI_CS_COST,
  recordIgyoForce,
} from '../styles/hensei/igyo-rensei'
import {
  clearKomonoireWeapon,
  extractKomonoireRoll,
  formatKomonoireSegment,
  hasKomonoireAcceptTag,
  hasKomonoireRefuseTag,
  setKomonoireWeapon,
} from '../styles/madosho/komonoire'
import { applyStatus } from './status/engine'
import {
  findGenericheStatusPoolId,
  GENERICHE_IPPUKU_POOL,
  GENERICHE_STATUS_ON_HIT,
  processGenericheIppuku,
} from '../styles/generiche/generiche-effects'
import {
  resolveGojuElementalAutoApply,
} from '../skiru/sokaiju-combat'
import {
  extractHitDeclaredFromText,
  extractLaunchCsOverride,
  extractLaunchSkiruId,
  extractLaunchTierFromText,
  extractWazaLaunchTargetSpec,
} from './waza-launch'
import { applyFudoshinDurationRider } from './waza-skiru-riders'
import { getStatusDefinition } from './status/catalog'
import type { SkiruSheet } from '../skiru/types'
import {
  consumeKyoshinOnWazaUse,
  formatKyoshinSegment,
  KYOSHIN_DEFAULT_TIER,
  KYOSHIN_POOL,
  readKyoshinState,
} from '../styles/generiche/kyoshin'
import {
  noteWazaLaunchThisTurn,
  resolvePassiveLaunchTierBonus,
} from '../styles/generiche/passive-triggers'
import { isWazaTier, type WazaTier } from './tier'

export type WazaChatParticipant = {
  characterId: string
  name: string
  surname?: string | null
}

export type WazaChatAutomationInput = {
  content: string
  meta: DoMechanicsUiMeta
  statusContainer: StatusContainer
  wazaIndex: ReadonlyMap<string, WazaTagCatalogEntry>
  chronoCsAvailable: number
  actorCharacterId: string
  roomParticipants?: WazaChatParticipant[]
  /** Madoshō del PG — abilita tag Komonoire solo se `komonoire`. */
  madoshoId?: string | null
  /** Scheda Skiru attore — automatismi Sōkaiju (Gojū su hit elementale, ecc.). */
  actorSkiruSheet?: SkiruSheet
  /** Pool id delle passive equipaggiate (Kajiba, Iai, …). */
  equippedPassivePoolIds?: readonly string[]
}

export type WazaChatAutomationEffect =
  | { kind: 'investimento_open' }
  | { kind: 'investimento_deposit'; amount: number; csSpent: number }
  | { kind: 'investimento_cashout'; poolCs: number; flatDamage: number; rangeBonusM: number }
  | { kind: 'investimento_lost' }
  | { kind: 'investimento_expired' }
  | { kind: 'debito_applied'; debtorCharacterId: string; stacks: number }
  | { kind: 'debito_interest'; debtorCharacterId: string; stacks: number }
  | { kind: 'debito_collection'; debtorCharacterId: string; stacks: number; damage: number }
  | { kind: 'debito_repay'; debtorCharacterId: string; stacks: number; cleared: boolean }
  | { kind: 'komei_activated'; removed: StatusId[]; inversions: string[] }
  | { kind: 'shokushin_read'; targetCharacterId: string; displayName: string }
  | { kind: 'nagori_activated' }
  | { kind: 'nagori_shift'; from: string; to: string; collateral: string }
  | { kind: 'giurisdizione_activated'; category: 'proiettile' | 'raggio' }
  | { kind: 'giurisdizione_claim' }
  | { kind: 'giurisdizione_claim_rejected'; reason: string }
  | { kind: 'decreto_imposed'; text: string }
  | { kind: 'decreto_applied'; effect: DecretoEffectKind }
  | { kind: 'decreto_rejected'; reason: string }
  | { kind: 'nagori_collateral_consumed'; collateral: string }
  | { kind: 'eden_activated' }
  | {
      kind: 'eden_regen'
      constructs: EdenDestroyedConstructSnapshot[]
    }
  | { kind: 'meisaku_activated'; label?: string }
  | { kind: 'meisaku_construct'; label: string }
  | { kind: 'meisaku_cleared' }
  | { kind: 'mugen_shihai_activated' }
  | { kind: 'mugen_shihai_broken' }
  | { kind: 'mugen_dominio_claim' }
  | {
      kind: 'sutura_applied'
      victimCharacterId: string
      displayName: string
      suturaKind: 'offensiva' | 'stile' | 'elementale'
    }
  | { kind: 'sutura_broken' }
  | { kind: 'omocha_activated'; objectLabel?: string }
  | { kind: 'gangushi_activated' }
  | { kind: 'shinryaku_construct'; label: string }
  | {
      kind: 'shinryaku_contact_damage'
      victimCharacterId: string
      displayName: string
      damage: number
    }
  | { kind: 'igyo_consistency_forced'; to: string; targetLabel?: string }
  | {
      kind: 'generiche_status_applied'
      victimCharacterId: string
      displayName: string
      statusId: StatusId
      stacks?: number
      durationTurns?: number
    }
  | { kind: 'komonoire_weapon'; roll: number; label: string }
  | { kind: 'komonoire_debitore' }
  | {
      kind: 'kyoshin_vibration_applied'
      victimCharacterId: string
      displayName: string
      tier: number
    }
  | { kind: 'kyoshin_consumed'; csPenalty: number }
  | {
      kind: 'sokaiju_goju_status_applied'
      victimCharacterId: string
      displayName: string
      statusId: StatusId
      stacks: number
      durationTurns: number
    }
  | {
      kind: 'waza_launch_damage'
      victimCharacterId: string
      displayName: string
      tier: number
      wazaName: string
      skiruId?: string
      flatBonus?: number
    }

export type WazaChatAutomationResult = {
  meta: DoMechanicsUiMeta
  statusContainer: StatusContainer
  csDelta: number
  effects: WazaChatAutomationEffect[]
  log: string[]
}

const TOSHI_POOL = 'toshi-investimento-energetico'
const SHAKKIN_POOL = 'shakkin-indebitamento'
const KOMEI_POOL = 'komei-chi-lo-ha-deciso'
const SHOKUSHIN_POOL = 'shokushin-lettura-corpo'
const NAGORI_POOL = 'nagori-principio-instabilita'
const GIURISDICTION_POOL = 'kankatsu-giurisdizione'
const CHOKUREI_POOL = 'chokurei-decreto'
const RAKUEN_POOL = 'rakuen-eden'
const MEISAKU_POOL = 'meisaku-opera-prima'
const HOGO_POOL = 'hogo-sutura-ego'
const MUGEN_POOL = 'mugen-shihai-dominazione-onirica'
const OMOCHA_POOL = 'omocha-il-giocattolo'
const GANGUSHI_POOL = 'gangushi-il-giocattolaio'
const SHINRYAKU_POOL = 'shinryaku-invasione'
const IGYO_POOL = 'igyo-rensei-insegnamenti-tucker'

function messageDeclaresElementalWaza(content: string): boolean {
  return /\[Elementale\]/i.test(content)
}

export function hasMeisakuEndTag(text: string): boolean {
  return /\[meisaku:\s*termine\s*\]/i.test(text)
}

export function hasDominioBreakTag(text: string): boolean {
  return /\[dominio:\s*spezza\s*\]/i.test(text)
}

function resolvePoolIdsFromMessage(
  content: string,
  index: ReadonlyMap<string, WazaTagCatalogEntry>,
): string[] {
  const names = extractWazaTagNames(content)
  const ids: string[] = []
  for (const name of names) {
    const key = normalizeWazaLookupKey(name)
    const entry = index.get(key)
    if (entry?.poolId) ids.push(entry.poolId)
  }
  return ids
}

export function extractInvestimentoDepositAmount(text: string): number | null {
  const m = /\[investimento:\s*\+?(\d+)\s*\]/i.exec(text)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null
}

export function hasInvestimentoCashOutTag(text: string): boolean {
  return /\[investimento:\s*riscuot/i.test(text)
}

export function hasShakkinCollectionTag(text: string): boolean {
  return /\[debito:\s*riscuot/i.test(text) || /\[shakkin:\s*riscoss/i.test(text)
}

export function hasDebitoRepayTag(text: string): boolean {
  return /\[debito:\s*restituisci\]/i.test(text)
}

export function extractDebitoTargetSpec(text: string): { characterId?: string; nameQuery?: string } | null {
  const idMatch = /\[debito:\s*id:([0-9a-f-]{36})\s*\]/i.exec(text)
  if (idMatch) return { characterId: idMatch[1] }
  const nameMatch = /\[debito:\s*(?!riscuot|restituisci|id:)([^\]]+)\]/i.exec(text)
  if (!nameMatch) return null
  const q = nameMatch[1]?.trim()
  if (!q) return null
  return { nameQuery: q }
}

export function resolveParticipantBySpec(
  spec: { characterId?: string; nameQuery?: string },
  participants: WazaChatParticipant[],
  actorCharacterId: string,
): { characterId: string; displayName: string } | null {
  if (spec.characterId) {
    if (spec.characterId === actorCharacterId) return null
    const p = participants.find((x) => x.characterId === spec.characterId)
    if (!p) return null
    return {
      characterId: p.characterId,
      displayName: `${p.name}${p.surname ? ` ${p.surname}` : ''}`.trim(),
    }
  }
  if (!spec.nameQuery) return null
  const q = spec.nameQuery.toLowerCase()
  const matches = participants.filter((p) => {
    if (p.characterId === actorCharacterId) return false
    const full = `${p.name}${p.surname ? ` ${p.surname}` : ''}`.toLowerCase()
    return full.includes(q) || p.name.toLowerCase().includes(q)
  })
  if (matches.length !== 1) return null
  const p = matches[0]
  return {
    characterId: p.characterId,
    displayName: `${p.name}${p.surname ? ` ${p.surname}` : ''}`.trim(),
  }
}

export function processWazaChatAutomation(input: WazaChatAutomationInput): WazaChatAutomationResult {
  let meta: DoMechanicsUiMeta = { ...input.meta }
  let statusContainer = input.statusContainer
  let csDelta = 0
  const effects: WazaChatAutomationEffect[] = []
  const log: string[] = []

  const investimentoActiveBefore = readInvestimentoFromMeta(input.meta).active
  const hadDebtsBefore = readShakkinDebts(input.meta).length > 0
  const komeiActiveBefore = readKomeiState(input.meta) != null
  const nagoriActiveBefore = readNagoriState(input.meta) != null
  const giurisdizioneActiveBefore = readGiurisdizioneState(input.meta) != null
  const decretoActiveBefore = readDecretoState(input.meta) != null
  const edenActiveBefore = readEdenState(input.meta) != null
  const mugenActiveBefore = readMugenShihaiState(input.meta) != null
  const suturaActiveBefore = readSuturaState(input.meta) != null
  const omochaActiveBefore = readOmochaState(input.meta) != null
  const gangushiActiveBefore = readGangushiState(input.meta) != null

  const poolIds = resolvePoolIdsFromMessage(input.content, input.wazaIndex)

  if (extractWazaTagNames(input.content).length > 0) {
    const csSpend = extractLaunchCsOverride(input.content)
    if (csSpend != null && csSpend > 0) {
      csDelta -= csSpend
      log.push(`Lancio: −${csSpend} CS`)
    }
  }

  const kyoshinBefore = readKyoshinState(meta)
  if (kyoshinBefore && poolIds.length > 0) {
    const consumed = consumeKyoshinOnWazaUse(meta)
    meta = consumed.meta
    if (consumed.csPenalty > 0) {
      csDelta -= consumed.csPenalty
      effects.push({ kind: 'kyoshin_consumed', csPenalty: consumed.csPenalty })
      log.push(`Kyōshin: vibrazione scaricata (+${consumed.csPenalty} CS sulla waza)`)
    }
  }

  if (poolIds.includes(KOMEI_POOL)) {
    const komei = activateKomei(statusContainer, meta)
    if (!komei.error) {
      statusContainer = komei.container
      meta = komei.meta
      csDelta -= KOMEI_CS_COST
      effects.push({
        kind: 'komei_activated',
        removed: komei.removed,
        inversions: komei.inversions,
      })
      log.push(`Kōmei: invertiti ${komei.removed.length} status → ${komei.inversions.join(', ')}`)
    } else {
      log.push(komei.error)
    }
  }

  if (poolIds.includes(SHOKUSHIN_POOL)) {
    const spec = extractLetturaTargetSpec(input.content)
    if (spec && input.roomParticipants?.length) {
      const target = resolveParticipantBySpec(spec, input.roomParticipants, input.actorCharacterId)
      if (target) {
        meta = applyShokushinReading(meta, target)
        csDelta -= SHOKUSHIN_CS_COST
        effects.push({
          kind: 'shokushin_read',
          targetCharacterId: target.characterId,
          displayName: target.displayName,
        })
        log.push(`Shokushin: lettura ${target.displayName}`)
      }
    }
  }

  if (poolIds.includes(NAGORI_POOL)) {
    meta = activateNagori(meta)
    csDelta -= NAGORI_CS_COST
    effects.push({ kind: 'nagori_activated' })
    log.push(`Nagori: Principio di Instabilità attivo (${NAGORI_DURATION_TURNS} turni)`)
  }

  const shift = extractConsistencyShift(input.content)
  if (shift && readNagoriState(meta)) {
    meta = recordNagoriShift(meta, shift)
    const collateral = nagoriCollateralLabel(shift.from)
    effects.push({
      kind: 'nagori_shift',
      from: shift.from,
      to: shift.to,
      collateral,
    })
    log.push(`Nagori: ${shift.from}→${shift.to} (${collateral})`)
  }

  if (poolIds.includes(GIURISDICTION_POOL)) {
    const category = extractGiurisdizioneCategory(input.content)
    if (category) {
      meta = activateGiurisdizione(meta, category)
      csDelta -= GIURISDICTION_CS_COST
      effects.push({ kind: 'giurisdizione_activated', category })
      log.push(`Giurisdizione: ${category} (${GIURISDICTION_CS_COST} CS)`)
    }
  }

  if (hasGiurisdizioneClaimTag(input.content) && readGiurisdizioneState(meta)) {
    const claimedWaza = extractWazaTagNames(input.content)[0]
    const claimedEntry = claimedWaza
      ? input.wazaIndex.get(normalizeWazaLookupKey(claimedWaza))
      : undefined
    const wazaEffectText = claimedEntry?.effect ?? claimedEntry?.description ?? null
    const claim = tryGiurisdizioneClaim(meta, { wazaEffectText })
    if (!claim.ok) {
      effects.push({ kind: 'giurisdizione_claim_rejected', reason: claim.reason })
      log.push(`Giurisdizione: ${claim.reason}`)
    } else {
      meta = claim.meta
      csDelta -= GIURISDICTION_CLAIM_CS_COST
      const tension = accumulateItoTensionInMeta(meta, 1)
      meta = tension.meta
      effects.push({ kind: 'giurisdizione_claim' })
      log.push(`Giurisdizione: reclamo (+1 Tensione, ${GIURISDICTION_CLAIM_CS_COST} CS)`)
    }
  }

  if (poolIds.includes(CHOKUREI_POOL)) {
    const decree = extractDecretoText(input.content)
    if (decree) {
      if (!canImposeDecreto(meta)) {
        effects.push({ kind: 'decreto_rejected', reason: 'Hai già imposto un Decreto questo turno.' })
        log.push('Chokurei: Decreto già imposto questo turno.')
      } else {
        meta = imposeDecreto(meta, decree)
        csDelta -= CHOKUREI_CS_COST
        effects.push({ kind: 'decreto_imposed', text: decree })
        log.push(`Chokurei: «${decree}»`)
      }
    }
  }

  if (hasDecretoApplyTag(input.content) && readDecretoState(meta)) {
    const wazaNames = extractWazaTagNames(input.content)
    const entry = wazaNames[0] ? input.wazaIndex.get(normalizeWazaLookupKey(wazaNames[0])) : undefined
    const effectText = entry?.effect ?? entry?.description ?? ''
    if (effectText) {
      const applied = tryApplyDecreto(meta, effectText)
      if (!applied.ok) {
        effects.push({ kind: 'decreto_rejected', reason: applied.reason })
        log.push(`Chokurei: ${applied.reason}`)
      } else {
        meta = applied.meta
        effects.push({ kind: 'decreto_applied', effect: applied.effect })
        log.push(`Chokurei: Decreto applicato (${applied.effect})`)
      }
    }
  }

  if (poolIds.includes(RAKUEN_POOL)) {
    meta = activateEden(meta)
    csDelta -= RAKUEN_CS_COST
    effects.push({ kind: 'eden_activated' })
    log.push(`Eden: zona attiva (${RAKUEN_CS_COST} CS)`)
  }

  const edenRegenCount = extractEdenRegenCount(input.content)
  if (edenRegenCount != null && readEdenState(meta)) {
    const regenCost = RAKUEN_REGEN_CS_PER_CONSTRUCT * edenRegenCount
    csDelta -= regenCost
    const consumed = consumeEdenRegenConstructs(meta, edenRegenCount)
    meta = consumed.meta
    if (consumed.snapshots.length > 0) {
      effects.push({ kind: 'eden_regen', constructs: consumed.snapshots })
    }
    log.push(
      consumed.snapshots.length > 0
        ? `Eden: rigenerati ${consumed.snapshots.length} costrutto/i (−${regenCost} CS)`
        : `Eden: nessun costrutto in coda (−${regenCost} CS)`,
    )
  }

  if (poolIds.includes(MEISAKU_POOL)) {
    const label = extractMeisakuLabel(input.content)
    meta = activateMeisaku(meta, label)
    csDelta -= MEISAKU_CS_COST
    const constructLabel = label ?? 'Opera Prima'
    effects.push({ kind: 'meisaku_activated', label: label ?? undefined })
    effects.push({ kind: 'meisaku_construct', label: constructLabel })
    log.push(label ? `Meisaku: Opera Prima «${label}»` : 'Meisaku: Opera Prima attiva')
  }

  if (hasMeisakuEndTag(input.content) && readMeisakuState(meta)) {
    meta = clearMeisaku(meta)
    effects.push({ kind: 'meisaku_cleared' })
    log.push('Meisaku: Opera Prima conclusa')
  }

  if (poolIds.includes(MUGEN_POOL)) {
    meta = activateMugenShihai(meta)
    csDelta -= MUGEN_SHIHAI_CS_COST
    effects.push({ kind: 'mugen_shihai_activated' })
    log.push(`Musō Shihai: Dominazione Onirica (${MUGEN_SHIHAI_CS_COST} CS)`)
  }

  if (hasDominioBreakTag(input.content) && readMugenShihaiState(meta)) {
    meta = breakMugenShihai(meta)
    effects.push({ kind: 'mugen_shihai_broken' })
    log.push('Dominazione Onirica spezzata')
  }

  if (hasDominioClaimTag(input.content) && readMugenShihaiState(meta)) {
    const tension = accumulateItoTensionInMeta(meta, 1)
    meta = tension.meta
    effects.push({ kind: 'mugen_dominio_claim' })
    log.push('Dominazione Onirica: waza reclamata (+1 Tensione)')
  }

  if (poolIds.includes(HOGO_POOL)) {
    const spec = extractSuturaSpec(input.content)
    if (spec?.kind && input.roomParticipants?.length) {
      const target = resolveParticipantBySpec(spec, input.roomParticipants, input.actorCharacterId)
      if (target) {
        csDelta -= HOGO_CS_COST
        effects.push({
          kind: 'sutura_applied',
          victimCharacterId: target.characterId,
          displayName: target.displayName,
          suturaKind: spec.kind,
        })
        log.push(`Hōgō: Sutura ${spec.kind} su ${target.displayName}`)
      }
    }
  }

  if (hasSuturaBreakTag(input.content) && readSuturaState(meta)) {
    meta = breakSutura(meta)
    csDelta -= HOGO_BREAK_CS_COST
    effects.push({ kind: 'sutura_broken' })
    log.push(`Sutura spezzata (${HOGO_BREAK_CS_COST} CS)`)
  }

  if (poolIds.includes(OMOCHA_POOL)) {
    const objectLabel = extractOmochaObjectLabel(input.content)
    meta = activateOmocha(meta, objectLabel)
    csDelta -= OMOCHA_CS_COST
    effects.push({ kind: 'omocha_activated', objectLabel: objectLabel ?? undefined })
    log.push(
      objectLabel
        ? `Omocha: ${objectLabel} → [Tōrō]`
        : 'Omocha: oggetto impugnato → [Tōrō]',
    )
  }

  if (poolIds.includes(GANGUSHI_POOL)) {
    meta = activateGangushi(meta)
    csDelta -= GANGUSHI_CS_COST
    effects.push({ kind: 'gangushi_activated' })
    log.push('Gangushi: oggetti indossati → [Tōrō] simultanei')
  }

  if (poolIds.includes(SHINRYAKU_POOL)) {
    const contactSpec = extractShinryakuContactSpec(input.content)
    if (contactSpec?.nameQuery || contactSpec?.characterId) {
      if (input.roomParticipants?.length) {
        const target = resolveParticipantBySpec(contactSpec, input.roomParticipants, input.actorCharacterId)
        if (target) {
          effects.push({
            kind: 'shinryaku_contact_damage',
            victimCharacterId: target.characterId,
            displayName: target.displayName,
            damage: SHINRYAKU_CONTACT_DAMAGE,
          })
          log.push(
            `Shinryaku: contatto su ${target.displayName} · ${SHINRYAKU_CONTACT_DAMAGE} danno`,
          )
        }
      }
    }
    const customLabel = extractShinryakuLabel(input.content)
    const label = defaultShinryakuConstructLabel(customLabel)
    csDelta -= SHINRYAKU_CS_COST
    effects.push({ kind: 'shinryaku_construct', label })
    log.push(`Shinryaku: Costrutto Grande «${label}»`)
  }

  if (poolIds.includes(IGYO_POOL)) {
    const spec = extractIgyoForceSpec(input.content)
    if (spec) {
      meta = recordIgyoForce(meta, spec)
      csDelta -= IGYO_RENSEI_CS_COST
      effects.push({
        kind: 'igyo_consistency_forced',
        to: spec.to,
        targetLabel: spec.targetLabel,
      })
      log.push(`Igyō-Rensei: forzato [${spec.to}]${spec.targetLabel ? ` su ${spec.targetLabel}` : ''}`)
    }
  }

  if (poolIds.includes(GENERICHE_IPPUKU_POOL)) {
    const ippuku = processGenericheIppuku(statusContainer, input.chronoCsAvailable, csDelta)
    statusContainer = ippuku.statusContainer
    csDelta += ippuku.csDelta
    log.push(
      ippuku.overheatApplied
        ? `Ippuku: +${ippuku.csDelta} CS · [Sovraccarico] (oltre ${20} CS)`
        : `Ippuku: +${ippuku.csDelta} CS`,
    )
  }

  const genericheStatusPool = findGenericheStatusPoolId(poolIds)
  if (genericheStatusPool && input.roomParticipants?.length) {
    const hitSpec = extractWazaLaunchTargetSpec(input.content)
    if (hitSpec) {
      const target = resolveParticipantBySpec(hitSpec, input.roomParticipants, input.actorCharacterId)
      const spec = GENERICHE_STATUS_ON_HIT[genericheStatusPool]
      if (target && spec) {
        let stacks = spec.stacks
        let durationTurns = spec.durationTurns
        const declaredSkiru = extractLaunchSkiruId(input.content)
        if (input.actorSkiruSheet) {
          if (durationTurns != null) {
            durationTurns = applyFudoshinDurationRider(durationTurns, declaredSkiru) ?? durationTurns
          }
        }
        effects.push({
          kind: 'generiche_status_applied',
          victimCharacterId: target.characterId,
          displayName: target.displayName,
          statusId: spec.statusId,
          stacks,
          durationTurns,
        })
        log.push(`Generiche: [${spec.statusId}] su ${target.displayName}`)
      }
    }
  }

  if (poolIds.includes(KYOSHIN_POOL) && input.roomParticipants?.length) {
    const hitSpec = extractWazaLaunchTargetSpec(input.content)
    if (hitSpec) {
      const target = resolveParticipantBySpec(hitSpec, input.roomParticipants, input.actorCharacterId)
      if (target) {
        effects.push({
          kind: 'kyoshin_vibration_applied',
          victimCharacterId: target.characterId,
          displayName: target.displayName,
          tier: KYOSHIN_DEFAULT_TIER,
        })
        log.push(`Kyōshin: vibrazione su ${target.displayName}`)
      }
    }
  }

  if (
    input.actorSkiruSheet &&
    messageDeclaresElementalWaza(input.content) &&
    input.roomParticipants?.length
  ) {
    const hitSpec = extractWazaLaunchTargetSpec(input.content)
    const goju = resolveGojuElementalAutoApply(input.actorSkiruSheet)
    if (hitSpec && goju) {
      const target = resolveParticipantBySpec(hitSpec, input.roomParticipants, input.actorCharacterId)
      if (target) {
        let durationTurns = goju.durationTurns
        durationTurns =
          applyFudoshinDurationRider(durationTurns, extractLaunchSkiruId(input.content)) ?? durationTurns
        effects.push({
          kind: 'sokaiju_goju_status_applied',
          victimCharacterId: target.characterId,
          displayName: target.displayName,
          statusId: goju.statusId,
          stacks: goju.stacks,
          durationTurns,
        })
        log.push(`Gojū: [${goju.statusId}] su ${target.displayName} (${durationTurns} turni)`)
      }
    }
  }

  if (input.madoshoId === 'komonoire') {
    const roll = extractKomonoireRoll(input.content)
    if (roll != null) {
      meta = setKomonoireWeapon(meta, roll)
      const label = meta.komonoireWeapon?.label ?? ''
      effects.push({ kind: 'komonoire_weapon', roll, label })
      log.push(`Komonoire: dado ${roll} → ${label}`)
    }
    if (hasKomonoireAcceptTag(input.content)) {
      log.push('Komonoire: patto accettato per questo turno')
    }
    if (hasKomonoireRefuseTag(input.content)) {
      statusContainer = applyStatus(statusContainer, 'debitore')
      effects.push({ kind: 'komonoire_debitore' })
      meta = clearKomonoireWeapon(meta)
      log.push('Komonoire: rifiuto/opposizione → [Debitore]')
    }
  }

  if (poolIds.includes(TOSHI_POOL)) {
    meta = openInvestimento(meta)
    csDelta -= INVESTIMENTO_OPEN_CS_COST
    effects.push({ kind: 'investimento_open' })
    log.push(`Tōshi: Investimento aperto (${INVESTIMENTO_DURATION_TURNS} turni, CS ${INVESTIMENTO_OPEN_CS_COST})`)
  }

  const depositAmount = extractInvestimentoDepositAmount(input.content)
  if (depositAmount != null) {
    const spend = Math.min(depositAmount, input.chronoCsAvailable + csDelta)
    if (spend > 0) {
      const dep = depositInvestimento(meta, spend)
      if (!dep.error) {
        meta = dep.meta
        csDelta -= dep.deposited
        effects.push({ kind: 'investimento_deposit', amount: dep.deposited, csSpent: dep.deposited })
        log.push(`Investimento: +${dep.deposited} CS (riserva ${readInvestimentoFromMeta(meta).poolCs})`)
      }
    }
  }

  if (hasInvestimentoCashOutTag(input.content)) {
    const cash = cashOutInvestimento(meta)
    meta = cash.meta
    effects.push({
      kind: 'investimento_cashout',
      poolCs: cash.poolCs,
      flatDamage: cash.flatDamage,
      rangeBonusM: cash.rangeBonusM,
    })
    log.push(
      cash.poolCs > 0
        ? `Investimento riscosso: ${cash.poolCs} CS → +${cash.flatDamage} danno, +${cash.rangeBonusM} m`
        : 'Investimento chiuso (pool vuoto)',
    )
  }

  if (poolIds.includes(SHAKKIN_POOL)) {
    const spec = extractDebitoTargetSpec(input.content)
    if (spec && input.roomParticipants?.length) {
      const target = resolveParticipantBySpec(spec, input.roomParticipants, input.actorCharacterId)
      if (target) {
        const opened = openShakkinDebt(meta, target.characterId)
        if (opened.created) {
          meta = opened.meta
          effects.push({
            kind: 'debito_applied',
            debtorCharacterId: target.characterId,
            stacks: SHAKKIN_INITIAL_STACKS,
          })
          log.push(`Shakkin: Debito ×${SHAKKIN_INITIAL_STACKS} su ${target.displayName}`)
        }
      }
    }
  }

  if (hasShakkinCollectionTag(input.content)) {
    const spec = extractDebitoTargetSpec(input.content)
    const target = spec && input.roomParticipants?.length
      ? resolveParticipantBySpec(spec, input.roomParticipants, input.actorCharacterId)
      : null
    const collected = collectShakkinDebts(meta, target?.characterId)
    meta = collected.meta
    for (const c of collected.collections) {
      effects.push({
        kind: 'debito_collection',
        debtorCharacterId: c.debtorCharacterId,
        stacks: c.stacks,
        damage: c.damage,
      })
      log.push(`Riscossione Debito: ${c.stacks} stack → ${c.damage} danno`)
    }
  }

  if (investimentoActiveBefore) {
    const tickInv = tickInvestimentoEndOfTurn(meta)
    meta = tickInv.meta
    if (tickInv.lost) {
      effects.push({ kind: 'investimento_lost' })
      log.push('Investimento perso (turno senza versamento)')
    } else if (tickInv.expired) {
      effects.push({ kind: 'investimento_expired' })
      log.push('Investimento scaduto (durata terminata)')
    }
  }

  if (hadDebtsBefore) {
    const interest = applyShakkinInterest(meta)
    meta = interest.meta
    for (const u of interest.updates) {
      effects.push({ kind: 'debito_interest', debtorCharacterId: u.debtorCharacterId, stacks: u.stacks })
    }
    for (const e of interest.expirations) {
      effects.push({
        kind: 'debito_collection',
        debtorCharacterId: e.debtorCharacterId,
        stacks: e.stacks,
        damage: e.damage,
      })
      log.push(`Debito scaduto: ${e.stacks} stack → ${e.damage} danno`)
    }
  }

  if (komeiActiveBefore) {
    meta = tickKomeiEndOfTurn(meta)
  }

  if (nagoriActiveBefore) {
    meta = tickNagoriEndOfTurn(meta)
  }

  if (giurisdizioneActiveBefore) {
    meta = tickGiurisdizioneEndOfTurn(meta)
  }

  if (decretoActiveBefore) {
    meta = tickDecretoEndOfTurn(meta)
  }

  if (edenActiveBefore) {
    meta = tickEdenEndOfTurn(meta)
  }

  if (mugenActiveBefore) {
    meta = tickMugenShihaiEndOfTurn(meta)
  }

  if (suturaActiveBefore) {
    meta = tickSuturaEndOfTurn(meta)
  }

  if (omochaActiveBefore) {
    meta = tickOmochaEndOfTurn(meta)
  }

  if (gangushiActiveBefore) {
    meta = tickGangushiEndOfTurn(meta)
  }

  const launchedWaza = extractWazaTagNames(input.content)
  if (
    launchedWaza.length > 0 &&
    extractHitDeclaredFromText(input.content) &&
    input.roomParticipants?.length
  ) {
    const tierRaw = extractLaunchTierFromText(input.content)
    const hitSpec = extractWazaLaunchTargetSpec(input.content)
    if (tierRaw != null && hitSpec) {
      const target = resolveParticipantBySpec(hitSpec, input.roomParticipants, input.actorCharacterId)
      if (target) {
        let launchTier = tierRaw
        let flatBonus = 0

        const payout = readInvestimentoFromMeta(meta).payoutPending
        if (payout) {
          flatBonus += payout.flatDamage
          meta = clearInvestimentoPayout(meta)
          log.push(`Investimento: +${payout.flatDamage} danno sul colpo`)
          if (payout.rangeBonusM > 0) {
            log.push(`Investimento: +${payout.rangeBonusM} m gittata (narrativo)`)
          }
        }

        const passiveBonus = resolvePassiveLaunchTierBonus(
          meta,
          target.characterId,
          input.equippedPassivePoolIds,
        )
        meta = passiveBonus.meta
        if (passiveBonus.tierSteps > 0) {
          const bumped = Math.min(5, launchTier + passiveBonus.tierSteps)
          launchTier = bumped
          log.push(`Passive: +${passiveBonus.tierSteps} tier (${passiveBonus.sources.join(', ')})`)
        }

        const nagoriMods = compileNagoriCollateralModifiers(meta)
        if (nagoriMods.offensiveTierBonus) {
          const bumped = Math.min(5, launchTier + nagoriMods.offensiveTierBonus)
          launchTier = bumped
          log.push(`Nagori: +${nagoriMods.offensiveTierBonus} tier danno`)
        }
        if (nagoriMods.bonusRangeMeters) {
          log.push(`Nagori: +${nagoriMods.bonusRangeMeters} m gittata (narrativo)`)
        }
        if (nagoriMods.shieldPenetrationTier) {
          log.push(`Nagori: ignora ${nagoriMods.shieldPenetrationTier} tier Resistenza/Scudo`)
        }
        if (nagoriMods.bonusDurationTurns) {
          log.push(`Nagori: +${nagoriMods.bonusDurationTurns} turno durata (narrativo)`)
        }
        if (Object.keys(nagoriMods).length > 0) {
          const collateral = readNagoriState(meta)?.lastFrom
            ? nagoriCollateralLabel(readNagoriState(meta)!.lastFrom!)
            : 'collaterale'
          meta = clearNagoriCollateral(meta)
          effects.push({ kind: 'nagori_collateral_consumed', collateral })
          log.push('Nagori: collaterale consumato')
        }

        meta = noteWazaLaunchThisTurn(meta)

        const tier = isWazaTier(launchTier) ? launchTier : (Math.min(5, Math.max(1, launchTier)) as WazaTier)

        effects.push({
          kind: 'waza_launch_damage',
          victimCharacterId: target.characterId,
          displayName: target.displayName,
          tier,
          wazaName: launchedWaza[0]!,
          skiruId: extractLaunchSkiruId(input.content) ?? undefined,
          flatBonus: flatBonus > 0 ? flatBonus : undefined,
        })
        log.push(`Lancio waza dichiarato: T${tier} vs ${target.displayName}`)
      }
    }
  }

  return { meta, statusContainer, csDelta, effects, log }
}

export function processDebtorRepayMessage(
  creditorMeta: DoMechanicsUiMeta,
  debtorCharacterId: string,
): { meta: DoMechanicsUiMeta; stacks: number; cleared: boolean } {
  const r = repayShakkinDebt(creditorMeta, debtorCharacterId, 1)
  return { meta: { ...creditorMeta, ...r.meta }, stacks: r.newStacks, cleared: r.cleared }
}

export function formatInvestimentoStateSegment(meta: DoMechanicsUiMeta): string | null {
  const s = readInvestimentoFromMeta(meta)
  if (!s.active && !s.payoutPending) return null
  if (s.payoutPending && s.payoutPending.poolCs > 0) {
    return `Investimento riscosso: +${s.payoutPending.flatDamage} danno, +${s.payoutPending.rangeBonusM} m`
  }
  if (s.active) {
    return `Investimento: ${s.poolCs} CS (${s.turnsLeft} turni)`
  }
  return null
}

export function formatShakkinCreditorSegment(meta: DoMechanicsUiMeta): string | null {
  const debts = readShakkinDebts(meta)
  if (debts.length === 0) return null
  const total = debts.reduce((n, d) => n + d.stacks, 0)
  return `Debiti attivi: ${debts.length} (${total} stack)`
}

export function formatAdvancedCombatSegments(meta: DoMechanicsUiMeta): string[] {
  const segments: string[] = []
  const inv = formatInvestimentoStateSegment(meta)
  if (inv) segments.push(inv)
  const debts = formatShakkinCreditorSegment(meta)
  if (debts) segments.push(debts)
  const komei = formatKomeiSegment(meta)
  if (komei) segments.push(komei)
  const read = formatShokushinSegment(meta)
  if (read) segments.push(read)
  const nagori = formatNagoriSegment(meta)
  if (nagori) segments.push(nagori)
  const giurisdizione = formatGiurisdizioneSegment(meta)
  if (giurisdizione) segments.push(giurisdizione)
  const decreto = formatDecretoSegment(meta)
  if (decreto) segments.push(decreto)
  const eden = formatEdenSegment(meta)
  if (eden) segments.push(eden)
  const meisaku = formatMeisakuSegment(meta)
  if (meisaku) segments.push(meisaku)
  const mugen = formatMugenShihaiSegment(meta)
  if (mugen) segments.push(mugen)
  const sutura = formatSuturaSegment(meta)
  if (sutura) segments.push(sutura)
  const omocha = formatOmochaSegment(meta)
  if (omocha) segments.push(omocha)
  const gangushi = formatGangushiSegment(meta)
  if (gangushi) segments.push(gangushi)
  const igyo = formatIgyoSegment(meta)
  if (igyo) segments.push(igyo)
  const komonoire = formatKomonoireSegment(meta)
  if (komonoire) segments.push(komonoire)
  const kyoshin = formatKyoshinSegment(meta)
  if (kyoshin) segments.push(kyoshin)
  return segments
}

export type HadoCombatMeta = Pick<
  DoMechanicsUiMeta,
  | 'hadoInvestimentoActive'
  | 'hadoInvestimentoTurnsLeft'
  | 'hadoInvestimentoPoolCs'
  | 'hadoInvestimentoDepositedThisTurn'
  | 'hadoInvestimentoPayout'
  | 'hadoDebts'
>
