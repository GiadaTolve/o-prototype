/**
 * Browser waza Madoshō — catalogo Parte IV PDF per lignaggio.
 */
import { useMemo, useState } from 'react'
import './WazaBrowser.css'
import { MADOSHO_POOL, type MadoshoDef } from './madoshoPool'
import {
  MADOSHO_RAMI_IDS,
  MADOSHO_RAMO_LABELS,
  type MadoshoRamo,
} from './madoshoTaxonomy'
import { renderBracketTaggedProse } from './wazaBracketProse'

function MadoshoRow({ waza, expanded, onToggle }: {
  waza: MadoshoDef
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <details
      className="wb-bulletin"
      open={expanded}
      onToggle={(e) => {
        if ((e.target as HTMLDetailsElement).open !== expanded) onToggle()
      }}
    >
      <summary>
        <span style={{ color: 'var(--accent-gold)' }}>{waza.name}</span>
        <span style={{ marginLeft: '0.5rem', opacity: 0.7, fontSize: '0.75rem' }}>
          {waza.type === 'passive' ? 'Passiva' : 'Attiva'}
          {waza.costCs > 0 ? ` · CS ${waza.costCs}` : ''}
        </span>
      </summary>
      <div className="wb-bulletin-body">
        {waza.description && (
          <p style={{ margin: '0 0 0.65rem', lineHeight: 1.55, color: 'var(--accent-violet-light)' }}>
            {renderBracketTaggedProse(waza.description)}
          </p>
        )}
        {waza.effect && (
          <p style={{ margin: 0, lineHeight: 1.55 }}>
            {renderBracketTaggedProse(waza.effect)}
          </p>
        )}
        <p style={{ marginTop: '0.65rem', fontSize: '0.72rem', opacity: 0.65 }}>
          id: <code>{waza.id}</code>
        </p>
      </div>
    </details>
  )
}

export default function MadoshoBrowser() {
  const [ramoFilter, setRamoFilter] = useState<MadoshoRamo | 'tutti'>('tutti')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(
    () =>
      ramoFilter === 'tutti'
        ? MADOSHO_POOL
        : MADOSHO_POOL.filter((w) => w.branch === ramoFilter),
    [ramoFilter],
  )

  const grouped = useMemo(
    () =>
      MADOSHO_RAMI_IDS.reduce<Record<MadoshoRamo, MadoshoDef[]>>((acc, ramo) => {
        acc[ramo] = filtered.filter((w) => w.branch === ramo)
        return acc
      }, {} as Record<MadoshoRamo, MadoshoDef[]>),
    [filtered],
  )

  return (
    <div>
      <p style={{ fontSize: '0.85rem', color: 'var(--accent-violet-light)', marginBottom: '1rem', lineHeight: 1.5 }}>
        Catalogo da <code>docs/Oyasumi_Manuale_Completo.pdf</code> · Parte IV.
        Komonoire: elenco waza assente nel manuale.
      </p>

      <section style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', color: 'var(--accent-violet)', marginBottom: '0.75rem' }}>
          Filtra per lignaggio
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button
            type="button"
            className="animate__animated animate__fadeIn"
            onClick={() => setRamoFilter('tutti')}
            style={{
              padding: '0.4rem 0.75rem',
              background: ramoFilter === 'tutti' ? 'rgba(201, 168, 74, 0.2)' : 'var(--button-bg)',
              border: `1px solid ${ramoFilter === 'tutti' ? 'var(--accent-gold)' : 'var(--border-color)'}`,
              borderRadius: 6,
              color: ramoFilter === 'tutti' ? 'var(--accent-gold)' : 'var(--accent-violet-light)',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            Tutti ({MADOSHO_POOL.length})
          </button>
          {MADOSHO_RAMI_IDS.map((ramo) => {
            const count = MADOSHO_POOL.filter((w) => w.branch === ramo).length
            return (
              <button
                key={ramo}
                type="button"
                onClick={() => setRamoFilter(ramo)}
                style={{
                  padding: '0.4rem 0.75rem',
                  background: ramoFilter === ramo ? 'rgba(201, 168, 74, 0.2)' : 'var(--button-bg)',
                  border: `1px solid ${ramoFilter === ramo ? 'var(--accent-gold)' : 'var(--border-color)'}`,
                  borderRadius: 6,
                  color: ramoFilter === ramo ? 'var(--accent-gold)' : 'var(--accent-violet-light)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                {MADOSHO_RAMO_LABELS[ramo]} ({count})
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: '1rem', color: 'var(--accent-violet)', marginBottom: '1rem' }}>
          Waza lignaggio ({filtered.length})
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(ramoFilter === 'tutti' ? MADOSHO_RAMI_IDS : [ramoFilter]).map((ramo) => {
            const list = ramoFilter === 'tutti' ? grouped[ramo] : filtered
            if (list.length === 0) return null
            return (
              <div key={ramo}>
                {ramoFilter === 'tutti' && (
                  <h3
                    style={{
                      fontSize: '0.9rem',
                      color: 'var(--accent-gold)',
                      marginBottom: '0.5rem',
                      paddingBottom: '0.25rem',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    {MADOSHO_RAMO_LABELS[ramo]}
                  </h3>
                )}
                {list.map((w) => (
                  <MadoshoRow
                    key={w.id}
                    waza={w}
                    expanded={expandedId === w.id}
                    onToggle={() => setExpandedId((id) => (id === w.id ? null : w.id))}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
