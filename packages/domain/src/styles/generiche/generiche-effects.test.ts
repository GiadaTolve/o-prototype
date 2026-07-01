import { describe, expect, it } from 'vitest'
import { createStatusContainer } from '../../combat/status/engine'
import {
  extractGenericheHitTargetSpec,
  findGenericheStatusPoolId,
  processGenericheIppuku,
} from './generiche-effects'

describe('Generiche effects', () => {
  it('Ippuku rigenera CS e Sovraccarico oltre cap', () => {
    const r = processGenericheIppuku(createStatusContainer(), 18, 0)
    expect(r.csDelta).toBe(3)
    expect(r.overheatApplied).toBe(true)
    expect(r.statusContainer.statuses.some((s) => s.id === 'sovraccarico')).toBe(true)
  })

  it('Ippuku sotto cap non applica Sovraccarico', () => {
    const r = processGenericheIppuku(createStatusContainer(), 10, 0)
    expect(r.overheatApplied).toBe(false)
  })

  it('colpito e pool status', () => {
    expect(extractGenericheHitTargetSpec('[generiche:colpito:Kaito]')?.nameQuery).toBe('Kaito')
    expect(
      findGenericheStatusPoolId(['generiche-suishin-acupressione-liquida', 'other']),
    ).toBe('generiche-suishin-acupressione-liquida')
  })
})
