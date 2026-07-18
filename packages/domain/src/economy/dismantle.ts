import { getJunkItemDef } from './junklist'
import { isItemBroken, usesIntegrity } from './items'
import type { EconomyMaterialCost, EconomyMaterialId, ItemCategory } from './types'
import { getSocialBlueprint } from '../shakai-kaikyu/blueprint-catalog'

/** Solo #Artigiano smantella — keystone in su. */
export const DISMANTLE_ARTIGIANO_TAG = '#Artigiano' as const

/** Skiru gate classe Artigiano (fino a `social_class` dedicato). */
export const ARTIGIANO_SKIRU_ID = 'shokunin' as const

/** Tetto smantellamenti/giorno per artigiano (anti riciclo). */
export const DISMANTLE_DAILY_MAX = 10

/** Resa materiali da equipaggiamento rotto (% ricetta, arrotondato per difetto). */
export const BROKEN_EQUIP_YIELD_RATIO = 0.5

/** Junk di scarto da equip/costrutti rotti. */
export const BROKEN_EQUIP_SCRAP_JUNK = 'junk-utensili-spezzati' as const

/** Junk debole da consumabili smantellati. */
export const CONSUMABLE_SCRAP_JUNK = 'junk-flaconi' as const

export function canDismantleAsArtigiano(socialClassTag: string | null): boolean {
  return socialClassTag === DISMANTLE_ARTIGIANO_TAG
}

export function isArtigianoFromSkiruSheet(skiruSheet: Readonly<Record<string, number>>): boolean {
  return (skiruSheet[ARTIGIANO_SKIRU_ID] ?? 0) >= 1
}

export interface DismantleCatalogYields {
  readonly junkCatalogKey?: string | null
  readonly materials?: Readonly<Partial<Record<EconomyMaterialId, number>>>
}

export interface DismantleItemInput {
  readonly category: ItemCategory
  readonly junkTemplateId?: string | null
  readonly blueprintId?: string | null
  readonly integrityCurrent?: number | null
  readonly integrityMax?: number | null
  readonly isEquipped?: boolean
  readonly itemType?: string | null
  readonly catalogYields?: DismantleCatalogYields | null
}

export interface DismantleCheck {
  ok: boolean
  reason?: string
}

export interface DismantleResolvedYields {
  readonly junk: ReadonlyArray<{ catalogKey: string; quantity: number }>
  readonly materials: readonly EconomyMaterialCost[]
}

export function canDismantleInventoryItem(item: DismantleItemInput): DismantleCheck {
  if (item.isEquipped) {
    return { ok: false, reason: 'Smonta prima l\'oggetto equipaggiato.' }
  }

  if (item.category === 'oggetto_trama') {
    return { ok: false, reason: 'Gli oggetti di trama non si smantellano.' }
  }

  if (item.category === 'materiale') {
    return { ok: false, reason: 'I materiali puri non si smantellano.' }
  }

  if (item.category === 'junk') {
    if (!item.junkTemplateId || !getJunkItemDef(item.junkTemplateId)) {
      return { ok: false, reason: 'Junk non riconosciuta nella junklist.' }
    }
    return { ok: true }
  }

  if (item.category === 'consumabile') {
    return { ok: true }
  }

  if (item.category === 'equipaggiamento' || item.category === 'costrutto_materiale') {
    if (!usesIntegrity(item.category)) {
      return { ok: false, reason: 'Oggetto non smantellabile.' }
    }
    if (!isItemBroken(item.integrityCurrent, item.integrityMax)) {
      return { ok: false, reason: 'Solo equipaggiamento o costrutti rotti (Integrità 0) sono smantellabili.' }
    }
    return { ok: true }
  }

  return { ok: false, reason: 'Categoria non smantellabile.' }
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

function materialsFromPartial(
  partial: Readonly<Partial<Record<EconomyMaterialId, number>>> | undefined,
): EconomyMaterialCost[] {
  if (!partial) return []
  return Object.entries(partial)
    .map(([materialId, quantity]) => ({
      materialId: materialId as EconomyMaterialId,
      quantity: Math.max(0, Math.floor(quantity ?? 0)),
    }))
    .filter((m) => m.quantity > 0)
}

function defaultBrokenEquipMaterials(itemType?: string | null): EconomyMaterialCost[] {
  if (itemType === 'ARMOR') return [{ materialId: 'stoffa', quantity: 1 }]
  if (itemType === 'WEAPON') return [{ materialId: 'rottame_metallico', quantity: 1 }]
  return [{ materialId: 'rottame_metallico', quantity: 1 }]
}

/** Resa unificata: junk di scarto + materiali (Fase 3). */
export function resolveDismantleYields(item: DismantleItemInput): DismantleResolvedYields {
  const catalog = item.catalogYields

  if (item.category === 'junk' && item.junkTemplateId) {
    return {
      junk: [],
      materials: [...resolveJunkDismantleYields(item.junkTemplateId)],
    }
  }

  if (item.category === 'consumabile') {
    const junkKey = catalog?.junkCatalogKey?.trim() || CONSUMABLE_SCRAP_JUNK
    const materials =
      materialsFromPartial(catalog?.materials).length > 0
        ? materialsFromPartial(catalog?.materials)
        : [{ materialId: 'reagente' as EconomyMaterialId, quantity: 1 }]
    return {
      junk: [{ catalogKey: junkKey, quantity: 1 }],
      materials,
    }
  }

  if (item.category === 'equipaggiamento' || item.category === 'costrutto_materiale') {
    const junkKey = catalog?.junkCatalogKey?.trim() || BROKEN_EQUIP_SCRAP_JUNK
    const junk = [{ catalogKey: junkKey, quantity: 1 }]

    const catalogMaterials = materialsFromPartial(catalog?.materials)
    if (catalogMaterials.length > 0) {
      return { junk, materials: catalogMaterials }
    }

    const bpId = item.blueprintId
    if (bpId) {
      const blueprint = getSocialBlueprint(bpId)
      const fromRecipe = blueprint?.materials?.length
        ? yieldFromBrokenEquipment(blueprint.materials)
        : []
      if (fromRecipe.length > 0) {
        return { junk, materials: fromRecipe }
      }
    }

    return {
      junk,
      materials: defaultBrokenEquipMaterials(item.itemType),
    }
  }

  return { junk: [], materials: [] }
}
