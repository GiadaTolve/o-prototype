import { describe, expect, it } from 'vitest'
import {
  appendReqGradeMarker,
  characterMeetsGradeRequirement,
  formatWazaGradeRequirementLabel,
  resolveWazaRequiredGrade,
  stripWazaSystemMarkers,
} from './waza-grade-req'

describe('waza-grade-req', () => {
  it('risolve da poolId noti', () => {
    expect(resolveWazaRequiredGrade({ poolId: 'omocha-il-giocattolo' })).toBe(
      'Sentatsu Bunsekikan',
    )
    expect(resolveWazaRequiredGrade({ poolId: 'tomurai-no-to-rito-funebre' })).toBe(
      "Shin'enkan",
    )
  })

  it('risolve da marker [req_grade]', () => {
    expect(
      resolveWazaRequiredGrade({
        description: 'Fluff\n\n[req_grade:K]',
      }),
    ).toBe('Kanteikan')
  })

  it('confronto grado', () => {
    expect(characterMeetsGradeRequirement('Bunsekikan', 'Sentatsu Bunsekikan')).toBe(false)
    expect(characterMeetsGradeRequirement('Sentatsu Bunsekikan', 'Sentatsu Bunsekikan')).toBe(
      true,
    )
    expect(characterMeetsGradeRequirement("Shin'enkan", 'Kanteikan')).toBe(true)
  })

  it('strip marker e label', () => {
    const raw = appendReqGradeMarker('Un testo.', 'Kanteikan')
    expect(raw).toContain('[req_grade:Kanteikan]')
    expect(stripWazaSystemMarkers(raw)).toBe('Un testo.')
    expect(formatWazaGradeRequirementLabel('Kanteikan')).toBe('Requisito: Kanteikan [K]')
  })
})
