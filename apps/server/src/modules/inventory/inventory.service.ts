import { eq, and, desc, sql, inArray } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { inventory, items, characters, characterHousing, housingTypes, housingGuests } from '../../db/schema'
import {
  canFitInSlots,
  canStackCategory,
  getInventorySlotCost,
  isEquippableItem,
  isItemBroken,
  sumInventorySlotUsage,
  usesIntegrity,
} from '@domain/economy/items'
import { isMarketableCategory } from '@domain/economy/market'
import type { ItemCategory, ItemOrigin } from '@domain/economy/types'

type InventoryLocation = 'CARRY' | 'HOUSING' | 'MARKET'

/**
 * Calcola gli slot totali disponibili per un personaggio.
 * Formula: baseSlots (5) + slot bonus da zaini equipaggiati + slot bonus da housing
 */
export async function calculateTotalSlots(characterId: string): Promise<{
  baseSlots: number
  bagSlots: number
  housingSlots: number
  totalSlots: number
}> {
  const char = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
  })

  if (!char) {
    throw new Error('Personaggio non trovato')
  }

  const baseSlots = char.baseSlots || 5

  // Calcola slot bonus da zaini equipaggiati
  const equippedBags = await db.query.inventory.findMany({
    where: and(
      eq(inventory.characterId, characterId),
      eq(inventory.isEquipped, true),
      eq(inventory.location, 'CARRY')
    ),
    with: {
      item: true,
    },
  })

  let bagSlots = 0
  for (const inv of equippedBags) {
    if (inv.item.type === 'BAG' && inv.item.slotsBonus) {
      bagSlots += inv.item.slotsBonus
    }
  }

  // Calcola slot bonus da housing
  const housing = await db.query.characterHousing.findFirst({
    where: eq(characterHousing.characterId, characterId),
    with: {
      housingType: true,
    },
  })

  const housingSlots = housing && !housing.evicted
    ? (housing.housingType.inventorySlotsBonus || 0)
    : 0

  const totalSlots = baseSlots + bagSlots + housingSlots

  return {
    baseSlots,
    bagSlots,
    housingSlots,
    totalSlots,
  }
}

type ItemRow = typeof items.$inferSelect
type InventoryRow = typeof inventory.$inferSelect

function mapItemEconomyFields(item: ItemRow, inv: InventoryRow) {
  const category = (item.category ?? 'junk') as ItemCategory
  const integrityMax = item.integrityMax ?? null
  const integrityCurrent = inv.integrityCurrent ?? integrityMax
  return {
    category,
    integrityCurrent,
    integrityMax,
    effectText: item.effectText ?? null,
    inventorySlotCost: getInventorySlotCost(item.inventorySlotCost),
    junkTemplateId: item.junkTemplateId ?? null,
    materialId: item.materialId ?? null,
    blueprintId: inv.blueprintId ?? item.blueprintId ?? null,
    origin: inv.origin ?? null,
    craftedByName: inv.craftedByName ?? null,
    isStackable: item.isStackable ?? true,
    isBroken: usesIntegrity(category)
      ? isItemBroken(integrityCurrent, integrityMax)
      : false,
    isMarketable: isMarketableCategory(category),
  }
}

async function getCarrySlotUsage(characterId: string): Promise<{
  rows: Array<{ inventorySlotCost: number; location: InventoryLocation }>
  occupied: number
  capacity: number
}> {
  const slotInfo = await calculateTotalSlots(characterId)
  const invRows = await db.query.inventory.findMany({
    where: eq(inventory.characterId, characterId),
    with: { item: true },
  })
  const rows = invRows.map((r) => ({
    inventorySlotCost: getInventorySlotCost(r.item.inventorySlotCost),
    location: r.location as InventoryLocation,
  }))
  const occupied = sumInventorySlotUsage(
    rows.filter((r) => r.location === 'CARRY'),
    'CARRY',
  )
  return { rows, occupied, capacity: slotInfo.totalSlots }
}

/**
 * Ottiene l'inventario completo di un personaggio con informazioni sugli slot.
 */
export async function getCharacterInventory(characterId: string) {
  const char = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
  })

  if (!char) {
    throw new Error('Personaggio non trovato')
  }

  try {
    // Usa query diretta senza relazioni per evitare problemi
    const invRows = await db
      .select({
        inventory_id: inventory.id,
        inventory_characterId: inventory.characterId,
        inventory_itemId: inventory.itemId,
        inventory_quantity: inventory.quantity,
        inventory_isEquipped: inventory.isEquipped,
        inventory_location: inventory.location,
        inventory_createdAt: inventory.createdAt,
        item_id: items.id,
        item_catalogKey: items.catalogKey,
        item_name: items.name,
        item_description: items.description,
        item_iconUrl: items.iconUrl,
        item_type: items.type,
        item_slotsBonus: items.slotsBonus,
        item_price: items.price,
        item_category: items.category,
        item_integrityMax: items.integrityMax,
        item_effectText: items.effectText,
        item_inventorySlotCost: items.inventorySlotCost,
        item_junkTemplateId: items.junkTemplateId,
        item_materialId: items.materialId,
        item_blueprintId: items.blueprintId,
        item_isStackable: items.isStackable,
        item_createdAt: items.createdAt,
        inv_integrityCurrent: inventory.integrityCurrent,
        inv_origin: inventory.origin,
        inv_craftedByName: inventory.craftedByName,
        inv_blueprintId: inventory.blueprintId,
      })
      .from(inventory)
      .leftJoin(items, eq(inventory.itemId, items.id))
      .where(eq(inventory.characterId, characterId))
      .orderBy(desc(inventory.createdAt))

    // Mappa i risultati nel formato atteso
    const mappedItems = invRows
      .filter((row) => row.item_id !== null)
      .map((row) => {
        const itemRow = {
          id: row.item_id!,
          name: row.item_name!,
          description: row.item_description,
          iconUrl: row.item_iconUrl,
          type: row.item_type!,
          slotsBonus: row.item_slotsBonus!,
          price: row.item_price,
          createdAt: row.item_createdAt!,
          catalogKey: row.item_catalogKey ?? null,
          category: row.item_category ?? 'junk',
          integrityMax: row.item_integrityMax,
          effectText: row.item_effectText,
          inventorySlotCost: row.item_inventorySlotCost ?? 1,
          junkTemplateId: row.item_junkTemplateId,
          materialId: row.item_materialId,
          blueprintId: row.item_blueprintId,
          isStackable: row.item_isStackable ?? true,
        }
        const invRow = {
          id: row.inventory_id!,
          characterId: row.inventory_characterId!,
          itemId: row.inventory_itemId!,
          quantity: row.inventory_quantity!,
          isEquipped: row.inventory_isEquipped!,
          location: row.inventory_location as InventoryLocation,
          createdAt: row.inventory_createdAt!,
          integrityCurrent: row.inv_integrityCurrent,
          origin: row.inv_origin,
          craftedByCharacterId: null,
          craftedByName: row.inv_craftedByName,
          blueprintId: row.inv_blueprintId,
        }
        return {
          id: invRow.id,
          characterId: invRow.characterId,
          itemId: invRow.itemId,
          quantity: invRow.quantity,
          isEquipped: invRow.isEquipped,
          location: invRow.location,
          createdAt: invRow.createdAt,
          item: {
            id: itemRow.id,
            name: itemRow.name,
            description: itemRow.description,
            iconUrl: itemRow.iconUrl,
            type: itemRow.type,
            slotsBonus: itemRow.slotsBonus,
            price: itemRow.price,
            createdAt: itemRow.createdAt,
          },
          economy: mapItemEconomyFields(itemRow as ItemRow, invRow as InventoryRow),
        }
      })

    const slotInfo = await calculateTotalSlots(characterId)

    const carryItems = mappedItems.filter((i) => i.location === 'CARRY')
    const housingItems = mappedItems.filter((i) => i.location === 'HOUSING')
    const marketItems = mappedItems.filter((i) => i.location === 'MARKET')

    const occupiedCarrySlots = sumInventorySlotUsage(
      carryItems.map((i) => ({
        inventorySlotCost: i.economy.inventorySlotCost,
        location: i.location,
      })),
      'CARRY',
    )
    const availableCarrySlots = slotInfo.totalSlots - occupiedCarrySlots

    const occupiedHousingSlots = sumInventorySlotUsage(
      housingItems.map((i) => ({
        inventorySlotCost: i.economy.inventorySlotCost,
        location: i.location,
      })),
      'HOUSING',
    )
    const availableHousingSlots = Math.max(0, (slotInfo.housingSlots || 0) - occupiedHousingSlots)

    return {
      items: mappedItems,
      carryItems,
      housingItems,
      marketItems,
      slots: {
        ...slotInfo,
        occupied: occupiedCarrySlots,
        available: availableCarrySlots,
        housingOccupied: occupiedHousingSlots,
        housingAvailable: availableHousingSlots,
        marketListed: marketItems.length,
      },
    }
  } catch (error) {
    console.error('[getCharacterInventory] Errore query:', error)
    throw new Error(`Errore nel recupero inventario: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`)
  }
}

/**
 * Aggiunge un oggetto all'inventario.
 * Verifica che ci sia spazio disponibile.
 */
export async function addItemToInventory(
  characterId: string,
  itemId: string,
  quantity: number = 1,
  options?: {
    origin?: ItemOrigin
    craftedByCharacterId?: string
    craftedByName?: string
    blueprintId?: string
    integrityCurrent?: number
    location?: 'CARRY' | 'HOUSING'
  },
) {
  const char = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
  })

  if (!char) {
    throw new Error('Personaggio non trovato')
  }

  const item = await db.query.items.findFirst({
    where: eq(items.id, itemId),
  })

  if (!item) {
    throw new Error('Oggetto non trovato')
  }

  const location = options?.location ?? 'CARRY'
  const slotCost = getInventorySlotCost(item.inventorySlotCost)
  const category = (item.category ?? 'junk') as ItemCategory

  if (location === 'CARRY') {
    const { occupied, capacity } = await getCarrySlotUsage(characterId)
    if (!canFitInSlots(occupied, capacity, slotCost)) {
      throw new Error('Inventario pieno. Libera spazio prima di aggiungere oggetti.')
    }
  }

  if (canStackCategory(category) && !usesIntegrity(category)) {
    const existing = await db.query.inventory.findFirst({
      where: and(
        eq(inventory.characterId, characterId),
        eq(inventory.itemId, itemId),
        eq(inventory.location, location),
      ),
    })
    if (existing) {
      const [updated] = await db
        .update(inventory)
        .set({ quantity: (existing.quantity ?? 0) + quantity })
        .where(eq(inventory.id, existing.id))
        .returning()
      return updated
    }
  }

  const integrityMax = item.integrityMax ?? null
  const integrityCurrent =
    options?.integrityCurrent ??
    (usesIntegrity(category) ? integrityMax : null)

  const [newInv] = await db
    .insert(inventory)
    .values({
      characterId,
      itemId,
      quantity: usesIntegrity(category) ? 1 : quantity,
      isEquipped: false,
      location,
      integrityCurrent,
      origin: options?.origin,
      craftedByCharacterId: options?.craftedByCharacterId,
      craftedByName: options?.craftedByName,
      blueprintId: options?.blueprintId,
    })
    .returning()

  return newInv
}

/** Aggiunge per catalog_key (drop/mod). */
export async function addItemByCatalogKey(
  characterId: string,
  catalogKey: string,
  quantity: number = 1,
  options?: Parameters<typeof addItemToInventory>[3],
) {
  const item = await db.query.items.findFirst({
    where: eq(items.catalogKey, catalogKey),
  })
  if (!item) {
    throw new Error(`Oggetto catalogo «${catalogKey}» non trovato. Esegui seed-item-catalog.`)
  }
  return addItemToInventory(characterId, item.id, quantity, options)
}

/**
 * Rimuove un oggetto dall'inventario.
 */
export async function removeItemFromInventory(inventoryId: string, characterId: string) {
  const inv = await db.query.inventory.findFirst({
    where: and(
      eq(inventory.id, inventoryId),
      eq(inventory.characterId, characterId)
    ),
  })

  if (!inv) {
    throw new Error('Oggetto non trovato nell\'inventario')
  }

  await db.delete(inventory).where(eq(inventory.id, inventoryId))

  return { success: true }
}

/**
 * Equipaggia/rimuove equipaggiamento di un oggetto.
 */
export async function toggleEquipItem(inventoryId: string, characterId: string) {
  const inv = await db.query.inventory.findFirst({
    where: and(
      eq(inventory.id, inventoryId),
      eq(inventory.characterId, characterId)
    ),
    with: {
      item: true,
    },
  })

  if (!inv) {
    throw new Error('Oggetto non trovato nell\'inventario')
  }

  const category = (inv.item.category ?? 'junk') as ItemCategory
  if (!isEquippableItem(inv.item.type, category)) {
    throw new Error('Questo oggetto non può essere equipaggiato.')
  }

  if (
    usesIntegrity(category) &&
    isItemBroken(inv.integrityCurrent, inv.item.integrityMax)
  ) {
    throw new Error('Non puoi equipaggiare un oggetto rotto.')
  }

  // Se è uno zaino e lo stiamo equipaggiando, verifica che non ci siano altri zaini equipaggiati
  if (inv.item.type === 'BAG' && !inv.isEquipped) {
    const otherEquippedBags = await db.query.inventory.findMany({
      where: and(
        eq(inventory.characterId, characterId),
        eq(inventory.isEquipped, true)
      ),
      with: {
        item: true,
      },
    })

    const hasOtherBag = otherEquippedBags.some(
      (i) => i.item.type === 'BAG' && i.id !== inventoryId
    )

    if (hasOtherBag) {
      throw new Error('Puoi equipaggiare solo uno zaino alla volta')
    }
  }

  const [updated] = await db
    .update(inventory)
    .set({ isEquipped: !inv.isEquipped })
    .where(eq(inventory.id, inventoryId))
    .returning()

  return updated
}

/**
 * Sposta un oggetto tra inventario portato addosso (CARRY) e inventario casa (HOUSING).
 */
export async function moveItemLocation(
  inventoryId: string,
  characterId: string,
  location: 'CARRY' | 'HOUSING'
) {
  const inv = await db.query.inventory.findFirst({
    where: and(
      eq(inventory.id, inventoryId),
      eq(inventory.characterId, characterId)
    ),
  })

  if (!inv) {
    throw new Error('Oggetto non trovato nell\'inventario')
  }

  const [updated] = await db
    .update(inventory)
    .set({ location })
    .where(eq(inventory.id, inventoryId))
    .returning()

  return updated
}

/**
 * Aggiorna la quantità di un oggetto nell'inventario.
 */
export async function updateItemQuantity(
  inventoryId: string,
  characterId: string,
  quantity: number
) {
  if (quantity < 1) {
    throw new Error('La quantità deve essere almeno 1')
  }

  const inv = await db.query.inventory.findFirst({
    where: and(
      eq(inventory.id, inventoryId),
      eq(inventory.characterId, characterId)
    ),
  })

  if (!inv) {
    throw new Error('Oggetto non trovato nell\'inventario')
  }

  const [updated] = await db
    .update(inventory)
    .set({ quantity })
    .where(eq(inventory.id, inventoryId))
    .returning()

  return updated
}

// ─── Rubare da casa altrui (solo ospiti) ───

/**
 * Ottiene gli oggetti nell'armadio della casa del proprietario.
 * Restituisce i dati solo se il chiamante (guestCharacterId) è ospite della casa.
 */
export async function getHousingArmadioForGuest(
  ownerCharacterId: string,
  guestCharacterId: string
): Promise<{
  items: Array<{
    id: string
    item: { name: string; type: string }
    quantity: number
    location: string
  }>
}> {
  const guestRow = await db.query.housingGuests.findFirst({
    where: and(
      eq(housingGuests.ownerCharacterId, ownerCharacterId),
      eq(housingGuests.guestCharacterId, guestCharacterId)
    ),
  })
  if (!guestRow) {
    throw new Error('Non sei ospite di questa casa')
  }

  const invRows = await db
    .select({
      inventory_id: inventory.id,
      inventory_itemId: inventory.itemId,
      inventory_quantity: inventory.quantity,
      inventory_location: inventory.location,
      item_id: items.id,
      item_name: items.name,
      item_type: items.type,
    })
    .from(inventory)
    .leftJoin(items, eq(inventory.itemId, items.id))
    .where(
      and(
        eq(inventory.characterId, ownerCharacterId),
        eq(inventory.location, 'HOUSING')
      )
    )

  const itemsList = invRows
    .filter((row) => row.item_id != null)
    .map((row) => ({
      id: row.inventory_id!,
      item: {
        name: row.item_name ?? '?',
        type: row.item_type ?? 'MISC',
      },
      quantity: row.inventory_quantity ?? 1,
      location: row.inventory_location ?? 'HOUSING',
    }))

  return { items: itemsList }
}

/**
 * Ruba un oggetto dall'armadio della casa del proprietario.
 * Solo gli ospiti (housing_guests) possono rubare.
 * Sposta 1 unità dall'inventario housing del proprietario allo zaino del ladro.
 */
export async function stealFromHousing(
  ownerCharacterId: string,
  inventoryId: string,
  thiefCharacterId: string
) {
  const guestRow = await db.query.housingGuests.findFirst({
    where: and(
      eq(housingGuests.ownerCharacterId, ownerCharacterId),
      eq(housingGuests.guestCharacterId, thiefCharacterId)
    ),
  })
  if (!guestRow) {
    throw new Error('Non sei ospite di questa casa')
  }

  const invRow = await db.query.inventory.findFirst({
    where: and(
      eq(inventory.id, inventoryId),
      eq(inventory.characterId, ownerCharacterId),
      eq(inventory.location, 'HOUSING')
    ),
    with: { item: true },
  })

  if (!invRow) {
    throw new Error('Oggetto non trovato nell\'armadio')
  }

  const slotInfo = await calculateTotalSlots(thiefCharacterId)
  const thiefCarry = await getCarrySlotUsage(thiefCharacterId)
  if (!canFitInSlots(thiefCarry.occupied, slotInfo.totalSlots, 1)) {
    throw new Error('Inventario pieno. Libera spazio prima di rubare.')
  }

  const qty = invRow.quantity ?? 0
  const toSteal = Math.min(1, qty)

  await db.transaction(async (tx) => {
    if (qty <= 1) {
      await tx.delete(inventory).where(eq(inventory.id, inventoryId))
    } else {
      await tx
        .update(inventory)
        .set({ quantity: qty - toSteal })
        .where(eq(inventory.id, inventoryId))
    }
    await tx.insert(inventory).values({
      characterId: thiefCharacterId,
      itemId: invRow.itemId,
      quantity: toSteal,
      isEquipped: false,
      location: 'CARRY',
    })
  })

  return { success: true }
}

/** Consuma materiali dallo zaino per catalog_key `mat-{materialId}`. */
export async function consumeMaterialsByCatalogKey(
  characterId: string,
  costs: readonly { materialId: string; quantity: number }[],
  options?: { location?: InventoryLocation },
) {
  const location = options?.location ?? 'CARRY'

  for (const cost of costs) {
    if (cost.quantity <= 0) continue
    const catalogKey = `mat-${cost.materialId}`
    let remaining = cost.quantity

    const rows = await db.query.inventory.findMany({
      where: and(eq(inventory.characterId, characterId), eq(inventory.location, location)),
      with: { item: true },
      orderBy: [desc(inventory.createdAt)],
    })

    for (const row of rows) {
      if (row.item.catalogKey !== catalogKey) continue
      const qty = row.quantity ?? 0
      if (qty <= 0) continue
      const take = Math.min(remaining, qty)
      remaining -= take
      if (qty <= take) {
        await db.delete(inventory).where(eq(inventory.id, row.id))
      } else {
        await db.update(inventory).set({ quantity: qty - take }).where(eq(inventory.id, row.id))
      }
      if (remaining <= 0) break
    }

    if (remaining > 0) {
      const label = cost.materialId.replace(/_/g, ' ')
      throw new Error(`Materiale insufficiente: ${label} (mancano ${remaining}).`)
    }
  }
}

/** Consuma uno o più stack consumabili per catalog_key (es. Ofuda). */
export async function consumeStackableByCatalogKey(
  characterId: string,
  catalogKey: string,
  quantity: number = 1,
  options?: { location?: InventoryLocation },
) {
  if (quantity <= 0) return
  const location = options?.location ?? 'CARRY'
  let remaining = quantity

  const rows = await db.query.inventory.findMany({
    where: and(eq(inventory.characterId, characterId), eq(inventory.location, location)),
    with: { item: true },
    orderBy: [desc(inventory.createdAt)],
  })

  for (const row of rows) {
    if (row.item.catalogKey !== catalogKey) continue
    const qty = row.quantity ?? 0
    if (qty <= 0) continue
    const take = Math.min(remaining, qty)
    remaining -= take
    if (qty <= take) {
      await db.delete(inventory).where(eq(inventory.id, row.id))
    } else {
      await db.update(inventory).set({ quantity: qty - take }).where(eq(inventory.id, row.id))
    }
    if (remaining <= 0) break
  }

  if (remaining > 0) {
    throw new Error(`Oggetto insufficiente: ${catalogKey} (mancano ${remaining}).`)
  }
}
