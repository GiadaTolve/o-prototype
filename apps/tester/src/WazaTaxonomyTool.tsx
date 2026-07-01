import { useEffect, useState } from 'react'
import './WazaInsertionTool.css'
import { getTesterContributionsApiBase, postTesterFileSnapshot, writeAuthoringFile } from './authoringApi'
import { escapeDoubleQuoted, escapeSingleQuoted } from './authoringSerialize'
import { BRANCH_DESCRIPTIONS, BRANCH_LABELS, type WazaBranch } from './wazaBranches'
import { WAZA_CATEGORIES, WAZA_CONSISTENCIES, WAZA_SUBCATEGORIES } from './wazaTaxonomy'

type BranchRow = { id: string; label: string; description: string }

type SubRow = { id: string; branch: WazaBranch; name: string; description: string }

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function buildWazaBranchesFile(rows: BranchRow[]): string {
  const ids = rows.map((r) => `'${escapeSingleQuoted(r.id)}'`).join(' | ')
  const labels = rows.map((r) => `  ${r.id}: '${escapeSingleQuoted(r.label)}',`).join('\n')
  const descRows = rows.filter((r) => r.description.trim())
  const descBlock =
    descRows.length === 0
      ? 'export const BRANCH_DESCRIPTIONS: Partial<Record<WazaBranch, string>> = {}\n'
      : `export const BRANCH_DESCRIPTIONS: Partial<Record<WazaBranch, string>> = {\n${descRows
          .map((r) => `  ${r.id}: "${escapeDoubleQuoted(r.description)}",`)
          .join('\n')}\n}\n`

  return `/**
 * Rami Waza (le "Vie") — etichette e descrizioni UI.
 * Modificabile dal tester: Idee → Categorie Waza → Salva su disco.
 */

export type WazaBranch = ${ids}

export const BRANCH_LABELS: Record<WazaBranch, string> = {
${labels}
}

${descBlock}`
}

function buildWazaTaxonomyFile(subs: SubRow[]): string {
  const subLines =
    subs.length === 0
      ? ''
      : `\n${subs
          .map(
            (s) =>
              `  { id: '${escapeSingleQuoted(s.id)}', branch: '${s.branch}', name: '${escapeSingleQuoted(s.name)}'` +
              (s.description.trim()
                ? `, description: '${escapeSingleQuoted(s.description.trim())}'`
                : '') +
              ' },',
          )
          .join('\n')}\n`

  return `/**
 * Tassonomia Waza — sottocategorie per ramo.
 * Modificabile dal tester — Salva su disco.
 */

import type { WazaBranch } from './wazaBranches'

export interface WazaSubcategoryDef {
  id: string
  branch: WazaBranch
  name: string
  description?: string
}

export const WAZA_SUBCATEGORIES: WazaSubcategoryDef[] = [${subLines}]
`
}

export default function WazaTaxonomyTool() {
  const apiBase = getTesterContributionsApiBase()
  const [branchRows, setBranchRows] = useState<BranchRow[]>(() =>
    (Object.keys(BRANCH_LABELS) as WazaBranch[]).map((id) => ({
      id,
      label: BRANCH_LABELS[id],
      description: BRANCH_DESCRIPTIONS[id] ?? '',
    })),
  )
  const [subs, setSubs] = useState<SubRow[]>(() =>
    WAZA_SUBCATEGORIES.map((s) => ({
      id: s.id,
      branch: s.branch,
      name: s.name,
      description: s.description ?? '',
    })),
  )

  const [newRamoId, setNewRamoId] = useState('')
  const [newRamoLabel, setNewRamoLabel] = useState('')
  const [subId, setSubId] = useState('')
  const [subBranch, setSubBranch] = useState<WazaBranch>('proiezione')
  const [subName, setSubName] = useState('')
  const [subDesc, setSubDesc] = useState('')
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [saveErr, setSaveErr] = useState<string | null>(null)

  const addBranch = () => {
    const id = slugify(newRamoId || newRamoLabel)
    const label = newRamoLabel.trim()
    if (!id || !label || branchRows.some((r) => r.id === id)) return
    setBranchRows([...branchRows, { id, label, description: '' }])
    setNewRamoId('')
    setNewRamoLabel('')
  }

  const removeBranch = (id: string) => {
    setBranchRows((r) => r.filter((x) => x.id !== id))
    setSubs((s) => s.filter((x) => x.branch !== id))
  }

  useEffect(() => {
    if (branchRows.length === 0) return
    if (!branchRows.some((b) => b.id === subBranch)) {
      setSubBranch(branchRows[0].id as WazaBranch)
    }
  }, [branchRows, subBranch])

  const updateBranchLabel = (id: string, label: string) => {
    setBranchRows((rows) => rows.map((r) => (r.id === id ? { ...r, label } : r)))
  }

  const updateBranchDesc = (id: string, description: string) => {
    setBranchRows((rows) => rows.map((r) => (r.id === id ? { ...r, description } : r)))
  }

  const addSub = () => {
    const id = slugify(subId || subName)
    const name = subName.trim()
    const br = subBranch
    if (!id || !name || subs.some((s) => s.id === id)) return
    setSubs([...subs, { id, branch: br, name, description: subDesc.trim() }])
    setSubId('')
    setSubName('')
    setSubDesc('')
  }

  const removeSub = (id: string) => setSubs((s) => s.filter((x) => x.id !== id))

  const updateSub = (id: string, patch: Partial<Pick<SubRow, 'name' | 'description' | 'branch'>>) => {
    setSubs((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  }

  const saveAll = async () => {
    setSaveMsg(null)
    setSaveErr(null)
    if (branchRows.length === 0) {
      setSaveErr('Serve almeno un ramo Waza.')
      return
    }
    const branchesTs = buildWazaBranchesFile(branchRows)
    const taxonomyTs = buildWazaTaxonomyFile(subs)
    try {
      if (apiBase) {
        await postTesterFileSnapshot('src/wazaBranches.ts', branchesTs)
        await postTesterFileSnapshot('src/wazaTaxonomy.ts', taxonomyTs)
        setSaveMsg(
          'Snapshot wazaBranches.ts e wazaTaxonomy.ts inviati al server (apply-tester-contributions per import in repo).',
        )
      } else {
        await writeAuthoringFile('src/wazaBranches.ts', branchesTs)
        await writeAuthoringFile('src/wazaTaxonomy.ts', taxonomyTs)
        setSaveMsg('Scritti src/wazaBranches.ts e src/wazaTaxonomy.ts.')
      }
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div className="wit animate__animated animate__fadeIn">
      <section className="wit-hero">
        <h2>Categorie e sottocategorie Waza</h2>
        <p>
          I <strong>rami già presenti</strong> si modificano nelle righe sotto (etichetta e descrizione browser). Le{' '}
          <strong>sottocategorie già presenti</strong>: stesso elenco, campi editabili; poi <strong>Salva su disco</strong>.{' '}
          Consistenze e categorie §2.5 del manuale sono in <code className="wit-inline-code">@domain/combat/waza-taxonomy</code> — inseriscile nel testo waza dal <strong>Tool inserimento Waza</strong>.
          {apiBase ? (
            <>
              Con <strong>API contributi</strong> attiva vengono inviati due snapshot (<code className="wit-inline-code">wazaBranches.ts</code>,{' '}
              <code className="wit-inline-code">wazaTaxonomy.ts</code>); in locale serve <code className="wit-inline-code">npm run dev</code> per scrivere i file.
            </>
          ) : (
            <>
              Solo con <code className="wit-inline-code">npm run dev</code> su <code className="wit-inline-code">wazaBranches.ts</code> e{' '}
              <code className="wit-inline-code">wazaTaxonomy.ts</code>.
            </>
          )}
        </p>
      </section>

      <div className="wit-panel">
        <h3 className="wit-panel-title">Rami Waza (slug fisso in lista · etichetta e descrizione modificabili)</h3>
        <p className="wit-hint wit-hint--flush-top">
          Per cambiare lo <strong>slug</strong> di un ramo (id in codice) usa <strong>Rimuovi</strong> e <strong>Aggiungi ramo</strong>, oppure edita il file TS a mano aggiornando anche le waza che usano quel <code className="wit-inline-code">branch</code>.
        </p>
        <div className="wit-row">
          <div className="wit-field">
            <label className="wit-label">Nuovo id slug</label>
            <input className="wit-input" value={newRamoId} onChange={(e) => setNewRamoId(e.target.value)} />
          </div>
          <div className="wit-field">
            <label className="wit-label">Nuova etichetta</label>
            <input className="wit-input" value={newRamoLabel} onChange={(e) => setNewRamoLabel(e.target.value)} />
          </div>
        </div>
        <button type="button" className="wit-btn wit-btn--secondary" onClick={addBranch}>
          Aggiungi ramo
        </button>
        <ul className="wit-taxonomy-list" style={{ marginTop: '1rem' }}>
          {branchRows.map((r) => (
            <li key={r.id} className="wit-taxonomy-row" style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ flex: '1 1 200px' }}>
                <span className="wit-taxonomy-meta">{r.id}</span>
                <input
                  className="wit-input"
                  style={{ marginTop: '0.35rem' }}
                  value={r.label}
                  onChange={(e) => updateBranchLabel(r.id, e.target.value)}
                  aria-label={`Etichetta ${r.id}`}
                />
                <textarea
                  className="wit-textarea"
                  style={{ marginTop: '0.35rem', minHeight: '4rem', fontSize: '0.82rem' }}
                  value={r.description}
                  onChange={(e) => updateBranchDesc(r.id, e.target.value)}
                  placeholder="Descrizione (opz.) nel browser filtro ramo…"
                />
              </div>
              <button
                type="button"
                className="wit-btn wit-btn--small wit-btn--secondary"
                onClick={() => removeBranch(r.id)}
              >
                Rimuovi
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="wit-panel">
        <h3 className="wit-panel-title">Sottocategoria Waza</h3>
        <div className="wit-row">
          <div className="wit-field">
            <label className="wit-label">Ramo</label>
            <select
              className="wit-select"
              value={subBranch}
              onChange={(e) => setSubBranch(e.target.value as WazaBranch)}
              disabled={branchRows.length === 0}
            >
              {branchRows.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="wit-field">
            <label className="wit-label">Id slug</label>
            <input className="wit-input" value={subId} onChange={(e) => setSubId(e.target.value)} />
          </div>
        </div>
        <div className="wit-field">
          <label className="wit-label">Nome</label>
          <input className="wit-input" value={subName} onChange={(e) => setSubName(e.target.value)} />
        </div>
        <div className="wit-field">
          <label className="wit-label">Nota</label>
          <input className="wit-input" value={subDesc} onChange={(e) => setSubDesc(e.target.value)} />
        </div>
        <button type="button" className="wit-btn" onClick={addSub} disabled={branchRows.length === 0}>
          Aggiungi sottocategoria
        </button>
      </div>

      {subs.length > 0 && (
        <div className="wit-panel">
          <h3 className="wit-panel-title">Sottocategorie (modificabili)</h3>
          <p className="wit-hint wit-hint--flush-top">
            Come per i rami, lo <strong>id</strong> slug della sottocategoria non si rinomina qui: rimuovi e aggiungi, o edita <code className="wit-inline-code">wazaTaxonomy.ts</code>.
          </p>
          <ul className="wit-taxonomy-list">
            {subs.map((s) => (
              <li key={s.id} className="wit-taxonomy-row" style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ flex: '1 1 300px' }}>
                  <span className="wit-taxonomy-meta">id: {s.id}</span>
                  <div className="wit-field" style={{ marginTop: '0.5rem' }}>
                    <label className="wit-label">Ramo</label>
                    <select
                      className="wit-select"
                      value={s.branch}
                      onChange={(e) => updateSub(s.id, { branch: e.target.value as WazaBranch })}
                    >
                      {branchRows.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="wit-field">
                    <label className="wit-label">Nome</label>
                    <input className="wit-input" value={s.name} onChange={(e) => updateSub(s.id, { name: e.target.value })} />
                  </div>
                  <div className="wit-field">
                    <label className="wit-label">Nota</label>
                    <input
                      className="wit-input"
                      value={s.description}
                      onChange={(e) => updateSub(s.id, { description: e.target.value })}
                    />
                  </div>
                </div>
                <button type="button" className="wit-btn wit-btn--small wit-btn--secondary" onClick={() => removeSub(s.id)}>
                  Rimuovi
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="wit-panel">
        <h3 className="wit-panel-title">Consistenze e categorie §2.5 (manuale · domain)</h3>
        <p className="wit-hint wit-hint--flush-top">
          Elenco di riferimento allineato a <code className="wit-inline-code">Oyasumi_Manuale_Completo.pdf</code>.
          Per inserirli nel testo waza usa i chip nel <strong>Tool inserimento Waza</strong>.
        </p>
        <div className="wit-field">
          <span className="wit-label">Consistenze</span>
          <ul className="wit-taxonomy-ref-list">
            {WAZA_CONSISTENCIES.filter((c) => c.implemented).map((c) => (
              <li key={c.id}>
                <code className="wit-inline-code">[{c.tag}]</code> — {c.description}
              </li>
            ))}
          </ul>
        </div>
        <div className="wit-field">
          <span className="wit-label">Categorie</span>
          <ul className="wit-taxonomy-ref-list">
            {WAZA_CATEGORIES.filter((c) => c.implemented).map((c) => (
              <li key={c.id}>
                <code className="wit-inline-code">[{c.tag}]</code> — {c.description}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="wit-actions">
        <button type="button" className="wit-btn wit-btn--secondary" onClick={saveAll}>
          Salva su disco (wazaBranches + wazaTaxonomy)
        </button>
      </div>
      {saveMsg && <p className="wit-hint">{saveMsg}</p>}
      {saveErr && <p className="wit-hint" style={{ color: 'var(--accent-violet, #c084fc)' }}>{saveErr}</p>}
    </div>
  )
}
