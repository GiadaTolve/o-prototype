import { useEffect, useState, type FormEvent } from 'react'
import AuditLogPanel from './AuditLogPanel'
import './IdeeESviluppo.css'
import { useCollabAuth } from './CollabAuthContext'
import CollabContributionsPanel from './CollabContributionsPanel'
import {
  getTesterContributionsApiBase,
  TESTER_API_LOCALSTORAGE_KEY,
} from './authoringApi'
import WazaInsertionTool from './WazaInsertionTool'
import type { WazaDef } from './wazaPool'
import SkiruInsertionTool from './SkiruInsertionTool'
import SkiruCategoryTool from './SkiruCategoryTool'
import WazaTaxonomyTool from './WazaTaxonomyTool'
import RamoTaxonomyTool from './RamoTaxonomyTool'
import WazaAccessoriSection from './WazaAccessoriSection'
import BatchGenericheTool from './BatchGenericheTool'

type IdeeSection =
  | 'waza'
  | 'madosho'
  | 'patti'
  | 'skiru'
  | 'tax-skiru'
  | 'tax-waza'
  | 'tax-madosho'
  | 'tax-patti'
  | 'acc-condizioni'
  | 'acc-status'
  | 'acc-counter'
  | 'batch-generiche'

export default function IdeeESviluppo({
  wazaEditPayload,
  onConsumedWazaEditPayload,
}: {
  wazaEditPayload?: { w: WazaDef; key: number } | null
  onConsumedWazaEditPayload?: () => void
} = {}) {
  const [section, setSection] = useState<IdeeSection>('waza')
  const {
    user,
    token,
    collabLoginRequired,
    loading: authLoading,
    error: authError,
    login,
    logout,
  } = useCollabAuth()
  const apiBase = getTesterContributionsApiBase()
  const [loginUser, setLoginUser] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [loginBusy, setLoginBusy] = useState(false)
  const [loginErr, setLoginErr] = useState<string | null>(null)
  const [apiUrlDraft, setApiUrlDraft] = useState('')
  const [auditByHash, setAuditByHash] = useState(
    () => typeof window !== 'undefined' && window.location.hash === '#registro-audit',
  )
  const [auditNudge, setAuditNudge] = useState(false)

  useEffect(() => {
    const onHash = () => setAuditByHash(window.location.hash === '#registro-audit')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    if (!auditByHash) return
    try {
      localStorage.setItem('oyasumi-audit-last-shown', String(Date.now()))
    } catch {
      /* */
    }
    setAuditNudge(false)
    const el = document.getElementById('registro-audit')
    requestAnimationFrame(() => el?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }, [auditByHash])

  useEffect(() => {
    if (!apiBase || !token) {
      setAuditNudge(false)
      return
    }
    try {
      const raw = localStorage.getItem('oyasumi-audit-last-shown')
      const last = raw ? parseInt(raw, 10) : 0
      if (!Number.isFinite(last) || Date.now() - last > 24 * 3600 * 1000) {
        setAuditNudge(true)
      }
    } catch {
      /* */
    }
  }, [apiBase, token])

  useEffect(() => {
    if (wazaEditPayload) setSection('waza')
  }, [wazaEditPayload?.key])

  const needCollabLogin = Boolean((apiBase || import.meta.env.PROD) && collabLoginRequired === true && !token)
  const configLoading = Boolean(apiBase && collabLoginRequired === null)

  async function handleLoginSubmit(e: FormEvent) {
    e.preventDefault()
    setLoginErr(null)
    setLoginBusy(true)
    try {
      await login(loginUser, loginPass)
      setLoginPass('')
    } catch (er) {
      setLoginErr(er instanceof Error ? er.message : String(er))
    } finally {
      setLoginBusy(false)
    }
  }

  function applySavedApiUrlAndReload() {
    setLoginErr(null)
    const raw = apiUrlDraft.trim().replace(/\/$/, '')
    if (!raw) {
      setLoginErr('Incolla l’URL del tester-api (es. https://tuoserver.example.com).')
      return
    }
    if (!/^https?:\/\//i.test(raw)) {
      setLoginErr('URL non valido: serve https://… (http solo per test in locale).')
      return
    }
    try {
      localStorage.setItem(TESTER_API_LOCALSTORAGE_KEY, raw)
    } catch {
      setLoginErr('Storage non disponibile (browser in modalità privata?).')
      return
    }
    window.location.reload()
  }

  if (configLoading) {
    return (
      <div className="idee-collab-gate animate__animated animate__fadeIn">
        <p className="idee-collab-gate-title">Idee e sviluppo</p>
        <p className="idee-collab-gate-hint">Connessione al server…</p>
      </div>
    )
  }

  if (needCollabLogin) {
    return (
      <div className="idee-collab-gate animate__animated animate__fadeIn">
        <h2 className="idee-collab-gate-title">Accesso collaboratori</h2>
        <p className="idee-collab-gate-hint">
          Inserisci le credenziali rilasciate dalla regia per usare gli strumenti di authoring online.
        </p>
        {!apiBase ? (
          <div style={{ marginBottom: '1rem', width: '100%', maxWidth: '22rem' }}>
            <label className="idee-collab-login-field" htmlFor="idee-api-url">
              <span>
                <strong>Server API</strong> (tester-api, senza / finale)
              </span>
            </label>
            <input
              id="idee-api-url"
              className="idee-collab-login-input"
              type="url"
              inputMode="url"
              placeholder="https://…"
              value={apiUrlDraft}
              onChange={(e) => {
                setApiUrlDraft(e.target.value)
                setLoginErr(null)
              }}
              autoComplete="off"
            />
            <button
              type="button"
              className="idee-collab-login-submit"
              style={{ marginTop: '0.5rem' }}
              onClick={applySavedApiUrlAndReload}
            >
              Salva URL e ricarica
            </button>
            {import.meta.env.PROD ? (
              <p className="idee-collab-gate-hint" style={{ marginTop: '0.75rem', opacity: 0.85 }}>
                In alternativa: <code className="idee-accessori-code">ALTERVISTA_TESTER_API_URL</code> nel file di deploy, o tag{' '}
                <code className="idee-accessori-code">meta oyasumi-tester-api</code> nell’HTML su Altervista.
              </p>
            ) : null}
          </div>
        ) : null}
        <form className="idee-collab-login-form" onSubmit={handleLoginSubmit}>
          <label className="idee-collab-login-field">
            <span>Nome utente</span>
            <input
              className="idee-collab-login-input"
              value={loginUser}
              onChange={(e) => setLoginUser(e.target.value)}
              autoComplete="username"
              disabled={loginBusy}
            />
          </label>
          <label className="idee-collab-login-field">
            <span>Password</span>
            <input
              className="idee-collab-login-input"
              type="password"
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              autoComplete="current-password"
              disabled={loginBusy}
            />
          </label>
          {(loginErr || authError) ? (
            <p className="idee-accessori-feedback idee-accessori-feedback--err">{loginErr || authError}</p>
          ) : null}
          <button
            type="submit"
            className="idee-collab-login-submit"
            disabled={loginBusy || authLoading || !apiBase}
            title={!apiBase ? 'Salva prima l’URL del server API (sopra).' : undefined}
          >
            {loginBusy ? 'Accesso…' : 'Entra'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="idee-hub animate__animated animate__fadeIn">
      <aside className="idee-hub-nav" aria-label="Sezioni Idee e sviluppo">
        <p className="idee-hub-nav-title">Idee e sviluppo</p>
        {apiBase && token && user ? (
          <div className="idee-collab-session">
            <span className="idee-collab-session-user">{user}</span>
            <button type="button" className="idee-collab-session-out" onClick={() => logout()}>
              Esci
            </button>
          </div>
        ) : null}
        <CollabContributionsPanel />
        <p className="idee-hub-nav-group">Schede (stesso modulo)</p>
        <div className="idee-hub-nav-buttons">
          <button
            type="button"
            className={`idee-hub-nav-btn${section === 'waza' ? ' idee-hub-nav-btn--active' : ''}`}
            onClick={() => setSection('waza')}
          >
            Waza
          </button>
          <button
            type="button"
            className={`idee-hub-nav-btn${section === 'madosho' ? ' idee-hub-nav-btn--active' : ''}`}
            onClick={() => setSection('madosho')}
          >
            Madōsho (clan)
          </button>
          <button
            type="button"
            className={`idee-hub-nav-btn${section === 'patti' ? ' idee-hub-nav-btn--active' : ''}`}
            onClick={() => setSection('patti')}
          >
            Patti (premio)
          </button>
        </div>
        <p className="idee-hub-nav-group">Skiru</p>
        <div className="idee-hub-nav-buttons">
          <button
            type="button"
            className={`idee-hub-nav-btn${section === 'skiru' ? ' idee-hub-nav-btn--active' : ''}`}
            onClick={() => setSection('skiru')}
          >
            Scheda abilità
          </button>
          <button
            type="button"
            className={`idee-hub-nav-btn${section === 'tax-skiru' ? ' idee-hub-nav-btn--active' : ''}`}
            onClick={() => setSection('tax-skiru')}
          >
            Categorie Skiru
          </button>
        </div>
        <p className="idee-hub-nav-group">Waza · tassonomia</p>
        <div className="idee-hub-nav-buttons">
          <button
            type="button"
            className={`idee-hub-nav-btn${section === 'tax-waza' ? ' idee-hub-nav-btn--active' : ''}`}
            onClick={() => setSection('tax-waza')}
          >
            Categorie e sottocategorie
          </button>
        </div>
        <p className="idee-hub-nav-group">Waza · accessori</p>
        <div className="idee-hub-nav-buttons">
          <button
            type="button"
            className={`idee-hub-nav-btn${section === 'acc-condizioni' ? ' idee-hub-nav-btn--active' : ''}`}
            onClick={() => setSection('acc-condizioni')}
          >
            Condizioni
          </button>
          <button
            type="button"
            className={`idee-hub-nav-btn${section === 'acc-status' ? ' idee-hub-nav-btn--active' : ''}`}
            onClick={() => setSection('acc-status')}
          >
            Status
          </button>
          <button
            type="button"
            className={`idee-hub-nav-btn${section === 'acc-counter' ? ' idee-hub-nav-btn--active' : ''}`}
            onClick={() => setSection('acc-counter')}
          >
            Counter
          </button>
        </div>
        <p className="idee-hub-nav-group">Waza · batch</p>
        <div className="idee-hub-nav-buttons">
          <button
            type="button"
            className={`idee-hub-nav-btn${section === 'batch-generiche' ? ' idee-hub-nav-btn--active' : ''}`}
            onClick={() => setSection('batch-generiche')}
          >
            Batch generiche avanzate
          </button>
        </div>
        <p className="idee-hub-nav-group">Madōsho / Patti</p>
        <div className="idee-hub-nav-buttons">
          <button
            type="button"
            className={`idee-hub-nav-btn${section === 'tax-madosho' ? ' idee-hub-nav-btn--active' : ''}`}
            onClick={() => setSection('tax-madosho')}
          >
            Tassonomia Madōsho
          </button>
          <button
            type="button"
            className={`idee-hub-nav-btn${section === 'tax-patti' ? ' idee-hub-nav-btn--active' : ''}`}
            onClick={() => setSection('tax-patti')}
          >
            Tassonomia Patti
          </button>
        </div>
      </aside>
      <main className="idee-hub-main">
        {auditNudge ? (
          <div className="audit-nudge audit-no-print">
            <span>
              Promemoria: apri il registro modifiche riservato (finestra 24h) con l’ancora nella URL o il pulsante.
            </span>
            <button
              type="button"
              onClick={() => {
                window.location.hash = '#registro-audit'
              }}
            >
              Apri #registro-audit
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.setItem('oyasumi-audit-last-shown', String(Date.now()))
                } catch {
                  /* */
                }
                setAuditNudge(false)
              }}
            >
              Nascondi 24h
            </button>
          </div>
        ) : null}
        {auditByHash ? <AuditLogPanel /> : null}
        {section === 'waza' && (
          <WazaInsertionTool
            kind="waza"
            initialWazaFromPool={wazaEditPayload?.w ?? null}
            initialWazaHydrateKey={wazaEditPayload?.key ?? 0}
            onHydratedWazaFromPool={onConsumedWazaEditPayload}
          />
        )}
        {section === 'madosho' && <WazaInsertionTool kind="madosho" />}
        {section === 'acc-condizioni' && <WazaAccessoriSection tab="condizioni" />}
        {section === 'acc-status' && <WazaAccessoriSection tab="status" />}
        {section === 'acc-counter' && <WazaAccessoriSection tab="counter" />}
        {section === 'batch-generiche' && <BatchGenericheTool />}
        {section === 'patti' && <WazaInsertionTool kind="patti" />}
        {section === 'skiru' && <SkiruInsertionTool />}
        {section === 'tax-skiru' && <SkiruCategoryTool />}
        {section === 'tax-waza' && <WazaTaxonomyTool />}
        {section === 'tax-madosho' && <RamoTaxonomyTool kind="madosho" />}
        {section === 'tax-patti' && <RamoTaxonomyTool kind="patti" />}
      </main>
    </div>
  )
}
