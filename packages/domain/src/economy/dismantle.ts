import type { EconomyMaterialCost } from './types'

/** Solo #Artigiano smantella — keystone in su. */
export const DISMANTLE_ARTIGIANO_TAG = '#Artigiano' as const

/** Tetto smantellamenti/giorno per artigiano (anti riciclo). */
export const DISMANTLE_DAILY_MAX = 10

/** Resa materiali da equipaggiamento rotto (% ricetta, arrotondato per difetto). */
export const BROKEN_EQUIP_YIELD_RATIO = 0.5

export function canDismantleAsArtigiano(socialClassTag: string | null): boolean {
  return socialClassTag === DISMANTLE_ARTIGIANO_TAG
}

/** Applica resa 50% arrotondata per difetto sui materiali ricetta. */
export function yieldFromBrokenEquipment(
  recipeMaterials: readonly EconomyMaterialCost[],
): EconomyMaterialCost[] {
  return recipeMaterials
    .map(({ materialId, quantity }) => ({
      materialId,
      quantity: Math.floor(quantity * BROKEN_EQUIP_YIELD_RATIO),
    }))
    .filter((m) => m.quantity > 0)
}
