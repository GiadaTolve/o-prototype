import { and, desc, eq } from 'drizzle-orm'
import {
  formatPiazzaTradeMessage,
  isMarketableCategory,
  PIAZZA_MAX_ACTIVE_LISTINGS,
  piazzaSellerProceeds,
} from '@domain/economy/market'
import { isItemBroken } from '@domain/economy/items'
import type { ItemCategory } from '@domain/economy/types'
import { db } from '../../plugins/db'
import { characters, inventory, marketListings, marketTradeFeed } from '../../db/schema'
import { applyRemDelta, getCharacterLabel } from './rem-ledger'
import { broadcastInventoryUpdated } from '../realtime/ws.routes'

export async function listPiazzaListings(limit = 50) {
  const rows = await db.query.marketListings.findMany({
    where: eq(marketListings.status, 'active'),
    orderBy: [desc(marketListings.createdAt)],
    limit: Math.min(limit, 100),
  })
  return rows
}

export async function getMyPiazzaListings(sellerCharacterId: string) {
  return db.query.marketListings.findMany({
    where: and(
      eq(marketListings.sellerCharacterId, sellerCharacterId),
      eq(marketListings.status, 'active'),
    ),
    orderBy: [desc(marketListings.createdAt)],
  })
}

export async function createPiazzaListing(
  sellerCharacterId: string,
  inventoryId: string,
  priceRem: number,
) {
  if (!Number.isInteger(priceRem) || priceRem < 1) {
    throw new Error('Prezzo non valido (minimo 1 Rem).')
  }

  const activeCount = await db.query.marketListings.findMany({
    where: and(
      eq(marketListings.sellerCharacterId, sellerCharacterId),
      eq(marketListings.status, 'active'),
    ),
  })
  if (activeCount.length >= PIAZZA_MAX_ACTIVE_LISTINGS) {
    throw new Error(`Massimo ${PIAZZA_MAX_ACTIVE_LISTINGS} inserzioni attive.`)
  }

  const inv = await db.query.inventory.findFirst({
    where: and(eq(inventory.id, inventoryId), eq(inventory.characterId, sellerCharacterId)),
    with: { item: true },
  })
  if (!inv?.item) throw new Error('Oggetto non trovato nell\'inventario.')
  if (inv.isEquipped) throw new Error('Smonta prima l\'oggetto equipaggiato.')
  if (inv.location === 'MARKET') throw new Error('Oggetto già in vendita.')

  const category = (inv.item.category ?? 'junk') as ItemCategory
  if (!isMarketableCategory(category)) {
    throw new Error('Questo oggetto non può essere venduto.')
  }
  if (
    (category === 'equipaggiamento' || category === 'costrutto_materiale') &&
    isItemBroken(inv.integrityCurrent, inv.item.integrityMax)
  ) {
    throw new Error('Il Banco/Piazza non accetta equipaggiamento rotto (usa smantellamento).')
  }

  const existingListing = await db.query.marketListings.findFirst({
    where: eq(marketListings.inventoryId, inventoryId),
  })
  if (existingListing?.status === 'active') {
    throw new Error('Inserzione già attiva per questo oggetto.')
  }

  await db.update(inventory).set({ location: 'MARKET' }).where(eq(inventory.id, inventoryId))

  const [listing] = await db
    .insert(marketListings)
    .values({
      sellerCharacterId,
      inventoryId,
      priceRem,
      itemName: inv.item.name,
      itemCategory: category,
      craftedByName: inv.craftedByName,
      quantity: inv.quantity ?? 1,
      status: 'active',
    })
    .returning()

  broadcastInventoryUpdated(sellerCharacterId)

  return listing
}

export async function cancelPiazzaListing(sellerCharacterId: string, listingId: string) {
  const listing = await db.query.marketListings.findFirst({
    where: and(
      eq(marketListings.id, listingId),
      eq(marketListings.sellerCharacterId, sellerCharacterId),
      eq(marketListings.status, 'active'),
    ),
  })
  if (!listing) throw new Error('Inserzione non trovata.')

  await db.transaction(async (tx) => {
    await tx
      .update(marketListings)
      .set({ status: 'cancelled' })
      .where(eq(marketListings.id, listingId))
    await tx
      .update(inventory)
      .set({ location: 'CARRY' })
      .where(eq(inventory.id, listing.inventoryId))
  })

  broadcastInventoryUpdated(sellerCharacterId)

  return { success: true }
}

export async function buyPiazzaListing(buyerCharacterId: string, listingId: string) {
  const listing = await db.query.marketListings.findFirst({
    where: and(eq(marketListings.id, listingId), eq(marketListings.status, 'active')),
  })
  if (!listing) throw new Error('Inserzione non disponibile.')
  if (listing.sellerCharacterId === buyerCharacterId) {
    throw new Error('Non puoi comprare la tua inserzione.')
  }

  const inv = await db.query.inventory.findFirst({
    where: eq(inventory.id, listing.inventoryId),
  })
  if (!inv) throw new Error('Oggetto dell\'inserzione non trovato.')

  const sellerProceeds = piazzaSellerProceeds(listing.priceRem)

  await applyRemDelta(
    buyerCharacterId,
    -listing.priceRem,
    'PURCHASE',
    `Piazza: acquisto ${listing.itemName}`,
    { channel: 'piazza', listingId },
  )

  await db.transaction(async (tx) => {
    await tx
      .update(inventory)
      .set({
        characterId: buyerCharacterId,
        location: 'CARRY',
        isEquipped: false,
      })
      .where(eq(inventory.id, listing.inventoryId))

    await tx
      .update(marketListings)
      .set({
        status: 'sold',
        buyerCharacterId,
        soldAt: new Date(),
      })
      .where(eq(marketListings.id, listingId))
  })

  await applyRemDelta(
    listing.sellerCharacterId,
    sellerProceeds,
    'SALE',
    `Piazza: vendita ${listing.itemName}`,
    { channel: 'piazza', listingId, grossRem: listing.priceRem },
  )

  const sellerLabel = await getCharacterLabel(listing.sellerCharacterId)
  const buyerLabel = await getCharacterLabel(buyerCharacterId)
  const message = formatPiazzaTradeMessage(
    sellerLabel,
    buyerLabel,
    listing.itemName,
    listing.quantity ?? 1,
    listing.priceRem,
  )

  await db.insert(marketTradeFeed).values({
    message,
    sellerCharacterId: listing.sellerCharacterId,
    buyerCharacterId,
    grossRem: listing.priceRem,
  })

  broadcastInventoryUpdated(buyerCharacterId)
  broadcastInventoryUpdated(listing.sellerCharacterId)

  return {
    listingId,
    itemName: listing.itemName,
    priceRem: listing.priceRem,
    sellerProceeds,
    message,
  }
}

export async function getPiazzaTradeFeed(limit = 30) {
  return db.query.marketTradeFeed.findMany({
    orderBy: [desc(marketTradeFeed.createdAt)],
    limit: Math.min(limit, 100),
  })
}
