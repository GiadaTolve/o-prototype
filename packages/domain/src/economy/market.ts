import type { ItemCategory, ItemOrigin } from './types'

export interface BancoPriceRow {
  readonly label: string
  readonly buyRem?: number
  readonly sellRem?: number
}

/** Prezzi Il Banco — vedi `ECONOMY_ITEMS_SPEC.md`. */
export const BANCO_BUY_JUNK_REM = 2
export const BANCO_BUY_COMMON_MATERIAL_REM = 5
export const BANCO_BUY_RARE_MATERIAL_REM = 20
export const BANCO_BUY_CRAFTED_CONSUMABLE_REM = 10
export const BANCO_BUY_INTACT_EQUIP_REM = 25
export const BANCO_SELL_COMMON_MATERIAL_REM = 15

export const BANCO_PRICES: readonly BancoPriceRow[] = [
  { label: 'Junk (qualsiasi)', buyRem: BANCO_BUY_JUNK_REM },
  { label: 'Materiale comune', buyRem: BANCO_BUY_COMMON_MATERIAL_REM, sellRem: BANCO_SELL_COMMON_MATERIAL_REM },
  { label: 'Materiale raro', buyRem: BANCO_BUY_RARE_MATERIAL_REM },
  { label: 'Consumabile craftato', buyRem: BANCO_BUY_CRAFTED_CONSUMABLE_REM },
  { label: 'Equipaggiamento integro', buyRem: BANCO_BUY_INTACT_EQUIP_REM },
] as const

/** Materiali comuni acquistabili dal Banco (NPC vende, mai rari). */
export const BANCO_SELLABLE_MATERIALS = [
  'stoffa',
  'legno',
  'rottame_metallico',
  'carta',
  'erba_comune',
] as const

export type BancoSellableMaterialId = (typeof BANCO_SELLABLE_MATERIALS)[number]

export const RARE_MATERIAL_IDS = new Set([
  'erba_rara',
  'frammento_onirico',
  'componente_fine',
  'componente_meccanico',
  'carne_pregiata',
  'trofeo',
  'trofeo_maggiore',
])

/** Commissione La Piazza sui Rem scambiati. */
export const PIAZZA_COMMISSION_RATE = 0.1

/** Inserzioni attive max per giocatore (estendibile con appartamento). */
export const PIAZZA_MAX_ACTIVE_LISTINGS = 5

export function isMarketableCategory(category: ItemCategory): boolean {
  return category !== 'oggetto_trama'
}

export function isRareMaterial(materialId: string | null | undefined): boolean {
  if (!materialId) return false
  return RARE_MATERIAL_IDS.has(materialId)
}

export interface BancoSellItemInput {
  readonly category: ItemCategory
  readonly materialId?: string | null
  readonly origin?: ItemOrigin | null
  readonly isBroken?: boolean
}

/** Rem che Il Banco paga al PG per un oggetto (null = non acquistabile). */
export function resolveBancoBuyPrice(item: BancoSellItemInput): number | null {
  if (!isMarketableCategory(item.category)) return null

  if (item.category === 'junk') return BANCO_BUY_JUNK_REM

  if (item.category === 'materiale') {
    if (isRareMaterial(item.materialId)) return BANCO_BUY_RARE_MATERIAL_REM
    return BANCO_BUY_COMMON_MATERIAL_REM
  }

  if (item.category === 'consumabile') {
    return BANCO_BUY_CRAFTED_CONSUMABLE_REM
  }

  if (item.category === 'equipaggiamento' || item.category === 'costrutto_materiale') {
    if (item.isBroken) return null
    return BANCO_BUY_INTACT_EQUIP_REM
  }

  return null
}

export function resolveBancoSellPrice(materialId: string): number | null {
  if ((BANCO_SELLABLE_MATERIALS as readonly string[]).includes(materialId)) {
    return BANCO_SELL_COMMON_MATERIAL_REM
  }
  return null
}

export function materialCatalogKey(materialId: string): string {
  return `mat-${materialId}`
}

/** Rem netti al venditore dopo commissione Piazza. */
export function piazzaSellerProceeds(grossRem: number): number {
  return Math.floor(grossRem * (1 - PIAZZA_COMMISSION_RATE))
}

export function piazzaCommission(grossRem: number): number {
  return grossRem - piazzaSellerProceeds(grossRem)
}

export function formatPiazzaTradeMessage(
  sellerLabel: string,
  buyerLabel: string,
  itemName: string,
  quantity: number,
  grossRem: number,
): string {
  return `${sellerLabel} ha venduto: ${itemName} ×${quantity} → ${buyerLabel}, ${grossRem} Rem`
}
