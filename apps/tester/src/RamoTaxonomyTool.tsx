import { useState } from 'react'
import './WazaInsertionTool.css'
import { getTesterContributionsApiBase, postTesterFileSnapshot, writeAuthoringFile } from './authoringApi'
import { escapeSingleQuoted } from './authoringSerialize'
import {
  MADOSHO_RAMI_IDS,
  MADOSHO_RAMO_LABELS,
  MADOSHO_SUBCATEGORIES,
  type MadoshoRamo,
} from './madoshoTaxonomy'
import {
  PATTI_RAMI_IDS,
  PATTI_RAMO_LABELS,
  PATTI_SUBCATEGORIES,
  type PattiRamo,
} from './pattiTaxonomy'

type Kind = 'madosho' | 'patti'

const CONFIG: Record<Kind, { title: string; file: string }> = {
  madosho: {
    title: 'Madōsho (clan) — rami e sottocategorie',
    file: 'src/madoshoTaxonomy.ts',
  },
  patti: {
    title: 'Patti (premio) — rami e sottocategorie',
    file: 'src/pattiTaxonomy.ts',
  },
}

type RamoRow = { id: string; label: string }
type SubRowM = { id: string; ramo: MadoshoRamo; name: string; description: string }
type SubRowP = { id: string; ramo: PattiRamo; name: string; description: string }

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function buildMadoshoFile(rami: RamoRow[], subs: SubRowM[]): string {
  const ids = rami.map((r) => `'${escapeSingleQuoted(r.id)}'`).join(', ')
  const labels = rami
    .map((r) => `  ${r.id}: '${escapeSingleQuoted(r.label)}',`)
    .join('\n')
  const subLines =
    subs.length === 0
      ? ''
      : `\n${subs
          .map(
            (s) =>
              `  { id: '${escapeSingleQuoted(s.id)}', ramo: '${s.ramo}', name: '${escapeSingleQuoted(s.name)}'` +
              (s.description.trim()
                ? `, description: '${escapeSingleQuoted(s.description.trim())}'`
                : '') +
              ' },',
          )
          .join('\n')}\n`

  return `/**
 * Madōsho (clan) — rami e sottocategorie.
 * Modificabile dal tester: Idee → Tassonomia Madōsho → Salva su disco.
 */

export const MADOSHO_RAMI_IDS = [${ids}] as const

export type MadoshoRamo = (typeof MADOSHO_RAMI_IDS)[number]

export const MADOSHO_RAMO_LABELS: Record<MadoshoRamo, string> = {
${labels}
}

export interface MadoshoSubcategoryDef {
  id: string
  ramo: MadoshoRamo
  name: string
  description?: string
}

export const MADOSHO_SUBCATEGORIES: MadoshoSubcategoryDef[] = [${subLines}]
`
}

function buildPattiFile(rami: RamoRow[], subs: SubRowP[]): string {
  const ids = rami.map((r) => `'${escapeSingleQuoted(r.id)}'`).join(', ')
  const labels = rami
    .map((r) => `  ${r.id}: '${escapeSingleQuoted(r.label)}',`)
    .join('\n')
  const subLines =
    subs.length === 0
      ? ''
      : `\n${subs
          .map(
            (s) =>
              `  { id: '${escapeSingleQuoted(s.id)}', ramo: '${s.ramo}', name: '${escapeSingleQuoted(s.name)}'` +
              (s.description.trim()
                ? `, description: '${escapeSingleQuoted(s.description.trim())}'`
                : '') +
              ' },',
          )
          .join('\n')}\n`

  return `/**
 * Patti (premio) — rami e sottocategorie.
 * Modificabile dal tester: Idee → Tassonomia Patti → Salva su disco.
 */

export const PATTI_RAMI_IDS = [${ids}] as const

export type PattiRamo = (typeof PATTI_RAMI_IDS)[number]

export const PATTI_RAMO_LABELS: Record<PattiRamo, string> = {
${labels}
}

export interface PattiSubcategoryDef {
  id: string
  ramo: PattiRamo
  name: string
  description?: string
}

export const PATTI_SUBCATEGORIES: PattiSubcategoryDef[] = [${subLines}]
`
}

export default function RamoTaxonomyTool({ kind }: { kind: Kind }) {
  const c = CONFIG[kind]
  const apiBase = getTesterContributionsApiBase()
  const [rami, setRami] = useState<RamoRow[]>(() =>
    kind === 'madosho'
      ? (MADOSHO_RAMI_IDS as readonly MadoshoRamo[]).map((id) => ({
          id,
          label: MADOSHO_RAMO_LABELS[id],
        }))
      : (PATTI_RAMI_IDS as readonly PattiRamo[]).map((id) => ({
          id,
          label: PATTI_RAMO_LABELS[id],
        })),
  )
  const [subsM, setSubsM] = useState<SubRowM[]>(() =>
    kind === 'madosho'
      ? MADOSHO_SUBCATEGORIES.map((s) => ({
          id: s.id,
          ramo: s.ramo,
          name: s.name,
          description: s.description ?? '',
        }))
      : [],
  )
  const [subsP, setSubsP] = useState<SubRowP[]>(() =>
    kind === 'patti'
      ? PATTI_SUBCATEGORIES.map((s) => ({
          id: s.id,
          ramo: s.ramo,
          name: s.name,
          description: s.description ?? '',
        }))
      : [],
  )

  const [newRamoId, setNewRamoId] = useState('')
  const [newRamoLabel, setNewRamoLabel] = useState('')
  const [subId, setSubId] = useState('')
  const [subRamo, setSubRamo] = useState('')
  const [subName, setSubName] = useState('')
  const [subDesc, setSubDesc] = useState('')
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [saveErr, setSaveErr] = useState<string | null>(null)

  const firstRamo = rami[0]?.id ?? ''

  const addRamo = () => {
    const id = slugify(newRamoId || newRamoLabel)
    const label = newRamoLabel.trim()
    if (!id || !label || rami.some((r) => r.id === id)) return
    setRami([...rami, { id, label }])
    setNewRamoId('')
    setNewRamoLabel('')
  }

  const removeRamo = (id: string) => {
    setRami((r) => r.filter((x) => x.id !== id))
    if (kind === 'madosho') {
      setSubsM((s) => s.filter((x) => x.ramo !== id))
    } else {
      setSubsP((s) => s.filter((x) => x.ramo !== id))
    }
  }

  const updateRamoLabel = (id: string, label: string) => {
    setRami((rs) => rs.map((r) => (r.id === id ? { ...r, label } : r)))
  }

  const updateSubM = (id: string, patch: Partial<Pick<SubRowM, 'name' | 'description' | 'ramo'>>) => {
    setSubsM((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  }

  const updateSubP = (id: string, patch: Partial<Pick<SubRowP, 'name' | 'description' | 'ramo'>>) => {
    setSubsP((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  }

  const addSub = () => {
    const id = slugify(subId || subName)
    const name = subName.trim()
    const ramoStr = subRamo || firstRamo
    if (!id || !name || !ramoStr) return
    if (kind === 'madosho') {
      const ramo = ramoStr as MadoshoRamo
      if (subsM.some((s) => s.id === id)) return
      setSubsM([...subsM, { id, ramo, name, description: subDesc.trim() }])
    } else {
      const ramo = ramoStr as PattiRamo
      if (subsP.some((s) => s.id === id)) return
      setSubsP([...subsP, { id, ramo, name, description: subDesc.trim() }])
    }
    setSubId('')
    setSubName('')
    setSubDesc('')
  }

  const removeSubM = (id: string) => setSubsM((s) => s.filter((x) => x.id !== id))
  const removeSubP = (id: string) => setSubsP((s) => s.filter((x) => x.id !== id))

  const currentContent = () => {
    if (rami.length === 0) return ''
    if (kind === 'madosho') return buildMadoshoFile(rami, subsM)
    return buildPattiFile(rami, subsP)
  }

  const saveToDisk = async () => {
    setSaveMsg(null)
    setSaveErr(null)
    if (rami.length === 0) {
      setSaveErr('Aggiungi almeno un ramo.')
      return
    }
    const content = currentContent()
    try {
      if (apiBase) {
        await postTesterFileSnapshot(c.file, content)
        setSaveMsg(`Snapshot ${c.file} inviato al server (apply-tester-contributions).`)
      } else {
        await writeAuthoringFile(c.file, content)
        setSaveMsg(`Scritto ${c.file}. HMR dovrebbe aggiornare il modulo automaticamente.`)
      }
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : String(e))
    }
  }

  const subsList = kind === 'madosho' ? subsM : subsP

  return (
    <div className="wit animate__animated animate__fadeIn">
      <section className="wit-hero">
        <h2>{c.title}</h2>
        <p>
          Definisci i <strong>rami</strong> e le <strong>sottocategorie</strong>.{' '}
          <strong>Voci già presenti:</strong> modifica etichetta ramo e campi delle sottocategorie direttamente nelle liste sotto, poi <strong>Salva su disco</strong>.{' '}
          {apiBase ? (
            <>
              Con <strong>API contributi</strong> attiva viene inviato uno snapshot di <code className="wit-inline-code">{c.file}</code>; in locale senza API serve{' '}
              <code className="wit-inline-code">npm run dev</code> per scrivere il file.
            </>
          ) : (
            <>
              Con il dev server (<code className="wit-inline-code">npm run dev</code>) il file <code className="wit-inline-code">{c.file}</code> si aggiorna; in preview/build la scrittura non è disponibile.
            </>
          )}
        </p>
      </section>

      <div className="wit-panel">
        <h3 className="wit-panel-title">Nuovo ramo</h3>
        <div className="wit-row">
          <div className="wit-field">
            <label className="wit-label">Id slug</label>
            <input className="wit-input" value={newRamoId} onChange={(e) => setNewRamoId(e.target.value)} />
          </div>
          <div className="wit-field">
            <label className="wit-label">Etichetta</label>
            <input className="wit-input" value={newRamoLabel} onChange={(e) => setNewRamoLabel(e.target.value)} />
          </div>
        </div>
        <button type="button" className="wit-btn" onClick={addRamo}>
          Aggiungi ramo
        </button>
      </div>

      <div className="wit-panel">
        <h3 className="wit-panel-title">Rami (slug fisso · etichetta modificabile)</h3>
        <p className="wit-hint wit-hint--flush-top">
          L’<strong>id</strong> è lo slug in codice; per rinominarlo occorre rimuovere il ramo (e le sottocategorie collegate) e crearne uno nuovo, oppure editare il file a mano.
        </p>
        <ul className="wit-taxonomy-list">
          {rami.map((r) => (
            <li key={r.id} className="wit-taxonomy-row" style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ flex: '1 1 240px' }}>
                <span className="wit-taxonomy-meta">id: {r.id}</span>
                <label className="wit-label wit-label--block-mt">Etichetta</label>
                <input
                  className="wit-input"
                  value={r.label}
                  onChange={(e) => updateRamoLabel(r.id, e.target.value)}
                  aria-label={`Etichetta ramo ${r.id}`}
                />
              </div>
              <button type="button" className="wit-btn wit-btn--small wit-btn--secondary" onClick={() => removeRamo(r.id)}>
                Rimuovi
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="wit-panel">
        <h3 className="wit-panel-title">Sottocategoria</h3>
        <div className="wit-row">
          <div className="wit-field">
            <label className="wit-label">Ramo</label>
            <select
              className="wit-select"
              value={subRamo || firstRamo}
              onChange={(e) => setSubRamo(e.target.value)}
              disabled={rami.length === 0}
            >
              {rami.map((r) => (
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
        <button type="button" className="wit-btn" onClick={addSub} disabled={rami.length === 0}>
          Aggiungi sottocategoria
        </button>
      </div>

      {subsList.length > 0 && (
        <div className="wit-panel">
          <h3 className="wit-panel-title">Sottocategorie (modificabili)</h3>
          <ul className="wit-taxonomy-list">
            {(kind === 'madosho' ? subsM : subsP).map((s) => (
              <li key={s.id} className="wit-taxonomy-row" style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ flex: '1 1 300px' }}>
                  <span className="wit-taxonomy-meta">id: {s.id}</span>
                  <div className="wit-field" style={{ marginTop: '0.5rem' }}>
                    <label className="wit-label">Ramo</label>
                    <select
                      className="wit-select"
                      value={s.ramo}
                      onChange={(e) =>
                        kind === 'madosho'
                          ? updateSubM(s.id, { ramo: e.target.value as MadoshoRamo })
                          : updateSubP(s.id, { ramo: e.target.value as PattiRamo })
                      }
                    >
                      {rami.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="wit-field">
                    <label className="wit-label">Nome</label>
                    <input
                      className="wit-input"
                      value={s.name}
                      onChange={(e) =>
                        kind === 'madosho' ? updateSubM(s.id, { name: e.target.value }) : updateSubP(s.id, { name: e.target.value })
                      }
                    />
                  </div>
                  <div className="wit-field">
                    <label className="wit-label">Nota</label>
                    <input
                      className="wit-input"
                      value={s.description}
                      onChange={(e) =>
                        kind === 'madosho'
                          ? updateSubM(s.id, { description: e.target.value })
                          : updateSubP(s.id, { description: e.target.value })
                      }
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="wit-btn wit-btn--small wit-btn--secondary"
                  onClick={() => (kind === 'madosho' ? removeSubM(s.id) : removeSubP(s.id))}
                >
                  Rimuovi
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="wit-actions">
        <button type="button" className="wit-btn wit-btn--secondary" onClick={saveToDisk} disabled={rami.length === 0}>
          Salva su disco
        </button>
      </div>
      {saveMsg && <p className="wit-hint">{saveMsg}</p>}
      {saveErr && <p className="wit-hint" style={{ color: 'var(--accent-violet, #c084fc)' }}>{saveErr}</p>}
    </div>
  )
}
