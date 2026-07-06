import { eq } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { characters, characterHousing, ledgerEntries } from '../../db/schema'
import { createRem } from '@domain/types/money'
import { spend } from '@domain/ledger/transaction'
import {
  computeInitialDueDate,
  computeNextDueDateAfterPayment,
  evaluateRentCycle,
  isRentCovered,
  shouldClearPaidFlag,
  startOfDay,
} from '@domain/ledger/rules/housing-rent-cycle'
import { getRentReminderMessage } from '@domain/ledger/rules/rent-reminder-messages'
import { sendRentReminderSms, sendEvictionNoticeSms } from './rent-reminder.service'

export type MonthlyRentProcessResult = {
  characterId: string
  autoPaid?: boolean
  evicted?: boolean
  reminderSent?: boolean
  newBalance?: number
}

type HousingRow = {
  id: string
  characterId: string
  hasPaidCurrentMonth: boolean
  evicted: boolean
  daysOverdue: number
  nextDueDate: Date | null
  housingType: {
    id: string
    code: string
    name: string
    monthlyRent: number | null
  }
}

async function ensureDueDate(housing: HousingRow): Promise<Date> {
  if (housing.nextDueDate) {
    return startOfDay(housing.nextDueDate)
  }
  const due = computeInitialDueDate(new Date())
  due.setHours(23, 59, 59, 999)
  await db
    .update(characterHousing)
    .set({ nextDueDate: due })
    .where(eq(characterHousing.id, housing.id))
  return startOfDay(due)
}

async function tryAutoPayRent(
  characterId: string,
  housing: HousingRow,
  rentAmount: number,
): Promise<number | null> {
  const char = await db.query.characters.findFirst({
    where: eq(characters.id, characterId),
  })
  if (!char) return null

  const currentBalance = createRem(char.rem)
  const amount = createRem(rentAmount)
  if (currentBalance < amount) return null

  const spendResult = spend(currentBalance, amount)
  if (!spendResult.ok) return null
  const newRemValue = spendResult.newBalance as number
  const nextDueDate = computeNextDueDateAfterPayment(new Date())
  nextDueDate.setHours(23, 59, 59, 999)

  await db.transaction(async (tx) => {
    await tx.update(characters).set({ rem: newRemValue }).where(eq(characters.id, characterId))
    await tx
      .update(characterHousing)
      .set({
        hasPaidCurrentMonth: true,
        nextDueDate,
        daysOverdue: 0,
      })
      .where(eq(characterHousing.id, housing.id))
    await tx.insert(ledgerEntries).values({
      characterId,
      type: 'RENT',
      amount: -(amount as number),
      balanceAfter: newRemValue,
      description: `Affitto mensile: ${housing.housingType.name}`,
      metadata: {
        housingTypeId: housing.housingType.id,
        housingTypeCode: housing.housingType.code,
        source: 'auto_daily_tick',
      },
    })
  })

  return newRemValue
}

async function evictTenant(housing: HousingRow, today: Date): Promise<void> {
  await db
    .update(characterHousing)
    .set({ evicted: true, evictedAt: today })
    .where(eq(characterHousing.id, housing.id))
  await db.delete(characterHousing).where(eq(characterHousing.id, housing.id))
  await sendEvictionNoticeSms(housing.characterId, housing.housingType.name)
}

/**
 * Gestisce affitto mensile per un singolo contratto (scadenza `nextDueDate`, sfratto 8 del mese dopo).
 */
export async function processMonthlyRentForHousing(
  housing: HousingRow,
  todayInput: Date = new Date(),
): Promise<MonthlyRentProcessResult | null> {
  if (!housing.housingType.monthlyRent || housing.evicted) {
    return null
  }

  const today = startOfDay(todayInput)
  const rentAmount = housing.housingType.monthlyRent
  let hasPaid = housing.hasPaidCurrentMonth
  const dueDate = await ensureDueDate(housing)

  if (isRentCovered(hasPaid, dueDate, today)) {
    return null
  }

  if (shouldClearPaidFlag(hasPaid, dueDate, today)) {
    hasPaid = false
    await db
      .update(characterHousing)
      .set({ hasPaidCurrentMonth: false })
      .where(eq(characterHousing.id, housing.id))
  }

  const cycle = evaluateRentCycle({ today, dueDate, hasPaid })

  if (cycle.status === 'OK') {
    return null
  }

  if (cycle.status === 'EVICT') {
    await evictTenant(housing, today)
    return { characterId: housing.characterId, evicted: true }
  }

  if (cycle.status === 'DUE_TODAY') {
    const paid = await tryAutoPayRent(housing.characterId, housing, rentAmount)
    if (paid != null) {
      return { characterId: housing.characterId, autoPaid: true, newBalance: paid }
    }
    await db
      .update(characterHousing)
      .set({ daysOverdue: 0 })
      .where(eq(characterHousing.id, housing.id))
    const sent = await sendRentReminderSms(housing.characterId, {
      messageIndex: 0,
      housingName: housing.housingType.name,
      rentAmount,
      dueDate,
    })
    return { characterId: housing.characterId, reminderSent: sent }
  }

  // OVERDUE
  await db
    .update(characterHousing)
    .set({ daysOverdue: cycle.daysOverdue })
    .where(eq(characterHousing.id, housing.id))

  const sent = await sendRentReminderSms(housing.characterId, {
    messageIndex: cycle.messageIndex,
    housingName: housing.housingType.name,
    rentAmount,
    dueDate,
  })

  return { characterId: housing.characterId, reminderSent: sent }
}

/** Elabora affitti mensili per tutti i contratti attivi (indipendente dallo stipendio). */
export async function processMonthlyRentForAllCharacters(
  todayInput: Date = new Date(),
): Promise<{ processed: number; results: MonthlyRentProcessResult[] }> {
  const rows = await db.query.characterHousing.findMany({
    where: eq(characterHousing.evicted, false),
    with: { housingType: true },
  })

  const results: MonthlyRentProcessResult[] = []

  for (const row of rows) {
    const ht = row.housingType
    if (!ht?.monthlyRent) continue

    const housing: HousingRow = {
      id: row.id,
      characterId: row.characterId,
      hasPaidCurrentMonth: row.hasPaidCurrentMonth,
      evicted: row.evicted,
      daysOverdue: row.daysOverdue,
      nextDueDate: row.nextDueDate,
      housingType: {
        id: ht.id,
        code: ht.code,
        name: ht.name,
        monthlyRent: ht.monthlyRent,
      },
    }

    const result = await processMonthlyRentForHousing(housing, todayInput)
    if (result) results.push(result)
  }

  return { processed: results.length, results }
}
