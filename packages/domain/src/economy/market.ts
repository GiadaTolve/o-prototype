import type { ItemCategory } from './types'

export interface BancoPriceRow {
  readonly label: string
  readonly buyRem?: number
  readonly sellRem?: number
}

/** Prezzi indicativi Il Banco — vedi `ECONOMY_ITEMS_SPEC.md` §4. */
export const BANCO_PRICES: readonly BancoPriceRow[] = [
  { label: 'Junk (qualsiasi)', buyRem: 2 },
  { label: 'Materiale comune', buyRem: 5, sellRem: 15 },
  { label: 'Materiale raro', buyRem: 20 },
  { label: 'Consumabile craftato', buyRem: 10 },
  { label: 'Equipaggiamento integro', buyRem: 25 },
] as const

/** Materiali che Il Banco può vendere (mai rari). */
export const BANCO_SELLABLE_MATERIALS = [
  'stoffa',
  'legno',
  'rottame_metallico',
  'carta',
  'erba_comune',
] as const

/** Commissione La Piazza sui Rem scambiati. */
export const PIAZZA_COMMISSION_RATE = 0.1

/** Inserzioni attive max per giocatore (estendibile con appartamento). */
export const PIAZZA_MAX_ACTIVE_LISTINGS = 5

export function isMarketableCategory(category: ItemCategory): boolean {
  return category !== 'oggetto_trama'
}

/** Rem netti al venditore dopo commissione Piazza. */
export function piazzaSellerProceeds(grossRem: number): number {
  return Math.floor(grossRem * (1 - PIAZZA_COMMISSION_RATE))
}

export function piazzaCommission(grossRem: number): number {
  return grossRem - piazzaSellerProceeds(grossRem)
}
