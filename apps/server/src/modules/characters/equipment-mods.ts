import { and, eq } from 'drizzle-orm'
import {
  aggregateEquippedItemMods,
  applyEquipmentModsToSheet,
  parseSkiruFlatList,
  type AggregatedEquipmentMods,
} from '@domain/economy/equipped-mods'
import type { SkiruSheet } from '@domain/skiru'
import { db } from '../../plugins/db'
import { inventory, items } from '../../db/schema'

/** Carica e aggrega i mod degli oggetti equipaggiati in CARRY. */
export async function loadEquippedItemMods(
  characterId: string,
): Promise<AggregatedEquipmentMods> {
  const rows = await db
    .select({
      name: items.name,
      damage: items.damage,
      mitigationFlat: items.mitigationFlat,
      skiruBonuses: items.skiruBonuses,
      skiruMaluses: items.skiruMaluses,
      isEquipped: inventory.isEquipped,
      location: inventory.location,
    })
    .from(inventory)
    .innerJoin(items, eq(inventory.itemId, items.id))
    .where(and(eq(inventory.characterId, characterId), eq(inventory.isEquipped, true)))

  return aggregateEquippedItemMods(
    rows.map((r) => ({
      name: r.name,
      damage: r.damage,
      mitigationFlat: r.mitigationFlat,
      skiruBonuses: parseSkiruFlatList(r.skiruBonuses),
      skiruMaluses: parseSkiruFlatList(r.skiruMaluses),
      isEquipped: Boolean(r.isEquipped),
      location: r.location,
    })),
  )
}

/** Sheet base + overlay equip (per IR / CAC / CAD). */
export async function resolveEffectiveSkiruSheet(
  characterId: string,
  baseSheet: SkiruSheet,
): Promise<{ sheet: SkiruSheet; mods: AggregatedEquipmentMods }> {
  const mods = await loadEquippedItemMods(characterId)
  return { sheet: applyEquipmentModsToSheet(baseSheet, mods), mods }
}
