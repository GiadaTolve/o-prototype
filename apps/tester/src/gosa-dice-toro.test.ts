import { describe, expect, it } from 'vitest'
import {
  resolveGosaState,
  accumulateGosaOnConstruct,
  applyGosaIrPenalty,
  applyGosaResistancePenalty,
  correctGosaStacks,
  clampGosaStacks,
  GOSA_MAX_STACKS,
  formatGosaTagsInText,
} from '../../../packages/domain/src/styles/genzai/gosa.ts'
import { formatToroTagsInText } from '../../../packages/domain/src/styles/toka/toro.ts'
import {
  resolveSlashDiceInMessage,
  messageNeedsDiceResolution,
} from '../../../apps/server/src/lib/dice-resolver.ts'
import {
  isDiceRollMessage,
  formatDiceRollLine,
} from '../../../packages/domain/src/chat/dice-display.ts'

describe => {
  it('accumula stack su materializzazione', () => {
    const next = accumulateGosaOnConstruct(0, {
      descriptionChars: 20,
      wazaTier: 3,
      size: 'grande',
      isNewForm: true,
    })
    expect(next).toBeGreaterThan(1)
    expect(next).toBeLessThanOrEqual(GOSA_MAX_STACKS)
  })

  it('applica penalità IR e resistenza', () => {
    expect(applyGosaIrPenalty(10, 3)).toBe(7)
    expect(applyGosaResistancePenalty(100, 2)).toBe(90)
  })

  it('corregge con CS', () => {
    const r = correctGosaStacks(3, 2, 2)
    expect(r?.stacksAfter).toBe(1)
    expect(r?.csSpent).toBe(2)
  })

  it('formatta tag [Gosa:N]', () => {
    const html = formatGosaTagsInText('Stack [Gosa:2] attivo')
    expect(html).toContain('gosa-tag')
    expect(html).toContain('Gosa 2')
  })

  it('clamp al cap', () => {
    expect(clampGosaStacks(99)).toBe(GOSA_MAX_STACKS)
    expect(resolveGosaState(4).atCap).toBe(false)
    expect(resolveGosaState(5).atCap).toBe(true)
  })
})

describe('Tōrō tag parser', () => {
  it('formatta [toro]', () => {
    const html = formatToroTagsInText('Canale [toro] attivo')
    expect(html).toContain('toro-tag')
    expect(html).toContain('Tōrō')
  })
})

describe('slash dice /d N', () => {
  it('rileva comandi dado', () => {
    expect(messageNeedsDiceResolution('Tiro /d 20')).toBe(true)
    expect(messageNeedsDiceResolution('solo testo')).toBe(false)
  })

  it('sostituisce /d N con risultato', () => {
    const out = resolveSlashDiceInMessage('Provo /d 6 fine')
    expect(out).toMatch(/\[🎲 \d+\/6\]/)
    expect(out).not.toContain('/d 6')
  })
})

describe => {
  it('rileva messaggio solo dado', () => {
    expect(isDiceRollMessage('[🎲 50/100]')).toBe(true)
    expect(isDiceRollMessage('Azione lunga [🎲 50/100]')).toBe(false)
  })

  it('formatta riga esito', () => {
    expect(formatDiceRollLine(['50/100'])).toBe('Lancia un dado, esito: [🎲 50/100]')
  })
})
