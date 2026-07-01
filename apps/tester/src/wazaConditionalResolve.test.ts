import { describe, expect, it } from 'vitest'
import { resolveWazaCombatNumbers, matchConditionalBranch, DEMO_WEAPON_TAGS_TORO } from './wazaConditionalResolve'
import type { WazaConditionalBranch } from './wazaPool'
import { SAMPLE_WAZA_STATS, WAZA_POOL } from './wazaPool'

describe('matchConditionalBranch', () => {
  const branches: WazaConditionalBranch[] = [
    {
      id: 'toro-branch',
      requireAnyWeaponTag: ['toro'],
      byRank: { 1: { damageMult: 2 } },
    },
  ]

  it('matcha se il tag è presente', () => {
    expect(matchConditionalBranch(branches, { tags: new Set(['toro']) })?.id).toBe('toro-branch')
  })

  it('non matcha senza tag', () => {
    expect(matchConditionalBranch(branches, { tags: new Set() })).toBeNull()
  })
})

describe('resolveWazaCombatNumbers', () => {
  it('raddoppia il danno Hōshutsu con tag toro (esempio pool)', () => {
    const w = WAZA_POOL.find((x) => x.id === 'hoshutsu-rilascio-della-fiamma')!
    expect(w.conditionalBranches?.length).toBeGreaterThan(0)

    const gradeDmg = 1.2
    const noTag = resolveWazaCombatNumbers(w, 1, SAMPLE_WAZA_STATS, { tags: new Set() }, {
      empathy: 10,
      bonusDmg: 0,
      gradeDmgMult: gradeDmg,
    })
    const withTag = resolveWazaCombatNumbers(w, 1, SAMPLE_WAZA_STATS, { tags: DEMO_WEAPON_TAGS_TORO }, {
      empathy: 10,
      bonusDmg: 0,
      gradeDmgMult: gradeDmg,
    })

    expect(noTag.damageBase).not.toBeNull()
    expect(withTag.damageFinal).toBe(Math.floor((noTag.damageBase as number) * 2))
    expect(withTag.conditionalBranchId).toBe('da-toro')
  })

  it('non applica il ramo se grantorSameTurn è false', () => {
    const w = WAZA_POOL.find((x) => x.id === 'hoshutsu-rilascio-della-fiamma')!
    const base = resolveWazaCombatNumbers(w, 1, SAMPLE_WAZA_STATS, { tags: DEMO_WEAPON_TAGS_TORO, grantorSameTurn: false }, {
      empathy: 10,
      bonusDmg: 0,
      gradeDmgMult: 1.2,
    })
    expect(base.conditionalBranchId).toBeNull()
    expect(base.damageFinal).toBe(base.damageBase)
  })
})
