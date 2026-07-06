import { describe, expect, it } from 'vitest'
import { getRentReminderMessage } from './rent-reminder-messages'

describe('rent-reminder-messages', () => {
  const due = new Date(2026, 3, 15)

  it('include prefisso e nome abitazione', () => {
    const msg = getRentReminderMessage({
      messageIndex: 0,
      housingName: 'Il Container',
      rentAmount: 100,
      dueDate: due,
    })
    expect(msg.startsWith('【Affitto】')).toBe(true)
    expect(msg).toContain('Il Container')
    expect(msg).toContain('100 REM')
  })

  it('escalation ultimo avviso', () => {
    const msg = getRentReminderMessage({
      messageIndex: 7,
      housingName: 'Monolocale',
      rentAmount: 120,
      dueDate: due,
    })
    expect(msg).toContain('ULTIMO AVVISO')
  })
})
