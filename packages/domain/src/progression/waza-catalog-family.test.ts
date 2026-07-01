import { describe, expect, it } from 'vitest'
import {
  groupWazaByCatalogFamily,
  isGenericheCatalogWaza,
  isOrdineCatalogWaza,
  isOnimoriCatalogWaza,
  canPurchaseOrdineWaza,
  layoutOwnedWazaSections,
  resolveWazaCatalogFamily,
} from './waza-catalog-family'

describe('waza-catalog-family', () => {
  it('classifica Dō per styleId', () => {
    expect(resolveWazaCatalogFamily({ styleId: 'ito', name: 'Ayatsuri' })).toBe('do')
  })

  it('classifica Madoshō per madoshoId', () => {
    expect(resolveWazaCatalogFamily({ madoshoId: 'gokaon', name: 'Oni no Mezame' })).toBe('madosho')
  })

  it('rileva Ordine da descrizione', () => {
    expect(
      resolveWazaCatalogFamily({
        description: '## Ordine · Mugen-Tai — tecnica d\'arsenale',
        name: 'Colpo di corda',
      }),
    ).toBe('ordine')
  })

  it('rileva Generiche da poolId', () => {
    expect(resolveWazaCatalogFamily({ poolId: 'generiche-shoken-eco-pugno', name: 'Shoken' })).toBe(
      'generiche',
    )
    expect(
      isGenericheCatalogWaza({ poolId: 'generiche-shoken-eco-pugno', name: 'Shoken' }),
    ).toBe(true)
    expect(isGenericheCatalogWaza({ styleId: 'ito', name: 'Ayatsuri' })).toBe(false)
  })

  it('rileva Ordine e Onimori da poolId', () => {
    expect(isOrdineCatalogWaza({ poolId: 'ordine-colpo-corda', name: 'X' })).toBe(true)
    expect(isOnimoriCatalogWaza({ poolId: 'onimori-nebbia-rossa', name: 'Y' })).toBe(true)
  })

  it('Ordine richiede ordine militare e Sentō Senshi', () => {
    expect(canPurchaseOrdineWaza({ order: 'NONE' }, { kensei: 5, 'sento-senshi': 1 }).ok).toBe(false)
    expect(canPurchaseOrdineWaza({ order: 'MUGEN-TAI' }, { kensei: 5 }).ok).toBe(false)
    expect(canPurchaseOrdineWaza({ order: 'MUGEN-TAI' }, { kensei: 5, 'sento-senshi': 1 }).ok).toBe(true)
  })

  it('raggruppa registro possedute con sotto-sezioni Dō', () => {
    const sections = layoutOwnedWazaSections(
      [
        { id: '1', styleId: 'hado', madoshoId: null },
        { id: '2', madoshoId: 'nakigara', styleId: null },
      ],
      (w) => w,
    )
    expect(sections.some((s) => s.kind === 'do')).toBe(true)
    expect(sections.some((s) => s.kind === 'madosho')).toBe(true)
  })

  it('groupWazaByCatalogFamily rispetta ordine famiglie', () => {
    const groups = groupWazaByCatalogFamily([
      { styleId: 'toka' },
      { madoshoId: 'gokaon' },
    ])
    expect(groups.map((g) => g.family)).toEqual(['do', 'madosho'])
  })
})
