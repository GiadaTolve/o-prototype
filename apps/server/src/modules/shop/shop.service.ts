import { eq, and } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { items, characters, inventory, ledgerEntries } from '../../db/schema'
import { createRem } from '@domain/types/money'
import { spend, earn } from '@domain/ledger/transaction'
import { addItemToInventory } from '../inventory/inventory.service'

/**
 * Ottiene tutti gli oggetti disponibili nello shop.
 */
export async function getShopItems() {
  return await db.query.items.findMany({
    orderBy: (items, { asc }) => [asc(items.name)],
  })
}

/**
 * Compra un oggetto dallo shop.
 */
export async function buyItem(
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

  // Verifica prezzo
  if (item.price == null) {
    throw new Error('Questo oggetto non è in vendita')
  }

  const totalPrice = item.price * quantity
  if (totalPrice <= 0) {
    throw new Error('Prezzo non valido')
  }

  // Verifica saldo
  const currentBalance = createRem(char.rem)
  const itemPrice = createRem(totalPrice)
  
  if (currentBalance < itemPrice) {
    throw new Error('Saldo insufficiente per acquistare questo oggetto')
  }

  // Verifica spazio disponibile
  try {
    const newInv = await addItemToInventory(characterId, itemId, quantity)

    // Paga l'oggetto
    const newBalance = spend(currentBalance, itemPrice)
    const newRemValue = newBalance.newBalance as number

    await db.transaction(async (tx) => {
      // Aggiorna il balance
      await tx
        .update(characters)
        .set({ rem: newRemValue })
        .where(eq(characters.id, characterId))

      // Registra nel ledger
      await tx.insert(ledgerEntries).values({
        characterId,
        type: 'PURCHASE',
        amount: -totalPrice, // Negativo perché è un'uscita
        balanceAfter: newRemValue,
        description: `Acquisto: ${item.name}${quantity > 1 ? ` x${quantity}` : ''}`,
        metadata: {
          itemId: item.id,
          itemName: item.name,
          quantity,
        },
      })
    })

    return newInv
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes('Inventario pieno')) {
      throw e
    }
    throw new Error('Errore durante l\'acquisto')
  }
}

/**
 * Vende un oggetto (rimuove dall'inventario e aggiunge REM).
 * Per ora, non c'è un sistema di vendita, ma possiamo implementarlo.
 */
export async function sellItem(
  characterId: string,
  inventoryId: string,
  price: number
) {
  const char = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
  })

  if (!char) {
    throw new Error('Personaggio non trovato')
  }

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

  // Rimuovi dall'inventario
  await db.delete(inventory).where(eq(inventory.id, inventoryId))

  // Aggiungi REM
  const currentBalance = createRem(char.rem)
  const salePrice = createRem(price)
  const newBalance = earn(currentBalance, salePrice)
  const newRemValue = newBalance.newBalance as number

  await db.transaction(async (tx) => {
    await tx
      .update(characters)
      .set({ rem: newRemValue })
      .where(eq(characters.id, characterId))

    await tx.insert(ledgerEntries).values({
      characterId,
      type: 'SALE',
      amount: price,
      balanceAfter: newRemValue,
      description: `Vendita: ${inv.item.name}`,
      metadata: {
        itemId: inv.itemId,
        itemName: inv.item.name,
      },
    })
  })

  return {
    newBalance: newRemValue,
    soldItem: inv.item.name,
  }
}
