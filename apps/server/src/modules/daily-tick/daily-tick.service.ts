import { eq, and, gte, lte } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { characters, ledgerEntries, users, characterHousing } from '../../db/schema'
import { createRem } from '@domain/types/money'
import { calculateSalary } from '@domain/ledger/rules/salary'
import { earn } from '@domain/ledger/transaction'
import { processMonthlyRentForAllCharacters } from '../housing/housing-monthly-rent.service'

const DAILY_SALARY_AMOUNT = 20 // +20 REM al giorno

/**
 * Esegue il Daily Tick per tutti i personaggi attivi.
 * Assegna lo stipendio giornaliero (+20 REM) e registra nel ledger.
 * In coda elabora affitti mensili e solleciti del Locatario (pass separato).
 */
export async function processDailyTickForAllCharacters() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const activeCharacters = await db.query.characters.findMany({
    where: eq(characters.isRaw, false),
  })

  const results = []

  for (const char of activeCharacters) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, char.userId),
    })

    if (!user) continue

    if (user.banState === 'FULL') {
      continue
    }

    const todayStart = new Date(today)
    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)

    const alreadyPaid = await db.query.ledgerEntries.findFirst({
      where: and(
        eq(ledgerEntries.characterId, char.id),
        eq(ledgerEntries.type, 'SALARY'),
        gte(ledgerEntries.createdAt, todayStart),
        lte(ledgerEntries.createdAt, todayEnd),
      ),
    })

    if (alreadyPaid) {
      continue
    }

    const housing = await db.query.characterHousing.findFirst({
      where: eq(characterHousing.characterId, char.id),
      with: {
        housingType: true,
      },
    })

    const ht = housing?.housingType as
      | { dailyRent?: number | null; monthlyRent?: number | null }
      | undefined
    let dailyRent: number | undefined = undefined
    if (housing && ht?.dailyRent) {
      dailyRent = ht.dailyRent
    }

    const currentBalance = createRem(char.rem)
    const baseSalary = createRem(DAILY_SALARY_AMOUNT)

    const salaryResult = calculateSalary({
      currentBalance,
      baseSalary,
      mode: 'DAILY',
      banState: user.banState ?? 'NONE',
      dailyRent: dailyRent ? createRem(dailyRent) : undefined,
    })

    if (!('ok' in salaryResult) || !salaryResult.ok) {
      continue
    }

    const newBalance = earn(currentBalance, salaryResult.amount)
    const newRemValue = 'newBalance' in newBalance ? newBalance.newBalance : 0

    await db.transaction(async (tx) => {
      await tx.update(characters).set({ rem: newRemValue }).where(eq(characters.id, char.id))

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

  const rentResults = await processMonthlyRentForAllCharacters(today)

  return {
    processed: results.length,
    results,
    rent: rentResults,
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

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)

  const alreadyPaid = await db.query.ledgerEntries.findFirst({
    where: and(
      eq(ledgerEntries.characterId, char.id),
      eq(ledgerEntries.type, 'SALARY'),
      gte(ledgerEntries.createdAt, today),
      lte(ledgerEntries.createdAt, todayEnd),
    ),
  })

  if (alreadyPaid) {
    throw new Error('Stipendio già pagato oggi')
  }

  const currentBalance = createRem(char.rem)
  const baseSalary = createRem(DAILY_SALARY_AMOUNT)

  const salaryResult = calculateSalary({
    currentBalance,
    baseSalary,
    mode: 'DAILY',
    banState: user.banState ?? 'NONE',
    dailyRent: undefined,
  })

  if (!('ok' in salaryResult) || !salaryResult.ok) {
    throw new Error(
      `Impossibile pagare stipendio: ${'reason' in salaryResult ? salaryResult.reason : 'unknown'}`,
    )
  }

  const newBalance = earn(currentBalance, salaryResult.amount)
  const newRemValue = 'newBalance' in newBalance ? newBalance.newBalance : 0

  await db.transaction(async (tx) => {
    await tx.update(characters).set({ rem: newRemValue }).where(eq(characters.id, char.id))

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
