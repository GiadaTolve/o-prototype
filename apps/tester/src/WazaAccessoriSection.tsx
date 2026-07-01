import { useState } from 'react'
import {
  appendWazaAccessorioToPool,
  canPersistAuthoringToPool,
  deleteWazaAccessorioContribution,
  getTesterContributionsApiBase,
} from './authoringApi'
import { useWazaAccessori } from './WazaAccessoriContext'

export type WazaAccessoriTab = 'condizioni' | 'status' | 'counter'

function PersistUnavailableBanner() {
  return (
    <p className="idee-accessori-feedback idee-accessori-feedback--err" role="alert">
      <strong>Salvataggio nel pool disattivato qui.</strong> Su hosting statico (es. Altervista) non si può
      modificare <code className="idee-accessori-code">wazaPool.ts</code>. Usa{' '}
      <code className="idee-accessori-code">npm run dev</code> in locale oppure ricompila il tester con{' '}
      <code className="idee-accessori-code">VITE_TESTER_API_URL</code> verso un{' '}
      <code className="idee-accessori-code">tester-api</code>: gli invii restano sul server finché non esegui{' '}
      <code className="idee-accessori-code">apply:tester-contributions</code> e un nuovo deploy.
    </p>
  )
}

function AccessoriCondizioniPanel() {
  const persist = canPersistAuthoringToPool()
  return (
    <div className="idee-accessori-single">
      <section className="idee-accessori-col idee-accessori-col--wide" aria-labelledby="idee-acc-cond-modulo">
        <h4 id="idee-acc-cond-modulo" className="idee-accessori-col-title">
          Moduli di creazione condizioni
        </h4>
        <p className="idee-accessori-hint">
          Aggiungi un id in <code className="idee-accessori-code">WAZA_CONDIZIONI_APPLICABILI</code> (stesso file). Serve{' '}
          <code className="idee-accessori-code">npm run dev</code> sul tester. Id: minuscolo,{' '}
          <code className="idee-accessori-code">a-z0-9_-</code>.
        </p>
        {!persist ? <PersistUnavailableBanner /> : null}
        <AccessorioPoolForm kind="condizione" />
        <AccessorioRegistryList kind="condizione" />
      </section>
    </div>
  )
}

function AccessoriStatusPanel() {
  return (
    <div className="idee-accessori-single">
      <section className="idee-accessori-col idee-accessori-col--wide" aria-labelledby="idee-acc-st-modulo">
        <h4 id="idee-acc-st-modulo" className="idee-accessori-col-title">
          Moduli di creazione status
        </h4>
        <p className="idee-accessori-hint">
          Aggiungi un nuovo id in <code className="idee-accessori-code">wazaPool.ts</code> (array + etichette). Serve{' '}
          <code className="idee-accessori-code">npm run dev</code> sul tester. Id: minuscolo, <code className="idee-accessori-code">a-z0-9_-</code>.
        </p>
        {!canPersistAuthoringToPool() ? <PersistUnavailableBanner /> : null}
        <AccessorioPoolForm kind="status" />
        <AccessorioRegistryList kind="status" />
      </section>
    </div>
  )
}

function AccessoriCounterPanel() {
  return (
    <div className="idee-accessori-single">
      <section className="idee-accessori-col idee-accessori-col--wide" aria-labelledby="idee-acc-ct-modulo">
        <h4 id="idee-acc-ct-modulo" className="idee-accessori-col-title">
          Moduli di creazione counter
        </h4>
        <p className="idee-accessori-hint">
          Aggiungi un nuovo id in <code className="idee-accessori-code">wazaPool.ts</code> (array + etichette). Serve{' '}
          <code className="idee-accessori-code">npm run dev</code> sul tester. Id: minuscolo, <code className="idee-accessori-code">a-z0-9_-</code>.
        </p>
        {!canPersistAuthoringToPool() ? <PersistUnavailableBanner /> : null}
        <AccessorioPoolForm kind="counter" />
        <AccessorioRegistryList kind="counter" />
      </section>
    </div>
  )
}

function AccessorioPoolForm({ kind }: { kind: 'condizione' | 'status' | 'counter' }) {
  const { refetch: refetchAccessori } = useWazaAccessori()
  const [slug, setSlug] = useState('')
  const [label, setLabel] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const persist = canPersistAuthoringToPool()

  const idTrim = slug.trim()
  const labelTrim = label.trim()
  const idValid = /^[a-z][a-z0-9_-]*$/.test(idTrim)

  return (
    <form
      className="idee-accessori-form"
      onSubmit={async (e) => {
        e.preventDefault()
        setMsg(null)
        setErr(null)
        if (!idTrim) {
          setErr('Inserisci un id (slug).')
          return
        }
        if (!idValid) {
          setErr(
            'L’id deve iniziare con lettera minuscola; poi solo a-z, 0-9, underscore o trattino (es. stesso_turno o stesso-turno).',
          )
          return
        }
        if (!labelTrim) {
          setErr('Inserisci il nome / etichetta.')
          return
        }
        setSaving(true)
        try {
          await appendWazaAccessorioToPool(kind, idTrim, labelTrim, note.trim())
          const viaApi = Boolean(getTesterContributionsApiBase())
          if (viaApi) await refetchAccessori()
          setMsg(
            viaApi
              ? `Inviato «${idTrim}» al server contributi. Le tendine si aggiornano subito se la build punta alla stessa API (GET /api/waza-accessori).`
              : `Salvato «${idTrim}» in src/wazaPool.ts. Con HMR le tendine Waza si aggiornano; altrimenti ricarica la pagina.`,
          )
          setSlug('')
          setLabel('')
          setNote('')
        } catch (er) {
          setErr(er instanceof Error ? er.message : String(er))
        } finally {
          setSaving(false)
        }
      }}
    >
      <label className="idee-accessori-field">
        <span className="idee-accessori-label">Id (slug)</span>
        <input
          type="text"
          className="idee-accessori-input"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value)
            setErr(null)
            setMsg(null)
          }}
          placeholder={
            kind === 'condizione' ? 'es. stesso_turno' : kind === 'status' ? 'es. ritardo' : 'es. riserva_jigo'
          }
          autoComplete="off"
        />
      </label>
      <label className="idee-accessori-field">
        <span className="idee-accessori-label">Nome / etichetta</span>
        <input
          type="text"
          className="idee-accessori-input"
          value={label}
          onChange={(e) => {
            setLabel(e.target.value)
            setErr(null)
            setMsg(null)
          }}
          placeholder={
            kind === 'condizione' ? 'Etichetta condizione' : kind === 'status' ? 'Etichetta status' : 'Etichetta counter'
          }
          autoComplete="off"
        />
      </label>
      <label className="idee-accessori-field">
        <span className="idee-accessori-label">Note (effetto, stack, durata…)</span>
        <textarea
          className="idee-accessori-textarea"
          value={note}
          onChange={(e) => {
            setNote(e.target.value)
            setErr(null)
            setMsg(null)
          }}
          rows={4}
          placeholder="Opzionale: confronto in file come commento sulla riga labels"
        />
      </label>
      {idTrim && !idValid ? (
        <p className="idee-accessori-warn">
          L’id deve iniziare con lettera minuscola; poi a-z, 0-9, _ o - (trattino).
        </p>
      ) : null}
      {msg ? <p className="idee-accessori-feedback idee-accessori-feedback--ok">{msg}</p> : null}
      {err ? <p className="idee-accessori-feedback idee-accessori-feedback--err">{err}</p> : null}
      <button
        type="submit"
        className="idee-accessori-submit idee-accessori-submit--active"
        disabled={saving || !persist}
        title={!persist ? 'Salvataggio non disponibile in questo ambiente' : undefined}
      >
        {saving ? 'Salvataggio…' : 'Salva nel pool'}
      </button>
    </form>
  )
}

function AccessorioRegistryList({ kind }: { kind: 'condizione' | 'status' | 'counter' }) {
  const { merged, refetch } = useWazaAccessori()
  const persist = canPersistAuthoringToPool()
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const entries =
    kind === 'condizione'
      ? merged.weapon.tagIds.map((id) => ({ id, label: merged.weapon.labelById[id] ?? id }))
      : kind === 'status'
        ? merged.status.ids.map((id) => ({ id, label: merged.status.labelById[id] ?? id }))
        : merged.counter.ids.map((id) => ({ id, label: merged.counter.labelById[id] ?? id }))

  return (
    <div className="idee-accessori-registry" style={{ marginTop: '1.25rem' }}>
      <h4 className="idee-accessori-col-title" style={{ fontSize: '0.95rem' }}>
        Elenco voci · consultazione e rimozione
      </h4>
      <p className="idee-accessori-hint">
        <strong>Rimuovi</strong> toglie la riga da <code className="idee-accessori-code">wazaPool.ts</code> (dev) o registra una cancellazione sull’API. Per le condizioni, solo gli id in{' '}
        <code className="idee-accessori-code">WAZA_CONDIZIONI_APPLICABILI</code> sono rimovibili così; i tag arma predefiniti vanno editati nel file sorgente.
      </p>
      {msg ? <p className="idee-accessori-feedback idee-accessori-feedback--ok">{msg}</p> : null}
      {err ? <p className="idee-accessori-feedback idee-accessori-feedback--err">{err}</p> : null}
      <ul className="idee-accessori-registry-list" style={{ listStyle: 'none', padding: 0, margin: '0.75rem 0 0' }}>
        {entries.map(({ id, label }) => (
          <li
            key={id}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <code className="idee-accessori-code">{id}</code>
            <span style={{ flex: '1 1 140px', opacity: 0.9 }}>{label}</span>
            <button
              type="button"
              className="idee-accessori-submit"
              disabled={!persist}
              title={!persist ? 'Salvataggio non disponibile' : 'Rimuovi dal pool'}
              style={{
                fontSize: '0.8rem',
                padding: '0.25rem 0.6rem',
                opacity: persist ? 1 : 0.5,
                background: 'rgba(180,60,60,0.2)',
                borderColor: 'rgba(255,120,120,0.35)',
              }}
              onClick={async () => {
                setMsg(null)
                setErr(null)
                if (!window.confirm(`Rimuovere «${id}» (${kind}) da wazaPool / contributi?`)) return
                try {
                  await deleteWazaAccessorioContribution(kind, id)
                  if (getTesterContributionsApiBase()) await refetch()
                  setMsg(`Rimosso «${id}». ${getTesterContributionsApiBase() ? 'Tendine aggiornate dall’API.' : 'Con HMR il file si ricarica in dev.'}`)
                } catch (er) {
                  setErr(er instanceof Error ? er.message : String(er))
                }
              }}
            >
              Rimuovi
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

const ACCESSORI_TITLES: Record<WazaAccessoriTab, string> = {
  condizioni: 'Condizioni',
  status: 'Status',
  counter: 'Counter',
}

export default function WazaAccessoriSection({ tab }: { tab: WazaAccessoriTab }) {
  return (
    <div className="idee-accessori-page animate__animated animate__fadeIn">
      <header className="idee-accessori-page-head">
        <h2 className="idee-accessori-page-title">
          Waza · accessori · {ACCESSORI_TITLES[tab]}
        </h2>
        <p className="idee-accessori-page-lead">
          Condizioni, status e counter condivisi da <strong>tutte le Waza</strong> (scheda tecnica, Madōshō, Patto…):
          moduli di authoring.
        </p>
      </header>
      {tab === 'condizioni' && <AccessoriCondizioniPanel />}
      {tab === 'status' && <AccessoriStatusPanel />}
      {tab === 'counter' && <AccessoriCounterPanel />}
    </div>
  )
}
