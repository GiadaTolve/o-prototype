import { describe, expect, it } from 'vitest'
import {
  createFieldConstruct,
  applyDamageToFieldConstruct,
} from '../../../packages/domain/src/combat/field-constructs.ts'
import {
  resolveToroState,
  hasToroFromSkillMeta,
  TORO_WEAPON_TAG,
} from '../../../packages/domain/src/styles/toka/toro.ts'

describe => {
  it('crea costrutto con resistenza calcolata', () => {
    const c = createFieldConstruct({
      id: 'x',
      creatorCharacterId: 'pg',
      label: 'Muraglia',
      wazaTier: 3,
      kongenRank: 5,
      size: 'media',
    })
    expect(c.maxResistance).toBe(8)
    expect(c.remainingResistance).toBe(8)
    expect(c.stationary).toBe(true)
  })

  it('assorbe danno e si distrugge a zero', () => {
    let c = createFieldConstruct({
      id: 'x',
      creatorCharacterId: 'pg',
      label: 'Scudo',
      wazaTier: 2,
      kongenRank: 4,
      size: 'piccola',
    })
    const hit = applyDamageToFieldConstruct(c, 10)
    expect(hit.absorbed).toBeGreaterThan(0)
    expect(hit.destroyed).toBe(true)
  })
})

describe => {
  it('attivo solo con passiva e contatto', () => {
    expect(
      resolveToroState({ hasToroPassiveEquipped: true, weaponInContact: true }).active,
    ).toBe(true)
    expect(
      resolveToroState({ hasToroPassiveEquipped: true, weaponInContact: false }).active,
    ).toBe(false)
  })

  it('blocca manipolazione a Tōrō attivo', () => {
    const s = resolveToroState({ hasToroPassiveEquipped: true, weaponInContact: true })
    expect(s.blocksManipulationTargeting).toBe(true)
  })

  it('riconosce passiva da poolId', () => {
    expect(hasToroFromSkillMeta({ poolId: 'toro-lanterna-incisa', name: 'X' })).toBe(true)
  })

  it('tag toro nel contesto apre canale', () => {
    const s = resolveToroState({
      hasToroPassiveEquipped: true,
      weaponInContact: false,
      weaponTagsInContext: [TORO_WEAPON_TAG],
    })
    expect(s.allowsTokaChannel).toBe(true)
  })
})
