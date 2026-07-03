import { describe, expect, it } from 'vitest'
import {
  applyExclusiveSkiru,
  canGrantExclusiveSkiru,
  getActiveJigaMilestone,
} from './exclusive-skiru'
import type { SkiruSheet } from './types'

describe('exclusive-skiru', () => {
  it('blocca Erede se Eremita è già attivo', () => {
    const sheet: SkiruSheet = { inkyo: 1 }
    const check = canGrantExclusiveSkiru(sheet, 'keishosha')
    expect(check.ok).toBe(false)
    expect(check.reason).toMatch(/mutuamente esclusive/i)
  })

  it('blocca Eremita se Erede è già attivo', () => {
    const sheet: SkiruSheet = { keishosha: 1 }
    const check = canGrantExclusiveSkiru(sheet, 'inkyo')
    expect(check.ok).toBe(false)
  })

  it('consente upgrade Erede → Erede Perfetto nello stesso percorso', () => {
    const sheet: SkiruSheet = { keishosha: 1 }
    const check = canGrantExclusiveSkiru(sheet, 'kanpeki-keishosha')
    expect(check.ok).toBe(true)

    const next = applyExclusiveSkiru(sheet, 'kanpeki-keishosha')
    expect(next.keishosha).toBeUndefined()
    expect(next['kanpeki-keishosha']).toBe(1)
    expect(getActiveJigaMilestone(next)).toBe('kanpeki-keishosha')
  })

  it('blocca cambio percorso se un altro è già attivo', () => {
    const sheet: SkiruSheet = { 'sento-senshi': 1 }
    const check = canGrantExclusiveSkiru(sheet, 'renkinjutsushi')
    expect(check.ok).toBe(false)
    expect(check.reason).toMatch(/mutuamente esclusive/i)
  })
})
