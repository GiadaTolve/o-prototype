import { getJunkItemDef } from './junklist'
import { isItemBroken, usesIntegrity } from './items'
import type { EconomyMaterialCost, EconomyMaterialId, ItemCategory } from './types'

/** Solo #Artigiano smantella — keystone in su. */
export const DISMANTLE_ARTIGIANO_TAG = '#Artigiano' as const

/** Skiru gate classe Artigiano (fino a `social_class` dedicato). */
export const ARTIGIANO_SKIRU_ID = 'shokunin' as const

/** Tetto smantellamenti/giorno per artigiano (anti riciclo). */
export const DISMANTLE_DAILY_MAX = 10

/** Resa materiali da equipaggiamento rotto (% ricetta, arrotondato per difetto). */
export const BROKEN_EQUIP_YIELD_RATIO = 0.5

export function canDismantleAsArtigiano(socialClassTag: string | null): boolean {
  return socialClassTag === DISMANTLE_ARTIGIANO_TAG
}

export function isArtigianoFromSkiruSheet(skiruSheet: Readonly<Record<string, number>>): boolean {
  return (skiruSheet[ARTIGIANO_SKIRU_ID] ?? 0) >= 1
}

export interface DismantleItemInput {
  readonly category: ItemCategory
  readonly junkTemplateId?: string | null
  readonly blueprintId?: string | null
  readonly integrityCurrent?: number | null
  readonly integrityMax?: number | null
  readonly isEquipped?: boolean
}

export interface DismantleCheck {
  ok: boolean
  reason?: string
}

export function canDismantleInventoryItem(item: DismantleItemInput): DismantleCheck {
  if (item.isEquipped) {
    return { ok: false, reason: 'Smonta prima l\'oggetto equipaggiato.' }
  }

  if (item.category === 'junk') {
    if (!item.junkTemplateId || !getJunkItemDef(item.junkTemplateId)) {
      return { ok: false, reason: 'Junk non riconosciuta nella junklist.' }
    }
    return { ok: true }
  }

  if (item.category === 'equipaggiamento' || item.category === 'costrutto_materiale') {
    if (!usesIntegrity(item.category)) {
      return { ok: false, reason: 'Oggetto non smantellabile.' }
    }
    if (!isItemBroken(item.integrityCurrent, item.integrityMax)) {
      return { ok: false, reason: 'Solo equipaggiamento o costrutti rotti (Integrità 0) sono smantellabili.' }
    }
    if (!item.blueprintId) {
      return { ok: false, reason: 'Manca il blueprint di costruzione per calcolare la resa.' }
    }
    return { ok: true }
  }

  return { ok: false, reason: 'Solo Junk o equipaggiamento/costrutti rotti possono essere smantellati.' }
}

/** Resa fissa da junklist. */
export function resolveJunkDismantleYields(
  junkTemplateId: string,
): readonly EconomyMaterialCost[] {
  const junk = getJunkItemDef(junkTemplateId)
  if (!junk) return []
  return Object.entries(junk.yields).map(([materialId, quantity]) => ({
    materialId: materialId as EconomyMaterialId,
    quantity: quantity ?? 0,
  }))
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

export function materialCatalogKey(materialId: EconomyMaterialId): string {
  return `mat-${materialId}`
}
