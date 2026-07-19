import { describe, expect, it, beforeEach } from 'bun:test'
import {
  AUTH_RATE_MAX_ATTEMPTS,
  __resetAuthRateLimiterForTests,
  checkForgotPasswordAllowed,
  checkLoginAllowed,
  clearLoginFailures,
  formatAuthRateLimitMessage,
  recordForgotPasswordAttempt,
  recordLoginFailure,
} from './login-rate-limiter'

describe('login-rate-limiter', () => {
  beforeEach(() => {
    __resetAuthRateLimiterForTests()
  })

  it('consente i primi tentativi', () => {
    expect(checkLoginAllowed('1.1.1.1', 'Botan').allowed).toBe(true)
  })

  it('blocca dopo 5 fallimenti sullo stesso IP', () => {
    const ip = '10.0.0.1'
    for (let i = 0; i < AUTH_RATE_MAX_ATTEMPTS; i++) {
      recordLoginFailure(ip, `pg-${i}`)
    }
    const blocked = checkLoginAllowed(ip, 'altro-pg')
    expect(blocked.allowed).toBe(false)
    if (!blocked.allowed) {
      expect(blocked.retryAfterSec).toBeGreaterThan(0)
    }
  })

  it('blocca dopo 5 fallimenti sullo stesso nome PG (IP diversi)', () => {
    const nome = 'Botan Miyazaki'
    for (let i = 0; i < AUTH_RATE_MAX_ATTEMPTS; i++) {
      recordLoginFailure(`10.0.0.${i}`, nome)
    }
    const blocked = checkLoginAllowed('10.0.0.99', nome)
    expect(blocked.allowed).toBe(false)
  })

  it('normalizza il nome PG (case / spazi)', () => {
    for (let i = 0; i < AUTH_RATE_MAX_ATTEMPTS; i++) {
      recordLoginFailure(`1.2.3.${i}`, '  BOTAN miyazaki ')
    }
    expect(checkLoginAllowed('9.9.9.9', 'botan miyazaki').allowed).toBe(false)
  })

  it('azzera i fallimenti dopo login riuscito', () => {
    const ip = '8.8.8.8'
    const nome = 'Hero'
    for (let i = 0; i < AUTH_RATE_MAX_ATTEMPTS - 1; i++) {
      recordLoginFailure(ip, nome)
    }
    clearLoginFailures(ip, nome)
    expect(checkLoginAllowed(ip, nome).allowed).toBe(true)
    for (let i = 0; i < AUTH_RATE_MAX_ATTEMPTS; i++) {
      recordLoginFailure(ip, nome)
    }
    expect(checkLoginAllowed(ip, nome).allowed).toBe(false)
  })

  it('forgot-password: 5 richieste per IP poi blocco', () => {
    const ip = '2.2.2.2'
    for (let i = 0; i < AUTH_RATE_MAX_ATTEMPTS; i++) {
      expect(checkForgotPasswordAllowed(ip).allowed).toBe(true)
      recordForgotPasswordAttempt(ip)
    }
    expect(checkForgotPasswordAllowed(ip).allowed).toBe(false)
  })

  it('messaggio generico con minuti', () => {
    expect(formatAuthRateLimitMessage(60)).toBe('Troppi tentativi, riprova tra 1 minuto.')
    expect(formatAuthRateLimitMessage(120)).toBe('Troppi tentativi, riprova tra 2 minuti.')
    expect(formatAuthRateLimitMessage(30)).toBe('Troppi tentativi, riprova tra 1 minuto.')
  })
})
