import type { ItemCategory, ItemOrigin } from './types'

/** Categorie che possono stackare quantity su una riga inventario. */
export const STACKABLE_CATEGORIES: readonly ItemCategory[] = [
  'junk',
  'materiale',
  'consumabile',
] as const

/** Categorie con Integrità (attuale/massima). */
export const INTEGRITY_CATEGORIES: readonly ItemCategory[] = [
  'equipaggiamento',
  'costrutto_materiale',
] as const

export function canStackCategory(category: ItemCategory): boolean {
  return STACKABLE_CATEGORIES.includes(category)
}

export function usesIntegrity(category: ItemCategory): boolean {
  return INTEGRITY_CATEGORIES.includes(category)
}

export function getInventorySlotCost(slotCost: number | null | undefined): number {
  const n = slotCost ?? 1
  return n > 0 ? n : 1
}

export function isItemBroken(
  integrityCurrent: number | null | undefined,
  integrityMax: number | null | undefined,
): boolean {
  if (integrityMax == null || integrityMax <= 0) return false
  if (integrityCurrent == null) return false
  return integrityCurrent <= 0
}

export function isEquippableLegacyType(type: string): boolean {
  return type === 'WEAPON' || type === 'ARMOR' || type === 'BAG'
}

/** Equipaggiamento indossabile (legacy type o categoria economy). */
export function isEquippableItem(
  type: string,
  category: ItemCategory | string | null | undefined,
): boolean {
  if (type === 'ACCESSORY') return true
  if (isEquippableLegacyType(type)) return true
  return category === 'equipaggiamento'
}

export interface InventorySlotUsageInput {
  readonly inventorySlotCost: number
  readonly location: 'CARRY' | 'HOUSING'
}

/** Somma slot occupati per location. */
export function sumInventorySlotUsage(
  rows: readonly InventorySlotUsageInput[],
  location: 'CARRY' | 'HOUSING',
): number {
  return rows
    .filter((r) => r.location === location)
    .reduce((sum, r) => sum + getInventorySlotCost(r.inventorySlotCost), 0)
}

export function canFitInSlots(
  occupied: number,
  capacity: number,
  additionalSlotCost: number,
): boolean {
  return occupied + additionalSlotCost <= capacity
}

export function normalizeItemOrigin(origin: string | null | undefined): ItemOrigin | null {
  if (origin === 'craftato' || origin === 'droppato' || origin === 'comprato') return origin
  return null
}
