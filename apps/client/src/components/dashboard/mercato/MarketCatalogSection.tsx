'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from '@/components/ui/Toast'
import { marketApi } from '@/lib/market-api'
import { MARKET_CATEGORIES, MARKET_CATEGORY_LABELS, type MarketCategory } from '@domain/economy/market-catalog'
import { MercatoEmpty } from './mercato-ui'
import type { MarketCatalogItem } from './mercato-types'

const PLACEHOLDER_ICON = '/dark-fantasy-ui/icon-placeholder.svg'

type Props = {
  onCharUpdate?: () => void
}

function MarketItemCard({ item, onBuy, busy }: { item: MarketCatalogItem; onBuy: () => void; busy: boolean }) {
  return (
    <div className="flex gap-3 p-3 rounded-lg border border-[var(--border-color)] bg-black/25">
      <img
        src={item.iconUrl || PLACEHOLDER_ICON}
        alt={item.name}
        width={100}
        height={100}
        className="w-[100px] h-[100px] shrink-0 rounded border border-white/10 bg-black/40 object-cover p-2"
        onError={(e) => {
          (e.target as HTMLImageElement).src = PLACEHOLDER_ICON
        }}
      />
      <div className="min-w-0 flex-1 flex flex-col gap-1.5">
        <div>
          <p className="font-display text-sm text-white">{item.name}</p>
          {item.nameRomaji && (
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{item.nameRomaji}</p>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-gray-400 leading-relaxed">{item.description}</p>
        )}
        {(item.integrityMax != null || item.effectText) && (
          <p className="text-[11px] text-[var(--accent-violet-light)]/90">
            {item.integrityMax != null && <span>Integrità {item.integrityMax}</span>}
            {item.integrityMax != null && item.effectText && <span className="mx-1.5 opacity-50">|</span>}
            {item.effectText && <span>{item.effectText}</span>}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="text-sm text-[var(--accent-gold)] font-display tabular-nums">
            {item.priceRem ?? '—'} Rem
          </span>
          <button
            type="button"
            onClick={onBuy}
            disabled={busy || item.priceRem == null}
            className="px-3 py-1.5 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-[10px] uppercase tracking-wider hover:bg-[var(--accent-gold)]/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Compra
          </button>
        </div>
      </div>
    </div>
  )
}

export function MarketCatalogSection({ onCharUpdate }: Props) {
  const [items, setItems] = useState<MarketCatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await marketApi.getCatalog()
      setItems(Array.isArray(data.items) ? data.items : [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Errore caricamento catalogo')
    }
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  const byCategory = useMemo(() => {
    const grouped = new Map<MarketCategory, MarketCatalogItem[]>()
    for (const cat of MARKET_CATEGORIES) grouped.set(cat, [])
    for (const item of items) {
      grouped.get(item.marketCategory)?.push(item)
    }
    return grouped
  }, [items])

  const handleBuy = async (item: MarketCatalogItem) => {
    setBusyId(item.id)
    try {
      await marketApi.buyFromCatalog(item.id)
      toast.success(`Acquistato ${item.name}.`)
      onCharUpdate?.()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Acquisto fallito')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Caricamento catalogo…</p>
  }

  const hasAnyItem = items.length > 0

  return (
    <div className="space-y-5">
      {error && (
        <p className="text-sm text-red-400 border border-red-900/50 bg-red-950/30 rounded px-3 py-2">{error}</p>
      )}

      {!hasAnyItem ? (
        <MercatoEmpty>Il catalogo è vuoto — lo staff può aggiungere oggetti dal pannello Sviluppo.</MercatoEmpty>
      ) : (
        MARKET_CATEGORIES.map((cat) => {
          const catItems = byCategory.get(cat) ?? []
          if (catItems.length === 0) return null
          return (
            <div key={cat}>
              <h3 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] font-display mb-2">
                {MARKET_CATEGORY_LABELS[cat]} ({catItems.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {catItems.map((item) => (
                  <MarketItemCard
                    key={item.id}
                    item={item}
                    busy={busyId === item.id}
                    onBuy={() => handleBuy(item)}
                  />
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
