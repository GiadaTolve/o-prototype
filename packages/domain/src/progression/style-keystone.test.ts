import { describe, expect, it } from 'vitest'
import {
  checkKeystoneForWaza,
  hasKeystoneOwned,
  MANUAL_WAZA_POOL_IDS,
  STYLE_KEYSTONE,
  STYLE_STATUTES,
} from './do-statutes.ts'
import { STYLE_HEX_ORDER } from './style-hexagon.ts'

describe('do statutes', () => {
  it('ha statuto per ogni stile esagono', () => {
    for (const id of STYLE_HEX_ORDER) {
      expect(STYLE_STATUTES[id].length).toBeGreaterThan(40)
    }
  })
})

describe('keystone Dō (Oyasumi_Manuale_Completo.pdf)', () => {
  it('Tōka richiede Tōrō per le altre waza', () => {
    const owned = new Set<string>()
    expect(checkKeystoneForWaza('toka', 'michishirube-luce-guida', owned).ok).toBe(false)
    owned.add('toro-lanterna-incisa')
    expect(checkKeystoneForWaza('toka', 'michishirube-luce-guida', owned).ok).toBe(true)
    expect(checkKeystoneForWaza('toka', 'toro-lanterna-incisa', new Set()).ok).toBe(true)
  })

  it('Genzai richiede Honshitsu per le altre waza', () => {
    const owned = new Set<string>()
    expect(checkKeystoneForWaza('genzai', 'kochiku-struttura-salda', owned).ok).toBe(false)
    owned.add('honshitsu-essenza-affine')
    expect(checkKeystoneForWaza('genzai', 'kochiku-struttura-salda', owned).ok).toBe(true)
    expect(hasKeystoneOwned('genzai', new Set())).toBe(false)
  })

  it('Hensei richiede Ishi — Volere (non Nuova Consistenza)', () => {
    expect(STYLE_KEYSTONE.hensei?.poolId).toBe('ishi-volere')
    const owned = new Set<string>()
    expect(checkKeystoneForWaza('hensei', 'renkin-soku-regole-alchemiche', owned).ok).toBe(false)
    owned.add('ishi-volere')
    expect(checkKeystoneForWaza('hensei', 'renkin-soku-regole-alchemiche', owned).ok).toBe(true)
  })

  it('Hadō richiede Chikuden per le altre waza', () => {
    const owned = new Set<string>()
    expect(checkKeystoneForWaza('hado', 'gyakuryu-riflusso', owned).ok).toBe(false)
    owned.add('chikuden-batteria')
    expect(checkKeystoneForWaza('hado', 'gyakuryu-riflusso', owned).ok).toBe(true)
  })

  it('Itō e Naikan non hanno keystone obbligatoria', () => {
    expect(hasKeystoneOwned('ito', new Set())).toBe(true)
    expect(hasKeystoneOwned('naikan', new Set())).toBe(true)
  })
})

describe('MANUAL_WAZA_POOL_IDS', () => {
  it('copre tutti gli stili e le keystone sono nel catalogo', () => {
    for (const id of STYLE_HEX_ORDER) {
      expect(MANUAL_WAZA_POOL_IDS[id].length).toBeGreaterThan(0)
      const ks = STYLE_KEYSTONE[id]
      if (ks) expect(MANUAL_WAZA_POOL_IDS[id]).toContain(ks.poolId)
    }
  })

  it('totale 112 waza Dō (PDF Parte III + waza avanzate per grado)', () => {
    const total = STYLE_HEX_ORDER.reduce((n, id) => n + MANUAL_WAZA_POOL_IDS[id].length, 0)
    expect(total).toBe(112)
  })
})
