/**
 * Registro audit modifiche (stessa logica di oat_build_audit_log nel PHP Altervista).
 */

function extractIdPoolEntry(entry: string): string | null {
  const m = /id:\s*['"]([^'"]+)['"]/.exec(entry)
  return m ? m[1]!.trim() : null
}

function extractNamePoolEntry(entry: string): string | null {
  const m = /name:\s*['"]([^'"]*)['"]/.exec(entry)
  return m ? m[1]! : null
}

function poolTextMapUpToIndex(
  sortedAsc: Record<string, unknown>[],
  poolKind: string,
  stopBeforeIndex: number,
): Map<string, string> {
  const map = new Map<string, string>()
  const n = Math.min(Math.max(0, stopBeforeIndex), sortedAsc.length)
  for (let i = 0; i < n; i++) {
    const r = sortedAsc[i]!
    if (typeof r !== 'object' || r === null) continue
    const rec = r as Record<string, unknown>
    if (rec.pool !== poolKind) continue
    const t = rec.type
    const payload =
      rec.payload !== undefined && typeof rec.payload === 'object' && rec.payload !== null
        ? (rec.payload as Record<string, unknown>)
        : {}
    if (t === 'pool_entry_delete') {
      const rid = typeof payload.removeId === 'string' ? payload.removeId.trim() : ''
      if (rid) map.delete(rid)
      continue
    }
    if (t === 'pool_entry_replace') {
      const rid = typeof payload.replaceId === 'string' ? payload.replaceId.trim() : ''
      const entry = typeof payload.entry === 'string' ? payload.entry : ''
      if (rid && entry) map.set(rid, entry)
      continue
    }
    if (t === 'pool_entry') {
      const entry = typeof payload.entry === 'string' ? payload.entry : ''
      const eid = extractIdPoolEntry(entry)
      if (eid && entry) map.set(eid, entry)
    }
  }
  return map
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

export function buildAuditLog(rows: unknown[], hoursWindow: number): AuditLogResponse {
  let hw = Math.floor(Number(hoursWindow))
  if (!Number.isFinite(hw) || hw < 1) hw = 24
  hw = Math.min(hw, 24 * 90)

  const list = rows.filter((r): r is Record<string, unknown> => Boolean(r && typeof r === 'object'))
  list.sort((a, b) => String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? '')))

  const cutoff = Date.now() - hw * 3600 * 1000
  const poolKinds = new Set(['waza', 'madosho', 'patti'])
  const out: AuditLogEntry[] = []

  for (let idx = 0; idx < list.length; idx++) {
    const r = list[idx]!
    const created = r.createdAt
    const ts = typeof created === 'string' ? Date.parse(created) : NaN
    if (!Number.isFinite(ts) || ts < cutoff) continue

    const type = typeof r.type === 'string' ? r.type : ''
    const payload =
      r.payload !== undefined && typeof r.payload === 'object' && r.payload !== null
        ? (r.payload as Record<string, unknown>)
        : {}
    const pool = typeof r.pool === 'string' ? r.pool : ''
    const author =
      typeof r.author === 'string' && r.author.trim() !== '' ? r.author.trim() : '—'

    let azione = 'altro'
    let riepilogo = type
    let blocco = ''

    if (type === 'pool_entry') {
      azione = 'aggiunta'
      const entry = typeof payload.entry === 'string' ? payload.entry : ''
      const eid = extractIdPoolEntry(entry)
      const name = extractNamePoolEntry(entry)
      const poolLabel = pool || '?'
      riepilogo = `Aggiunta pool «${poolLabel}»${eid ? `: ${eid}` : ''}`
      if (name) riepilogo += ` — ${name}`
      blocco = entry
    } else if (type === 'pool_entry_replace') {
      azione = 'modifica'
      const rid = typeof payload.replaceId === 'string' ? payload.replaceId.trim() : ''
      const entry = typeof payload.entry === 'string' ? payload.entry : ''
      const poolLabel = pool || '?'
      riepilogo = `Modifica pool «${poolLabel}» id «${rid}»`
      blocco = entry
    } else if (type === 'pool_entry_delete') {
      azione = 'rimozione'
      const rid = typeof payload.removeId === 'string' ? payload.removeId.trim() : ''
      const poolLabel = pool || '?'
      riepilogo = `Rimozione pool «${poolLabel}» id «${rid}»`
      let rec: string | undefined
      if (pool && poolKinds.has(pool)) {
        const map = poolTextMapUpToIndex(list, pool, idx)
        rec = map.get(rid)
      }
      blocco =
        rec && rec !== ''
          ? rec
          : JSON.stringify({
              removeId: rid,
              nota: 'Nessun blocco precedente ricostruibile dal log (id mai inserito o già rimosso prima).',
            })
    } else if (type === 'waza_accessorio') {
      azione = 'aggiunta'
      const sk = typeof r.subkind === 'string' ? r.subkind : ''
      const pid = typeof payload.id === 'string' ? payload.id : ''
      const lab = typeof payload.label === 'string' ? payload.label : ''
      riepilogo = `Accessorio Waza (${sk}): «${pid}» — ${lab}`
      blocco = JSON.stringify(payload)
    } else if (type === 'waza_accessorio_delete') {
      azione = 'rimozione'
      const sk = typeof r.subkind === 'string' ? r.subkind : ''
      const pid = typeof payload.id === 'string' ? payload.id : ''
      riepilogo = `Rimozione accessorio (${sk}): «${pid}»`
      blocco = JSON.stringify(payload)
    } else if (type === 'skiru_pool_snapshot') {
      azione = 'snapshot'
      riepilogo = 'Snapshot completo Skiru'
      const c = payload.content
      blocco = typeof c === 'string' ? c : JSON.stringify(payload)
    } else if (type === 'skiru_categories_snapshot') {
      azione = 'snapshot'
      riepilogo = 'Snapshot categorie Skiru'
      blocco = JSON.stringify(payload)
    } else if (type === 'file_snapshot') {
      azione = 'modifica'
      const p = typeof payload.path === 'string' ? payload.path : ''
      riepilogo = `Snapshot file: ${p}`
      const c = payload.content
      blocco = typeof c === 'string' ? c : JSON.stringify(payload)
    } else {
      riepilogo = `Contributo: ${type}`
      blocco = JSON.stringify(r)
    }

    out.push({
      contributionId: r.id,
      createdAt,
      utente: author,
      azione,
      tipoTecnico: type,
      riepilogo,
      blocco,
    })
  }

  return {
    windowHours: hw,
    generatedAt: new Date().toISOString(),
    count: out.length,
    entries: out.reverse(),
  }
}
