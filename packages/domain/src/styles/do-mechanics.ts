import {
  processTensioneEndOfTurn,
  processTensioneManualAccumulate,
  releaseTensione,
  resolveTensioneState,
  type TensioneState,
} from './ito/tensione'
import { resolveJunkanState, type JunkanState } from './naikan/junkan'
import { resolveYuragiState, type YuragiPhase, type YuragiState } from './hensei/yuragi'
import { resolveAtsuryokuState, type AtsuryokuState } from './hado/atsuryoku'
import { readInvestimentoFromMeta, type InvestimentoState } from './hado/investimento'
import { readShakkinDebts, type ShakkinDebtEntry } from './hado/debito-shakkin'
import { readNagoriState, type ConsistencyKind } from './hensei/nagori'
import { isWazaTier, type WazaTier } from '../combat/tier'

export type DoMechanicsUiMeta = {
  itoTension?: number
  /** True se nel turno corrente sono stati dichiarati fili Itō (+1/+2 manuale). */
  itoUsedThisTurn?: boolean
  naikanPhase?: number
  yuragiPhase?: string
  yuragiLastConsistency?: string
  hadoPressure?: number
  gosaStacks?: number
  /** Tier ultimo colpo subìto (Junnō / Hibiki) — aggiornato in combattimento o da pannello. */
  lastReceivedHitTier?: number
  /** Tōshi · Investimento Energetico */
  hadoInvestimentoActive?: boolean
  hadoInvestimentoTurnsLeft?: number
  hadoInvestimentoPoolCs?: number
  hadoInvestimentoDepositedThisTurn?: boolean
  hadoInvestimentoPayout?: {
    poolCs: number
    flatDamage: number
    rangeBonusM: number
  } | null
  /** Shakkin · debiti verso altri PG */
  hadoDebts?: Array<{
    debtorCharacterId: string
    stacks: number
    turnsLeft: number
  }>
  /** Kōmei · inversioni attive */
  naikanKomei?: import('./naikan/komei').NaikanKomeiState | null
  /** Shokushin · bersaglio letto */
  naikanReadTarget?: import('./naikan/shokushin').NaikanReadTarget | null
  /** Nagori · principio instabilità */
  henseiNagori?: import('./hensei/nagori').HenseiNagoriState | null
  /** Kankatsu · Giurisdizione Itō */
  itoGiurisdizione?: import('./ito/giurisdizione').ItoGiurisdizioneState | null
  /** Chokurei · Decreto Itō */
  itoDecreto?: import('./ito/chokurei').ItoDecretoState | null
  /** Musō Shihai · dominio onirico */
  itoMugenShihai?: import('./ito/mugen-shihai').ItoMugenShihaiState | null
  /** Rakuen · Eden Genzai */
  genzaiEden?: import('./genzai/rakuen').GenzaiEdenState | null
  genzaiEdenDestroyedQueue?: import('./genzai/rakuen').EdenDestroyedConstructSnapshot[]
  /** Meisaku · Opera Prima */
  genzaiMeisaku?: import('./genzai/meisaku').GenzaiMeisakuState | null
  /** Hōgō · Sutura (sul bersaglio) */
  naikanSutura?: import('./naikan/hogo').NaikanSuturaState | null
  /** Passive Generiche · Kajiba / Iai */
  genericheKajibaHalfHpTriggered?: boolean
  genericheKajibaTierBonusPending?: boolean
  genericheIaiReady?: boolean
  genericheIaiWazaLaunchesThisTurn?: number
  genericheIaiDamagedTargetIds?: string[]
  genericheTurnWazaUsed?: boolean
  /** Omocha · Arma Psichica */
  tokaOmocha?: import('./toka/omocha').TokaOmochaState | null
  /** Gangushi · multi Tōrō */
  tokaGangushi?: import('./toka/gangushi').TokaGangushiState | null
  /** Igyō-Rensei · ultimo forzamento consistenza */
  henseiIgyoLast?: import('./hensei/igyo-rensei').HenseiIgyoState | null
  /** Komonoire · arma del dado demoniaco (turno corrente) */
  komonoireWeapon?: import('./madosho/komonoire').KomonoireWeaponState | null
  /** Kyōshin · vibrazione sul bersaglio */
  genericheKyoshin?: import('./generiche/kyoshin').GenericheKyoshinState | null
}

export type DoMechanicsSnapshot = {
  ito: TensioneState
  naikan: JunkanState
  hensei: YuragiState
  hado: AtsuryokuState
  investimento: InvestimentoState
  shakkinDebts: ShakkinDebtEntry[]
  currentCs?: number
  lastReceivedHitTier?: WazaTier | null
  /** Ultimo shift Nagori (bonus collaterale al prossimo colpo). */
  nagoriLastFrom?: ConsistencyKind | null
}

export function readDoMechanicsFromMeta(
  meta: DoMechanicsUiMeta | null | undefined,
  currentCs = 0,
): DoMechanicsSnapshot {
  const rawTier = meta?.lastReceivedHitTier
  const lastReceivedHitTier =
    typeof rawTier === 'number' && isWazaTier(rawTier) ? rawTier : null
  return {
    ito: resolveTensioneState(meta?.itoTension ?? 0),
    naikan: resolveJunkanState(meta?.naikanPhase ?? 0),
    hensei: resolveYuragiState(
      meta?.yuragiPhase ?? 'neutro',
      meta?.yuragiLastConsistency,
    ),
    hado: resolveAtsuryokuState(meta?.hadoPressure ?? 0, currentCs),
    investimento: readInvestimentoFromMeta(meta),
    shakkinDebts: readShakkinDebts(meta),
    currentCs,
    lastReceivedHitTier,
    nagoriLastFrom: readNagoriState(meta)?.lastFrom ?? null,
  }
}

/** Campi opzionali per `WazaResolveContext` da snapshot meccaniche Dō. */
export function mapDoMechanicsToWazaResolveFields(
  snapshot: DoMechanicsSnapshot | null | undefined,
): {
  currentCs?: number | null
  atsuryokuPressure?: number | null
  yuragiParityNext?: boolean
  lastReceivedHitTier?: WazaTier | null
  itoIrBonus?: number | null
  nagoriCollateralFrom?: ConsistencyKind | null
} {
  if (!snapshot) return {}
  return {
    currentCs: snapshot.currentCs ?? null,
    atsuryokuPressure: snapshot.hado.pressure,
    yuragiParityNext: snapshot.hensei.phase !== 'neutro',
    lastReceivedHitTier: snapshot.lastReceivedHitTier ?? null,
    itoIrBonus: snapshot.ito.irBonus,
    nagoriCollateralFrom: snapshot.nagoriLastFrom ?? null,
  }
}

export type DoMechanicsPatch =
  | { style: 'ito'; action: 'release' }
  | { style: 'ito'; action: 'accumulate'; threads?: 1 | 2 }
  | { style: 'ito'; action: 'tickTurn' }
  | { style: 'naikan'; action: 'reset' | 'advance' }
  | { style: 'hensei'; action: 'setPhase'; phase: YuragiPhase }
  | { style: 'hado'; action: 'vent' }

export type ItoTensionPatchResult = {
  meta: DoMechanicsUiMeta
  overflowAdded: number
  emorragiaStacks: number
  decayed: number
  csSpent: number
}

export function accumulateItoTensionInMeta(
  meta: DoMechanicsUiMeta,
  threads: 1 | 2 = 1,
): ItoTensionPatchResult {
  const result = processTensioneManualAccumulate(meta.itoTension ?? 0, threads)
  return {
    meta: {
      ...meta,
      itoTension: result.rawLevel,
      itoUsedThisTurn: true,
    },
    overflowAdded: result.overflowAdded,
    emorragiaStacks: result.emorragiaStacks,
    decayed: 0,
    csSpent: 0,
  }
}

export function tickItoTensionInMeta(meta: DoMechanicsUiMeta): ItoTensionPatchResult {
  const result = processTensioneEndOfTurn(meta.itoTension ?? 0, meta.itoUsedThisTurn ?? false)
  return {
    meta: {
      ...meta,
      itoTension: result.rawLevel,
      itoUsedThisTurn: false,
    },
    overflowAdded: 0,
    emorragiaStacks: 0,
    decayed: result.decayed,
    csSpent: 0,
  }
}

export function releaseItoTensionInMeta(meta: DoMechanicsUiMeta): DoMechanicsUiMeta {
  return {
    ...meta,
    itoTension: releaseTensione(meta.itoTension ?? 0, 2),
  }
}

export function patchDoMechanicsMeta(
  meta: DoMechanicsUiMeta,
  patch: DoMechanicsPatch,
): DoMechanicsUiMeta {
  let next = { ...meta }
  switch (patch.style) {
    case 'ito':
      if (patch.action === 'release') {
        next = releaseItoTensionInMeta(next)
      } else if (patch.action === 'accumulate') {
        next = accumulateItoTensionInMeta(next, patch.threads ?? 1).meta
      } else if (patch.action === 'tickTurn') {
        next = tickItoTensionInMeta(next).meta
      }
      break
    case 'naikan':
      if (patch.action === 'reset') next.naikanPhase = 0
      if (patch.action === 'advance') next.naikanPhase = Math.min(3, (next.naikanPhase ?? 0) + 1)
      break
    case 'hensei':
      if (patch.action === 'setPhase') next.yuragiPhase = patch.phase
      break
    case 'hado':
      if (patch.action === 'vent') next.hadoPressure = Math.max(0, (next.hadoPressure ?? 0) - 4)
      break
  }
  return next
}
