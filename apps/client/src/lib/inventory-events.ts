/** Evento DOM emesso quando il server notifica aggiornamento inventario (WS `inventory_updated`). */
export const INVENTORY_UPDATED_EVENT = 'inventoryUpdated'

export type InventoryUpdatedDetail = {
  characterId: string
}

export function dispatchInventoryUpdated(characterId: string): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<InventoryUpdatedDetail>(INVENTORY_UPDATED_EVENT, {
      detail: { characterId },
    }),
  )
}
