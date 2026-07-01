import { describe, expect, it } from 'vitest'
import { compileCombatModifiers } from '../../combat/status/modifiers'
import { createStatusContainer, applyStatus, tickStatusEndOfCharacterTurn } from '../../combat/status/engine'
import { applySutura, compileSuturaModifiers } from './hogo'

describe('Hōgō Sutura', () => {
  it('offensiva penalizza IR di −3', () => {
    const meta = applySutura({}, { characterId: 'a', displayName: 'Caster' }, 'offensiva')
    expect(compileSuturaModifiers(meta).indexBonus).toBe(-3)
    const mods = compileCombatModifiers(createStatusContainer(), meta)
    expect(mods.indexBonus).toBe(-3)
  })

  it('elementale congela decay status a fine turno', () => {
    const meta = applySutura({}, { characterId: 'a', displayName: 'Caster' }, 'elementale')
    expect(compileSuturaModifiers(meta).blockStatusDecay).toBe(true)
    let c = applyStatus(createStatusContainer(), 'vertigini', { stacks: 2 })
    const tick = tickStatusEndOfCharacterTurn(c, { blockStatusDecay: true })
    expect(tick.container.statuses[0]?.stacks).toBe(2)
  })
})
