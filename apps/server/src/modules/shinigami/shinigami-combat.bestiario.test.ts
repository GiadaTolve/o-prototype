import { describe, expect, it } from 'bun:test'
import {
  asTipoForTest,
  normalizeDropTable,
  normalizeWaza,
} from './shinigami-combat.service'

describe('bestiario write helpers', () => {
  it('normalizza drop e waza', () => {
    expect(
      normalizeDropTable([
        { item_id: ' junk-lattine ', item_nome: 'Lattine', probabilita: 150, quantita_min: 1 },
      ]),
    ).toEqual([
      {
        item_id: 'junk-lattine',
        item_nome: 'Lattine',
        quantita: undefined,
        quantita_min: 1,
        quantita_max: undefined,
        probabilita: 100,
      },
    ])
    expect(
      normalizeWaza([{ nome: ' Squarcio ', descrizione: 'x', danno: 6, tier: 9 }]),
    ).toEqual([{ nome: 'Squarcio', descrizione: 'x', danno: 6, tier: 5 }])
  })

  it('asTipo fallback mob', () => {
    expect(asTipoForTest('kizu')).toBe('kizu')
    expect(asTipoForTest('nope')).toBe('mob')
  })
})
