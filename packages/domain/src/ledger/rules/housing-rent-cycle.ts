/** Utility pure per il ciclo affitto mensile (scadenza 15, sfratto 8 del mese successivo). */

export function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function fifteenthOfMonth(year: number, month: number): Date {
  const d = new Date(year, month, 15)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Prima scadenza al momento dell'assegnazione contratto. */
export function computeInitialDueDate(from: Date): Date {
  const today = startOfDay(from)
  if (today.getDate() <= 15) {
    return fifteenthOfMonth(today.getFullYear(), today.getMonth())
  }
  return fifteenthOfMonth(today.getFullYear(), today.getMonth() + 1)
}

/** Prossima scadenza dopo un pagamento (15 del mese successivo alla data di pagamento). */
export function computeNextDueDateAfterPayment(paymentDate: Date): Date {
  const today = startOfDay(paymentDate)
  return fifteenthOfMonth(today.getFullYear(), today.getMonth() + 1)
}

/** Sfratto: giorno 8 del mese successivo alla scadenza. */
export function computeEvictionDate(dueDate: Date): Date {
  const due = startOfDay(dueDate)
  return startOfDay(new Date(due.getFullYear(), due.getMonth() + 1, 8))
}

export function computeDaysOverdue(dueDate: Date, today: Date): number {
  const due = startOfDay(dueDate)
  const t = startOfDay(today)
  if (t.getTime() <= due.getTime()) return 0
  return Math.floor((t.getTime() - due.getTime()) / 86_400_000)
}

/** Affitto già saldato per il periodo in corso (prima della scadenza). */
export function isRentCovered(hasPaid: boolean, dueDate: Date, today: Date): boolean {
  return hasPaid && startOfDay(today).getTime() < startOfDay(dueDate).getTime()
}

/** Alla scadenza il flag pagato va azzerato per il nuovo ciclo. */
export function shouldClearPaidFlag(hasPaid: boolean, dueDate: Date, today: Date): boolean {
  return hasPaid && startOfDay(today).getTime() >= startOfDay(dueDate).getTime()
}

export type RentCycleStatus =
  | { status: 'OK' }
  | { status: 'DUE_TODAY'; messageIndex: 0 }
  | { status: 'OVERDUE'; messageIndex: number; daysOverdue: number }
  | { status: 'EVICT' }

export function evaluateRentCycle(args: {
  today: Date
  dueDate: Date
  hasPaid: boolean
}): RentCycleStatus {
  const today = startOfDay(args.today)
  const due = startOfDay(args.dueDate)
  const eviction = computeEvictionDate(due)

  if (args.hasPaid && today.getTime() < due.getTime()) {
    return { status: 'OK' }
  }

  if (today.getTime() < due.getTime()) {
    return { status: 'OK' }
  }

  if (today.getTime() >= eviction.getTime()) {
    return { status: 'EVICT' }
  }

  if (today.getTime() === due.getTime()) {
    return { status: 'DUE_TODAY', messageIndex: 0 }
  }

  const daysOverdue = computeDaysOverdue(due, today)
  const messageIndex = Math.min(daysOverdue, 7)
  return { status: 'OVERDUE', messageIndex, daysOverdue }
}
