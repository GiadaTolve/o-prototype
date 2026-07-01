import * as jose from 'jose'

/** username (lowercase) → hash Bun.password (bcrypt/argon2) */
export type CollabUserMap = Record<string, string>

export function loadCollabUsers(): CollabUserMap {
  const raw = process.env.TESTER_COLLAB_USERS?.trim()
  if (!raw) return {}
  try {
    const o = JSON.parse(raw) as Record<string, unknown>
    const out: CollabUserMap = {}
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === 'string' && v.length > 0) out[k.trim().toLowerCase()] = v
    }
    return out
  } catch {
    console.warn('[tester-api] TESTER_COLLAB_USERS JSON non valido')
    return {}
  }
}

export function collabAuthConfigured(users: CollabUserMap): boolean {
  return Object.keys(users).length > 0 && Boolean(process.env.TESTER_JWT_SECRET?.trim())
}

export async function verifyLoginPassword(
  users: CollabUserMap,
  username: string,
  password: string,
): Promise<boolean> {
  const hash = users[username.trim().toLowerCase()]
  if (!hash) return false
  return Bun.password.verify(password, hash)
}

export async function signCollabJwt(username: string): Promise<string> {
  const secret = process.env.TESTER_JWT_SECRET?.trim()
  if (!secret) throw new Error('TESTER_JWT_SECRET mancante')
  const key = new TextEncoder().encode(secret)
  return new jose.SignJWT({ sub: username.trim() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10h')
    .sign(key)
}

export async function verifyCollabJwt(token: string): Promise<{ sub: string } | null> {
  const secret = process.env.TESTER_JWT_SECRET?.trim()
  if (!secret) return null
  try {
    const key = new TextEncoder().encode(secret)
    const { payload } = await jose.jwtVerify(token, key)
    const sub = typeof payload.sub === 'string' ? payload.sub : null
    if (!sub?.trim()) return null
    return { sub: sub.trim() }
  } catch {
    return null
  }
}
