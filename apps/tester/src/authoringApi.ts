/**
 * Dev (`vite`): scrittura su disco tramite plugin oyasumiWriteFile.
 * Online: URL API da `VITE_TESTER_API_URL`, meta `oyasumi-tester-api`, o localStorage (schermata login Idee).
 */

import { getCollabJwt } from './collabAuth'
import type { SkiruDef } from './skiruPool'

/** Chiave localStorage: base URL tester-api impostato dall’utente sul gate login (senza / finale). */
export const TESTER_API_LOCALSTORAGE_KEY = 'oyasumi-tester-api-base'

function collabBearerHeader(): Record<string, string> {
  const t = getCollabJwt()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

export function getTesterContributionsApiBase(): string | undefined {
  const u = import.meta.env.VITE_TESTER_API_URL as string | undefined
  if (u?.trim()) return u.trim().replace(/\/$/, '')
  if (typeof document !== 'undefined') {
    const m = document.querySelector('meta[name="oyasumi-tester-api"]')?.getAttribute('content')?.trim()
    if (m) return m.replace(/\/$/, '')
  }
  if (typeof localStorage !== 'undefined') {
    try {
      const s = localStorage.getItem(TESTER_API_LOCALSTORAGE_KEY)?.trim()
      if (s && /^https?:\/\//i.test(s)) return s.replace(/\/$/, '')
    } catch {
      /* private mode */
    }
  }
  return undefined
}

/** Salva su disco (plugin Vite) solo in `vite` dev; online richiede base URL API (vedi getTesterContributionsApiBase). */
export function canPersistAuthoringToPool(): boolean {
  return Boolean(getTesterContributionsApiBase() || import.meta.env.DEV)
}

function contributeKeyHeader(): Record<string, string> {
  const key = (import.meta.env.VITE_TESTER_CONTRIBUTE_KEY as string | undefined)?.trim()
  if (!key) return {}
  return { 'X-Contribute-Key': key }
}

async function postContribution(body: {
  type: string
  subkind?: string
  pool?: string
  payload: Record<string, unknown>
  author?: string
}): Promise<void> {
  const base = getTesterContributionsApiBase()
  if (!base) {
    throw new Error(
      'API contributi: imposta URL in Idee → campo «Server API», oppure meta oyasumi-tester-api / VITE_TESTER_API_URL.',
    )
  }
  const res = await fetch(`${base}/api/contributions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...collabBearerHeader(),
      ...contributeKeyHeader(),
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || res.statusText)
  }
}

export async function writeAuthoringFile(relativePath: string, content: string): Promise<void> {
  const res = await fetch('/__oyasumi/write-file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: relativePath.replace(/^\//, ''), content }),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || res.statusText)
  }
}

/** Solo dev (`vite`): appende una voce all’array pool indicato. */
export type OyasumiAppendPoolKind = 'waza' | 'madosho' | 'patti' | 'skiru'

const FILE_SNAPSHOT_PATHS = new Set([
  'src/wazaBranches.ts',
  'src/wazaTaxonomy.ts',
  'src/madoshoTaxonomy.ts',
  'src/pattiTaxonomy.ts',
])

function normalizeTesterPath(rel: string): string {
  return rel.replace(/^\//, '').replace(/\\/g, '/')
}

/** Snapshot file tassonomia (apply script + import repo). */
export async function postTesterFileSnapshot(relPath: string, content: string): Promise<void> {
  const path = normalizeTesterPath(relPath)
  if (!FILE_SNAPSHOT_PATHS.has(path)) {
    throw new Error(`file_snapshot: path non consentito (${path})`)
  }
  await postContribution({
    type: 'file_snapshot',
    payload: { path, content },
  })
}

/** Snapshot intero skiruPool.ts + JSON voci per GET /api/runtime/skiru */
export async function postSkiruPoolSnapshot(content: string, entries: SkiruDef[]): Promise<void> {
  await postContribution({
    type: 'skiru_pool_snapshot',
    payload: { content, entries: entries.map((e) => ({ ...e })) },
  })
}

/** Snapshot skiruCategories.ts + metadati per runtime */
export async function postSkiruCategoriesSnapshot(
  content: string,
  order: string[],
  labels: Record<string, string>,
): Promise<void> {
  await postContribution({
    type: 'skiru_categories_snapshot',
    payload: { content, order: [...order], labels: { ...labels } },
  })
}

export async function appendOyasumiPoolEntry(kind: OyasumiAppendPoolKind, entry: string): Promise<void> {
  if (getTesterContributionsApiBase()) {
    await postContribution({
      type: 'pool_entry',
      pool: kind,
      payload: { entry },
    })
    return
  }
  const res = await fetch('/__oyasumi/append-pool-entry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pool: kind, entry }),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || res.statusText)
  }
}

export async function replaceOyasumiPoolEntry(
  kind: OyasumiAppendPoolKind,
  entry: string,
  replaceId: string,
): Promise<void> {
  if (getTesterContributionsApiBase()) {
    await postContribution({
      type: 'pool_entry_replace',
      pool: kind,
      payload: { entry, replaceId },
    })
    return
  }
  const res = await fetch('/__oyasumi/replace-pool-entry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pool: kind, entry, replaceId }),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || res.statusText)
  }
}

/** Rimuove una voce dall’array pool (dev: patch file; online: contributo `pool_entry_delete`). */
export async function deleteOyasumiPoolEntry(kind: OyasumiAppendPoolKind, removeId: string): Promise<void> {
  if (getTesterContributionsApiBase()) {
    await postContribution({
      type: 'pool_entry_delete',
      pool: kind,
      payload: { removeId },
    })
    return
  }
  const res = await fetch('/__oyasumi/delete-pool-entry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pool: kind, removeId }),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || res.statusText)
  }
}

/** Condizione / status / counter: dev su file, oppure online su tester-api. */
export async function appendWazaAccessorioToPool(
  kind: 'condizione' | 'status' | 'counter',
  id: string,
  label: string,
  note?: string,
): Promise<void> {
  if (getTesterContributionsApiBase()) {
    await postContribution({
      type: 'waza_accessorio',
      subkind: kind,
      payload: { id, label, note: note ?? '' },
    })
    return
  }
  const res = await fetch('/__oyasumi/append-waza-accessorio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, id, label, note: note ?? '' }),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || res.statusText)
  }
}

/** Rimuove condizione / status / counter da wazaPool.ts (dev o contributo `waza_accessorio_delete`). */
export async function deleteWazaAccessorioContribution(
  kind: 'condizione' | 'status' | 'counter',
  id: string,
): Promise<void> {
  if (getTesterContributionsApiBase()) {
    await postContribution({
      type: 'waza_accessorio_delete',
      subkind: kind,
      payload: { id },
    })
    return
  }
  const res = await fetch('/__oyasumi/delete-waza-accessorio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, id }),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || res.statusText)
  }
}

export type AuditLogEntry = {
  contributionId: unknown
  createdAt: unknown
  utente: string
  azione: string
  tipoTecnico: string
  riepilogo: string
  blocco: string
}

export type AuditLogResponse = {
  windowHours: number
  generatedAt: string
  count: number
  entries: AuditLogEntry[]
}

/**
 * Registro modifiche (admin). Stessa chiave di GET /api/contributions.
 */
export async function fetchAuditLog(adminKey: string, hours = 24): Promise<AuditLogResponse> {
  const base = getTesterContributionsApiBase()
  if (!base) {
    throw new Error('API base mancante (meta / localStorage / VITE).')
  }
  const h = Math.max(1, Math.floor(hours))
  const res = await fetch(`${base}/api/audit-log?hours=${h}`, {
    headers: { 'X-Admin-Key': adminKey.trim() },
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || res.statusText)
  }
  return (await res.json()) as AuditLogResponse
}
