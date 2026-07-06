import { describe, expect, it } from 'vitest'
import {
  canImposeDecreto,
  decretoAppliesToWaza,
  imposeDecreto,
  inferDecretoEffectKind,
  tryApplyDecreto,
} from './chokurei'

describe('chokurei', () => {
  it('inferisce effetto decreto proiettile', () => {
    expect(inferDecretoEffectKind('Quella Proiettile torna al mittente')).toBe(
      'invert_projectile',
    )
  })

  it('applica decreto a waza compatibile', () => {
    const meta = imposeDecreto({}, 'Quella Proiettile torna al mittente')
    expect(canImposeDecreto(meta)).toBe(false)
    const applied = tryApplyDecreto(meta, 'Attiva · [Proiettile][Sonoro] · CS 1')
    expect(applied.ok).toBe(true)
    if (applied.ok) expect(applied.effect).toBe('invert_projectile')
  })

  it('rifiuta waza incompatibile', () => {
    const meta = imposeDecreto({}, 'Quella Proiettile torna al mittente')
    expect(
      decretoAppliesToWaza(meta.itoDecreto!.text, 'Attiva · [Contatto][Solido] · CS 2'),
    ).toBe(false)
  })
})
