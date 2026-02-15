import { eq } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { characters, characterHousing, housingTypes, ledgerEntries } from '../../db/schema'
import { createRem } from '@domain/types/money'
import { spend } from '@domain/ledger/transaction'

/**
 * Ottiene tutte le tipologie di abitazione disponibili.
 */
export async function getAllHousingTypes() {
  return await db.query.housingTypes.findMany({
    orderBy: (types, { asc }) => [asc(types.monthlyRent ?? 0)],
  })
}

/**
 * Ottiene l'abitazione di un personaggio.
 */
export async function getCharacterHousing(characterId: string) {
  return await db.query.characterHousing.findFirst({
    where: eq(characterHousing.characterId, characterId),
    with: {
      housingType: true,
    },
  })
}

/**
 * Assegna un'abitazione a un personaggio.
 * Se il personaggio ha già un'abitazione, la rimuove prima.
 */
export async function assignHousing(
  characterId: string,
  housingTypeId: string
) {
  const char = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
  })

  if (!char) {
    throw new Error('Personaggio non trovato')
  }

  const housingType = await db.query.housingTypes.findFirst({
    where: eq(housingTypes.id, housingTypeId),
  })

  if (!housingType) {
    throw new Error('Tipo di abitazione non trovato')
  }

  // Verifica requisiti (es. paradise pass)
  if (housingType.requirements?.paradisePass) {
    // TODO: Verifica se il personaggio ha il pass paradise
    // Per ora, permetto a tutti
  }

  // Rimuovi l'abitazione esistente (se presente)
  const existing = await db.query.characterHousing.findFirst({
    where: eq(characterHousing.characterId, characterId),
  })

  if (existing) {
    await db.delete(characterHousing).where(eq(characterHousing.id, existing.id))
  }

  // Calcola la prossima scadenza (15 del mese corrente o successivo)
  const today = new Date()
  let nextDueDate: Date | null = null

  if (housingType.monthlyRent) {
    // Per affitti mensili, la scadenza è il 15 del mese corrente (se siamo prima del 15) o del mese successivo
    if (today.getDate() <= 15) {
      nextDueDate = new Date(today.getFullYear(), today.getMonth(), 15)
    } else {
      nextDueDate = new Date(today.getFullYear(), today.getMonth() + 1, 15)
    }
    nextDueDate.setHours(23, 59, 59, 999)
  }

  // Genera un roomId univoco per la chat della casa (solo per case con affitto mensile, non per Stanza dell'Ordine)
  let chatRoomId: string | null = null
  if (housingType.monthlyRent) {
    // Formato: housing_{code}_{characterId} (es. housing_container_abc123)
    chatRoomId = `housing_${housingType.code}_${characterId}`
  }

  // Crea la nuova abitazione
  const [newHousing] = await db.insert(characterHousing).values({
    characterId,
    housingTypeId,
    chatRoomId,
    nextDueDate,
    hasPaidCurrentMonth: false, // Deve pagare al prossimo 15
    daysOverdue: 0,
    evicted: false,
  }).returning()

  return newHousing
}

/**
 * Paga manualmente l'affitto mensile.
 */
export async function payMonthlyRent(characterId: string) {
  const housing = await db.query.characterHousing.findFirst({
    where: eq(characterHousing.characterId, characterId),
    with: {
      housingType: true,
    },
  })

  if (!housing) {
    throw new Error('Nessuna abitazione assegnata')
  }

  if (!housing.housingType.monthlyRent) {
    throw new Error('Questa abitazione non ha affitto mensile')
  }

  if (housing.evicted) {
    throw new Error('Abitazione sfrattata')
  }

  if (housing.hasPaidCurrentMonth) {
    throw new Error('Affitto già pagato per questo mese')
  }

  const char = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
  })

  if (!char) {
    throw new Error('Personaggio non trovato')
  }

  const currentBalance = createRem(char.rem)
  const rentAmount = createRem(housing.housingType.monthlyRent)

  // Verifica se può pagare
  if (currentBalance < rentAmount) {
    throw new Error('Saldo insufficiente per pagare l\'affitto')
  }

  // Paga l'affitto
  const newBalance = spend(currentBalance, rentAmount)
  const newRemValue = newBalance.newBalance as number

  // Calcola la prossima scadenza (15 del mese successivo)
  const today = new Date()
  const nextDueDate = new Date(today.getFullYear(), today.getMonth() + 1, 15)
  nextDueDate.setHours(23, 59, 59, 999)

  await db.transaction(async (tx) => {
    // Aggiorna il balance
    await tx
      .update(characters)
      .set({ rem: newRemValue })
      .where(eq(characters.id, characterId))

    // Aggiorna l'housing
    await tx
      .update(characterHousing)
      .set({
        hasPaidCurrentMonth: true,
        nextDueDate,
        daysOverdue: 0,
      })
      .where(eq(characterHousing.id, housing.id))

    // Registra nel ledger
    await tx.insert(ledgerEntries).values({
      characterId,
      type: 'RENT',
      amount: -(rentAmount as number),
      balanceAfter: newRemValue,
      description: `Affitto mensile: ${housing.housingType.name}`,
      metadata: {
        housingTypeId: housing.housingType.id,
        housingTypeCode: housing.housingType.code,
      },
    })
  })

  return {
    newBalance: newRemValue,
    nextDueDate,
  }
}

/**
 * Rimuove l'abitazione di un personaggio (diventa senzatetto).
 */
export async function removeHousing(characterId: string) {
  const housing = await db.query.characterHousing.findFirst({
    where: eq(characterHousing.characterId, characterId),
  })

  if (!housing) {
    throw new Error('Nessuna abitazione assegnata')
  }

  await db.delete(characterHousing).where(eq(characterHousing.id, housing.id))

  return { success: true }
}
