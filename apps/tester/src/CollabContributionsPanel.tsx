import { useCallback, useEffect, useState } from 'react'
import { useCollabAuth } from './CollabAuthContext'
import { getTesterContributionsApiBase } from './authoringApi'
import { getCollabJwt } from './collabAuth'

type CatalogItem = {
  id: string
  createdAt?: string
  type?: string
  pool?: string
  subkind?: string
  author?: string
  entityId: string | null
  title: string | null
}

export default function CollabContributionsPanel() {
  const { token } = useCollabAuth()
  const base = getTesterContributionsApiBase()
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!base) return
    const t = getCollabJwt()
    if (!t) return
    setLoading(true)
    setErr(null)
    try {
      const r = await fetch(`${base}/api/contributions/catalog`, {
        headers: { Authorization: `Bearer ${t}` },
      })
      if (!r.ok) {
        setErr(await r.text())
        return
      }
      const d = (await r.json()) as { items?: CatalogItem[] }
      setItems(Array.isArray(d.items) ? d.items : [])
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [base])

  useEffect(() => {
    load()
  }, [load])

  if (!base || !token) return null

  return (
    <div className="idee-collab-catalog">
      <p className="idee-collab-catalog-title">Contributi salvati sul server</p>
      <p className="idee-collab-catalog-hint">
        Elenco grezzo (id tecnico + anteprima). Per importare nel repo usa l’export admin o lo script
        <code className="idee-accessori-code"> apply:tester-contributions</code>.
      </p>
      {loading ? <p className="idee-collab-catalog-muted">Caricamento…</p> : null}
      {err ? <p className="idee-accessori-feedback idee-accessori-feedback--err">{err}</p> : null}
      {!loading && !err && items.length === 0 ? (
        <p className="idee-collab-catalog-muted">Nessun contributo ancora.</p>
      ) : null}
      {items.length > 0 ? (
        <ul className="idee-collab-catalog-list">
          {items
            .slice()
            .reverse()
            .map((it) => (
              <li key={String(it.id)} className="idee-collab-catalog-item">
                <span className="idee-collab-catalog-type">{String(it.type ?? '—')}</span>
                {it.pool ? <span className="idee-collab-catalog-pool">{String(it.pool)}</span> : null}
                {it.entityId ? (
                  <span className="idee-collab-catalog-entity">
                    {it.title ? `${it.title} ` : ''}(
                    <code>{it.entityId}</code>)
                  </span>
                ) : null}
                <span className="idee-collab-catalog-meta">
                  {it.createdAt ? new Date(String(it.createdAt)).toLocaleString('it-IT') : ''}
                  {it.author ? ` · ${it.author}` : ''}
                </span>
                <code className="idee-collab-catalog-id" title="Id contributo (UUID)">
                  {String(it.id)}
                </code>
              </li>
            ))}
        </ul>
      ) : null}
      <button type="button" className="idee-collab-catalog-refresh" onClick={() => load()}>
        Aggiorna elenco
      </button>
    </div>
  )
}
