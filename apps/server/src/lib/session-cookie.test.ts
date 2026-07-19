import { describe, expect, it } from 'bun:test'
import {
  SESSION_COOKIE_NAME,
  buildClearSessionCookie,
  buildSessionCookie,
  getSessionTokenFromCookieHeader,
  parseCookieHeader,
  resolveRequestAccessToken,
} from './session-cookie'

describe('session-cookie', () => {
  it('parse e legge il token', () => {
    const header = `${SESSION_COOKIE_NAME}=abc%20123; other=1`
    expect(parseCookieHeader(header)[SESSION_COOKIE_NAME]).toBe('abc 123')
    expect(getSessionTokenFromCookieHeader(header)).toBe('abc 123')
  })

  it('buildSessionCookie è httpOnly', () => {
    const c = buildSessionCookie('tok')
    expect(c).toContain(`${SESSION_COOKIE_NAME}=tok`)
    expect(c).toContain('HttpOnly')
    expect(c).toContain('Path=/')
  })

  it('clear azzera Max-Age', () => {
    expect(buildClearSessionCookie()).toContain('Max-Age=0')
  })

  it('resolveRequestAccessToken: Bearer prima del cookie', () => {
    expect(
      resolveRequestAccessToken({
        authorization: 'Bearer from-header',
        cookie: `${SESSION_COOKIE_NAME}=from-cookie`,
      }),
    ).toBe('from-header')
    expect(
      resolveRequestAccessToken({
        cookie: `${SESSION_COOKIE_NAME}=from-cookie`,
      }),
    ).toBe('from-cookie')
    expect(resolveRequestAccessToken({})).toBeNull()
  })
})
