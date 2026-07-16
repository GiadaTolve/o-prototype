import { describe, expect, it } from 'vitest'
import {
  JUNKAN_POTENZIAMENTO_BASE,
  resolveJunkanPotenziamentoCapacity,
} from './junkan'

describe('Junkan', () => {
  it('Capacità Potenziamento = 3 + Itami', () => {
    expect(resolveJunkanPotenziamentoCapacity({ itami: 5 })).toBe(
      JUNKAN_POTENZIAMENTO_BASE + 5,
    )
    expect(resolveJunkanPotenziamentoCapacity({})).toBe(JUNKAN_POTENZIAMENTO_BASE)
  })
})
