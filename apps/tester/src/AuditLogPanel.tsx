import { useCallback, useEffect, useState } from 'react'
import { fetchAuditLog, type AuditLogResponse } from './authoringApi'
import './AuditLogPanel.css'

const SESSION_KEY = 'oyasumi-audit-admin-key'

export default function AuditLogPanel() {
  const [adminKey, setAdminKey] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) ?? ''
    } catch {
      return ''
    }
  })
  const [hours, setHours] = useState(24)
  const [data, setData] = useState<AuditLogResponse | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    try {
      if (adminKey.trim()) sessionStorage.setItem(SESSION_KEY, adminKey.trim())
      else sessionStorage.removeItem(SESSION_KEY)
    } catch {
      /* */
    }
  }, [adminKey])

  const load = useCallback(async () => {
    setErr(null)
    setData(null)
    const k = adminKey.trim()
    if (!k) {
      setErr('Inserisci la chiave admin (stessa di export contributi).')
      return
    }
    setLoading(true)
    try {
      setData(await fetchAuditLog(k, hours))
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [adminKey, hours])

  const actionClass = (azione: string) => {
    if (azione === 'rimozione') return 'audit-entry-action audit-entry-action--rimozione'
    if (azione === 'aggiunta') return 'audit-entry-action audit-entry-action--aggiunta'
    if (azione === 'modifica') return 'audit-entry-action audit-entry-action--modifica'
    return 'audit-entry-action'
  }

  return (
    <section className="audit-panel animate__animated animate__fadeIn" id="registro-audit">
      <div className="audit-panel-head">
        <h2 className="audit-panel-title">Registro modifiche (riservato)</h2>
        <p className="audit-panel-lead">
          Finestra mobile: mostra gli interventi sugli ultimi N ore (default 24). Per le rimozioni da pool Waza /
          Madōsho / Patti, il blocco testuale è ricostruito dal log quando possibile (ripristino copiaincolla).
          Accesso solo con la chiave <strong>admin</strong> del server.
        </p>
      </div>

      <div className="audit-panel-controls audit-no-print">
        <label>
          Chiave admin
          <input
            type="password"
            autoComplete="off"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="X-Admin-Key"
          />
        </label>
        <label>
          Ore
          <input
            type="number"
            min={1}
            max={2160}
            value={hours}
            onChange={(e) => setHours(Math.max(1, parseInt(e.target.value, 10) || 24))}
          />
        </label>
        <button type="button" className="audit-btn" disabled={loading} onClick={() => void load()}>
          {loading ? 'Carico…' : 'Aggiorna registro'}
        </button>
        <button
          type="button"
          className="audit-btn audit-btn--print"
          onClick={() => window.print()}
          disabled={!data?.entries.length}
        >
          Stampa / PDF
        </button>
      </div>

      {err ? (
        <p className="idee-accessori-feedback idee-accessori-feedback--err audit-no-print">{err}</p>
      ) : null}

      {data ? (
        <div className="audit-print-root">
          <p className="audit-meta">
            Generato: {data.generatedAt} · Finestra: {data.windowHours} h · Voci: {data.count}
          </p>
          {data.entries.length === 0 ? (
            <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>Nessuna modifica in questo intervallo.</p>
          ) : (
            data.entries.map((e, i) => (
              <article key={`${String(e.contributionId)}-${i}`} className="audit-entry">
                <div className="audit-entry-top">
                  <span className="audit-entry-user">{e.utente}</span>
                  <span className={actionClass(e.azione)}>{e.azione}</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.65 }}>{String(e.createdAt)}</span>
                </div>
                <p className="audit-entry-sum">{e.riepilogo}</p>
                <pre className="audit-entry-block">{e.blocco}</pre>
              </article>
            ))
          )}
        </div>
      ) : null}
    </section>
  )
}
