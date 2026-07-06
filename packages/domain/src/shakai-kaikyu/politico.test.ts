import { describe, expect, it } from 'vitest'
import { getSocialBlueprint } from './blueprint-catalog'
import { inferAllowedLeverages, isPoliticoPactTemplate, validateNewPact } from './politico'

describe('politico', () => {
  it('riconosce template patto', () => {
    const bp = getSocialBlueprint('politico-patto-peso-1')
    expect(bp && isPoliticoPactTemplate(bp)).toBe(true)
  })

  it('leve da sottoclassi', () => {
    expect(inferAllowedLeverages({ 'seijika-kojin': true })).toEqual(['neutro'])
    expect(inferAllowedLeverages({ 'seijika-meishi': true })).toContain('formale')
  })

  it('valida nuovo patto', () => {
    const bp = getSocialBlueprint('politico-patto-peso-2')!
    expect(
      validateNewPact(
        bp,
        { maxWeight: 2, maxActive: 2, activeCount: 0 },
        'neutro',
        ['neutro'],
      ).ok,
    ).toBe(true)
    expect(
      validateNewPact(
        bp,
        { maxWeight: 2, maxActive: 2, activeCount: 2 },
        'neutro',
        ['neutro'],
      ).ok,
    ).toBe(false)
  })
})
