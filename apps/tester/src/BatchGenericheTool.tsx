import { useMemo, useState } from 'react'
import {
  appendOyasumiPoolEntry,
  canPersistAuthoringToPool,
  replaceOyasumiPoolEntry,
} from './authoringApi'
import { useRuntimeWaza } from './RuntimeWazaContext'

type BatchGenericaRow = {
  id: string
  name: string
  description: string
  effect?: string
  costCs?: number
  costJigo?: number
  manualTier?: 1 | 2 | 3 | 4 | 5
  hasVelocity?: boolean
  hasDamage?: boolean
  dbw?: number
}

const SAMPLE_JSON = `[
  {
    "id": "onda-sincrona",
    "name": "Onda Sincrona",
    "description": "Emissione ritmica che disturba la concentrazione avversaria.",
    "effect": "[Status] Vertigini leggere al bersaglio per 1 turno.",
    "costCs": 2,
    "costJigo": 1,
    "manualTier": 2,
    "hasDamage": false,
    "hasVelocity": true
  },
  {
    "id": "fendente-eco",
    "name": "Fendente Eco",
    "description": "Taglio energetico con ritorno di risonanza.",
    "costCs": 3,
    "costJigo": 2,
    "manualTier": 3,
    "hasDamage": true,
    "dbw": 6
  }
]`

function escapeForPoolString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
}

function buildWazaEntry(row: BatchGenericaRow): string {
  const description = escapeForPoolString(row.description.trim())
  const effect = row.effect?.trim() ? `    effect: "${escapeForPoolString(row.effect.trim())}",\n` : ''
  const costCs = Math.max(0, Number(row.costCs ?? 0) || 0)
  const costJigo = Math.max(0, Number(row.costJigo ?? 0) || 0)
  const manualTier = row.manualTier ? `    manualTier: ${row.manualTier},\n` : ''
  const hasVelocity = Boolean(row.hasVelocity)
  const hasDamage = Boolean(row.hasDamage)
  const dbw = hasDamage ? Math.max(0, Number(row.dbw ?? 0) || 0) : 0

  return `  // Waza (batch): ${row.name.replace(/\n/g, ' ')}
  {
    id: '${row.id.replace(/'/g, "\\'")}',
    name: '${row.name.replace(/'/g, "\\'")}',
    type: 'active',
    branch: 'generiche',
    description: "${description}",
${effect}    costJigoTipo: 'fisso',
    costJigo: () => ${costJigo},
    costCs: ${costCs},
${manualTier}    velBonus: 0,
    dbw: ${dbw},
    hasVelocity: ${hasVelocity},
    hasDamage: ${hasDamage},
  },`
}

export default function BatchGenericheTool() {
  const { pool } = useRuntimeWaza()
  const [jsonText, setJsonText] = useState(SAMPLE_JSON)
  const [replaceExisting, setReplaceExisting] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const persist = canPersistAuthoringToPool()
  const existingIds = useMemo(() => new Set((pool ?? []).map((w) => String(w.id))), [pool])

  const parsed = useMemo(() => {
    try {
      const raw = JSON.parse(jsonText) as unknown
      if (!Array.isArray(raw)) return { rows: [] as BatchGenericaRow[], parseError: 'Il JSON deve essere un array.' }
      const rows = raw as BatchGenericaRow[]
      for (const [i, r] of rows.entries()) {
        if (!r || typeof r !== 'object') throw new Error(`Riga ${i + 1}: oggetto non valido.`)
        if (!String(r.id ?? '').trim()) throw new Error(`Riga ${i + 1}: id obbligatorio.`)
        if (!String(r.name ?? '').trim()) throw new Error(`Riga ${i + 1}: name obbligatorio.`)
        if (!String(r.description ?? '').trim()) throw new Error(`Riga ${i + 1}: description obbligatoria.`)
      }
      return { rows, parseError: null as string | null }
    } catch (e) {
      return { rows: [] as BatchGenericaRow[], parseError: e instanceof Error ? e.message : String(e) }
    }
  }, [jsonText])

  const summary = useMemo(() => {
    const ids = parsed.rows.map((r) => String(r.id).trim())
    const dup = ids.filter((id, idx) => ids.indexOf(id) !== idx)
    const existing = ids.filter((id) => existingIds.has(id))
    const create = ids.filter((id) => !existingIds.has(id))
    return {
      duplicates: [...new Set(dup)],
      existing,
      create,
    }
  }, [parsed.rows, existingIds])

  const runBatch = async () => {
    setMsg(null)
    setErr(null)
    if (!persist) {
      setErr('Salvataggio non disponibile in questo ambiente.')
      return
    }
    if (parsed.parseError) {
      setErr(parsed.parseError)
      return
    }
    if (parsed.rows.length === 0) {
      setErr('Inserisci almeno una voce.')
      return
    }
    if (summary.duplicates.length > 0) {
      setErr(`ID duplicati nel batch: ${summary.duplicates.join(', ')}`)
      return
    }

    setBusy(true)
    try {
      let created = 0
      let replaced = 0
      for (const row of parsed.rows) {
        const id = String(row.id).trim()
        const entry = buildWazaEntry({
          ...row,
          id,
          name: String(row.name).trim(),
          description: String(row.description).trim(),
        })
        const exists = existingIds.has(id)
        if (exists && replaceExisting) {
          await replaceOyasumiPoolEntry('waza', entry, id)
          replaced++
        } else if (!exists) {
          await appendOyasumiPoolEntry('waza', entry)
          created++
        }
      }
      setMsg(`Batch completato: ${created} create, ${replaced} aggiornate.`)
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="idee-accessori-page animate__animated animate__fadeIn">
      <header className="idee-accessori-page-head">
        <h2 className="idee-accessori-page-title">Batch generiche avanzate</h2>
        <p className="idee-accessori-page-lead">
          Importa piu Waza generiche in un colpo unico da JSON (create + replace opzionale per ID esistente).
        </p>
      </header>

      <label className="idee-accessori-label" htmlFor="batch-generiche-json">
        JSON array
      </label>
      <textarea
        id="batch-generiche-json"
        className="idee-accessori-textarea"
        rows={18}
        value={jsonText}
        onChange={(e) => {
          setJsonText(e.target.value)
          setErr(null)
          setMsg(null)
        }}
      />

      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
        <input
          type="checkbox"
          checked={replaceExisting}
          onChange={(e) => setReplaceExisting(e.target.checked)}
        />
        <span style={{ fontSize: '0.9rem' }}>Aggiorna le Waza gia presenti (stesso ID)</span>
      </label>

      <p className="idee-accessori-hint" style={{ marginTop: '0.75rem' }}>
        Preview: {parsed.rows.length} righe · nuove {summary.create.length} · esistenti {summary.existing.length}
      </p>
      {parsed.parseError ? (
        <p className="idee-accessori-feedback idee-accessori-feedback--err">{parsed.parseError}</p>
      ) : null}
      {summary.duplicates.length > 0 ? (
        <p className="idee-accessori-feedback idee-accessori-feedback--err">
          ID duplicati nel batch: {summary.duplicates.join(', ')}
        </p>
      ) : null}
      {msg ? <p className="idee-accessori-feedback idee-accessori-feedback--ok">{msg}</p> : null}
      {err ? <p className="idee-accessori-feedback idee-accessori-feedback--err">{err}</p> : null}

      <button
        type="button"
        className="idee-accessori-submit idee-accessori-submit--active"
        onClick={runBatch}
        disabled={busy || !persist || Boolean(parsed.parseError)}
        style={{ marginTop: '0.75rem' }}
      >
        {busy ? 'Import batch…' : 'Esegui batch'}
      </button>
    </section>
  )
}
