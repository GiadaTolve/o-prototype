import { describe, expect, it } from 'vitest'
import {
  buildActionStateSummarySegments,
  buildActionStateSummaryTag,
  formatActionStateTagsInText,
} from './action-state-summary'
import { createStatusContainer, applyStatus } from './status/engine'
import { readDoMechanicsFromMeta } from '../styles/do-mechanics'

describe('action-state-summary', () => {
  it('include Tensione fili e Emorragia con effetti', () => {
    const doMechanics = readDoMechanicsFromMeta(
      { itoTension: 14, naikanPhase: 1, yuragiPhase: 'fluido', gosaStacks: 5, lastReceivedHitTier: 3 },
      12,
    )
    let container = createStatusContainer()
    container = applyStatus(container, 'emorragia', { stacks: 4, addStacks: true })
    const segments = buildActionStateSummarySegments({ doMechanics, statusContainer: container })
    expect(segments).toEqual(['Tensione: 14 fili in campo', 'Emorragia ×4 (−8 HP/turno)'])
  })

  it('ritorna null senza meccaniche né status', () => {
    const tag = buildActionStateSummaryTag({
      doMechanics: readDoMechanicsFromMeta({}, 0),
      statusContainer: createStatusContainer(),
    })
    expect(tag).toBeNull()
  })

  it('genera tag [stato: …]', () => {
    const tag = buildActionStateSummaryTag({
      doMechanics: readDoMechanicsFromMeta({ itoTension: 2 }, 0),
      statusContainer: createStatusContainer(),
    })
    expect(tag).toMatch(/\[stato: Tensione: 2 fili/)
  })

  it('formatta HTML dedicato con chip', () => {
    const html = formatActionStateTagsInText(
      '[stato: Tensione: 3 fili in campo · Emorragia ×2 (−4 HP/turno)]',
    )
    expect(html).toContain('action-state-summary')
    expect(html).toContain('action-state-summary__chip--tensione')
    expect(html).toContain('action-state-summary__chip--status')
    expect(html).toContain('Emorragia')
    expect(html).toContain('−4 HP/turno')
  })
})
