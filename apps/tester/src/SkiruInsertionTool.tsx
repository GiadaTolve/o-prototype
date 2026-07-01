import { useEffect, useRef, useState } from 'react'
import './WazaInsertionTool.css'
import {
  getTesterContributionsApiBase,
  postSkiruPoolSnapshot,
} from './authoringApi'
import { useRuntimeSkiru } from './RuntimeSkiruContext'
import {
  CANONICAL_SKIRU_CATALOG_PATH,
  SKIRU_POOL,
  SKIRU_CATEGORY_LABELS,
  SKIRU_CATEGORY_ORDER,
  domainForSkiruBranch,
  type SkiruCategory,
  type SkiruDef,
} from './skiruPool'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function SkiruInsertionTool() {
  const apiBase = getTesterContributionsApiBase()
  const {
    pool: runtimePool,
    categoryOrder,
    categoryLabels,
    refetch,
    loading: runtimeLoading,
  } = useRuntimeSkiru()
  const defaultCategory = (categoryOrder[0] ?? SKIRU_CATEGORY_ORDER[0] ?? 'shakai-kaikyu') as SkiruCategory
  const [draftPool, setDraftPool] = useState<SkiruDef[]>(() => [...SKIRU_POOL])
  const [category, setCategory] = useState<SkiruCategory>(defaultCategory)
  const draftSeededRef = useRef(false)
  const [idOverride, setIdOverride] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [haRequisiti, setHaRequisiti] = useState<'si' | 'no'>('no')
  const [requisiti, setRequisiti] = useState('')
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [saveErr, setSaveErr] = useState<string | null>(null)

  useEffect(() => {
    const ord = categoryOrder.length > 0 ? categoryOrder : [...SKIRU_CATEGORY_ORDER]
    if (!ord.includes(category)) {
      setCategory((ord[0] ?? 'shakai-kaikyu') as SkiruCategory)
    }
  }, [category, categoryOrder])

  useEffect(() => {
    if (runtimeLoading) return
    if (draftSeededRef.current) return
    draftSeededRef.current = true
    setDraftPool([...runtimePool])
  }, [runtimeLoading, runtimePool])

  const resolvedId = slugify(idOverride.trim() || name.trim())

  const handleResetForm = () => {
    setCategory(SKIRU_CATEGORY_ORDER[0] ?? 'shakai-kaikyu')
    setIdOverride('')
    setName('')
    setDescription('')
    setHaRequisiti('no')
    setRequisiti('')
  }

  const reloadFromModule = async () => {
    setSaveMsg(null)
    setSaveErr(null)
    if (apiBase) {
      const r = await refetch()
      if (r) setDraftPool([...r.pool])
    } else {
      setDraftPool([...SKIRU_POOL])
    }
  }

  const addToSession = () => {
    const id = resolvedId
    const n = name.trim()
    if (!id || !n) return
    if (draftPool.some((x) => x.id === id)) {
      setSaveErr(`Esiste già una voce con id «${id}». Cambia nome/id o rimuovila dall’elenco sessione.`)
      return
    }
    setSaveErr(null)
    const entry: SkiruDef = {
      id,
      name: n,
      domain: domainForSkiruBranch(category),
      branchId: category,
      category,
      description: description.trim() || undefined,
      kind: 'standard',
    }
    setDraftPool((p) => [...p, entry])
    handleResetForm()
  }

  const removeFromSession = (id: string) => {
    setDraftPool((p) => p.filter((x) => x.id !== id))
  }

  const saveToDisk = async () => {
    setSaveMsg(null)
    setSaveErr(null)
    if (!apiBase) {
      setSaveErr(`Catalogo read-only in locale. Modifica ${CANONICAL_SKIRU_CATALOG_PATH}.`)
      return
    }
    try {
      await postSkiruPoolSnapshot(JSON.stringify(draftPool), draftPool)
      const r = await refetch()
      if (r) setDraftPool([...r.pool])
      setSaveMsg('Snapshot inviato al server. Scheda Skiru e browser si aggiornano dai dati runtime.')
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : String(e))
    }
  }

  const poolSnippet =
    name.trim() !== ''
      ? `  { id: '${resolvedId.replace(/'/g, "\\'")}', name: '${name.trim().replace(/'/g, "\\'")}', category: '${category}'${
          description.trim()
            ? `, description: "${description.trim().replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`
            : ''
        } },`
      : ''

  const showPreview =
    name.trim() !== '' ||
    description.trim() !== '' ||
    (haRequisiti === 'si' && requisiti.trim() !== '')

  return (
    <div className="wit animate__animated animate__fadeIn">
      <section className="wit-hero">
        <h2>Tool Skiru</h2>
        <p>
          Compila la scheda, poi <strong>Aggiungi al pool (sessione)</strong>. Controlla l’elenco sotto, infine{' '}
          <strong>{apiBase ? 'Salva snapshot sul server' : 'Salva skiruPool.ts su disco'}</strong>
          {!apiBase && (
            <> con <code className="wit-inline-code">npm run dev</code> attivo (come per Categorie Skiru).</>
          )}
          {apiBase && ' dopo il login collaboratore.'}
        </p>
      </section>

      <div className="wit-panel">
        <h3 className="wit-panel-title">Pool in questa sessione ({draftPool.length} voci)</h3>
        <p className="wit-hint wit-hint--flush-top">
          Parte dall’elenco runtime (o dal file in dev). Le modifiche restano in memoria finché non salvi o non ricarichi.
        </p>
        <ul className="wit-taxonomy-list">
          {draftPool.map((d) => (
            <li key={d.id} className="wit-taxonomy-row">
              <span>
                <strong>{d.name}</strong>{' '}
                <span className="wit-taxonomy-meta">
                  ({d.id}) · {categoryLabels[d.category] ?? SKIRU_CATEGORY_LABELS[d.category] ?? d.category}
                </span>
              </span>
              <button type="button" className="wit-btn wit-btn--small wit-btn--secondary" onClick={() => removeFromSession(d.id)}>
                Rimuovi
              </button>
            </li>
          ))}
        </ul>
        <div className="wit-actions">
          <button type="button" className="wit-btn wit-btn--secondary" onClick={() => void reloadFromModule()}>
            {apiBase ? 'Ricarica dal server' : 'Ricarica da file (SKIRU_POOL)'}
          </button>
          <button type="button" className="wit-btn" onClick={saveToDisk} disabled={draftPool.length === 0}>
            {apiBase ? 'Salva snapshot sul server' : 'Salva skiruPool.ts su disco'}
          </button>
        </div>
        {saveMsg && <p className="wit-hint">{saveMsg}</p>}
        {saveErr && <p className="wit-hint" style={{ color: 'var(--accent-violet, #c084fc)' }}>{saveErr}</p>}
      </div>

      <form
        className="wit-form"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="wit-panel">
          <h3 className="wit-panel-title">Nuova / modifica in form → aggiungi al pool</h3>

          <div className="wit-field">
            <label className="wit-label" htmlFor="skiru-cat">Categoria</label>
            <select
              id="skiru-cat"
              className="wit-select"
              value={category}
              onChange={(e) => setCategory(e.target.value as SkiruCategory)}
            >
              {(categoryOrder.length > 0 ? categoryOrder : [...SKIRU_CATEGORY_ORDER]).map((c) => (
                <option key={c} value={c}>
                  {categoryLabels[c] ?? SKIRU_CATEGORY_LABELS[c as SkiruCategory] ?? c}
                </option>
              ))}
            </select>
          </div>

          <div className="wit-field">
            <label className="wit-label" htmlFor="skiru-id-override">Id slug (opzionale)</label>
            <input
              id="skiru-id-override"
              type="text"
              className="wit-input"
              value={idOverride}
              onChange={(e) => setIdOverride(e.target.value)}
              placeholder="Vuoto = derivato dal nome"
            />
            <span className="wit-hint">Anteprima id: {resolvedId || '—'}</span>
          </div>

          <div className="wit-field">
            <label className="wit-label" htmlFor="skiru-name">Nome</label>
            <input
              id="skiru-name"
              type="text"
              className="wit-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome della Skiru"
            />
          </div>

          <div className="wit-field">
            <label className="wit-label" htmlFor="skiru-desc">Descrizione</label>
            <textarea
              id="skiru-desc"
              className="wit-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrizione effetto, uso, contesto…"
            />
          </div>

          <div className="wit-field">
            <span className="wit-label">Requisiti</span>
            <div className="wit-choice-row">
              {(['no', 'si'] as const).map((v) => (
                <label key={v} className="wit-choice">
                  <input
                    type="radio"
                    name="skiruRequisiti"
                    checked={haRequisiti === v}
                    onChange={() => {
                      setHaRequisiti(v)
                      if (v === 'no') setRequisiti('')
                    }}
                  />
                  <span>{v === 'si' ? 'Sì' : 'No'}</span>
                </label>
              ))}
            </div>
            {haRequisiti === 'si' && (
              <>
                <label className="wit-label wit-label--block-mt" htmlFor="skiru-req">
                  Indicare requisiti
                </label>
                <textarea
                  id="skiru-req"
                  className="wit-textarea"
                  value={requisiti}
                  onChange={(e) => setRequisiti(e.target.value)}
                  placeholder="Es. waza prerequisito, rango, oggetti…"
                />
              </>
            )}
            <span className="wit-hint">
              I requisiti restano nel riepilogo testuale; non sono nel tipo di dato del pool.
            </span>
          </div>
        </div>

        <div className="wit-actions">
          <button type="button" className="wit-btn" onClick={addToSession} disabled={!resolvedId || !name.trim()}>
            Aggiungi al pool (sessione)
          </button>
          <button type="button" className="wit-btn wit-btn--secondary" onClick={handleResetForm}>
            Pulisci form
          </button>
        </div>
      </form>

      {showPreview && (
        <section className="wit-preview animate__animated animate__fadeInUp">
          <h3>Anteprima scheda (prima di aggiungere)</h3>
          <div className="wit-preview-body">
            <p className="wit-preview-statline">
              <span className="wit-tag-gold">Categoria</span>{' '}
              {categoryLabels[category] ?? SKIRU_CATEGORY_LABELS[category] ?? category}
            </p>
            {name.trim() && (
              <p><strong>{name.trim()}</strong></p>
            )}
            {description.trim() && <p>{description.trim()}</p>}
            {haRequisiti === 'si' && requisiti.trim() && (
              <p className="wit-preview-statline">
                <span className="wit-tag-gold">Requisiti</span> {requisiti.trim()}
              </p>
            )}
          </div>
          {poolSnippet && (
            <>
              <h4 className="wit-panel-title" style={{ marginTop: '1rem', fontSize: '0.95rem' }}>
                Solo riga (alternativa manuale)
              </h4>
              <button
                type="button"
                className="wit-btn wit-btn--small"
                onClick={() => navigator.clipboard?.writeText(poolSnippet)}
              >
                Copia riga
              </button>
              <pre className="wit-code-block">
                <code>{poolSnippet}</code>
              </pre>
            </>
          )}
        </section>
      )}
    </div>
  )
}
