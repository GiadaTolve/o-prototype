/**
 * Browser Skiru — lista competenze e abilità per categoria.
 */

import { useMemo, useState } from 'react'
import {
  canPersistAuthoringToPool,
  getTesterContributionsApiBase,
  postSkiruPoolSnapshot,
} from './authoringApi'
import { useRuntimeSkiru } from './RuntimeSkiruContext'
import { CANONICAL_SKIRU_CATALOG_PATH, type SkiruDef } from './skiruPool'

export default function SkiruBrowser() {
  const apiBase = getTesterContributionsApiBase()
  const { pool, categoryOrder, categoryLabels, loading, refetch } = useRuntimeSkiru()
  const [removeErr, setRemoveErr] = useState<string | null>(null)

  const displayOrder = useMemo(() => {
    const fromPool = [...new Set(pool.map((s) => s.category))]
    const seen = new Set<string>()
    const out: string[] = []
    for (const c of categoryOrder) {
      if (!seen.has(c)) {
        seen.add(c)
        out.push(c)
      }
    }
    for (const c of fromPool) {
      if (!seen.has(c)) {
        seen.add(c)
        out.push(c)
      }
    }
    return out
  }, [pool, categoryOrder])

  const [categoryFilter, setCategoryFilter] = useState<string | 'tutti'>('tutti')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (categoryFilter === 'tutti') return pool
    return pool.filter((s) => s.category === categoryFilter)
  }, [pool, categoryFilter])

  const grouped = useMemo(() => {
    return displayOrder.reduce<Record<string, SkiruDef[]>>((acc, c) => {
      acc[c] = filtered.filter((s) => s.category === c)
      return acc
    }, {})
  }, [displayOrder, filtered])

  const persist = canPersistAuthoringToPool()

  const handleRemoveSkiru = async (s: SkiruDef) => {
    setRemoveErr(null)
    if (!apiBase) {
      setRemoveErr(`Catalogo read-only in locale. Modifica ${CANONICAL_SKIRU_CATALOG_PATH}.`)
      return
    }
    if (!persist) {
      setRemoveErr('Salvataggio non disponibile: configura VITE_TESTER_API_URL.')
      return
    }
    if (!window.confirm(`Eliminare «${s.name}» (id: ${s.id}) dal pool Skiru?`)) return
    const next = pool.filter((x) => x.id !== s.id)
    try {
      await postSkiruPoolSnapshot(JSON.stringify(next), next)
      await refetch()
    } catch (e) {
      setRemoveErr(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div>
      {removeErr && (
        <p style={{ fontSize: '0.85rem', color: 'var(--accent-violet, #c084fc)', marginBottom: '0.75rem' }} role="alert">
          {removeErr}
        </p>
      )}
      {loading && (
        <p style={{ fontSize: '0.8rem', color: 'var(--accent-violet-light, #c4b5fd)', marginBottom: '1rem' }}>
          Caricamento dati runtime Skiru…
        </p>
      )}
      {!apiBase && (
        <p style={{ fontSize: '0.8rem', color: 'var(--accent-violet-light, #c4b5fd)', marginBottom: '1rem' }}>
          Catalogo read-only ({CANONICAL_SKIRU_CATALOG_PATH}). Modifica il file domain per nuove Skiru.
        </p>
      )}
      <section style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', color: '#a270ff', marginBottom: '0.75rem' }}>
          Filtra per categoria
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setCategoryFilter('tutti')}
            style={{
              padding: '0.4rem 0.75rem',
              background: categoryFilter === 'tutti' ? 'rgba(162,112,255,0.3)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${categoryFilter === 'tutti' ? '#a270ff' : 'rgba(255,255,255,0.2)'}`,
              borderRadius: 6,
              color: categoryFilter === 'tutti' ? '#fff' : '#888',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            Tutti
          </button>
          {displayOrder.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategoryFilter(c)}
              style={{
                padding: '0.4rem 0.75rem',
                background: categoryFilter === c ? 'rgba(162,112,255,0.3)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${categoryFilter === c ? '#a270ff' : 'rgba(255,255,255,0.2)'}`,
                borderRadius: 6,
                color: categoryFilter === c ? '#fff' : '#888',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              {categoryLabels[c] ?? c}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: '1rem', color: '#a270ff', marginBottom: '1rem' }}>
          Skiru ({filtered.length})
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(categoryFilter === 'tutti' ? displayOrder : [categoryFilter]).map((category) => {
            const list =
              categoryFilter === 'tutti' ? (grouped[category] ?? []) : filtered
            if (list.length === 0) return null

            return (
              <div key={category}>
                {categoryFilter === 'tutti' && (
                  <h3
                    style={{
                      fontSize: '0.9rem',
                      color: '#c9a84a',
                      marginBottom: '0.5rem',
                      paddingBottom: '0.25rem',
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {categoryLabels[category] ?? category}
                  </h3>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {list.map((s) => (
                    <SkiruCard
                      key={s.id}
                      skiru={s}
                      categoryLabel={categoryLabels[s.category] ?? s.category}
                      expanded={expandedId === s.id}
                      onToggle={() =>
                        setExpandedId((id) => (id === s.id ? null : s.id))
                      }
                      canRemove={persist}
                      onRemove={() => handleRemoveSkiru(s)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function SkiruCard({
  skiru,
  categoryLabel,
  expanded,
  onToggle,
  canRemove,
  onRemove,
}: {
  skiru: SkiruDef
  categoryLabel: string
  expanded: boolean
  onToggle: () => void
  canRemove: boolean
  onRemove: () => void
}) {
  return (
    <div
      style={{
        padding: '0.75rem 1rem',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.08)',
        cursor: skiru.description ? 'pointer' : 'default',
      }}
      onClick={skiru.description ? onToggle : undefined}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <span style={{ fontWeight: 600, color: '#fff' }}>{skiru.name}</span>
        <span
          style={{
            fontSize: '0.7rem',
            padding: '0.15rem 0.4rem',
            background: 'rgba(162, 112, 255, 0.15)',
            border: '1px solid rgba(162, 112, 255, 0.32)',
            borderRadius: 4,
            color: 'var(--accent-violet-light)',
          }}
        >
          {categoryLabel}
        </span>
        {skiru.description && (
          <span style={{ fontSize: '0.75rem', color: '#666' }}>
            {expanded ? '▼' : '▶'}
          </span>
        )}
        {canRemove && (
          <button
            type="button"
            title="Rimuovi dal pool"
            onClick={(ev) => {
              ev.stopPropagation()
              onRemove()
            }}
            style={{
              marginLeft: 'auto',
              padding: '0.2rem 0.5rem',
              fontSize: '0.72rem',
              cursor: 'pointer',
              background: 'rgba(255,80,80,0.12)',
              border: '1px solid rgba(255,120,120,0.35)',
              borderRadius: 4,
              color: 'var(--accent-violet-light, #ddd)',
            }}
          >
            Elimina
          </button>
        )}
      </div>
      {expanded && skiru.description && (
        <div
          style={{
            marginTop: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            fontSize: '0.85rem',
            color: '#aaa',
            lineHeight: 1.5,
          }}
        >
          {skiru.description}
        </div>
      )}
    </div>
  )
}
