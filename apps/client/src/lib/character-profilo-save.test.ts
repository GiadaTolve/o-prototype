import { describe, expect, it } from 'vitest'
import { resolveProfiloSaveEndpoint } from './character-profilo-save'

const STAFF_CHARACTER_ID = '1b015338-6fbc-4e65-810a-7ee9af779a7e'
const TARGET_CHARACTER_ID = '439963a5-fd34-4429-963a-2deab0947408'

describe('resolveProfiloSaveEndpoint', () => {
  it('scheda propria → /characters/me/profilo', () => {
    expect(resolveProfiloSaveEndpoint(false, STAFF_CHARACTER_ID)).toBe('/characters/me/profilo')
  })

  it('staff modifica scheda altrui → PUT sul target, non su /me', () => {
    const url = resolveProfiloSaveEndpoint(true, TARGET_CHARACTER_ID)
    expect(url).toBe(`/characters/${TARGET_CHARACTER_ID}/profilo`)
    expect(url).not.toBe('/characters/me/profilo')
    expect(url).not.toContain(STAFF_CHARACTER_ID)
  })

  it('scheda altrui senza targetCharacterId → errore', () => {
    expect(() => resolveProfiloSaveEndpoint(true, undefined)).toThrow(/targetCharacterId/)
  })
})
