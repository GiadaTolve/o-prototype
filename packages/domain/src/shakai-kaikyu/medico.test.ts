import { describe, expect, it } from 'vitest'
import { clampMedicoHeal, isMedicoCraftBlueprint, medicoBlueprintCatalogKey } from './medico'
import { getSocialBlueprint } from './blueprint-catalog'

describe('medico', () => {
  it('catalog key per preparato', () => {
    expect(medicoBlueprintCatalogKey('medico-bendaggio-semplice')).toBe(
      'prep-medico-bendaggio-semplice',
    )
  })

  it('clamp cura su ferite e budget', () => {
    expect(
      clampMedicoHeal({
        requested: 10,
        budgetRemaining: 30,
        targetHpCurrent: 40,
        targetHpMax: 50,
      }),
    ).toEqual({ applied: 10, budgetCost: 10 })

    expect(
      clampMedicoHeal({
        requested: 20,
        budgetRemaining: 5,
        targetHpCurrent: 10,
        targetHpMax: 50,
      }),
    ).toEqual({ applied: 5, budgetCost: 5 })

    expect(
      clampMedicoHeal({
        requested: 10,
        budgetRemaining: 30,
        targetHpCurrent: 48,
        targetHpMax: 50,
      }),
    ).toEqual({ applied: 2, budgetCost: 2 })
  })

  it('ricette craftabili escludono procedure', () => {
    const recipe = getSocialBlueprint('medico-bendaggio-semplice')
    const procedure = getSocialBlueprint('medico-intervento-maggiore')
    expect(recipe && isMedicoCraftBlueprint(recipe)).toBe(true)
    expect(procedure && isMedicoCraftBlueprint(procedure)).toBe(false)
  })
})
