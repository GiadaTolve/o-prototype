/**
 * Profilo costrutto derivato da blocco EVOCA_COSTRUTTO + contesto creatore.
 *
 * Resistenza: ⌊(rank Kongen + numero_tier) × mult_taglia⌋
 * Gosa (limite globale PG): max costrutti simultanei = 2 + Seimitsu
 */

import {
  CONSTRUCT_SIZES,
  calculateConstructResistance,
  type ConstructSizeId,
} from './constructs'
import { calculateMovementMetersPerQuarterFromSkiru } from '../skiru/derived-stats'
import { getSkiruPoints } from '../skiru/progression'
import { getSokaijuRank } from '../skiru/sokaiju-combat'
import { getTierValue, isWazaTier, type WazaTier } from './tier'
import { calculateGosaMaxSimultaneousConstructs } from '../styles/genzai/gosa-construct-limit'

export const CONSTRUCT_PROPRIETA_IDS = ['BATTERIA', 'PERSONALE', 'TORO'] as const
export type ConstructProprietaId = (typeof CONSTRUCT_PROPRIETA_IDS)[number]

export const BATTERIA_CS_CAP = 5

export type ConstructMeiAuthoring = {
  etichetta?: string
  inviolabile?: boolean
}

export type ConstructMeiProfile = {
  attivo: true
  conta_per_gosa: boolean
  etichetta?: string
  inviolabile?: boolean
}

export type ValoreEffetto =
  | { tipo: 'FISSO'; n: number }
  | { tipo: 'TIER' }
  | { tipo: 'TIER_DELTA'; n: number }
  | { tipo: string; n?: number; x?: number }

export type DeriveConstructInput = {
  wazaTier: WazaTier | number
  taglia: ConstructSizeId | string
  consistenza?: string
  comportamento?: 'COMANDATO' | 'SEGUE' | 'AUTO_REAZIONE' | 'STATICO' | string
  proprieta?: ConstructProprietaId[]

  creator: {
    sheet: import('../skiru/types').SkiruSheet
    styleGenitore?: string | null
    isAnalystConscious?: boolean
  }

  resistenza?: ValoreEffetto | 'DERIVATA' | unknown
  danno?: ValoreEffetto | 'DERIVATA' | null | unknown
  movimento_m?: number | 'DERIVATA' | null
  gittata_controllo_m?: number | null

  toro_da_arma?: boolean
  armaSorgente?: {
    dannoBase: number
    taglia: ConstructSizeId
  }

  mei?: ConstructMeiAuthoring | null
}

export type DerivedConstructProfile = {
  taglia_effettiva: ConstructSizeId
  resistenza: number
  danno: number | null
  movimento_m: number | null
  gittata_controllo_m: number | null
  proprieta: ConstructProprietaId[]
  mei: ConstructMeiProfile | null
  flags: {
    solo_creatore_controlla: boolean
    scioglie_se_analista_ko_o_morto: boolean
    bersagliabile_manipolazione_altrui: boolean
    bersagliabile_trasformazione_altrui: boolean
  }
  battery?: { cap_cs: number; stored_cs: number }
  /** Limite globale sul creatore (non sulla scheda singolo costrutto). */
  limite_globale_costrutti_gosa: number
}

function normalizeSize(value: string | undefined): ConstructSizeId {
  const map: Record<string, ConstructSizeId> = {
    piccola: 'piccola',
    Piccola: 'piccola',
    media: 'media',
    Media: 'media',
    grande: 'grande',
    Grande: 'grande',
    enorme: 'enorme',
    Enorme: 'enorme',
  }
  return map[value ?? ''] ?? 'media'
}

function isGenzaiGenitore(genitore: string | null | undefined): boolean {
  if (!genitore) return false
  return /genzai/i.test(genitore)
}

function resolveTierNumber(wazaTier: WazaTier | number): WazaTier {
  return typeof wazaTier === 'number' && isWazaTier(wazaTier) ? wazaTier : 1
}

function resolveValoreDanno(
  spec: ValoreEffetto | 'DERIVATA' | unknown,
  wazaTier: WazaTier,
): number | null {
  if (spec === 'DERIVATA' || spec == null) {
    return getTierValue(wazaTier)
  }
  if (typeof spec !== 'object' || spec === null || !('tipo' in spec)) return null
  const v = spec as ValoreEffetto
  switch (v.tipo) {
    case 'FISSO':
      return typeof v.n === 'number' ? v.n : null
    case 'TIER':
      return getTierValue(wazaTier)
    case 'TIER_DELTA': {
      const delta = typeof v.n === 'number' ? v.n : 0
      const next = Math.min(5, Math.max(1, wazaTier + delta))
      return getTierValue(next as WazaTier)
    }
    default:
      return null
  }
}

export function deriveConstructProfile(input: DeriveConstructInput): DerivedConstructProfile {
  const tier = resolveTierNumber(input.wazaTier)
  const proprieta = [...(input.proprieta ?? [])]
  const hasToro = proprieta.includes('TORO')
  const hasPersonale = proprieta.includes('PERSONALE')
  const hasBatteria = proprieta.includes('BATTERIA')
  const sheet = input.creator.sheet

  const taglia_effettiva =
    hasToro && input.toro_da_arma !== false && input.armaSorgente?.taglia
      ? input.armaSorgente.taglia
      : normalizeSize(String(input.taglia))

  const kongenRank = getSokaijuRank(sheet, 'kongen')
  const resistenza =
    input.resistenza === 'DERIVATA' || input.resistenza == null
      ? calculateConstructResistance(kongenRank, tier, taglia_effettiva)
      : typeof input.resistenza === 'object' &&
          input.resistenza !== null &&
          'tipo' in input.resistenza
        ? resolveValoreDanno(input.resistenza, tier) ?? calculateConstructResistance(kongenRank, tier, taglia_effettiva)
        : calculateConstructResistance(kongenRank, tier, taglia_effettiva)

  const mobile = input.comportamento !== 'STATICO'
  const sizeDef = CONSTRUCT_SIZES[taglia_effettiva]
  const movimentoBase = calculateMovementMetersPerQuarterFromSkiru(sheet)
  const movimento_m =
    !mobile
      ? null
      : input.movimento_m === 'DERIVATA' || input.movimento_m == null
        ? Math.floor(movimentoBase * sizeDef.movementMult)
        : input.movimento_m

  let danno: number | null = null
  if (hasToro && input.toro_da_arma !== false && input.armaSorgente) {
    danno = Math.max(0, Math.floor(input.armaSorgente.dannoBase))
  } else if (input.danno !== null && input.danno !== 'DERIVATA') {
    danno = resolveValoreDanno(input.danno, tier)
  } else if (input.danno === 'DERIVATA' || (input.danno && typeof input.danno === 'object')) {
    danno = resolveValoreDanno(input.danno, tier)
  }

  const isGenzai = isGenzaiGenitore(input.creator.styleGenitore ?? null)
  const mei: ConstructMeiProfile | null =
    isGenzai && input.mei
      ? {
          attivo: true,
          conta_per_gosa: !input.mei.inviolabile,
          etichetta: input.mei.etichetta?.trim() || undefined,
          inviolabile: input.mei.inviolabile ?? false,
        }
      : null

  const seimitsu = getSkiruPoints(sheet, 'seimitsu')

  return {
    taglia_effettiva,
    resistenza,
    danno,
    movimento_m,
    gittata_controllo_m: input.gittata_controllo_m ?? null,
    proprieta,
    mei,
    flags: {
      solo_creatore_controlla: hasPersonale,
      scioglie_se_analista_ko_o_morto: hasPersonale,
      bersagliabile_manipolazione_altrui: !hasToro,
      bersagliabile_trasformazione_altrui: !hasToro,
    },
    battery: hasBatteria ? { cap_cs: BATTERIA_CS_CAP, stored_cs: 0 } : undefined,
    limite_globale_costrutti_gosa: calculateGosaMaxSimultaneousConstructs(seimitsu),
  }
}

/** Anteprima editor / chat: riassunto leggibile. */
export function formatConstructProfilePreview(
  profile: DerivedConstructProfile,
  opts?: { kongenRank?: number; wazaTier?: number },
): string {
  const parts: string[] = []
  parts.push(`Resistenza ${profile.resistenza}`)
  if (opts?.kongenRank != null && opts.wazaTier != null) {
    const mult = CONSTRUCT_SIZES[profile.taglia_effettiva].resistanceMult
    parts[0] =
      `Resistenza ${profile.resistenza} (Kongen ${opts.kongenRank} + tier ${opts.wazaTier}) × ${mult}`
  }
  if (profile.movimento_m != null) {
    parts.push(`movimento ${profile.movimento_m} m`)
  }
  if (profile.danno != null) {
    parts.push(`danno ${profile.danno}`)
  }
  if (profile.proprieta.length > 0) {
    parts.push(profile.proprieta.join(', '))
  }
  if (profile.mei?.etichetta) {
    parts.push(`Mei «${profile.mei.etichetta}»`)
  }
  return parts.join(' · ')
}

/** Personale: dissolve se analista privo di sensi o morto (non per distanza). */
export function shouldDissolvePersonalConstruct(
  profile: Pick<DerivedConstructProfile, 'flags'>,
  analystConsciousAndAlive: boolean,
): boolean {
  if (!profile.flags.scioglie_se_analista_ko_o_morto) return false
  return !analystConsciousAndAlive
}
