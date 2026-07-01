/**
 * Micro-API per raccogliere contributi dal Waza Tester (deploy statico).
 * Persistenza: append-only JSONL su disco.
 *
 * Opzionale: login collaboratori (TESTER_JWT_SECRET + TESTER_COLLAB_USERS)
 * → POST /api/contributions richiede Bearer JWT.
 */
import { mkdir, appendFile, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  collabAuthConfigured,
  loadCollabUsers,
  signCollabJwt,
  verifyCollabJwt,
  verifyLoginPassword,
} from './auth'
import { buildAuditLog } from './auditLog'
import { summarizeContribution, type ContributionRow } from './catalog'
import { latestSkiruCategoriesSnapshot, latestSkiruPoolSnapshot } from './runtimeSkiru'

const PORT = Number(process.env.TESTER_API_PORT ?? '3751') || 3751
const ADMIN_KEY = process.env.TESTER_API_ADMIN_KEY?.trim() ?? ''
const CONTRIBUTE_KEY = process.env.TESTER_API_CONTRIBUTE_KEY?.trim() ?? ''
const DATA_DIR = process.env.TESTER_API_DATA_DIR ?? join(process.cwd(), 'data')
const JSONL_PATH = join(DATA_DIR, 'contributions.jsonl')
const CORS_ORIGINS = (process.env.TESTER_API_CORS_ORIGINS ?? '*')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const COLLAB_USERS = loadCollabUsers()
const AUTH_COLLAB = collabAuthConfigured(COLLAB_USERS)

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? ''
  let allow = '*'
  if (!CORS_ORIGINS.includes('*') && CORS_ORIGINS.length > 0) {
    allow = CORS_ORIGINS.includes(origin) ? origin : CORS_ORIGINS[0] ?? '*'
  }
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Contribute-Key',
    'Access-Control-Max-Age': '86400',
  }
}

function json(data: unknown, req: Request, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(req) },
  })
}

function text(body: string, req: Request, status = 200): Response {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', ...corsHeaders(req) },
  })
}

async function appendContribution(record: Record<string, unknown>): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  await appendFile(JSONL_PATH, `${JSON.stringify(record)}\n`, 'utf8')
}

type WazaAccessoriEntry = { id: string; label: string }

type WazaAccessoriPayload = {
  condizioni: WazaAccessoriEntry[]
  status: WazaAccessoriEntry[]
  counter: WazaAccessoriEntry[]
  deletedCondizioneIds: string[]
  deletedStatusIds: string[]
  deletedCounterIds: string[]
}

function aggregateWazaAccessori(rows: unknown[]): WazaAccessoriPayload & { sourceRows: number } {
  type Row = {
    type?: string
    subkind?: string
    createdAt?: string
    payload?: { id?: unknown; label?: unknown }
  }
  const list = rows
    .filter((r): r is Row => Boolean(r && typeof r === 'object'))
    .filter(
      (r) =>
        (r.type === 'waza_accessorio' || r.type === 'waza_accessorio_delete') &&
        typeof r.subkind === 'string',
    )
    .sort((a, b) => String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? '')))

  const condMap = new Map<string, string>()
  const stMap = new Map<string, string>()
  const ctMap = new Map<string, string>()
  const delCond = new Set<string>()
  const delSt = new Set<string>()
  const delCt = new Set<string>()

  for (const r of list) {
    const sk = r.subkind!
    const id = typeof r.payload?.id === 'string' ? r.payload.id.trim() : ''
    if (!id) continue
    if (r.type === 'waza_accessorio_delete') {
      if (sk === 'condizione') {
        condMap.delete(id)
        delCond.add(id)
      } else if (sk === 'status') {
        stMap.delete(id)
        delSt.add(id)
      } else if (sk === 'counter') {
        ctMap.delete(id)
        delCt.add(id)
      }
      continue
    }
    const label = typeof r.payload?.label === 'string' ? r.payload.label.trim() : ''
    if (sk === 'condizione') {
      condMap.set(id, label || id)
      delCond.delete(id)
    } else if (sk === 'status') {
      stMap.set(id, label || id)
      delSt.delete(id)
    } else if (sk === 'counter') {
      ctMap.set(id, label || id)
      delCt.delete(id)
    }
  }

  const toArr = (m: Map<string, string>): WazaAccessoriEntry[] =>
    [...m.entries()].map(([id, label]) => ({ id, label }))

  return {
    condizioni: toArr(condMap),
    status: toArr(stMap),
    counter: toArr(ctMap),
    deletedCondizioneIds: [...delCond],
    deletedStatusIds: [...delSt],
    deletedCounterIds: [...delCt],
    sourceRows: list.length,
  }
}

type WazaPoolOverlay = {
  hasOverlay: boolean
  replacements: Array<{ id: string; entry: string }>
  removedIds: string[]
}

function extractWazaIdFromEntry(entry: string): string | null {
  const m = /id:\s*['"]([^'"]+)['"]/.exec(entry)
  return m ? m[1]!.trim() : null
}

function aggregateWazaPoolOverlays(rows: unknown[]): WazaPoolOverlay {
  type Row = {
    type?: string
    pool?: string
    createdAt?: string
    payload?: { removeId?: unknown; replaceId?: unknown; entry?: unknown }
  }
  const list = rows
    .filter((r): r is Row => Boolean(r && typeof r === 'object'))
    .filter((r) => r.pool === 'waza')
    .sort((a, b) => String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? '')))

  const map = new Map<string, string>()
  const removed = new Set<string>()

  for (const r of list) {
    const t = r.type
    const p = r.payload
    if (t === 'pool_entry_delete') {
      const rid = typeof p?.removeId === 'string' ? p.removeId.trim() : ''
      if (rid) {
        map.delete(rid)
        removed.add(rid)
      }
      continue
    }
    if (t === 'pool_entry_replace') {
      const rid = typeof p?.replaceId === 'string' ? p.replaceId.trim() : ''
      const entry = typeof p?.entry === 'string' ? p.entry : ''
      if (rid && entry) {
        map.set(rid, entry)
        removed.delete(rid)
      }
      continue
    }
    if (t === 'pool_entry') {
      const entry = typeof p?.entry === 'string' ? p.entry : ''
      const eid = extractWazaIdFromEntry(entry)
      if (eid && entry) {
        map.set(eid, entry)
        removed.delete(eid)
      }
    }
  }

  const replacements = [...map.entries()].map(([id, entry]) => ({ id, entry }))
  return {
    hasOverlay: replacements.length > 0 || removed.size > 0,
    replacements,
    removedIds: [...removed],
  }
}

async function readAllContributions(): Promise<unknown[]> {
  try {
    const raw = await readFile(JSONL_PATH, 'utf8')
    const out: unknown[] = []
    for (const line of raw.split('\n')) {
      const t = line.trim()
      if (!t) continue
      try {
        out.push(JSON.parse(t) as unknown)
      } catch {
        /* skip */
      }
    }
    return out
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'ENOENT') {
      return []
    }
    throw e
  }
}

function assertAdmin(req: Request): boolean {
  if (!ADMIN_KEY) return false
  const auth = req.headers.get('Authorization') ?? ''
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  const headerKey = req.headers.get('X-Admin-Key')?.trim() ?? ''
  return bearer === ADMIN_KEY || headerKey === ADMIN_KEY
}

function assertContribute(req: Request): boolean {
  if (!CONTRIBUTE_KEY) return true
  return (req.headers.get('X-Contribute-Key') ?? '').trim() === CONTRIBUTE_KEY
}

async function requireCollabJwt(req: Request): Promise<{ sub: string } | Response> {
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!token) return text('Autenticazione richiesta (Bearer JWT)', req, 401)
  const v = await verifyCollabJwt(token)
  if (!v) return text('Token non valido o scaduto', req, 401)
  return v
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(req) })
    }

    const url = new URL(req.url)
    const path = url.pathname

    if (path === '/api/health' && req.method === 'GET') {
      return json({ ok: true, service: 'tester-api', collabAuth: AUTH_COLLAB }, req)
    }

    if (path === '/api/auth/config' && req.method === 'GET') {
      return json({ collabLoginRequired: AUTH_COLLAB }, req)
    }

    if (path === '/api/auth/login' && req.method === 'POST') {
      if (!AUTH_COLLAB) {
        return text('Login collaboratori non configurato (manca TESTER_JWT_SECRET o TESTER_COLLAB_USERS)', req, 503)
      }
      let body: unknown
      try {
        body = await req.json()
      } catch {
        return text('JSON non valido', req, 400)
      }
      const b = body as Record<string, unknown>
      const username = typeof b.username === 'string' ? b.username.trim() : ''
      const password = typeof b.password === 'string' ? b.password : ''
      if (!username || !password) return text('username e password obbligatori', req, 400)
      const ok = await verifyLoginPassword(COLLAB_USERS, username, password)
      if (!ok) return text('Credenziali non valide', req, 401)
      const token = await signCollabJwt(username)
      return json({ ok: true, token, user: username }, req)
    }

    if (path === '/api/waza-accessori' && req.method === 'GET') {
      const rows = await readAllContributions()
      const agg = aggregateWazaAccessori(rows)
      return json(agg, req)
    }

    if (path === '/api/runtime/waza' && req.method === 'GET') {
      const rows = await readAllContributions()
      return json(aggregateWazaPoolOverlays(rows), req)
    }

    if (path === '/api/runtime/skiru' && req.method === 'GET') {
      const rows = await readAllContributions()
      return json(latestSkiruPoolSnapshot(rows), req)
    }

    if (path === '/api/runtime/skiru-categories' && req.method === 'GET') {
      const rows = await readAllContributions()
      return json(latestSkiruCategoriesSnapshot(rows), req)
    }

    if (path === '/api/contributions/catalog' && req.method === 'GET') {
      if (!AUTH_COLLAB) {
        return text('Catalogo riservato: abilita login collaboratori', req, 503)
      }
      const jwtv = await requireCollabJwt(req)
      if (jwtv instanceof Response) return jwtv
      const rows = await readAllContributions()
      const items = rows
        .filter((r): r is ContributionRow => Boolean(r && typeof r === 'object'))
        .map((r) => summarizeContribution(r))
      return json({ count: items.length, items }, req)
    }

    const contribMatch = /^\/api\/contributions\/([^/]+)$/.exec(path)
    if (contribMatch && req.method === 'GET') {
      if (!AUTH_COLLAB) {
        return text('Dettaglio riservato: abilita login collaboratori', req, 503)
      }
      const jwtv = await requireCollabJwt(req)
      if (jwtv instanceof Response) return jwtv
      const wantId = contribMatch[1]
      const rows = await readAllContributions()
      const hit = rows.find(
        (r) =>
          Boolean(r && typeof r === 'object' && (r as ContributionRow).id === wantId),
      )
      if (!hit) return text('Contributo non trovato', req, 404)
      return json(hit, req)
    }

    if (path === '/api/contributions' && req.method === 'GET') {
      if (!ADMIN_KEY) {
        return text('TESTER_API_ADMIN_KEY non impostata sul server', req, 503)
      }
      if (!assertAdmin(req)) {
        return text('Non autorizzato', req, 401)
      }
      const rows = await readAllContributions()
      return json({ count: rows.length, contributions: rows }, req)
    }

    if (path === '/api/audit-log' && req.method === 'GET') {
      if (!ADMIN_KEY) {
        return text('TESTER_API_ADMIN_KEY non impostata sul server', req, 503)
      }
      if (!assertAdmin(req)) {
        return text('Non autorizzato', req, 401)
      }
      const hoursRaw = new URL(req.url).searchParams.get('hours')
      const hours = hoursRaw != null ? Number(hoursRaw) : 24
      const rows = await readAllContributions()
      return json(buildAuditLog(rows, hours), req)
    }

    if (path === '/api/contributions' && req.method === 'POST') {
      if (AUTH_COLLAB) {
        const jwtv = await requireCollabJwt(req)
        if (jwtv instanceof Response) return jwtv
        let body: unknown
        try {
          body = await req.json()
        } catch {
          return text('JSON non valido', req, 400)
        }
        if (!body || typeof body !== 'object') {
          return text('Body obbligatorio (oggetto JSON)', req, 400)
        }
        const b = body as Record<string, unknown>
        const type = typeof b.type === 'string' ? b.type.trim() : ''
        if (!type) {
          return text('Campo "type" obbligatorio', req, 400)
        }
        const id = crypto.randomUUID()
        const createdAt = new Date().toISOString()
        const payload =
          b.payload !== undefined && typeof b.payload === 'object' && b.payload !== null
            ? (b.payload as Record<string, unknown>)
            : { raw: b }

        const record: Record<string, unknown> = {
          id,
          createdAt,
          type,
          author: jwtv.sub,
          payload,
        }
        if (typeof b.subkind === 'string' && b.subkind.trim()) record.subkind = b.subkind.trim()
        if (typeof b.pool === 'string' && b.pool.trim()) record.pool = b.pool.trim()

        await appendContribution(record)
        return json({ ok: true, id, createdAt }, req, 201)
      }

      if (!assertContribute(req)) {
        return text('X-Contribute-Key mancante o errata', req, 401)
      }
      let body: unknown
      try {
        body = await req.json()
      } catch {
        return text('JSON non valido', req, 400)
      }
      if (!body || typeof body !== 'object') {
        return text('Body obbligatorio (oggetto JSON)', req, 400)
      }
      const b = body as Record<string, unknown>
      const type = typeof b.type === 'string' ? b.type.trim() : ''
      if (!type) {
        return text('Campo "type" obbligatorio', req, 400)
      }
      const id = crypto.randomUUID()
      const createdAt = new Date().toISOString()
      const author = typeof b.author === 'string' ? b.author.trim().slice(0, 120) : undefined
      const payload =
        b.payload !== undefined && typeof b.payload === 'object' && b.payload !== null
          ? (b.payload as Record<string, unknown>)
          : { raw: b }

      const record: Record<string, unknown> = {
        id,
        createdAt,
        type,
        author,
        payload,
      }
      if (typeof b.subkind === 'string' && b.subkind.trim()) record.subkind = b.subkind.trim()
      if (typeof b.pool === 'string' && b.pool.trim()) record.pool = b.pool.trim()

      await appendContribution(record)
      return json({ ok: true, id, createdAt }, req, 201)
    }

    return text('Not found', req, 404)
  },
})

console.log(`tester-api in ascolto su http://localhost:${server.port}`)
console.log(`jsonl: ${JSONL_PATH}`)
if (AUTH_COLLAB) console.log('[tester-api] Login collaboratori attivo (POST /api/contributions richiede JWT)')
else console.log('[tester-api] Login collaboratori disattivo — POST usa X-Contribute-Key se impostata')
if (!ADMIN_KEY) console.warn('[tester-api] TESTER_API_ADMIN_KEY assente: GET /api/contributions (export) disabilitato')
