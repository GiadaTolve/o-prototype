import type { ItemCategory } from './types'
import { isItemBroken, isEquippableItem, usesIntegrity } from './items'

/** Costo integrità per utilizzo in chat (1 utilizzo = 1 integrità). */
export const INTEGRITY_PER_CHAT_USE = 1

export const ITEM_USE_PREFIX = '[OGGETTO]'

export type ItemUseRequestPayload = {
  readonly inventoryId: string
}

export type ItemUseCardData = {
  readonly itemName: string
  readonly category: string
  readonly integrityBefore?: number | null
  readonly integrityAfter?: number | null
  readonly consumableRemaining?: number | null
  readonly ammoLabel?: string | null
  readonly isBroken?: boolean
  readonly effectText?: string | null
}

/** Payload inviato dal pannello combattimento (non digitabile in chat). */
export function encodeItemUseRequest(inventoryId: string): string {
  const payload: ItemUseRequestPayload = { inventoryId }
  return ITEM_USE_PREFIX + JSON.stringify(payload)
}

export function parseItemUseRequest(content: string): ItemUseRequestPayload | null {
  if (!content.startsWith(ITEM_USE_PREFIX)) return null
  try {
    const data = JSON.parse(content.slice(ITEM_USE_PREFIX.length)) as ItemUseRequestPayload
    if (typeof data.inventoryId === 'string' && data.inventoryId.trim()) {
      return { inventoryId: data.inventoryId.trim() }
    }
    return null
  } catch {
    return null
  }
}

/** Messaggio persistito in chat dopo l'utilizzo (card). */
export function encodeItemUseCard(data: ItemUseCardData): string {
  return ITEM_USE_PREFIX + JSON.stringify(data)
}

export function extractItemUseCard(content: string): ItemUseCardData | null {
  if (!content.startsWith(ITEM_USE_PREFIX)) return null
  try {
    const data = JSON.parse(content.slice(ITEM_USE_PREFIX.length)) as ItemUseCardData
    if (typeof data.itemName === 'string') return data
    return null
  } catch {
    return null
  }
}

export function isItemUsePanelMessage(content: string): boolean {
  return parseItemUseRequest(content.trim()) != null
}

export function canUseCategoryInChat(category: ItemCategory | string | null | undefined): boolean {
  return category === 'consumabile' || category === 'equipaggiamento' || category === 'costrutto_materiale'
}

export interface ItemUseValidationInput {
  readonly category: ItemCategory | string
  readonly type: string
  readonly isEquipped: boolean
  readonly location: 'CARRY' | 'HOUSING' | 'MARKET' | string
  readonly integrityCurrent: number | null
  readonly integrityMax: number | null
  readonly quantity: number
  readonly ammoKindRequired?: string | null
  readonly ammoAvailable?: number
}

export function validateItemUseInChat(input: ItemUseValidationInput): { ok: true } | { ok: false; reason: string } {
  if (input.location !== 'CARRY') {
    return { ok: false, reason: 'L\'oggetto deve essere nello zaino (non in casa o in vendita).' }
  }

  const category = input.category as ItemCategory

  if (!canUseCategoryInChat(category)) {
    return { ok: false, reason: 'Questo tipo di oggetto non si usa in chat.' }
  }

  if (category === 'consumabile') {
    if (input.quantity < 1) {
      return { ok: false, reason: 'Quantità insufficiente.' }
    }
    return { ok: true }
  }

  if (!input.isEquipped && isEquippableItem(input.type, category)) {
    return { ok: false, reason: 'Equipaggia l\'oggetto prima di usarlo dal pannello combattimento.' }
  }

  if (usesIntegrity(category)) {
    if (isItemBroken(input.integrityCurrent, input.integrityMax)) {
      return { ok: false, reason: 'Oggetto rotto (Integrità 0): riparalo o smantellalo.' }
    }
    const current = input.integrityCurrent ?? input.integrityMax ?? 0
    if (current < INTEGRITY_PER_CHAT_USE) {
      return { ok: false, reason: 'Integrità insufficiente per un utilizzo.' }
    }
  }

  if (input.ammoKindRequired) {
    if ((input.ammoAvailable ?? 0) < 1) {
      return {
        ok: false,
        reason: `Equipaggia munizioni (${input.ammoKindRequired}) addosso prima di sparare.`,
      }
    }
  }

  return { ok: true }
}
