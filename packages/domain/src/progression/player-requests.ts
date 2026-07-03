/**
 * Richieste giocatore — Madoshō, Ordine, Premi (approvazione staff).
 * MECHANICS_ROADMAP · cross-cutting Richieste
 */

import { MADOSHO_CATALOG, type MadoshoId } from './madosho'

export { MADOSHO_CATALOG } from './madosho'

export const PLAYER_REQUEST_KINDS = ['MADOSHO', 'ORDER', 'PREMIO', 'TENKAN'] as const
export type PlayerRequestKind = (typeof PLAYER_REQUEST_KINDS)[number]

export const PLAYER_REQUEST_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const
export type PlayerRequestStatus = (typeof PLAYER_REQUEST_STATUSES)[number]

export const ORDER_REQUEST_VALUES = ['MUGEN-TAI', 'CHISEN-TAI'] as const
export type OrderRequestValue = (typeof ORDER_REQUEST_VALUES)[number]

/** Premi speciali richiedibili (pixel-icon / milestone narrative). Estendibile. */
export const PREMIO_REQUEST_OPTIONS: Array<{ id: string; label: string }> = [
  { id: 'keishosha', label: 'Keishōsha — Erede Madoshō (55%)' },
  { id: 'kanpeki-keishosha', label: 'Kanpeki Keishōsha — Erede (85%)' },
  { id: 'inkyo', label: 'Inkyo — Premio speciale (55%)' },
  { id: 'sentō-senshi', label: 'Sentō Senshi — Arsenale d\'ordine' },
  { id: 'renkinjutsushi', label: 'Renkinjutsushi — 4 Waza stessa Consistenza' },
  { id: 'daisei-renkin', label: 'Daisei no Renkin — 8 Waza stessa Consistenza' },
]

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

export function labelForPremioRequest(value: string): string {
  return PREMIO_REQUEST_OPTIONS.find((p) => p.id === value)?.label ?? value
}

export function labelForPlayerRequest(kind: PlayerRequestKind, value: string): string {
  switch (kind) {
    case 'MADOSHO':
      return labelForMadoshoRequest(value)
    case 'ORDER':
      return labelForOrderRequest(value)
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

export function isValidPremioRequest(value: string): boolean {
  return PREMIO_REQUEST_OPTIONS.some((p) => p.id === value)
}

export function isValidTenkanRequest(value: string): boolean {
  return value === TENKAN_REQUEST_VALUE
}
