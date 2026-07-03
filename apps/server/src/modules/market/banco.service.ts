import { and, eq } from 'drizzle-orm'
import {
  BANCO_SELLABLE_MATERIALS,
  materialCatalogKey,
  resolveBancoBuyPrice,
  resolveBancoSellPrice,
} from '@domain/economy/market'
import { isItemBroken } from '@domain/economy/items'
import type { ItemCategory } from '@domain/economy/types'
import { ECONOMY_MATERIAL_LABELS } from '@domain/economy/junklist'
import { db } from '../../plugins/db'
import { characters, inventory, items } from '../../db/schema'
import { addItemByCatalogKey } from '../inventory/inventory.service'
import { applyRemDelta } from './rem-ledger'
import { broadcastInventoryUpdated } from '../realtime/ws.routes'

export function getBancoNpcCatalog() {
  return {
    buyPrices: BANCO_SELLABLE_MATERIALS.map((materialId) => ({
      materialId,
      catalogKey: materialCatalogKey(materialId),
      name: ECONOMY_MATERIAL_LABELS[materialId],
      priceRem: resolveBancoSellPrice(materialId),
    })),
    rules: {
      buysJunk: 2,
      buysCommonMaterial: 5,
      buysRareMaterial: 20,
      buysCraftedConsumable: 10,
      buysIntactEquip: 25,
    },
  }
}

export async function sellInventoryToBanco(characterId: string, inventoryId: string) {
  const inv = await db.query.inventory.findFirst({
    where: and(eq(inventory.id, inventoryId), eq(inventory.characterId, characterId)),
    with: { item: true },
  })
  if (!inv?.item) throw new Error('Oggetto non trovato nell\'inventario.')
  if (inv.isEquipped) throw new Error('Smonta prima l\'oggetto equipaggiato.')
  if (inv.location === 'MARKET') throw new Error('Oggetto già in vendita sulla Piazza.')

  const category = (inv.item.category ?? 'junk') as ItemCategory
  const price = resolveBancoBuyPrice({
    category,
    materialId: inv.item.materialId,
    origin: inv.origin,
    isBroken: isItemBroken(inv.integrityCurrent, inv.item.integrityMax),
  })
  if (price == null) throw new Error('Il Banco non acquista questo oggetto.')

  const qty = inv.quantity ?? 1
  const totalRem = price * qty

  await db.delete(inventory).where(eq(inventory.id, inventoryId))
  const newBalance = await applyRemDelta(
    characterId,
    totalRem,
    'SALE',
    `Banco: vendita ${inv.item.name}${qty > 1 ? ` ×${qty}` : ''}`,
    { channel: 'banco', inventoryId, itemName: inv.item.name, quantity: qty },
  )

  broadcastInventoryUpdated(characterId)

  return {
    itemName: inv.item.name,
    quantity: qty,
    unitPriceRem: price,
    totalRem,
    newBalance,
  }
}

export async function buyMaterialFromBanco(
  characterId: string,
  catalogKey: string,
  quantity: number = 1,
) {
  if (quantity < 1) throw new Error('Quantità non valida.')

  const item = await db.query.items.findFirst({
    where: eq(items.catalogKey, catalogKey),
  })
  if (!item?.materialId) throw new Error('Materiale non disponibile al Banco.')

  const unitPrice = resolveBancoSellPrice(item.materialId)
  if (unitPrice == null) throw new Error('Il Banco non vende questo materiale.')

  const totalRem = unitPrice * quantity
  await applyRemDelta(
    characterId,
    -totalRem,
    'PURCHASE',
    `Banco: acquisto ${item.name} ×${quantity}`,
    { channel: 'banco', catalogKey, quantity },
  )

  await addItemByCatalogKey(characterId, catalogKey, quantity, { origin: 'comprato' })

  broadcastInventoryUpdated(characterId)

  const char = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
    columns: { rem: true },
  })

  return {
    catalogKey,
    itemName: item.name,
    quantity,
    totalRem,
    newBalance: char?.rem ?? 0,
  }
}
