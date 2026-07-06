import { describe, expect, it } from 'vitest'
import {
  computeDaysOverdue,
  computeEvictionDate,
  computeInitialDueDate,
  computeNextDueDateAfterPayment,
  evaluateRentCycle,
  isRentCovered,
  shouldClearPaidFlag,
} from './housing-rent-cycle'

describe('housing-rent-cycle', () => {
  it('computeInitialDueDate — prima del 15 usa il 15 del mese corrente', () => {
    const d = computeInitialDueDate(new Date(2026, 2, 10))
    expect(d.getDate()).toBe(15)
    expect(d.getMonth()).toBe(2)
  })

  it('computeInitialDueDate — dopo il 15 usa il 15 del mese successivo', () => {
    const d = computeInitialDueDate(new Date(2026, 2, 20))
    expect(d.getDate()).toBe(15)
    expect(d.getMonth()).toBe(3)
  })

  it('computeNextDueDateAfterPayment — sempre il 15 del mese successivo', () => {
    const d = computeNextDueDateAfterPayment(new Date(2026, 1, 15))
    expect(d.getDate()).toBe(15)
    expect(d.getMonth()).toBe(2)
  })

  it('isRentCovered — pagato e prima della scadenza', () => {
    const due = new Date(2026, 3, 15)
    expect(isRentCovered(true, due, new Date(2026, 3, 10))).toBe(true)
    expect(isRentCovered(true, due, new Date(2026, 3, 15))).toBe(false)
  })

  it('shouldClearPaidFlag — alla scadenza serve nuovo ciclo', () => {
    const due = new Date(2026, 3, 15)
    expect(shouldClearPaidFlag(true, due, new Date(2026, 3, 15))).toBe(true)
    expect(shouldClearPaidFlag(true, due, new Date(2026, 3, 14))).toBe(false)
  })

  it('evaluateRentCycle — giorno scadenza non pagato', () => {
    const due = new Date(2026, 3, 15)
    const r = evaluateRentCycle({ today: due, dueDate: due, hasPaid: false })
    expect(r.status).toBe('DUE_TODAY')
  })

  it('evaluateRentCycle — morosità con messageIndex', () => {
    const due = new Date(2026, 3, 15)
    const r = evaluateRentCycle({ today: new Date(2026, 3, 17), dueDate: due, hasPaid: false })
    expect(r.status).toBe('OVERDUE')
    if (r.status === 'OVERDUE') {
      expect(r.daysOverdue).toBe(2)
      expect(r.messageIndex).toBe(2)
    }
  })

  it('evaluateRentCycle — sfratto dall’8 del mese successivo', () => {
    const due = new Date(2026, 1, 15)
    const eviction = computeEvictionDate(due)
    expect(eviction.getDate()).toBe(8)
    expect(eviction.getMonth()).toBe(2)
    const r = evaluateRentCycle({ today: eviction, dueDate: due, hasPaid: false })
    expect(r.status).toBe('EVICT')
  })

  it('computeDaysOverdue', () => {
    const due = new Date(2026, 3, 15)
    expect(computeDaysOverdue(due, new Date(2026, 3, 16))).toBe(1)
  })
})
