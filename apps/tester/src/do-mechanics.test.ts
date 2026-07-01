import { describe, expect, it } from 'vitest'
import {
  readDoMechanicsFromMeta,
  patchDoMechanicsMeta,
} from '../../../packages/domain/src/styles/do-mechanics.ts'
import {
  accumulateTensione,
  releaseTensione,
  processTensioneManualAccumulate,
  TENSIONE_SNAP_THRESHOLD,
} from '../../../packages/domain/src/styles/ito/tensione.ts'
import {
  advanceJunkanPhase,
  JUNKAN_MAX_PHASE,
} from '../../../packages/domain/src/styles/naikan/junkan.ts'
import {
  applyYuragiParityIr,
  nextYuragiPhase,
} from '../../../packages/domain/src/styles/hensei/yuragi.ts'
import {
  accumulateAtsuryoku,
  ATSURYOKU_METAMORPHOSIS_CS,
  ventAtsuryoku,
} from '../../../packages/domain/src/styles/hado/atsuryoku.ts'

describe('do-mechanics snapshot', () => {
  it('legge meta ui e risolve tutti gli stili', () => {
    const snap = readDoMechanicsFromMeta(
      {
        itoTension: 5,
        naikanPhase: 2,
        yuragiPhase: 'fluido',
        hadoPressure: 8,
      },
      12,
    )
    expect(snap.ito.level).toBe(5)
    expect(snap.naikan.phase).toBe(2)
    expect(snap.naikan.canTransfer).toBe(true)
    expect(snap.hensei.phase).toBe('fluido')
    expect(snap.hado.metamorphosisReady).toBe(true)
    expect(snap.investimento.active).toBe(false)
    expect(snap.shakkinDebts).toEqual([])
    expect(snap.currentCs).toBe(12)
  })

  it('applica patch per stile', () => {
    const meta = { itoTension: 6, naikanPhase: 1, hadoPressure: 10 }
    const afterIto = patchDoMechanicsMeta(meta, { style: 'ito', action: 'release' })
    expect(afterIto.itoTension).toBe(4)
    const afterNaikan = patchDoMechanicsMeta(afterIto, { style: 'naikan', action: 'advance' })
    expect(afterNaikan.naikanPhase).toBe(2)
    const afterHado = patchDoMechanicsMeta(afterNaikan, { style: 'hado', action: 'vent' })
    expect(afterHado.hadoPressure).toBe(6)
  })
})

describe('Tensione Itō', () => {
  it('accumula e segnala snap risk', () => {
    const level = accumulateTensione(6, 2)
    expect(level).toBe(8)
    expect(level).toBeGreaterThanOrEqual(TENSIONE_SNAP_THRESHOLD)
    expect(releaseTensione(level)).toBe(6)
  })

  it('accumulo raw oltre cap', () => {
    const r = processTensioneManualAccumulate(10, 1)
    expect(r.rawLevel).toBe(11)
    expect(r.emorragiaStacks).toBe(1)
  })
})

describe('Junkan Naikan', () => {
  it('avanza solo con supporto', () => {
    expect(advanceJunkanPhase(1, false)).toBe(1)
    expect(advanceJunkanPhase(1, true)).toBe(2)
    expect(advanceJunkanPhase(JUNKAN_MAX_PHASE, true)).toBe(JUNKAN_MAX_PHASE)
  })
})

describe('Yuragi Hensei', () => {
  it('bonus parità al cambio consistenza', () => {
    const r = applyYuragiParityIr(10, 'fluido', 'solido')
    expect(r.shifted).toBe(true)
    expect(r.ir).toBe(12)
  })

  it('inferisce fase da consistenza', () => {
    expect(nextYuragiPhase('neutro', 'solido denso')).toBe('solido')
  })
})

describe('Atsuryoku Hadō', () => {
  it('accumula con CS trattenuto e sfia', () => {
    const p = accumulateAtsuryoku(3, ATSURYOKU_METAMORPHOSIS_CS)
    expect(p).toBeGreaterThan(3)
    expect(ventAtsuryoku(p)).toBeLessThan(p)
  })
})

describe('Dō waza pool sizes', () => {
  it('contiene 19 waza Itō-dō', async () => {
    const { ITO_WAZA_POOL } = await import('./pools/ito-waza-pool.ts')
    expect(ITO_WAZA_POOL).toHaveLength(19)
  })

  it('contiene 17 waza Naikan-dō', async () => {
    const { NAIKAN_WAZA_POOL } = await import('./pools/naikan-waza-pool.ts')
    expect(NAIKAN_WAZA_POOL).toHaveLength(17)
  })

  it('contiene 19 waza Hensei-dō', async () => {
    const { HENSEI_WAZA_POOL } = await import('./pools/hensei-waza-pool.ts')
    expect(HENSEI_WAZA_POOL).toHaveLength(19)
  })

  it('contiene 22 waza Hadō-dō', async () => {
    const { HADO_WAZA_POOL } = await import('./pools/hado-waza-pool.ts')
    expect(HADO_WAZA_POOL).toHaveLength(22)
  })

  it('contiene 12 waza Tōka-dō', async () => {
    const { TOKA_WAZA_POOL } = await import('./pools/toka-waza-pool.ts')
    expect(TOKA_WAZA_POOL).toHaveLength(12)
  })

  it('contiene 23 waza Genzai-dō', async () => {
    const { GENZAI_WAZA_POOL } = await import('./pools/genzai-waza-pool.ts')
    expect(GENZAI_WAZA_POOL).toHaveLength(23)
  })
})

describe('catalogo waza vs Oyasumi_Manuale_Completo.pdf', () => {
  it('poolId per Dō coincidono con MANUAL_WAZA_POOL_IDS', async () => {
    const { MANUAL_WAZA_POOL_IDS } = await import(
      '../../../packages/domain/src/progression/do-statutes.ts'
    )
    const { styleIdFromBranchLabel } = await import(
      '../../../packages/domain/src/progression/style-hexagon.ts'
    )
    const { WAZA_POOL } = await import('./wazaPool.ts')

    const byStyle: Record<string, string[]> = {}
    for (const w of WAZA_POOL) {
      const styleId = styleIdFromBranchLabel(w.branch)
      if (!styleId) continue
      byStyle[styleId] ??= []
      byStyle[styleId].push(w.id)
    }

    for (const styleId of Object.keys(MANUAL_WAZA_POOL_IDS)) {
      expect(byStyle[styleId]?.sort()).toEqual([...MANUAL_WAZA_POOL_IDS[styleId as keyof typeof MANUAL_WAZA_POOL_IDS]].sort())
    }
  })
})
