import type { ItemCategory } from '@domain/economy/types'
import type { MarketCategory } from '@domain/economy/market-catalog'

export type HousingCatalogItem = {
  id: string
  code: string
  name: string
  nameRomaji: string | null
  description: string | null
  effectText: string | null
  iconUrl: string | null
  squareMeters: number
  dailyRent: number | null
  monthlyRent: number | null
  hpBonus: number
  inventorySlotsBonus: number
  requirements: { paradisePass?: boolean } | null
  isActiveInCatalog: boolean
}

  id: string
  catalogKey: string | null
  marketCategory: MarketCategory
  name: string
  nameRomaji: string | null
  description: string | null
  iconUrl: string | null
  integrityMax: number | null
  effectText: string | null
  priceRem: number | null
  isActiveInMarket: boolean
  category: ItemCategory
}

export type MarketCatalogResponse = {
  items: MarketCatalogItem[]
}

export type MarketCatalogBuyResponse = {
  itemId: string
  itemName: string
  quantity: number
  totalRem: number
  newBalance: number
}

export type BancoCatalogResponse = {
  buyPrices: Array<{
    materialId: string
    catalogKey: string
    name: string
    priceRem: number
  }>
  rules: {
    buysJunk: number
    buysCommonMaterial: number
    buysRareMaterial: number
    buysCraftedConsumable: number
    buysIntactEquip: number
  }
}

export type BancoSellResponse = {
  itemName: string
  quantity: number
  unitPriceRem: number
  totalRem: number
  newBalance: number
}

export type BancoBuyResponse = {
  catalogKey: string
  itemName: string
  quantity: number
  totalRem: number
  newBalance: number
}

export type MarketListing = {
  id: string
  sellerCharacterId: string
  inventoryId: string
  priceRem: number
  itemName: string
  itemCategory: string
  craftedByName: string | null
  quantity: number
  status: 'active' | 'sold' | 'cancelled'
  buyerCharacterId?: string | null
  soldAt?: string | null
  createdAt: string
}

export type PiazzaListingsResponse = {
  listings: MarketListing[]
}

export type TradeFeedEntry = {
  id: string
  message: string
  sellerCharacterId: string | null
  buyerCharacterId: string | null
  grossRem: number | null
  createdAt: string
}

export type PiazzaFeedResponse = {
  feed: TradeFeedEntry[]
}

export type PiazzaBuyResponse = {
  listingId: string
  itemName: string
  priceRem: number
  sellerProceeds: number
  message: string
}

export type MercatoInventoryRow = {
  id: string
  quantity: number
  isEquipped: boolean
  location: 'CARRY' | 'HOUSING' | 'MARKET'
  item: {
    id: string
    name: string
    type: string
  }
  economy: {
    category: ItemCategory | string
    materialId: string | null
    origin: string | null
    isBroken: boolean
    isMarketable: boolean
    integrityCurrent: number | null
    integrityMax: number | null
    craftedByName: string | null
    effectText: string | null
    inventorySlotCost: number
  }
}

export type MercatoInventoryResponse = {
  items: MercatoInventoryRow[]
  slots?: {
    marketListed?: number
  }
}
