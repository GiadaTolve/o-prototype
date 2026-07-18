import { and, eq, isNotNull } from 'drizzle-orm'
import { isMarketCategory, type MarketCategory } from '@domain/economy/market-catalog'
import type { ItemCategory } from '@domain/economy/types'
import { db } from '../../plugins/db'
import { characters, inventory, items } from '../../db/schema'
import { addItemToInventory } from '../inventory/inventory.service'
import { applyRemDelta } from './rem-ledger'
import { broadcastInventoryUpdated } from '../realtime/ws.routes'

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function uniqueCatalogKey(base: string): Promise<string> {
  let candidate = `market-${base}`
  let n = 1
  while (await db.query.items.findFirst({ where: eq(items.catalogKey, candidate) })) {
    n += 1
    candidate = `market-${base}-${n}`
  }
  return candidate
}

/** Catalogo pubblico Market — solo voci attive con categoria vetrina assegnata. */
export async function listMarketCatalog() {
  const rows = await db.query.items.findMany({
    where: and(isNotNull(items.marketCategory), eq(items.isActiveInMarket, true)),
    orderBy: (t, { asc }) => [asc(t.marketCategory), asc(t.name)],
  })
  return rows.map(toCatalogEntry)
}

/** Tutti gli oggetti nel DB — per il pannello Sviluppo (nessun filtro categoria). */
export async function listMarketCatalogAdmin() {
  const rows = await db.query.items.findMany({
    orderBy: (t, { asc }) => [asc(t.name)],
  })
  return rows.map(toCatalogEntry)
}

function toCatalogEntry(row: typeof items.$inferSelect) {
  return {
    id: row.id,
    catalogKey: row.catalogKey,
    marketCategory: row.marketCategory as MarketCategory,
    name: row.name,
    nameRomaji: row.nameRomaji,
    description: row.description,
    iconUrl: row.iconUrl,
    integrityMax: row.integrityMax,
    effectText: row.effectText,
    priceRem: row.price,
    isActiveInMarket: row.isActiveInMarket,
    category: row.category as ItemCategory,
    type: row.type,
    damage: row.damage,
    resistance: row.resistance,
    bonus: row.bonus,
    ammoKind: row.ammoKind,
  }
}

export type MarketCatalogInput = {
  marketCategory: string
  name: string
  nameRomaji?: string | null
  description?: string | null
  iconUrl?: string | null
  integrityMax?: number | null
  effectText?: string | null
  priceRem: number
  category?: ItemCategory
  isActiveInMarket?: boolean
  type?: 'GENERIC' | 'WEAPON' | 'ARMOR' | 'BAG'
  damage?: number | null
  resistance?: number | null
  bonus?: number | null
  ammoKind?: string | null
}

function assertValidInput(input: MarketCatalogInput) {
  if (!isMarketCategory(input.marketCategory)) {
    throw new Error('Categoria Market non valida.')
  }
  if (!input.name?.trim()) {
    throw new Error('Nome italiano obbligatorio.')
  }
  if (!Number.isFinite(input.priceRem) || input.priceRem < 0) {
    throw new Error('Prezzo Rem non valido.')
  }
}

export async function createMarketCatalogItem(input: MarketCatalogInput) {
  assertValidInput(input)
  const catalogKey = await uniqueCatalogKey(slugify(input.name))

  const [row] = await db
    .insert(items)
    .values({
      catalogKey,
      name: input.name,
      nameRomaji: input.nameRomaji ?? null,
      description: input.description ?? null,
      iconUrl: input.iconUrl ?? null,
      category: input.category ?? 'equipaggiamento',
      type: input.type ?? 'GENERIC',
      integrityMax: input.integrityMax ?? null,
      effectText: input.effectText ?? null,
      inventorySlotCost: 1,
      isStackable: false,
      marketCategory: input.marketCategory as MarketCategory,
      price: input.priceRem,
      isActiveInMarket: input.isActiveInMarket ?? true,
      damage: input.damage ?? null,
      resistance: input.resistance ?? null,
      bonus: input.bonus ?? null,
      ammoKind: input.ammoKind ?? null,
    })
    .returning()

  return toCatalogEntry(row)
}

export async function updateMarketCatalogItem(id: string, input: Partial<MarketCatalogInput>) {
  const existing = await db.query.items.findFirst({ where: eq(items.id, id) })
  if (!existing) throw new Error('Oggetto non trovato.')

  if (input.marketCategory != null && input.marketCategory !== '' && !isMarketCategory(input.marketCategory)) {
    throw new Error('Categoria Market non valida.')
  }
  if (input.priceRem != null && (!Number.isFinite(input.priceRem) || input.priceRem < 0)) {
    throw new Error('Prezzo Rem non valido.')
  }

  const [row] = await db
    .update(items)
    .set({
      name: input.name ?? existing.name,
      nameRomaji: input.nameRomaji !== undefined ? input.nameRomaji : existing.nameRomaji,
      description: input.description !== undefined ? input.description : existing.description,
      iconUrl: input.iconUrl !== undefined ? input.iconUrl : existing.iconUrl,
      integrityMax: input.integrityMax !== undefined ? input.integrityMax : existing.integrityMax,
      effectText: input.effectText !== undefined ? input.effectText : existing.effectText,
      marketCategory:
        input.marketCategory !== undefined
          ? (input.marketCategory as MarketCategory | null)
          : existing.marketCategory,
      price: input.priceRem ?? existing.price,
      isActiveInMarket: input.isActiveInMarket ?? existing.isActiveInMarket,
      category: input.category ?? existing.category,
      type: input.type ?? existing.type,
      damage: input.damage !== undefined ? input.damage : existing.damage,
      resistance: input.resistance !== undefined ? input.resistance : existing.resistance,
      bonus: input.bonus !== undefined ? input.bonus : existing.bonus,
      ammoKind: input.ammoKind !== undefined ? input.ammoKind : existing.ammoKind,
    })
    .where(eq(items.id, id))
    .returning()

  return toCatalogEntry(row)
}

/**
 * "Elimina" dal pannello Sviluppo: se nessun personaggio possiede già l'oggetto,
 * lo rimuove davvero. Altrimenti lo disattiva soltanto (righe inventario esistenti
 * restano valide, l'oggetto sparisce solo dalla vetrina).
 */
export async function deleteOrDeactivateMarketCatalogItem(id: string) {
  const existing = await db.query.items.findFirst({ where: eq(items.id, id) })
  if (!existing) throw new Error('Oggetto non trovato.')

  const owned = await db.query.inventory.findFirst({ where: eq(inventory.itemId, id) })
  if (owned) {
    await db.update(items).set({ isActiveInMarket: false }).where(eq(items.id, id))
    return { deactivated: true as const }
  }

  await db.delete(items).where(eq(items.id, id))
  return { deleted: true as const }
}

export async function buyFromMarketCatalog(characterId: string, itemId: string, quantity = 1) {
  if (quantity < 1) throw new Error('Quantità non valida.')

  const item = await db.query.items.findFirst({ where: eq(items.id, itemId) })
  if (!item || !item.marketCategory || !item.isActiveInMarket) {
    throw new Error('Oggetto non disponibile nel Market.')
  }
  if (item.price == null) throw new Error('Oggetto non acquistabile.')

  const totalRem = item.price * quantity
  await applyRemDelta(
    characterId,
    -totalRem,
    'PURCHASE',
    `Market: acquisto ${item.name}${quantity > 1 ? ` ×${quantity}` : ''}`,
    { channel: 'market-catalog', itemId, quantity },
  )

  await addItemToInventory(characterId, item.id, quantity, { origin: 'comprato' })
  broadcastInventoryUpdated(characterId)

  const char = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
    columns: { rem: true },
  })

  return {
    itemId: item.id,
    itemName: item.name,
    quantity,
    totalRem,
    newBalance: char?.rem ?? 0,
  }
}
