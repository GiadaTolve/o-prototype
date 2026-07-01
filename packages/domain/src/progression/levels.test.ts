import { describe, expect, it } from 'vitest'
import {
  EXP_DELTA_BASE,
  EXP_DELTA_STEP,
  LEVELS,
  LEVEL_CAP,
  getExpDeltaForLevel,
  getExpTotalForLevel,
  getLevelFromExp,
  getLevelRow,
  getPhaseForLevel,
} from './levels.ts'

/** Campione tabella canonica (LEVELING_DESIGN). */
const CANONICAL_SAMPLES: Array<{ level: number; expDelta: number | null; expTotal: number }> = [
  { level: 1, expDelta: null, expTotal: 0 },
  { level: 2, expDelta: 50, expTotal: 50 },
  { level: 3, expDelta: 89, expTotal: 139 },
  { level: 4, expDelta: 128, expTotal: 267 },
  { level: 5, expDelta: 167, expTotal: 434 },
  { level: 15, expDelta: 557, expTotal: 4249 },
  { level: 16, expDelta: 596, expTotal: 4845 },
  { level: 26, expDelta: 986, expTotal: 12950 },
  { level: 50, expDelta: 1922, expTotal: 48314 },
]

describe('levels curve', () => {
  it('ha 50 livelli nel catalogo', () => {
    expect(LEVELS).toHaveLength(LEVEL_CAP)
    expect(LEVEL_CAP).toBe(50)
  })

  it('Δ EXP = 50 + 39 × (L − 2)', () => {
    for (let level = 2; level <= LEVEL_CAP; level++) {
      expect(getExpDeltaForLevel(level)).toBe(EXP_DELTA_BASE + EXP_DELTA_STEP * (level - 2))
    }
  })

  it('campioni tabella manuale', () => {
    for (const sample of CANONICAL_SAMPLES) {
      expect(getExpDeltaForLevel(sample.level)).toBe(sample.expDelta)
      expect(getExpTotalForLevel(sample.level)).toBe(sample.expTotal)
      const row = getLevelRow(sample.level)
      expect(row?.expDelta).toBe(sample.expDelta)
      expect(row?.expTotal).toBe(sample.expTotal)
    }
  })

  it('getLevelFromExp ai confini', () => {
    expect(getLevelFromExp(0)).toBe(1)
    expect(getLevelFromExp(49)).toBe(1)
    expect(getLevelFromExp(50)).toBe(2)
    expect(getLevelFromExp(48313)).toBe(49)
    expect(getLevelFromExp(48314)).toBe(50)
  })

  it('fasi LEVELING_DESIGN', () => {
    expect(getPhaseForLevel(1)).toBe('EARLY-GAME')
    expect(getPhaseForLevel(6)).toBe('EARLY-GAME')
    expect(getPhaseForLevel(7)).toBe('MID-GAME')
    expect(getPhaseForLevel(25)).toBe('MID-GAME')
    expect(getPhaseForLevel(26)).toBe('CORE')
    expect(getPhaseForLevel(50)).toBe('CORE')
  })
})
