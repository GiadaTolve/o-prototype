import { eq, and, desc, sql, inArray } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { inventory, items, characters, characterHousing, housingTypes } from '../../db/schema'

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
        item_name: items.name,
        item_description: items.description,
        item_iconUrl: items.iconUrl,
        item_type: items.type,
        item_slotsBonus: items.slotsBonus,
        item_price: items.price,
        item_createdAt: items.createdAt,
      })
      .from(inventory)
      .leftJoin(items, eq(inventory.itemId, items.id))
      .where(eq(inventory.characterId, characterId))
      .orderBy(desc(inventory.createdAt))

    // Mappa i risultati nel formato atteso
    const mappedItems = invRows
      .filter((row) => row.item_id !== null) // Filtra solo righe con item valido
      .map((row) => ({
        id: row.inventory_id!,
        characterId: row.inventory_characterId!,
        itemId: row.inventory_itemId!,
        quantity: row.inventory_quantity!,
        isEquipped: row.inventory_isEquipped!,
        location: row.inventory_location as 'CARRY' | 'HOUSING',
        createdAt: row.inventory_createdAt!,
        item: {
          id: row.item_id!,
          name: row.item_name!,
          description: row.item_description,
          iconUrl: row.item_iconUrl,
          type: row.item_type!,
          slotsBonus: row.item_slotsBonus!,
          price: row.item_price,
          createdAt: row.item_createdAt!,
        },
      }))

    const slotInfo = await calculateTotalSlots(characterId)

    // Separa oggetti portati addosso e oggetti in abitazione
    const carryItems = mappedItems.filter((i) => i.location === 'CARRY')
    const housingItems = mappedItems.filter((i) => i.location === 'HOUSING')

    // Conta slot occupati per l'inventario "addosso"
    const occupiedCarrySlots = carryItems.length
    const availableCarrySlots = slotInfo.totalSlots - occupiedCarrySlots

    // Conteggio per inventario casa (usa housingSlots come capacità massimo)
    const occupiedHousingSlots = housingItems.length
    const availableHousingSlots = Math.max(0, (slotInfo.housingSlots || 0) - occupiedHousingSlots)

    return {
      items: mappedItems,
      slots: {
        ...slotInfo,
        occupied: occupiedCarrySlots,
        available: availableCarrySlots,
        housingOccupied: occupiedHousingSlots,
        housingAvailable: availableHousingSlots,
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
  quantity: number = 1
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

  // Verifica spazio disponibile
  const slotInfo = await calculateTotalSlots(characterId)
  const currentItems = await db.query.inventory.findMany({
    where: eq(inventory.characterId, characterId),
  })

  const occupiedSlots = currentItems.length
  const availableSlots = slotInfo.totalSlots - occupiedSlots

  if (availableSlots < 1) {
    throw new Error('Inventario pieno. Libera spazio prima di aggiungere oggetti.')
  }

  // Aggiungi l'oggetto
  const [newInv] = await db.insert(inventory).values({
    characterId,
    itemId,
    quantity,
    isEquipped: false,
  }).returning()

  return newInv
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
