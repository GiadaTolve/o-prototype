/**
 * Richieste giocatore — Madoshō, Ordine, Skiru esclusive, Tenkan (approvazione staff).
 */

import { MADOSHO_CATALOG, type MadoshoId } from './madosho'
import { getSkiruDef } from '../skiru/catalog'

export { MADOSHO_CATALOG } from './madosho'

export const PLAYER_REQUEST_KINDS = [
  'MADOSHO',
  'ORDER',
  'SKIRU_ESCLUSIVA',
  'PREMIO',
  'TENKAN',
] as const
export type PlayerRequestKind = (typeof PLAYER_REQUEST_KINDS)[number]

export const PLAYER_REQUEST_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const
export type PlayerRequestStatus = (typeof PLAYER_REQUEST_STATUSES)[number]

export const ORDER_REQUEST_VALUES = ['MUGEN-TAI', 'CHISEN-TAI'] as const
export type OrderRequestValue = (typeof ORDER_REQUEST_VALUES)[number]

/** Skiru Jiga no Shihaisha — richiesta staff + EXP all'approvazione. */
export const EXCLUSIVE_SKIRU_REQUEST_OPTIONS: Array<{ id: string; label: string }> = [
  { id: 'keishosha', label: 'Erede (Keishōsha) — 55% waza Madoshō' },
  { id: 'kanpeki-keishosha', label: 'Erede Perfetto — 85% waza Madoshō (richiede Erede)' },
  { id: 'renkinjutsushi', label: 'Alchimista — 4 waza stessa consistenza' },
  { id: 'daisei-no-renkin', label: 'Opus Magna — 8 waza stessa consistenza (richiede Alchimista)' },
  { id: 'inkyo', label: 'Eremita (Inkyo) — percorso premio (contenuto in definizione)' },
  { id: 'sento-senshi', label: "Soldato Scelto — 55% arsenale d'ordine" },
]

/** Premi narrativi — non ancora definiti. */
export const PREMIO_REQUEST_OPTIONS: Array<{ id: string; label: string }> = []

/** Apertura accademica Terzo Occhio — unica voce, approvazione staff. */
export const TENKAN_REQUEST_VALUE = 'terzo-occhio' as const

export function labelForTenkanRequest(_value: string): string {
  return 'Apertura Terzo Occhio (Tenkan)'
}

export function labelForMadoshoRequest(value: string): string {
  return MADOSHO_CATALOG.find((m) => m.id === value)?.name ?? value
}

export function labelForOrderRequest(value: string): string {
  if (value === 'MUGEN-TAI') return 'Mugen-Tai'
  if (value === 'CHISEN-TAI') return 'Chisen-Tai'
  return value
}

export function labelForExclusiveSkiruRequest(value: string): string {
  const fromList = EXCLUSIVE_SKIRU_REQUEST_OPTIONS.find((p) => p.id === value)?.label
  if (fromList) return fromList
  const def = getSkiruDef(value)
  return def?.name ?? value
}

export function labelForPremioRequest(value: string): string {
  return PREMIO_REQUEST_OPTIONS.find((p) => p.id === value)?.label ?? value
}

export function labelForPlayerRequest(kind: PlayerRequestKind, value: string): string {
  switch (kind) {
    case 'MADOSHO':
      return labelForMadoshoRequest(value)
    case 'ORDER':
      return labelForOrderRequest(value)
    case 'SKIRU_ESCLUSIVA':
      return labelForExclusiveSkiruRequest(value)
    case 'PREMIO':
      return labelForPremioRequest(value)
    case 'TENKAN':
      return labelForTenkanRequest(value)
    default:
      return value
  }
}

export function isValidMadoshoRequest(value: string): value is MadoshoId {
  return MADOSHO_CATALOG.some((m) => m.id === value)
}

export function isValidOrderRequest(value: string): value is OrderRequestValue {
  return (ORDER_REQUEST_VALUES as readonly string[]).includes(value)
}

export function isValidExclusiveSkiruRequest(value: string): boolean {
  return EXCLUSIVE_SKIRU_REQUEST_OPTIONS.some((p) => p.id === value)
}

export function isValidPremioRequest(value: string): boolean {
  return PREMIO_REQUEST_OPTIONS.some((p) => p.id === value)
}

export function isValidTenkanRequest(value: string): boolean {
  return value === TENKAN_REQUEST_VALUE
}
