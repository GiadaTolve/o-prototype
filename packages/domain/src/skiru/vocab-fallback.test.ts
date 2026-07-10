import { describe, expect, test } from 'bun:test'
import { mergeCatalogWithSkiruVocab, skiruDefFromVocab } from './vocab-fallback.ts'

describe('skiru vocab fallback', () => {
  test('skiruDefFromVocab usa catalogo se presente', () => {
    const def = skiruDefFromVocab('itten-kokan', {
      ramo: 'wrong',
      dominio: 'jin',
      label: 'Wrong',
    })
    expect(def?.nameRomaji).toBe('Itten Kōkan')
  })

  test('skiruDefFromVocab costruisce da extra vocab', () => {
    const def = skiruDefFromVocab('sochu-kokan', {
      ramo: 'shinka-no-nagare',
      dominio: 'jin',
      label: 'Incanalamento Diretto',
      labelRomaji: 'Sochū Kōkan',
    })
    expect(def?.branchId).toBe('shinka-no-nagare')
    expect(def?.name).toBe('Incanalamento Diretto')
  })

  test('mergeCatalogWithSkiruVocab include slug vocab non in catalogo', () => {
    const merged = mergeCatalogWithSkiruVocab(
      ['sochu-kokan', 'itten-kokan'],
      [
        {
          valore: 'sochu-kokan',
          extra: {
            ramo: 'shinka-no-nagare',
            dominio: 'jin',
            label: 'Incanalamento Diretto',
            labelRomaji: 'Sochū Kōkan',
          },
        },
      ],
    )
    expect(merged.some((s) => s.id === 'sochu-kokan')).toBe(true)
    expect(merged.some((s) => s.id === 'itten-kokan')).toBe(true)
  })
})
