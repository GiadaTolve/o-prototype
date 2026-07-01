import { describe, expect, it } from 'vitest'
import type { SkiruSheet } from '../../../packages/domain/src/skiru/types'
import {
  applyStatus,
  applyElementalStatus,
  tickStatusEndOfCharacterTurn,
  onSuccessfulHitTaken,
  onConfrontationStatusEvent,
  compileStatusModifiers,
  adjustCsCostFromStatus,
  calculateSuccessIndexWithStatus,
  createStatusContainer,
  getStatusStacks,
  STATUS_DEFINITIONS,
} from '../../../packages/domain/src/combat/index.ts'

describe('status engine §2.4', () => {
  it('applica status emotivo con stack default', () => {
    let c = createStatusContainer()
    c = applyStatus(c, 'ira')
    expect(c.statuses).toEqual([{ id: 'ira', stacks: 1 }])
    expect(compileStatusModifiers(c).offensiveTierBonus).toBe(1)
  })

  it('elementale fuoco → Incendiato 3 turni', () => {
    let c = createStatusContainer()
    c = applyElementalStatus(c, 'fuoco')
    expect(c.statuses[0]).toEqual({ id: 'incendiato', stacks: 3 })
  })

  it('decay a fine turno e DoT Emorragia', () => {
    let c = applyStatus(createStatusContainer(), 'emorragia', { stacks: 2 })
    const tick = tickStatusEndOfCharacterTurn(c)
    expect(tick.selfDamage).toBe(4)
    expect(tick.container.statuses[0]?.stacks).toBe(1)
  })

  it('Beatitudine non decade', () => {
    let c = applyStatus(createStatusContainer(), 'beatitudine', { stacks: 2 })
    const tick = tickStatusEndOfCharacterTurn(c)
    expect(tick.container.statuses[0]?.stacks).toBe(2)
    expect(compileStatusModifiers(tick.container).bonusCsPerTurn).toBe(1)
  })

  it('Tristezza dimezza CS (min 1)', () => {
    const c = applyStatus(createStatusContainer(), 'tristezza')
    expect(adjustCsCostFromStatus(3, c)).toBe(1)
    expect(adjustCsCostFromStatus(4, c)).toBe(2)
  })

  it('Macchiato −1 stack su colpo subito', () => {
    let c = applyStatus(createStatusContainer(), 'macchiato', { stacks: 2 })
    c = onSuccessfulHitTaken(c)
    expect(c.statuses[0]?.stacks).toBe(1)
  })

  it('Euforia stack su confronto', () => {
    let c = applyStatus(createStatusContainer(), 'euforia', { stacks: 3 })
    c = onConfrontationStatusEvent(c, { won: true, tookDamage: true })
    expect(c.statuses[0]?.stacks).toBe(3)
    c = onConfrontationStatusEvent(c, { won: true, tookDamage: false })
    expect(c.statuses[0]?.stacks).toBe(4)
  })

  it('catalogo copre tutti gli status roadmap', () => {
    const ids = [
      'ira',
      'tristezza',
      'disperazione',
      'beatitudine',
      'euforia',
      'incendiato',
      'sovraccarico',
      'torpore',
      'appesantimento',
      'vertigini',
      'emorragia',
    'debitore',
    'debito',
    'metamorfosi',
      'trance_onirica',
      'sigillato',
      'macchiato',
      'rallentato',
    ] as const
    for (const id of ids) {
      expect(STATUS_DEFINITIONS[id]).toBeDefined()
    }
  })

  it('Rallentato penalizza movimento di 2 m', () => {
    const c = applyStatus(createStatusContainer(), 'rallentato', { stacks: 2 })
    expect(compileStatusModifiers(c).movementPenaltyMeters).toBe(2)
    expect(compileStatusModifiers(c).indexBonus).toBe(0)
  })

  it('Debitore forza Skiru più bassa nell\'IR', () => {
    const sheet: SkiruSheet = { kensei: 8, 'itten-kokan': 2 }
    const c = applyStatus(createStatusContainer(), 'debitore')
    const ir = calculateSuccessIndexWithStatus(
      sheet,
      { physicalSkiruId: 'kensei', channelingSkiruId: 'itten-kokan' },
      c,
    )
    expect(ir.successIndex).toBe(2)
  })

  it('Debito Shakkin forza Skiru più bassa nell\'IR', () => {
    const sheet: SkiruSheet = { kensei: 8, 'itten-kokan': 2 }
    const c = applyStatus(createStatusContainer(), 'debito', { stacks: 3 })
    const ir = calculateSuccessIndexWithStatus(
      sheet,
      { physicalSkiruId: 'kensei', channelingSkiruId: 'itten-kokan' },
      c,
    )
    expect(ir.successIndex).toBe(2)
    expect(getStatusStacks(c, 'debito')).toBe(3)
  })
})
