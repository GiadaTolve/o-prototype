import { describe, expect, it } from 'vitest'
import { totalExpForSkiruPoints, totalExpSpentOnSkiruSheet } from './progression'
import type { SkiruSheet } from './types'

describe('totalExpSpentOnSkiruSheet', () => {
  it('somma il costo cumulativo di ogni nodo investito', () => {
    const sheet: SkiruSheet = { hansha: 2, kensei: 1 }
    expect(totalExpSpentOnSkiruSheet(sheet)).toBe(
      totalExpForSkiruPoints(2) + totalExpForSkiruPoints(1),
    )
  })

  it('ignora nodi a zero punti', () => {
    expect(totalExpSpentOnSkiruSheet({ hansha: 0, undo: 3 })).toBe(totalExpForSkiruPoints(3))
  })
})
