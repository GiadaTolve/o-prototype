import { useEffect, useRef, useState } from 'react'
import './WazaInsertionTool.css'
import {
  getTesterContributionsApiBase,
  postSkiruCategoriesSnapshot,
} from './authoringApi'
import { useRuntimeSkiru } from './RuntimeSkiruContext'
import { SKIRU_CATEGORY_LABELS, SKIRU_CATEGORY_ORDER } from './skiruCategories'
import { CANONICAL_SKIRU_CATALOG_PATH } from './skiruPool'
import { escapeSingleQuoted } from './authoringSerialize'

type Row = { id: string; label: string }

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function buildSkiruCategoriesFile(rows: Row[]): string {
  const ids = rows.map((r) => `'${r.id.replace(/'/g, "\\'")}'`).join(' | ')
  const labels = rows.map((r) => `  ${r.id}: '${escapeSingleQuoted(r.label)}',`).join('\n')
  const order = rows.map((r) => `'${escapeSingleQuoted(r.id)}'`).join(', ')

  return `/**
 * Categorie Skiru — modificabile dal tester: Idee → Categorie Skiru → Salva su disco.
 */

export type SkiruCategory = ${ids}

export const SKIRU_CATEGORY_LABELS: Record<SkiruCategory, string> = {
${labels}
}

/** Ordine schede nel browser Skiru */
export const SKIRU_CATEGORY_ORDER: SkiruCategory[] = [${order}]
`
}

export default function SkiruCategoryTool() {
  const apiBase = getTesterContributionsApiBase()
  const { categoryOrder, categoryLabels, refetch, loading, hasRemoteCategories } = useRuntimeSkiru()
  const seededFromRuntimeRef = useRef(false)

  const [rows, setRows] = useState<Row[]>(() =>
    SKIRU_CATEGORY_ORDER.map((id) => ({
      id,
      label: SKIRU_CATEGORY_LABELS[id],
    })),
  )
  const [draftId, setDraftId] = useState('')
  const [draftLabel, setDraftLabel] = useState('')
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [saveErr, setSaveErr] = useState<string | null>(null)

  useEffect(() => {
    if (!apiBase || loading) return
    if (!hasRemoteCategories || seededFromRuntimeRef.current) return
    seededFromRuntimeRef.current = true
    setRows(categoryOrder.map((id) => ({ id, label: categoryLabels[id] ?? id })))
  }, [apiBase, loading, hasRemoteCategories, categoryOrder, categoryLabels])

  const addRow = () => {
    const id = slugify(draftId || draftLabel)
    const label = draftLabel.trim()
    if (!id || !label) return
    if (rows.some((r) => r.id === id)) return
    setRows((r) => [...r, { id, label }])
    setDraftId('')
    setDraftLabel('')
  }

  const removeRow = (id: string) => setRows((r) => r.filter((x) => x.id !== id))

  const updateLabel = (id: string, label: string) => {
    setRows((rs) => rs.map((x) => (x.id === id ? { ...x, label } : x)))
  }

  const saveToDisk = async () => {
    setSaveMsg(null)
    setSaveErr(null)
    if (!apiBase) {
      setSaveErr(`Rami read-only in locale. Modifica SKIRU_BRANCHES in ${CANONICAL_SKIRU_CATALOG_PATH}.`)
      return
    }
    if (rows.length === 0) {
      setSaveErr('Serve almeno una categoria.')
      return
    }
    try {
      const content = buildSkiruCategoriesFile(rows)
      const order = rows.map((r) => r.id)
      const labels = Object.fromEntries(rows.map((r) => [r.id, r.label]))
      await postSkiruCategoriesSnapshot(content, order, labels)
      await refetch()
      setSaveMsg('Snapshot categorie inviato al server. Browser Skiru e inserimento usano i dati runtime.')
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div className="wit animate__animated animate__fadeIn">
      <section className="wit-hero">
        <h2>Categorie Skiru</h2>
        <p>
          Rami Skiru allineati al domain (<code className="wit-inline-code">{CANONICAL_SKIRU_CATALOG_PATH}</code>).
          In locale le categorie sono <strong>read-only</strong>; con API contributi attiva puoi inviare snapshot runtime.
          Il pool abilità è in <code className="wit-inline-code">SKIRU_CATALOG</code> nello stesso file domain.
        </p>
      </section>

      <div className="wit-panel">
        <h3 className="wit-panel-title">Nuova categoria</h3>
        <div className="wit-field">
          <label className="wit-label" htmlFor="skcat-id">Id slug</label>
          <input
            id="skcat-id"
            type="text"
            className="wit-input"
            value={draftId}
            onChange={(e) => setDraftId(e.target.value)}
            placeholder="es. sociali"
          />
        </div>
        <div className="wit-field">
          <label className="wit-label" htmlFor="skcat-label">Etichetta</label>
          <input
            id="skcat-label"
            type="text"
            className="wit-input"
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            placeholder="es. Sociali"
          />
        </div>
        <div className="wit-actions">
          <button type="button" className="wit-btn" onClick={addRow}>
            Aggiungi categoria
          </button>
        </div>
      </div>

      <div className="wit-panel">
        <h3 className="wit-panel-title">Categorie (ordine = ordinamento in UI)</h3>
        <ul className="wit-taxonomy-list">
          {rows.map((r) => (
            <li key={r.id} className="wit-taxonomy-row" style={{ flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <span className="wit-taxonomy-meta">{r.id}</span>
                <input
                  className="wit-input"
                  style={{ marginTop: '0.35rem' }}
                  value={r.label}
                  onChange={(e) => updateLabel(r.id, e.target.value)}
                  aria-label={`Etichetta ${r.id}`}
                />
              </div>
              <button type="button" className="wit-btn wit-btn--small wit-btn--secondary" onClick={() => removeRow(r.id)}>
                Rimuovi
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="wit-actions">
        <button type="button" className="wit-btn wit-btn--secondary" onClick={saveToDisk} disabled={rows.length === 0}>
          Salva su disco
        </button>
      </div>
      {saveMsg && <p className="wit-hint">{saveMsg}</p>}
      {saveErr && <p className="wit-hint" style={{ color: 'var(--accent-violet, #c084fc)' }}>{saveErr}</p>}
    </div>
  )
}
