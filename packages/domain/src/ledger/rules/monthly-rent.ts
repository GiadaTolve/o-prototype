// packages/domain/src/ledger/rules/monthly-rent.ts

import {
  computeDaysOverdue,
  computeEvictionDate,
  startOfDay,
} from './housing-rent-cycle'

export function evaluateMonthlyRent(args: {
  today: Date
  dueDate: Date
  rentAmount: any
  hasPaid: boolean
  daysOverdue: number
}) {
  const { today, dueDate, hasPaid } = args
  const due = startOfDay(dueDate)
  const t = startOfDay(today)

  if (hasPaid && t.getTime() < due.getTime()) {
    return { status: 'OK' as const }
  }

  if (t.getTime() < due.getTime()) {
    return { status: 'OK' as const }
  }

  const eviction = computeEvictionDate(due)
  if (t.getTime() >= eviction.getTime()) {
    return { status: 'EVICTED' as const }
  }

  if (t.getTime() === due.getTime()) {
    return { status: 'OVERDUE' as const, messageIndex: 0 }
  }

  const overdue = computeDaysOverdue(due, t)
  return {
    status: 'OVERDUE' as const,
    messageIndex: Math.min(overdue, 7),
  }
}
