import { eq, and, gte, lte } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { characters, jobs, ledgerEntries, users, characterHousing, housingTypes } from '../../db/schema'
import { createRem } from '@domain/types/money'
import { calculateSalary } from '@domain/ledger/rules/salary'
import { earn, spend } from '@domain/ledger/transaction'

const DAILY_SALARY_AMOUNT = 20 // +20 REM al giorno (default)

/**
 * Ottiene tutti i job disponibili.
 */
export async function getAllJobs() {
  return await db.query.jobs.findMany({
    orderBy: (jobs, { asc }) => [asc(jobs.dailySalary)],
  })
}

/**
 * Ottiene il job corrente di un personaggio.
 */
export async function getCharacterJob(characterId: string) {
  const char = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
    with: {
      job: true,
    },
  })

  return char?.job || null
}

/**
 * Cambia il job di un personaggio.
 */
export async function changeCharacterJob(characterId: string, jobId: string) {
  const char = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
  })

  if (!char) {
    throw new Error('Personaggio non trovato')
  }

  const job = await db.query.jobs.findFirst({
    where: eq(jobs.id, jobId),
  })

  if (!job) {
    throw new Error('Job non trovato')
  }

  const [updated] = await db
    .update(characters)
    .set({ jobId })
    .where(eq(characters.id, characterId))
    .returning()

  return updated
}

/**
 * Ritira lo stipendio giornaliero per il personaggio corrente.
 * Verifica se può ricevere lo stipendio (non bannato, non già pagato oggi).
 */
export async function withdrawDailySalary(characterId: string) {
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
      lte(ledgerEntries.createdAt, todayEnd)
    ),
  })

  if (alreadyPaid) {
    throw new Error('Stipendio già ritirato oggi')
  }

  // Ottieni il job del personaggio per calcolare lo stipendio
  const job = await db.query.jobs.findFirst({
    where: eq(jobs.id, char.jobId || ''),
  })

  // Usa lo stipendio del job se disponibile, altrimenti default
  const baseSalaryAmount = job?.dailySalary || DAILY_SALARY_AMOUNT

  // Verifica se ha un'abitazione con affitto giornaliero
  const housing = await db.query.characterHousing.findFirst({
    where: eq(characterHousing.characterId, char.id),
    with: {
      housingType: true,
    },
  })

  // Calcola affitto giornaliero (solo per Stanza dell'Ordine)
  const housingType = housing?.housingType as { dailyRent?: number | null } | undefined
  let dailyRent: number | undefined = undefined
  if (housing && !housing.evicted && housingType?.dailyRent) {
    dailyRent = housingType.dailyRent
  }

  // Calcola lo stipendio usando la logica del domain
  const currentBalance = createRem(char.rem)
  const baseSalary = createRem(baseSalaryAmount)

  const salaryResult = calculateSalary({
    currentBalance,
    baseSalary,
    mode: 'DAILY',
    banState: user.banState ?? 'NONE',
    dailyRent: dailyRent ? createRem(dailyRent) : undefined,
  })

  if (!('ok' in salaryResult) || !salaryResult.ok) {
    throw new Error(`Non può ricevere stipendio: ${'reason' in salaryResult ? salaryResult.reason : 'unknown'}`)
  }

  // Aggiorna il balance del personaggio
  const newBalance = earn(currentBalance, salaryResult.amount)
  const newRemValue = 'newBalance' in newBalance ? newBalance.newBalance : 0

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
        jobId: job?.id,
        jobTitle: job?.title,
      },
    })
  })

  return {
    amount: salaryResult.amount as number,
    newBalance: newRemValue,
    reason: salaryResult.reason,
    jobTitle: job?.title || 'Default',
  }
}

/**
 * Ottiene lo storico del ledger per un personaggio.
 */
export async function getCharacterLedger(characterId: string, limit: number = 50) {
  return await db.query.ledgerEntries.findMany({
    where: eq(ledgerEntries.characterId, characterId),
    orderBy: (entries, { desc }) => [desc(entries.createdAt)],
    limit: Math.min(limit, 100),
  })
}

/**
 * Verifica se il personaggio può ritirare lo stipendio oggi.
 */
export async function canWithdrawSalary(characterId: string): Promise<{
  canWithdraw: boolean
  reason?: string
  lastWithdrawal?: Date
}> {
  const char = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
  })

  if (!char || char.isRaw) {
    return { canWithdraw: false, reason: 'Personaggio non attivo' }
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, char.userId),
  })

  if (!user || user.banState === 'FULL') {
    return { canWithdraw: false, reason: 'Personaggio bannato' }
  }

  // Verifica se ha già ritirato oggi
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)

  const lastWithdrawal = await db.query.ledgerEntries.findFirst({
    where: and(
      eq(ledgerEntries.characterId, char.id),
      eq(ledgerEntries.type, 'SALARY'),
      gte(ledgerEntries.createdAt, today),
      lte(ledgerEntries.createdAt, todayEnd)
    ),
    orderBy: (entries, { desc }) => [desc(entries.createdAt)],
  })

  if (lastWithdrawal) {
    return {
      canWithdraw: false,
      reason: 'Stipendio già ritirato oggi',
      lastWithdrawal: lastWithdrawal.createdAt,
    }
  }

  return { canWithdraw: true }
}

/**
 * Bonifico REM da un personaggio a un altro (per nome PG).
 */
export async function transferRem(
  senderCharacterId: string,
  receiverCharacterName: string,
  amount: number,
  reason: string
) {
  if (amount <= 0) {
    throw new Error('L\'importo deve essere positivo')
  }

  const sender = await db.query.characters.findFirst({
    where: eq(characters.id, senderCharacterId),
  })
  if (!sender) {
    throw new Error('Personaggio non trovato')
  }
  if (sender.isRaw) {
    throw new Error('Personaggio non ancora attivato')
  }

  const receiver = await db.query.characters.findFirst({
    where: eq(characters.name, receiverCharacterName.trim()),
  })
  if (!receiver) {
    throw new Error(`Nessun personaggio trovato con nome "${receiverCharacterName.trim()}"`)
  }
  if (receiver.id === sender.id) {
    throw new Error('Non puoi inviare REM a te stesso')
  }

  const currentBalance = createRem(sender.rem)
  const transferAmount = createRem(amount)
  const spendResult = spend(currentBalance, transferAmount)
  if (!spendResult.ok) {
    throw new Error('Saldo insufficiente')
  }

  const receiverBalance = createRem(receiver.rem)
  const receiverNewBalance = earn(receiverBalance, transferAmount)

  await db.transaction(async (tx) => {
    await tx
      .update(characters)
      .set({ rem: spendResult.newBalance as number })
      .where(eq(characters.id, sender.id))

    await tx
      .update(characters)
      .set({ rem: receiverNewBalance.newBalance as number })
      .where(eq(characters.id, receiver.id))

    await tx.insert(ledgerEntries).values({
      characterId: sender.id,
      type: 'TRANSFER',
      amount: -amount,
      balanceAfter: spendResult.newBalance as number,
      description: reason || 'Bonifico',
      metadata: {
        toCharacterId: receiver.id,
        toCharacterName: receiver.name,
      },
    })

    await tx.insert(ledgerEntries).values({
      characterId: receiver.id,
      type: 'TRANSFER',
      amount,
      balanceAfter: receiverNewBalance.newBalance as number,
      description: reason || 'Bonifico ricevuto',
      metadata: {
        fromCharacterId: sender.id,
        fromCharacterName: sender.name,
      },
    })
  })

  return {
    message: `Bonifico di ${amount} REM inviato a ${receiver.name}`,
    newBalance: spendResult.newBalance as number,
  }
}

/**
 * Lascia il lavoro corrente (imposta jobId a null).
 */
export async function leaveJob(characterId: string) {
  const [updated] = await db
    .update(characters)
    .set({ jobId: null })
    .where(eq(characters.id, characterId))
    .returning()

  if (!updated) {
    throw new Error('Personaggio non trovato')
  }

  return {
    message: 'Hai lasciato il lavoro. Sei ora disoccupato.',
    job: null,
  }
}
