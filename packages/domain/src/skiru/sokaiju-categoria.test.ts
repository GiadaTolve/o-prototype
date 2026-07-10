import { describe, expect, test } from 'bun:test'
import { SKIRU_CATALOG } from './catalog.ts'
import { SOKAIJU_ANCHORS } from './sokaiju-index.ts'

const EXPECTED_CATEGORIA_BY_ID: Record<string, string | undefined> = {
  tenkan: undefined,
  chiko: 'Raggio',
  goju: 'Proiettile',
  jikai: 'Potenziamento',
  gojin: 'Contatto',
  kashin: 'Emanazione a Distanza',
  shodo: 'Emanazione',
  eiga: 'Propagazione',
  kongen: 'Costrutto',
  hikan: 'Propagazione Conica',
  genkai: 'Scudo',
}

describe('sokaiju categoria waza papabile', () => {
  test('ancoraggi: mappa manuale completa', () => {
    for (const anchor of SOKAIJU_ANCHORS) {
      expect(anchor.wazaCategoriaPapabile).toBe(EXPECTED_CATEGORIA_BY_ID[anchor.id])
    }
  })

  test('catalogo: propaga categoria sui nodi Sōkaiju', () => {
    for (const [id, categoria] of Object.entries(EXPECTED_CATEGORIA_BY_ID)) {
      const skiru = SKIRU_CATALOG.find((s) => s.id === id)
      expect(skiru?.wazaCategoriaPapabile).toBe(categoria)
    }
  })

  test('affinità elementali Gojū non sono nel catalogo (ramo Jin dedicato in arrivo)', () => {
    for (const id of ['goju-fuoco', 'goju-fulmine', 'goju-acqua', 'goju-gravita', 'goju-aria']) {
      expect(SKIRU_CATALOG.some((s) => s.id === id)).toBe(false)
    }
  })
})
