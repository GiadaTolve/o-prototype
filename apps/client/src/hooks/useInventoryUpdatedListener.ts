'use client'

import { useEffect } from 'react'
import { INVENTORY_UPDATED_EVENT, type InventoryUpdatedDetail } from '@/lib/inventory-events'

/** Ricarica callback quando l'inventario del personaggio indicato cambia (WS). */
export function useInventoryUpdatedListener(
  characterId: string | undefined,
  onRefresh: () => void | Promise<void>,
): void {
  useEffect(() => {
    if (!characterId) return

    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent<InventoryUpdatedDetail>).detail
      if (detail?.characterId === characterId) {
        void onRefresh()
      }
    }

    window.addEventListener(INVENTORY_UPDATED_EVENT, handler)
    return () => window.removeEventListener(INVENTORY_UPDATED_EVENT, handler)
  }, [characterId, onRefresh])
}
