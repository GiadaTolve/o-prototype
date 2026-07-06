import { describe, expect, it } from 'vitest'
import { createStatusContainer } from '../../combat/status/engine.ts'
import { compileCombatModifiers } from '../../combat/status/modifiers.ts'
import { compileNagoriCollateralModifiers, recordNagoriShift, activateNagori, clearNagoriCollateral } from './nagori.ts'
import { applyKomeiRoventeOnContactHit } from '../naikan/komei.ts'

describe('Nagori collateral modifiers', () => {
  it('solido → +1 tier offensivo', () => {
    let meta = activateNagori({})
    meta = recordNagoriShift(meta, { from: 'solido', to: 'liquido' })
    const m = compileNagoriCollateralModifiers(meta)
    expect(m.offensiveTierBonus).toBe(1)
  })

  it('liquido → +4 m gittata', () => {
    let meta = activateNagori({})
    meta = recordNagoriShift(meta, { from: 'liquido', to: 'solido' })
    expect(compileNagoriCollateralModifiers(meta).bonusRangeMeters).toBe(4)
  })

  it('si compila in compileCombatModifiers', () => {
    let meta = activateNagori({})
    meta = recordNagoriShift(meta, { from: 'solido', to: 'gassoso' })
    const m = compileCombatModifiers(createStatusContainer(), meta)
    expect(m.offensiveTierBonus).toBe(1)
  })

  it('clearNagoriCollateral consuma bonus', () => {
    let meta = activateNagori({})
    meta = recordNagoriShift(meta, { from: 'solido', to: 'liquido' })
    meta = clearNagoriCollateral(meta)
    expect(compileNagoriCollateralModifiers(meta).offensiveTierBonus ?? 0).toBe(0)
  })
})

describe('Kōmei Rovente', () => {
  it('applica Incendiato al difensore', () => {
    const c = applyKomeiRoventeOnContactHit(createStatusContainer(), true)
    expect(c.statuses.some((s) => s.id === 'incendiato')).toBe(true)
  })
})
