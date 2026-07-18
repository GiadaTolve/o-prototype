import type { MercatoInventoryRow } from './mercato-types'

export type DismantleStatusResponse = {
  isArtigiano: boolean
  dayKey: string
  usedToday: number
  remainingToday: number
  dailyMax: number
}

export type DismantleInventoryRow = MercatoInventoryRow & {
  canDismantle?: boolean
  dismantleBlockReason?: string
  dismantlePreview?: {
    junk: Array<{ catalogKey: string; quantity: number }>
    materials: Array<{ materialId: string; quantity: number; catalogKey: string }>
  }
}

export type DismantleInventoryResponse = {
  items: DismantleInventoryRow[]
  dismantle: DismantleStatusResponse
}

export type DismantleResultResponse = {
  dismantled: Array<{
    inventoryId: string
    itemName: string
    junk: Array<{ catalogKey: string; quantity: number }>
    materials: Array<{ materialId: string; quantity: number; catalogKey: string }>
  }>
  usedToday: number
  remainingToday: number
}
