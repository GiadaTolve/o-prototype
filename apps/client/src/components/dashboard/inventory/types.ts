import type { ItemCategory, ItemOrigin } from '@domain/economy/types'

export type InventoryLocation = 'CARRY' | 'HOUSING' | 'MARKET'

export interface InventoryEconomyFields {
  category: ItemCategory
  integrityCurrent: number | null
  integrityMax: number | null
  effectText: string | null
  inventorySlotCost: number
  junkTemplateId: string | null
  materialId: string | null
  blueprintId: string | null
  origin: ItemOrigin | null
  craftedByName: string | null
  isStackable: boolean
  isBroken: boolean
  isMarketable: boolean
}

export interface InventoryItemRow {
  id: string
  itemId: string
  quantity: number
  isEquipped: boolean
  location: InventoryLocation
  item: {
    id: string
    name: string
    description: string | null
    type: string
    slotsBonus: number
    damage?: number | null
    resistance?: number | null
    bonus?: number | null
    ammoKind?: string | null
  }
  economy?: InventoryEconomyFields
}

export interface InventorySlotsInfo {
  baseSlots: number
  bagSlots: number
  housingSlots: number
  totalSlots: number
  occupied: number
  available: number
  housingOccupied?: number
  housingAvailable?: number
  marketListed?: number
  equipSlots?: number
  equipSlotsUsed?: number
}

export interface CharacterInventoryResponse {
  items: InventoryItemRow[]
  carryItems?: InventoryItemRow[]
  housingItems?: InventoryItemRow[]
  marketItems?: InventoryItemRow[]
  slots: InventorySlotsInfo
}
