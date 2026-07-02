import { eq } from 'drizzle-orm'
import { createRem } from '@domain/types/money'
import { earn, spend } from '@domain/ledger/transaction'
import { db } from '../../plugins/db'
import { characters, ledgerEntries } from '../../db/schema'

export async function applyRemDelta(
  characterId: string,
  amount: number,
  type: 'PURCHASE' | 'SALE' | 'TRANSFER',
  description: string,
  metadata?: Record<string, unknown>,
): Promise<number> {
  const char = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
    columns: { rem: true },
  })
  if (!char) throw new Error('Personaggio non trovato')

  const balance = createRem(char.rem)
  let newRemValue: number

  if (amount < 0) {
    const result = spend(balance, createRem(-amount))
    if (!result.ok) throw new Error('Saldo insufficiente')
    newRemValue = result.newBalance as number
  } else {
    const result = earn(balance, createRem(amount))
    newRemValue = result.newBalance as number
  }

  await db.transaction(async (tx) => {
    await tx.update(characters).set({ rem: newRemValue }).where(eq(characters.id, characterId))
    await tx.insert(ledgerEntries).values({
      characterId,
      type,
      amount,
      balanceAfter: newRemValue,
      description,
      metadata: metadata ?? {},
    })
  })

  return newRemValue
}

export async function getCharacterLabel(characterId: string): Promise<string> {
  const char = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
    columns: { name: true, surname: true },
  })
  if (!char) return 'Sconosciuto'
  return char.surname ? `${char.name} ${char.surname}` : char.name
}
