import { describe, expect, it } from 'vitest'
import {
  activateGiurisdizione,
  tryGiurisdizioneClaim,
  wazaMatchesGiurisdizioneCategory,
} from './giurisdizione'

describe('giurisdizione', () => {
  it('valida categoria waza', () => {
    expect(
      wazaMatchesGiurisdizioneCategory('Attiva · [Proiettile][Sonoro] · CS 1', 'proiettile'),
    ).toBe(true)
    expect(wazaMatchesGiurisdizioneCategory('Attiva · [Raggio][Sonoro] · CS 2', 'proiettile')).toBe(
      false,
    )
  })

  it('un solo reclamo per turno', () => {
    let meta = activateGiurisdizione({}, 'raggio')
    const first = tryGiurisdizioneClaim(meta)
    expect(first.ok).toBe(true)
    if (first.ok) meta = first.meta
    const second = tryGiurisdizioneClaim(meta)
    expect(second.ok).toBe(false)
  })
})
