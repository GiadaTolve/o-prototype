import { eq, and, gte, lte } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { characters, ledgerEntries, users, characterHousing, housingTypes } from '../../db/schema'
import { createRem } from '@domain/types/money'
import { calculateSalary } from '@domain/ledger/rules/salary'
import { earn, spend } from '@domain/ledger/transaction'

const DAILY_SALARY_AMOUNT = 20 // +20 REM al giorno

/**
 * Gestisce l'affitto mensile per un personaggio.
 * Scadenza: 15 del mese
 * Sfratto: Giorno 8 del mese successivo (se non pagato)
 */
async function processMonthlyRent(
  characterId: string,
  housing: {
    id: string;
    housingTypeId: string;
    hasPaidCurrentMonth: boolean;
    evicted: boolean;
    daysOverdue: number;
    housingType: {
      id: string;
      code: string;
      name: string;
      monthlyRent: number | null;
      dailyRent: number | null;
    };
  },
  today: Date
): Promise<{ newBalance: number } | null> {
  if (!housing.housingType.monthlyRent) {
    return null // Non è un affitto mensile
  }

  if (housing.evicted) {
    return null // Già sfrattato
  }

  // Calcola la scadenza (15 del mese corrente o precedente se siamo già oltre)
  let dueDate = new Date(today.getFullYear(), today.getMonth(), 15)
  if (today.getDate() > 15) {
    // Se siamo già oltre il 15, la scadenza è il 15 del mese corrente
    dueDate = new Date(today.getFullYear(), today.getMonth(), 15)
  } else {
    // Altrimenti è il 15 del mese precedente
    dueDate = new Date(today.getFullYear(), today.getMonth() - 1, 15)
  }
  dueDate.setHours(23, 59, 59, 999)

  // Calcola il giorno di sfratto (8 del mese successivo alla scadenza)
  const evictionDate = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 8)
  evictionDate.setHours(0, 0, 0, 0)

  // Se è già stato pagato questo mese, non fare nulla
  if (housing.hasPaidCurrentMonth && today <= dueDate) {
    return null
  }

  // Se siamo dopo la scadenza ma prima dello sfratto
  if (today > dueDate && today < evictionDate) {
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Aggiorna i giorni di ritardo
    await db
      .update(characterHousing)
      .set({ daysOverdue })
      .where(eq(characterHousing.id, housing.id))

    return null // Non ancora sfrattato, ma in ritardo
  }

  // Se siamo al giorno di sfratto o dopo
  if (today >= evictionDate) {
    // Sfratto: rimuovi l'abitazione
    await db
      .update(characterHousing)
      .set({
        evicted: true,
        evictedAt: today,
      })
      .where(eq(characterHousing.id, housing.id))

    // Rimuovi l'abitazione dal personaggio (cancella il record)
    await db
      .delete(characterHousing)
      .where(eq(characterHousing.id, housing.id))

    return null // Sfrattato, non c'è più affitto da pagare
  }

  // Se siamo al giorno di scadenza (15) e non è stato pagato, prova a pagare automaticamente
  if (today.getDate() === 15 && !housing.hasPaidCurrentMonth) {
    const char = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
    })

    if (!char) return null

    const currentBalance = createRem(char.rem)
    const rentAmount = createRem(housing.housingType.monthlyRent)

    // Verifica se può pagare
    if (currentBalance >= rentAmount) {
      // Paga l'affitto
      const newBalance = spend(currentBalance, rentAmount)
      const newRemValue = newBalance.newBalance as number

      // Calcola la prossima scadenza (15 del mese successivo)
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
          amount: -(rentAmount as number), // Negativo perché è un'uscita
          balanceAfter: newRemValue,
          description: `Affitto mensile: ${housing.housingType.name}`,
          metadata: {
            housingTypeId: housing.housingType.id,
            housingTypeCode: housing.housingType.code,
          },
        })
      })

      return { newBalance: newRemValue }
    } else {
      // Non può pagare, segna come non pagato
      await db
        .update(characterHousing)
        .set({ hasPaidCurrentMonth: false })
        .where(eq(characterHousing.id, housing.id))
    }
  }

  return null
}

/**
 * Esegue il Daily Tick per tutti i personaggi attivi.
 * Assegna lo stipendio giornaliero (+20 REM) e registra nel ledger.
 */
export async function processDailyTickForAllCharacters() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Trova tutti i personaggi attivi (non raw)
  const activeCharacters = await db.query.characters.findMany({
    where: eq(characters.isRaw, false),
  })

  const results = []

  for (const char of activeCharacters) {
    // Ottieni l'utente per verificare il banState
    const user = await db.query.users.findFirst({
      where: eq(users.id, char.userId),
    })

    if (!user) continue

    // Skip se FULL ban (non riceve stipendio)
    if (user.banState === 'FULL') {
      continue
    }

    // Verifica se ha già ricevuto lo stipendio oggi
    const todayStart = new Date(today)
    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)

    const alreadyPaid = await db.query.ledgerEntries.findFirst({
      where: and(
        eq(ledgerEntries.characterId, char.id),
        eq(ledgerEntries.type, 'SALARY'),
        gte(ledgerEntries.createdAt, todayStart),
        lte(ledgerEntries.createdAt, todayEnd)
      ),
    })

    if (alreadyPaid) {
      continue // Già pagato oggi
    }

    // Verifica se ha un'abitazione
    const housing = await db.query.characterHousing.findFirst({
      where: eq(characterHousing.characterId, char.id),
      with: {
        housingType: true,
      },
    })

    // Calcola affitto giornaliero (solo per Stanza dell'Ordine)
    let dailyRent: number | undefined = undefined
    if (housing && housing.housingType.dailyRent) {
      dailyRent = housing.housingType.dailyRent
    }

    // Calcola lo stipendio usando la logica del domain
    const currentBalance = createRem(char.rem)
    const baseSalary = createRem(DAILY_SALARY_AMOUNT)

    const salaryResult = calculateSalary({
      currentBalance,
      baseSalary,
      mode: 'DAILY',
      banState: user.banState,
      dailyRent: dailyRent ? createRem(dailyRent) : undefined,
    })

    if (!salaryResult.ok) {
      continue // Non può ricevere stipendio
    }

    // Aggiorna il balance del personaggio
    let newBalance = earn(currentBalance, salaryResult.amount)
    let newRemValue = newBalance.newBalance as number

    // Gestisci affitto mensile (se applicabile)
    let rentProcessed = false
    if (housing && housing.housingType.monthlyRent && !housing.evicted) {
      const today = new Date()
      const rentResult = await processMonthlyRent(char.id, housing, today)
      if (rentResult) {
        newRemValue = rentResult.newBalance
        rentProcessed = true
      }
    }

    await db.transaction(async (tx) => {
      // Aggiorna il balance
      await tx
        .update(characters)
        .set({ rem: newRemValue })
        .where(eq(characters.id, char.id))

      // Registra stipendio nel ledger
      await tx.insert(ledgerEntries).values({
        characterId: char.id,
        type: 'SALARY',
        amount: salaryResult.amount as number,
        balanceAfter: newRemValue,
        description: `Stipendio giornaliero: ${salaryResult.reason}`,
        metadata: {
          source: salaryResult.source,
          reason: salaryResult.reason,
        },
      })
    })

    results.push({
      characterId: char.id,
      characterName: char.name,
      amount: salaryResult.amount as number,
      newBalance: newRemValue,
    })
  }

  return {
    processed: results.length,
    results,
    date: today.toISOString(),
  }
}

/**
 * Esegue il Daily Tick per un singolo personaggio (utile per test o recupero).
 */
export async function processDailyTickForCharacter(characterId: string) {
  const char = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
  })

  if (!char) {
    throw new Error('Personaggio non trovato')
  }

  if (char.isRaw) {
    throw new Error('Personaggio non ancora attivato')
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, char.userId),
  })

  if (!user) {
    throw new Error('Utente non trovato')
  }

  if (user.banState === 'FULL') {
    throw new Error('Personaggio bannato completamente, non può ricevere stipendio')
  }

  // Verifica se ha già ricevuto lo stipendio oggi
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)

  const alreadyPaid = await db.query.ledgerEntries.findFirst({
    where: and(
      eq(ledgerEntries.characterId, char.id),
      eq(ledgerEntries.type, 'SALARY'),
      gte(ledgerEntries.createdAt, today),
      sql`${ledgerEntries.createdAt} <= ${todayEnd}`
    ),
  })

  if (alreadyPaid) {
    throw new Error('Stipendio già pagato oggi')
  }

  // Calcola lo stipendio
  const currentBalance = createRem(char.rem)
  const baseSalary = createRem(DAILY_SALARY_AMOUNT)

  const salaryResult = calculateSalary({
    currentBalance,
    baseSalary,
    mode: 'DAILY',
    banState: user.banState,
    dailyRent: undefined,
  })

  if (!salaryResult.ok) {
    throw new Error(`Impossibile pagare stipendio: ${salaryResult.reason}`)
  }

  // Aggiorna il balance
  const newBalance = earn(currentBalance, salaryResult.amount)
  const newRemValue = newBalance.newBalance as number

  await db.transaction(async (tx) => {
    await tx
      .update(characters)
      .set({ rem: newRemValue })
      .where(eq(characters.id, char.id))

    await tx.insert(ledgerEntries).values({
      characterId: char.id,
      type: 'SALARY',
      amount: salaryResult.amount as number,
      balanceAfter: newRemValue,
      description: `Stipendio giornaliero: ${salaryResult.reason}`,
      metadata: {
        source: salaryResult.source,
        reason: salaryResult.reason,
      },
    })
  })

  return {
    characterId: char.id,
    characterName: char.name,
    amount: salaryResult.amount as number,
    newBalance: newRemValue,
  }
}

/**
 * Ottiene lo storico del ledger per un personaggio.
 */
export async function getCharacterLedger(characterId: string, limit = 50) {
  const entries = await db.query.ledgerEntries.findMany({
    where: eq(ledgerEntries.characterId, characterId),
    orderBy: (entries, { desc }) => [desc(entries.createdAt)],
    limit,
  })

  return entries
}
