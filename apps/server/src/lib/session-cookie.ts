/**
 * Cookie di sessione httpOnly (JWT).
 * - Locale (stesso sito localhost porte diverse): SameSite=Lax
 * - Produzione (Vercel ↔ Render, cross-site): SameSite=None; Secure
 */

import { IS_RENDER } from '../config'

export const SESSION_COOKIE_NAME = 'oyasumi_session'
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 14 // 14 giorni

export const IS_PRODUCTION =
  process.env.NODE_ENV === 'production' || IS_RENDER

export function parseCookieHeader(cookieHeader: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (!cookieHeader) return out
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=')
    if (idx < 0) continue
    const key = part.slice(0, idx).trim()
    const val = part.slice(idx + 1).trim()
    if (!key) continue
    try {
      out[key] = decodeURIComponent(val)
    } catch {
      out[key] = val
    }
  }
  return out
}

export function getSessionTokenFromCookieHeader(
  cookieHeader: string | null | undefined,
): string | null {
  const token = parseCookieHeader(cookieHeader)[SESSION_COOKIE_NAME]
  return token && token.length > 0 ? token : null
}

export function buildSessionCookie(token: string): string {
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    `Max-Age=${SESSION_MAX_AGE_SEC}`,
  ]
  if (IS_PRODUCTION) {
    // Cross-site (Vercel ↔ Render): SameSite=None; Partitioned aiuta Chrome CHIPS.
    parts.push('Secure', 'SameSite=None', 'Partitioned')
  } else {
    parts.push('SameSite=Lax')
  }
  return parts.join('; ')
}

export function buildClearSessionCookie(): string {
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'Max-Age=0',
  ]
  if (IS_PRODUCTION) {
    parts.push('Secure', 'SameSite=None', 'Partitioned')
  } else {
    parts.push('SameSite=Lax')
  }
  return parts.join('; ')
}

/** Appende Set-Cookie senza sovrascrivere altri header già presenti. */
export function appendSetCookie(
  set: { headers: Record<string, string | number | string[] | undefined> },
  cookie: string,
): void {
  const prev = set.headers['set-cookie']
  if (prev == null || prev === '') {
    set.headers['set-cookie'] = cookie
    return
  }
  if (Array.isArray(prev)) {
    set.headers['set-cookie'] = [...prev, cookie]
    return
  }
  set.headers['set-cookie'] = [String(prev), cookie]
}

export function extractBearerToken(authorization: string | undefined): string | null {
  if (!authorization?.startsWith('Bearer ')) return null
  const t = authorization.slice(7).trim()
  return t.length > 0 ? t : null
}

/** Bearer ha priorità; altrimenti cookie di sessione. */
export function resolveRequestAccessToken(input: {
  authorization?: string
  cookie?: string | null
}): string | null {
  return (
    extractBearerToken(input.authorization) ??
    getSessionTokenFromCookieHeader(input.cookie ?? null)
  )
}
