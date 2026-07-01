import { describe, expect, it } from 'vitest'
import {
  accumulateTensioneRaw,
  processTensioneEndOfTurn,
  processTensioneManualAccumulate,
  releaseTensione,
  resolveTensioneState,
  TENSIONE_MAX,
  TENSIONE_SNAP_THRESHOLD,
} from './tensione'

describe('Tensione Itō', () => {
  it('IR e snap usano livello clampato 0–8', () => {
    const s = resolveTensioneState(12)
    expect(s.level).toBe(TENSIONE_MAX)
    expect(s.rawLevel).toBe(12)
    expect(s.overflow).toBe(4)
    expect(s.irBonus).toBe(8)
    expect(s.snapRisk).toBe(true)
  })

  it('accumulo manuale + esubero → Emorragia', () => {
    const r = processTensioneManualAccumulate(7, 2)
    expect(r.rawLevel).toBe(9)
    expect(r.overflowAdded).toBe(1)
    expect(r.emorragiaStacks).toBe(1)
  })

  it('fine turno: −1 se nessun filo usato', () => {
    const r = processTensioneEndOfTurn(5, false)
    expect(r.rawLevel).toBe(4)
    expect(r.decayed).toBe(1)
  })

  it('fine turno: niente decay se filo usato', () => {
    const r = processTensioneEndOfTurn(5, true)
    expect(r.rawLevel).toBe(5)
    expect(r.decayed).toBe(0)
  })

  it('rilascio manuale −2', () => {
    expect(releaseTensione(8, 2)).toBe(6)
  })

  it('snap risk da soglia 8', () => {
    expect(resolveTensioneState(TENSIONE_SNAP_THRESHOLD - 1).snapRisk).toBe(false)
    expect(resolveTensioneState(TENSIONE_SNAP_THRESHOLD).snapRisk).toBe(true)
  })

  it('accumulateTensioneRaw non clampa in alto', () => {
    expect(accumulateTensioneRaw(8, 1)).toBe(9)
  })
})
