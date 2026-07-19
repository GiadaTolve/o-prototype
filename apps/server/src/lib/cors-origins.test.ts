import { describe, expect, it } from 'bun:test'

/**
 * Test sulla logica pura di parsing — senza toccare IS_PRODUCTION del config caricato.
 * Duplica le regole stabili di cors-origins (normalize + CSV + RegExp).
 */
const VERCEL_OYASUMI_ORIGIN_RE = /^https:\/\/oyasumi[a-z0-9-]*\.vercel\.app$/i

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

function buildProdList(opts: {
  appUrl: string
  corsOrigins?: string
  defaults?: readonly string[]
  allowVercelPreviews?: boolean
}): Array<string | RegExp> {
  const strings = new Set<string>()
  const app = normalizeOrigin(opts.appUrl)
  if (app) strings.add(app)
  for (const o of opts.defaults ?? []) strings.add(o)
  for (const o of parseCsvOrigins(opts.corsOrigins)) strings.add(o)
  const list: Array<string | RegExp> = [...strings]
  if (opts.allowVercelPreviews !== false) list.push(VERCEL_OYASUMI_ORIGIN_RE)
  return list
}

describe('cors-origins allowlist', () => {
  it('normalizza slash finale e CSV', () => {
    expect(normalizeOrigin('https://oyasumi-topaz.vercel.app/')).toBe(
      'https://oyasumi-topaz.vercel.app',
    )
    expect(parseCsvOrigins(' https://a.example , https://b.example/ ')).toEqual([
      'https://a.example',
      'https://b.example',
    ])
  })

  it('include APP_URL, default e CORS_ORIGINS', () => {
    const list = buildProdList({
      appUrl: 'https://oyasumi-topaz.vercel.app/',
      corsOrigins: 'https://custom.example',
      defaults: ['https://oyasumi-topaz.vercel.app'],
      allowVercelPreviews: false,
    })
    expect(list).toContain('https://oyasumi-topaz.vercel.app')
    expect(list).toContain('https://custom.example')
    expect(list.every((x) => typeof x === 'string')).toBe(true)
  })

  it('accetta preview Vercel oyasumi*', () => {
    expect(VERCEL_OYASUMI_ORIGIN_RE.test('https://oyasumi-topaz.vercel.app')).toBe(true)
    expect(VERCEL_OYASUMI_ORIGIN_RE.test('https://oyasumi-hqcmq4xk3-oyasumi1.vercel.app')).toBe(true)
    expect(VERCEL_OYASUMI_ORIGIN_RE.test('https://evil.vercel.app')).toBe(false)
    expect(VERCEL_OYASUMI_ORIGIN_RE.test('https://oyasumi.evil.com')).toBe(false)
  })
})
