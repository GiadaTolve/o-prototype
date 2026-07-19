/**
 * CORS allowlist — in produzione solo origini note; in locale reflect (origin: true).
 *
 * Config:
 * - APP_URL — origine del client (sempre inclusa)
 * - CORS_ORIGINS — lista CSV aggiuntiva (es. preview Vercel)
 * - CORS_ALLOW_VERCEL_PREVIEWS — default true: consente https://oyasumi*.vercel.app
 */

import { APP_URL, IS_PRODUCTION } from '../config'

/** Client di produzione noto (Vercel). */
export const DEFAULT_PRODUCTION_ORIGINS = [
  'https://oyasumi-topaz.vercel.app',
] as const

/** Preview / branch deploy del progetto su Vercel. */
export const VERCEL_OYASUMI_ORIGIN_RE = /^https:\/\/oyasumi[a-z0-9-]*\.vercel\.app$/i

export type CorsOriginOption = string | RegExp | true

function normalizeOrigin(raw: string): string {
  return raw.trim().replace(/\/$/, '')
}

function parseCsvOrigins(raw: string | undefined): string[] {
  if (!raw?.trim()) return []
  return raw
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean)
}

/**
 * Valore da passare a `@elysiajs/cors` → `origin`.
 * - sviluppo: `true` (riflette l’Origin della richiesta)
 * - produzione: allowlist stringhe + eventuale RegExp Vercel
 */
export function resolveCorsOrigin(): CorsOriginOption | CorsOriginOption[] {
  if (!IS_PRODUCTION) return true

  const allowVercelPreviews = process.env.CORS_ALLOW_VERCEL_PREVIEWS !== 'false'
  const fromEnv = parseCsvOrigins(process.env.CORS_ORIGINS)
  const app = normalizeOrigin(APP_URL)

  const strings = new Set<string>()
  if (app) strings.add(app)
  for (const o of DEFAULT_PRODUCTION_ORIGINS) strings.add(o)
  for (const o of fromEnv) strings.add(o)

  const list: CorsOriginOption[] = [...strings]
  if (allowVercelPreviews) list.push(VERCEL_OYASUMI_ORIGIN_RE)
  return list
}

export function describeCorsOrigin(origin: CorsOriginOption | CorsOriginOption[]): string {
  if (origin === true) return 'reflect (dev)'
  const list = Array.isArray(origin) ? origin : [origin]
  return list
    .map((o) => (typeof o === 'string' ? o : o instanceof RegExp ? o.toString() : String(o)))
    .join(', ')
}
