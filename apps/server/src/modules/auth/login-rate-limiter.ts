/**
 * Rate limit + lockout anti brute-force per login e forgot-password.
 * In-memory (si resetta al riavvio), allineato al pattern della chat.
 *
 * Login: 5 fallimenti in 15 min per IP e per nome PG → lockout 15 min.
 * Forgot-password: 5 richieste in 15 min per IP → lockout 15 min.
 */

export const AUTH_RATE_MAX_ATTEMPTS = 5
export const AUTH_RATE_WINDOW_MS = 15 * 60 * 1000
export const AUTH_RATE_LOCKOUT_MS = 15 * 60 * 1000

type RateEntry = {
  count: number
  windowStartedAt: number
  lockedUntil: number | null
}

const store = new Map<string, RateEntry>()

export type AuthRateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSec: number }

function nowMs(): number {
  return Date.now()
}

function getEntry(key: string): RateEntry | undefined {
  return store.get(key)
}

function setEntry(key: string, entry: RateEntry): void {
  store.set(key, entry)
}

/** Normalizza nome PG per chiave bucket (trim + lower). */
export function normalizeLoginNomePg(nomePg: string): string {
  return nomePg.trim().toLowerCase()
}

function checkKey(key: string): AuthRateLimitResult {
  const now = nowMs()
  const entry = getEntry(key)
  if (!entry) return { allowed: true }

  if (entry.lockedUntil != null && now < entry.lockedUntil) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((entry.lockedUntil - now) / 1000)),
    }
  }

  if (entry.lockedUntil != null && now >= entry.lockedUntil) {
    store.delete(key)
    return { allowed: true }
  }

  if (now - entry.windowStartedAt >= AUTH_RATE_WINDOW_MS) {
    store.delete(key)
    return { allowed: true }
  }

  if (entry.count >= AUTH_RATE_MAX_ATTEMPTS) {
    const lockedUntil = entry.windowStartedAt + AUTH_RATE_LOCKOUT_MS
    if (now < lockedUntil) {
      entry.lockedUntil = lockedUntil
      return {
        allowed: false,
        retryAfterSec: Math.max(1, Math.ceil((lockedUntil - now) / 1000)),
      }
    }
    store.delete(key)
    return { allowed: true }
  }

  return { allowed: true }
}

function recordKey(key: string): AuthRateLimitResult {
  const now = nowMs()
  const existing = getEntry(key)

  if (existing?.lockedUntil != null && now < existing.lockedUntil) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.lockedUntil - now) / 1000)),
    }
  }

  if (
    !existing ||
    now - existing.windowStartedAt >= AUTH_RATE_WINDOW_MS ||
    (existing.lockedUntil != null && now >= existing.lockedUntil)
  ) {
    setEntry(key, { count: 1, windowStartedAt: now, lockedUntil: null })
    return { allowed: true }
  }

  existing.count += 1
  if (existing.count >= AUTH_RATE_MAX_ATTEMPTS) {
    existing.lockedUntil = now + AUTH_RATE_LOCKOUT_MS
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil(AUTH_RATE_LOCKOUT_MS / 1000)),
    }
  }

  return { allowed: true }
}

function clearKey(key: string): void {
  store.delete(key)
}

function mergeResults(a: AuthRateLimitResult, b: AuthRateLimitResult): AuthRateLimitResult {
  if (a.allowed && b.allowed) return { allowed: true }
  const secA = a.allowed ? 0 : a.retryAfterSec
  const secB = b.allowed ? 0 : b.retryAfterSec
  return { allowed: false, retryAfterSec: Math.max(secA, secB) }
}

export function checkLoginAllowed(ip: string, nomePg: string): AuthRateLimitResult {
  const ipKey = `login:ip:${ip || 'unknown'}`
  const pgKey = `login:pg:${normalizeLoginNomePg(nomePg) || 'empty'}`
  return mergeResults(checkKey(ipKey), checkKey(pgKey))
}

/** Registra un fallimento login (password errata o PG inesistente). */
export function recordLoginFailure(ip: string, nomePg: string): AuthRateLimitResult {
  const ipKey = `login:ip:${ip || 'unknown'}`
  const pgKey = `login:pg:${normalizeLoginNomePg(nomePg) || 'empty'}`
  return mergeResults(recordKey(ipKey), recordKey(pgKey))
}

export function clearLoginFailures(ip: string, nomePg: string): void {
  clearKey(`login:ip:${ip || 'unknown'}`)
  clearKey(`login:pg:${normalizeLoginNomePg(nomePg) || 'empty'}`)
}

export function checkForgotPasswordAllowed(ip: string): AuthRateLimitResult {
  return checkKey(`forgot:ip:${ip || 'unknown'}`)
}

/** Conta ogni richiesta forgot-password (anti-spam email). */
export function recordForgotPasswordAttempt(ip: string): AuthRateLimitResult {
  return recordKey(`forgot:ip:${ip || 'unknown'}`)
}

export function formatAuthRateLimitMessage(retryAfterSec: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterSec / 60))
  return `Troppi tentativi, riprova tra ${minutes} minut${minutes === 1 ? 'o' : 'i'}.`
}

/** Solo per test. */
export function __resetAuthRateLimiterForTests(): void {
  store.clear()
}
