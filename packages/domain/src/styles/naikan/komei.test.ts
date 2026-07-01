import { describe, expect, it } from 'vitest'
import { createStatusContainer, applyStatus } from '../../combat/status/engine'
import {
  activateKomei,
  compileKomeiModifiers,
  formatKomeiSegment,
  tickKomeiEndOfTurn,
} from './komei'

describe('Kōmei', () => {
  it('inverte status negativi e applica buff meta', () => {
    let container = createStatusContainer()
    container = applyStatus(container, 'emorragia', { stacks: 3 })
    container = applyStatus(container, 'torpore', { stacks: 1 })

    const r = activateKomei(container, {})
    expect(r.error).toBeUndefined()
    expect(r.removed).toContain('emorragia')
    expect(r.removed).toContain('torpore')
    expect(r.inversions).toContain('rovente')
    expect(r.inversions).toContain('armatura')
    expect(r.container.statuses.some((s) => s.id === 'emorragia')).toBe(false)
    expect(r.meta.naikanKomei?.turnsLeft).toBe(3)
  })

  it('rifiuta senza status eleggibili', () => {
    const r = activateKomei(createStatusContainer(), {})
    expect(r.error).toMatch(/status negativo/)
    expect(r.inversions).toHaveLength(0)
  })

  it('compila modificatori e segmento chat', () => {
    const meta = {
      naikanKomei: { inversions: ['armatura', 'carburante'] as const, turnsLeft: 2 },
    }
    const mods = compileKomeiModifiers(meta.naikanKomei)
    expect(mods.mitigationBonusPercent).toBe(10)
    expect(mods.bonusCsPerTurn).toBe(2)

    const tick = tickKomeiEndOfTurn(meta)
    expect(tick.naikanKomei?.turnsLeft).toBe(1)
    expect(formatKomeiSegment(meta)).toMatch(/Kōmei: Armatura, Carburante/)
  })
})
