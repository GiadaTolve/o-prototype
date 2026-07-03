/** Categoria scheda oggetto — vedi `ECONOMY_ITEMS_SPEC.md` §2. */
export type ItemCategory =
  | 'junk'
  | 'materiale'
  | 'consumabile'
  | 'equipaggiamento'
  | 'costrutto_materiale'
  | 'oggetto_trama'

export type ItemOrigin = 'craftato' | 'droppato' | 'comprato'

/** Materiali da crafting / junklist. */
export type EconomyMaterialId =
  | 'rottame_metallico'
  | 'componente_meccanico'
  | 'componente_fine'
  | 'stoffa'
  | 'cuoio'
  | 'legno'
  | 'carta'
  | 'reagente'
  | 'erba_comune'
  | 'erba_rara'
  | 'carne'
  | 'carne_pregiata'
  | 'frammento_onirico'
  | 'trofeo'
  | 'trofeo_maggiore'
  | 'carburante'

export interface EconomyMaterialCost {
  readonly materialId: EconomyMaterialId
  readonly quantity: number
}

/** Campi scheda oggetto (target schema). */
export interface ItemSheetFields {
  readonly name: string
  readonly category: ItemCategory
  readonly integrityCurrent?: number
  readonly integrityMax?: number
  readonly effectText?: string
  readonly inventorySlots?: number
  readonly origin?: ItemOrigin
  readonly craftedByName?: string
  readonly blueprintId?: string
}
