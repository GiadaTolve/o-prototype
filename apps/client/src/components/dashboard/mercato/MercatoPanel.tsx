'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { marketApi } from '@/lib/market-api'
import { resolveBancoBuyPrice, PIAZZA_COMMISSION_RATE, PIAZZA_MAX_ACTIVE_LISTINGS } from '@domain/economy/market'
import type { ItemCategory } from '@domain/economy/types'
import type { CharacterSummary } from '../types'
import { HousingMarketSection } from './HousingMarketSection'
import type {
  BancoCatalogResponse,
  MarketListing,
  MercatoInventoryResponse,
  MercatoInventoryRow,
  TradeFeedEntry,
} from './mercato-types'

const CATEGORY_LABELS: Record<string, string> = {
  junk: 'Junk',
  materiale: 'Materiale',
  consumabile: 'Consumabile',
  equipaggiamento: 'Equipaggiamento',
  costrutto_materiale: 'Costrutto',
  oggetto_trama: 'Trama',
}

type MercatoTab = 'banco' | 'piazza' | 'immobiliare'

type Props = {
  char?: CharacterSummary
  onCharUpdate?: () => void
}

function formatCategory(category: string): string {
  return CATEGORY_LABELS[category] ?? category
}

function bancoSellPrice(row: MercatoInventoryRow): number | null {
  return resolveBancoBuyPrice({
    category: row.economy.category as ItemCategory,
    materialId: row.economy.materialId,
    origin: row.economy.origin as 'craftato' | 'droppato' | 'comprato' | null,
    isBroken: row.economy.isBroken,
  })
}

export function MercatoPanel({ char, onCharUpdate }: Props) {
  const [tab, setTab] = useState<MercatoTab>('banco')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [catalog, setCatalog] = useState<BancoCatalogResponse | null>(null)
  const [inventory, setInventory] = useState<MercatoInventoryRow[]>([])
  const [marketListed, setMarketListed] = useState(0)
  const [listings, setListings] = useState<MarketListing[]>([])
  const [myListings, setMyListings] = useState<MarketListing[]>([])
  const [feed, setFeed] = useState<TradeFeedEntry[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [buyQty, setBuyQty] = useState<Record<string, number>>({})
  const [listingPrice, setListingPrice] = useState<Record<string, number>>({})

  const loadAll = useCallback(async () => {
    setError(null)
    try {
      const [cat, invData, piazzaList, mine, feedData] = await Promise.all([
        marketApi.getBancoCatalog(),
        api.get('/inventory/me') as Promise<MercatoInventoryResponse>,
        marketApi.listPiazza(),
        marketApi.myListings(),
        marketApi.getFeed(),
      ])
      setCatalog(cat)
      setInventory(Array.isArray(invData?.items) ? invData.items : [])
      setMarketListed(invData?.slots?.marketListed ?? 0)
      setListings(piazzaList.listings.filter((l) => l.status === 'active'))
      setMyListings(mine.listings.filter((l) => l.status === 'active'))
      setFeed(feedData.feed)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Errore caricamento mercato')
    }
  }, [])

  useEffect(() => {
    loadAll().finally(() => setLoading(false))
  }, [loadAll])

  const sellableToBanco = useMemo(
    () =>
      inventory.filter(
        (row) =>
          row.location === 'CARRY' &&
          !row.isEquipped &&
          row.economy.isMarketable &&
          !row.economy.isBroken &&
          bancoSellPrice(row) != null,
      ),
    [inventory],
  )

  const listableItems = useMemo(
    () =>
      inventory.filter(
        (row) =>
          row.location === 'CARRY' &&
          !row.isEquipped &&
          row.economy.isMarketable &&
          !row.economy.isBroken,
      ),
    [inventory],
  )

  const activeMyCount = myListings.length
  const canCreateListing = activeMyCount < PIAZZA_MAX_ACTIVE_LISTINGS

  const handleBancoSell = async (inventoryId: string) => {
    setBusyId(inventoryId)
    try {
      const result = await marketApi.sellToBanco(inventoryId)
      onCharUpdate?.()
      await loadAll()
      alert(`Venduto: ${result.itemName} ×${result.quantity} per ${result.totalRem} Rem`)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Vendita fallita')
    } finally {
      setBusyId(null)
    }
  }

  const handleBancoBuy = async (catalogKey: string, name: string) => {
    const qty = buyQty[catalogKey] ?? 1
    if (!Number.isFinite(qty) || qty < 1) {
      alert('Quantità non valida')
      return
    }
    setBusyId(catalogKey)
    try {
      const result = await marketApi.buyFromBanco(catalogKey, qty)
      onCharUpdate?.()
      await loadAll()
      alert(`Acquistato: ${result.itemName} ×${result.quantity} (−${result.totalRem} Rem)`)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Acquisto fallito')
    } finally {
      setBusyId(null)
    }
  }

  const handleCreateListing = async (inventoryId: string) => {
    const price = listingPrice[inventoryId]
    if (!price || price < 1) {
      alert('Inserisci un prezzo valido (min 1 Rem)')
      return
    }
    if (!canCreateListing) {
      alert(`Massimo ${PIAZZA_MAX_ACTIVE_LISTINGS} inserzioni attive`)
      return
    }
    setBusyId(inventoryId)
    try {
      await marketApi.createListing(inventoryId, price)
      onCharUpdate?.()
      await loadAll()
      setListingPrice((p) => {
        const next = { ...p }
        delete next[inventoryId]
        return next
      })
      alert('Inserzione pubblicata sulla Piazza')
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Inserzione fallita')
    } finally {
      setBusyId(null)
    }
  }

  const handleCancelListing = async (listingId: string) => {
    if (!confirm('Annullare questa inserzione?')) return
    setBusyId(listingId)
    try {
      await marketApi.cancelListing(listingId)
      await loadAll()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Annullamento fallito')
    } finally {
      setBusyId(null)
    }
  }

  const handleBuyListing = async (listingId: string, itemName: string, priceRem: number) => {
    if (!confirm(`Acquistare ${itemName} per ${priceRem} Rem?`)) return
    setBusyId(listingId)
    try {
      const result = await marketApi.buyListing(listingId)
      onCharUpdate?.()
      await loadAll()
      alert(result.message)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Acquisto fallito')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500 animate__animated animate__fadeIn motion-reduce:animate-none">Caricamento…</p>
  }

  const tabs: { id: MercatoTab; label: string }[] = [
    { id: 'banco', label: 'Il Banco' },
    { id: 'piazza', label: 'La Piazza' },
    { id: 'immobiliare', label: 'Immobiliare' },
  ]

  return (
    <div className="space-y-4 animate__animated animate__fadeIn motion-reduce:animate-none">
      {error && (
        <p className="text-sm text-red-400 border border-red-900/50 bg-red-950/30 rounded px-3 py-2">{error}</p>
      )}

      <div className="flex gap-1 border-b border-[var(--border-color)]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-[10px] uppercase tracking-wider font-display border-b-2 transition-colors ${
              tab === t.id
                ? 'text-[var(--accent-gold)] border-[var(--accent-gold)]'
                : 'text-gray-500 border-transparent hover:text-gray-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'banco' && catalog && (
        <div className="space-y-5">
          <section>
            <h4 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-2 font-display">
              Vendi al Banco
            </h4>
            {sellableToBanco.length === 0 ? (
              <p className="text-sm text-gray-500">Nessun oggetto vendibile nello zaino.</p>
            ) : (
              <div className="space-y-2">
                {sellableToBanco.map((row) => {
                  const unit = bancoSellPrice(row)!
                  const total = unit * row.quantity
                  return (
                    <div
                      key={row.id}
                      className="flex flex-wrap items-center gap-2 justify-between py-2 px-3 rounded border border-[var(--border-color)] bg-black/20"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white truncate">
                          {row.item.name}
                          {row.quantity > 1 ? ` ×${row.quantity}` : ''}
                        </p>
                        <p className="text-[10px] text-[var(--accent-violet-light)]">
                          {formatCategory(row.economy.category)}
                          {row.economy.craftedByName ? ` · firma ${row.economy.craftedByName}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-[var(--accent-gold)] font-display tabular-nums">
                          +{total} Rem
                        </span>
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => handleBancoSell(row.id)}
                          className="px-2 py-1 text-[10px] uppercase tracking-wider rounded border border-[var(--accent-gold)]/50 text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/10 disabled:opacity-50"
                        >
                          Vendi
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section>
            <h4 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-2 font-display">
              Compra materiali comuni
            </h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {catalog.buyPrices.map((mat) => (
                <div
                  key={mat.catalogKey}
                  className="flex flex-wrap items-center gap-2 justify-between p-3 rounded border border-[var(--border-color)] bg-black/20"
                >
                  <div>
                    <p className="text-sm text-white">{mat.name}</p>
                    <p className="text-[10px] text-gray-500">{mat.priceRem} Rem / unità</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={buyQty[mat.catalogKey] ?? 1}
                      onChange={(e) =>
                        setBuyQty((p) => ({ ...p, [mat.catalogKey]: parseInt(e.target.value, 10) || 1 }))
                      }
                      className="w-12 px-1 py-1 text-center text-xs rounded border border-[var(--border-color)] bg-black/50 text-white"
                    />
                    <button
                      type="button"
                      disabled={busyId === mat.catalogKey}
                      onClick={() => handleBancoBuy(mat.catalogKey, mat.name)}
                      className="px-2 py-1 text-[10px] uppercase tracking-wider rounded border border-[var(--accent-violet)]/50 text-[var(--accent-violet-light)] hover:bg-[var(--accent-violet)]/10 disabled:opacity-50"
                    >
                      Compra
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === 'piazza' && (
        <div className="space-y-5">
          <section className="rounded border border-[var(--border-color)] bg-black/20 p-3">
            <p className="text-[11px] text-[var(--accent-violet-light)]">
              Commissione Piazza: {Math.round(PIAZZA_COMMISSION_RATE * 100)}% · Max {PIAZZA_MAX_ACTIVE_LISTINGS} inserzioni
              {marketListed > 0 ? ` · ${marketListed} oggetto/i in vendita` : ''}
            </p>
          </section>

          <section>
            <h4 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-2 font-display">
              Feed scambi
            </h4>
            {feed.length === 0 ? (
              <p className="text-sm text-gray-500">Nessuno scambio recente.</p>
            ) : (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {feed.map((entry) => (
                  <p key={entry.id} className="text-[11px] text-gray-300 border-l-2 border-[var(--accent-violet)]/40 pl-2 py-0.5">
                    {entry.message}
                  </p>
                ))}
              </div>
            )}
          </section>

          <section>
            <h4 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-2 font-display">
              Inserzioni ({listings.length})
            </h4>
            {listings.length === 0 ? (
              <p className="text-sm text-gray-500">Nessuna inserzione attiva.</p>
            ) : (
              <div className="space-y-2">
                {listings.map((listing) => {
                  const isMine = listing.sellerCharacterId === char?.id
                  return (
                    <div
                      key={listing.id}
                      className="flex flex-wrap items-center gap-2 justify-between py-2 px-3 rounded border border-[var(--border-color)] bg-black/20"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white truncate">
                          {listing.itemName}
                          {listing.quantity > 1 ? ` ×${listing.quantity}` : ''}
                        </p>
                        <p className="text-[10px] text-[var(--accent-violet-light)]">
                          {formatCategory(listing.itemCategory)}
                          {listing.craftedByName ? ` · ${listing.craftedByName}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm text-[var(--accent-gold)] font-display tabular-nums">
                          {listing.priceRem} Rem
                        </span>
                        {!isMine && (
                          <button
                            type="button"
                            disabled={busyId === listing.id}
                            onClick={() => handleBuyListing(listing.id, listing.itemName, listing.priceRem)}
                            className="px-2 py-1 text-[10px] uppercase tracking-wider rounded border border-[var(--accent-gold)]/50 text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/10 disabled:opacity-50"
                          >
                            Compra
                          </button>
                        )}
                        {isMine && (
                          <button
                            type="button"
                            disabled={busyId === listing.id}
                            onClick={() => handleCancelListing(listing.id)}
                            className="px-2 py-1 text-[10px] uppercase tracking-wider rounded border border-red-900/50 text-red-400 hover:bg-red-950/30 disabled:opacity-50"
                          >
                            Rimuovi
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section>
            <h4 className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-2 font-display">
              Le tue inserzioni ({activeMyCount}/{PIAZZA_MAX_ACTIVE_LISTINGS})
            </h4>
            {myListings.length === 0 ? (
              <p className="text-sm text-gray-500 mb-3">Nessuna inserzione attiva.</p>
            ) : (
              <div className="space-y-2 mb-4">
                {myListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="flex items-center justify-between py-2 px-3 rounded border border-[var(--accent-gold)]/30 bg-[var(--accent-gold)]/5"
                  >
                    <span className="text-sm text-white truncate">{listing.itemName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--accent-gold)] font-display">{listing.priceRem} Rem</span>
                      <button
                        type="button"
                        disabled={busyId === listing.id}
                        onClick={() => handleCancelListing(listing.id)}
                        className="text-[10px] uppercase text-red-400 hover:text-red-300"
                      >
                        Annulla
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h4 className="text-[10px] uppercase tracking-widest text-[var(--accent-violet-light)] mb-2 font-display">
              Pubblica inserzione
            </h4>
            {!canCreateListing ? (
              <p className="text-sm text-gray-500">Hai raggiunto il limite di inserzioni attive.</p>
            ) : listableItems.length === 0 ? (
              <p className="text-sm text-gray-500">Nessun oggetto disponibile nello zaino.</p>
            ) : (
              <div className="space-y-2">
                {listableItems.map((row) => (
                  <div
                    key={row.id}
                    className="flex flex-wrap items-center gap-2 justify-between py-2 px-3 rounded border border-[var(--border-color)]/60 bg-black/15"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white truncate">{row.item.name}</p>
                      <p className="text-[10px] text-gray-500">{formatCategory(row.economy.category)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        placeholder="Rem"
                        value={listingPrice[row.id] ?? ''}
                        onChange={(e) =>
                          setListingPrice((p) => ({ ...p, [row.id]: parseInt(e.target.value, 10) || 0 }))
                        }
                        className="w-16 px-1 py-1 text-center text-xs rounded border border-[var(--border-color)] bg-black/50 text-white"
                      />
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => handleCreateListing(row.id)}
                        className="px-2 py-1 text-[10px] uppercase tracking-wider rounded border border-[var(--accent-violet)]/50 text-[var(--accent-violet-light)] hover:bg-[var(--accent-violet)]/10 disabled:opacity-50"
                      >
                        Pubblica
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {tab === 'immobiliare' && (
        <HousingMarketSection char={char} onCharUpdate={onCharUpdate} />
      )}
    </div>
  )
}
