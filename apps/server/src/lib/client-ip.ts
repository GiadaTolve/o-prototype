/**
 * Client IP helpers — Supervisione Gestione.
 * Preferisce CF / proxy fidati, poi X-Forwarded-For, poi socket Bun.
 */
export function extractClientIp(input: {
  request?: Request
  headers?: Headers | Record<string, string | undefined>
  server?: { requestIP?: (req: Request) => { address: string } | null }
}): string {
  const get = (name: string): string | undefined => {
    const h = input.headers
    if (!h) return undefined
    if (h instanceof Headers) return h.get(name) ?? undefined
    return h[name] ?? h[name.toLowerCase()]
  }

  const cf = get('cf-connecting-ip')?.trim()
  if (cf) return normalizeIp(cf)

  const real = get('x-real-ip')?.trim()
  if (real) return normalizeIp(real)

  const xff = get('x-forwarded-for')?.trim()
  if (xff) {
    const first = xff.split(',')[0]?.trim()
    if (first) return normalizeIp(first)
  }

  if (input.request && input.server?.requestIP) {
    try {
      const addr = input.server.requestIP(input.request)?.address
      if (addr) return normalizeIp(addr)
    } catch {
      /* ignore */
    }
  }

  return 'unknown'
}

export function normalizeIp(raw: string): string {
  const s = raw.trim().toLowerCase()
  // IPv6-mapped IPv4
  if (s.startsWith('::ffff:')) return s.slice(7)
  return s
}
