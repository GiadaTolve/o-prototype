// packages/domain/src/ledger/rules/monthly-rent.ts

export function evaluateMonthlyRent(args: {
  today: Date
  dueDate: Date
  rentAmount: any
  hasPaid: boolean
  daysOverdue: number
}) {
  const { today, dueDate, hasPaid, daysOverdue } = args

  if (hasPaid) {
    return { status: 'OK' as const }
  }

  if (today <= dueDate) {
    return { status: 'OK' as const }
  }

  if (daysOverdue >= 7) {
    return { status: 'EVICTED' as const }
  }

  return {
    status: 'OVERDUE' as const,
    messageIndex: daysOverdue
  }
}
