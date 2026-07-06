'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from '@/components/ui/Toast'
import { api } from '@/lib/api'
import { marketApi } from '@/lib/market-api'
import { resolveBancoBuyPrice, PIAZZA_COMMISSION_RATE, PIAZZA_MAX_ACTIVE_LISTINGS } from '@domain/economy/market'
import type { ItemCategory } from '@domain/economy/types'
import type { CharacterSummary } from '../types'
import { HousingMarketSection } from './HousingMarketSection'
import {
  MercatoActionButton,
  MercatoEmpty,
  MercatoNumInput,
  MercatoRow,
  MercatoSection,
  MercatoTabBar,
  type MercatoTabId,
} from './mercato-ui'
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

function itemSubtitle(row: MercatoInventoryRow): string {
  const parts = [formatCategory(row.economy.category)]
  if (row.economy.craftedByName) parts.push(`firma ${row.economy.craftedByName}`)
  return parts.join(' · ')
}

function listingSubtitle(listing: MarketListing): string {
  const parts = [formatCategory(listing.itemCategory)]
  if (listing.craftedByName) parts.push(listing.craftedByName)
  return parts.join(' · ')
}

export function MercatoPanel({ char, onCharUpdate }: Props) {
  const [tab, setTab] = useState<MercatoTabId>('banco')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [catalog, setCatalog] = useState<BancoCatalogResponse | null>(null)
  const [inventory, setInventory] = useState<MercatoInventoryRow[]>([])
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

  const myListedInventoryIds = useMemo(
    () => new Set(myListings.map((l) => l.inventoryId)),
    [myListings],
  )

  const listableItems = useMemo(
    () =>
      inventory.filter(
        (row) =>
          row.location === 'CARRY' &&
          !row.isEquipped &&
          row.economy.isMarketable &&
          !row.economy.isBroken &&
          !myListedInventoryIds.has(row.id),
      ),
    [inventory, myListedInventoryIds],
  )

  const othersListings = useMemo(
    () => listings.filter((l) => l.sellerCharacterId !== char?.id),
    [listings, char?.id],
  )

  const activeMyCount = myListings.length
  const canCreateListing = activeMyCount < PIAZZA_MAX_ACTIVE_LISTINGS
  const commissionPct = Math.round(PIAZZA_COMMISSION_RATE * 100)

  const handleBancoSell = async (inventoryId: string) => {
    setBusyId(inventoryId)
    try {
      await marketApi.sellToBanco(inventoryId)
      onCharUpdate?.()
      await loadAll()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Vendita fallita')
    } finally {
      setBusyId(null)
    }
  }

  const handleBancoBuy = async (catalogKey: string) => {
    const qty = buyQty[catalogKey] ?? 1
    if (!Number.isFinite(qty) || qty < 1) {
      toast.error('Quantità non valida')
      return
    }
    setBusyId(catalogKey)
    try {
      await marketApi.buyFromBanco(catalogKey, qty)
      onCharUpdate?.()
      await loadAll()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Acquisto fallito')
    } finally {
      setBusyId(null)
    }
  }

  const handleCreateListing = async (inventoryId: string) => {
    const price = listingPrice[inventoryId]
    if (!price || price < 1) {
      toast.error('Inserisci un prezzo valido (min 1 Rem)')
      return
    }
    if (!canCreateListing) {
      toast.error(`Massimo ${PIAZZA_MAX_ACTIVE_LISTINGS} inserzioni attive`)
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
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Inserzione fallita')
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
      toast.error(e instanceof Error ? e.message : 'Annullamento fallito')
    } finally {
      setBusyId(null)
    }
  }

  const handleBuyListing = async (listingId: string, itemName: string, priceRem: number) => {
    if (!confirm(`Acquistare ${itemName} per ${priceRem} Rem?`)) return
    setBusyId(listingId)
    try {
      await marketApi.buyListing(listingId)
      onCharUpdate?.()
      await loadAll()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Acquisto fallito')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-gray-500 animate__animated animate__fadeIn motion-reduce:animate-none">
        Caricamento…
      </p>
    )
  }

  return (
    <div className="mercato-panel flex flex-col gap-4 animate__animated animate__fadeIn motion-reduce:animate-none">
      {error && (
        <p className="text-sm text-red-400 border border-red-900/50 bg-red-950/30 rounded px-3 py-2">{error}</p>
      )}

      <MercatoTabBar tab={tab} onTab={setTab} rem={char?.rem} />

      {tab === 'banco' && catalog && (
        <div className="grid gap-4 lg:grid-cols-2">
          <MercatoSection title="Vendi al Banco" hint="Riscatta oggetti dallo zaino a prezzo fisso.">
            {sellableToBanco.length === 0 ? (
              <MercatoEmpty>Nessun oggetto vendibile nello zaino.</MercatoEmpty>
            ) : (
              <div className="space-y-2">
                {sellableToBanco.map((row) => {
                  const unit = bancoSellPrice(row)!
                  const total = unit * row.quantity
                  return (
                    <MercatoRow
                      key={row.id}
                      title={`${row.item.name}${row.quantity > 1 ? ` ×${row.quantity}` : ''}`}
                      subtitle={itemSubtitle(row)}
                      trailing={
                        <span className="text-xs text-[var(--accent-gold)] font-display tabular-nums">
                          +{total} Rem
                        </span>
                      }
                      actions={
                        <MercatoActionButton
                          label="Vendi"
                          disabled={busyId === row.id}
                          onClick={() => handleBancoSell(row.id)}
                        />
                      }
                    />
                  )
                })}
              </div>
            )}
          </MercatoSection>

          <MercatoSection title="Compra materiali" hint="Materiali comuni disponibili al Banco.">
            <div className="space-y-2">
              {catalog.buyPrices.map((mat) => (
                <MercatoRow
                  key={mat.catalogKey}
                  title={mat.name}
                  subtitle={`${mat.priceRem} Rem / unità`}
                  actions={
                    <>
                      <MercatoNumInput
                        value={buyQty[mat.catalogKey] ?? 1}
                        onChange={(n) => setBuyQty((p) => ({ ...p, [mat.catalogKey]: n || 1 }))}
                      />
                      <MercatoActionButton
                        label="Compra"
                        variant="violet"
                        disabled={busyId === mat.catalogKey}
                        onClick={() => handleBancoBuy(mat.catalogKey)}
                      />
                    </>
                  }
                />
              ))}
            </div>
          </MercatoSection>
        </div>
      )}

      {tab === 'piazza' && (
        <div className="space-y-4">
          {feed.length > 0 && (
            <details className="rounded-lg border border-[var(--border-color)]/60 bg-black/20 group">
              <summary className="cursor-pointer list-none px-3 py-2 text-[10px] uppercase tracking-widest text-[var(--accent-violet-light)] font-display flex items-center justify-between">
                <span>Scambi recenti ({feed.length})</span>
                <span className="text-gray-600 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <div className="px-3 pb-3 space-y-1 max-h-28 overflow-y-auto border-t border-[var(--border-color)]/50">
                {feed.map((entry) => (
                  <p
                    key={entry.id}
                    className="text-[11px] text-gray-300 border-l-2 border-[var(--accent-violet)]/40 pl-2 py-0.5"
                  >
                    {entry.message}
                  </p>
                ))}
              </div>
            </details>
          )}

          <MercatoSection
            title={`Acquista (${othersListings.length})`}
            hint="Inserzioni di altri giocatori sulla Piazza."
          >
            {othersListings.length === 0 ? (
              <MercatoEmpty>Nessuna inserzione al momento.</MercatoEmpty>
            ) : (
              <div className="space-y-2">
                {othersListings.map((listing) => (
                  <MercatoRow
                    key={listing.id}
                    title={`${listing.itemName}${listing.quantity > 1 ? ` ×${listing.quantity}` : ''}`}
                    subtitle={listingSubtitle(listing)}
                    trailing={
                      <span className="text-sm text-[var(--accent-gold)] font-display tabular-nums">
                        {listing.priceRem} Rem
                      </span>
                    }
                    actions={
                      <MercatoActionButton
                        label="Compra"
                        disabled={busyId === listing.id}
                        onClick={() => handleBuyListing(listing.id, listing.itemName, listing.priceRem)}
                      />
                    }
                  />
                ))}
              </div>
            )}
          </MercatoSection>

          <MercatoSection
            title={`Vendi (${activeMyCount}/${PIAZZA_MAX_ACTIVE_LISTINGS})`}
            hint={`Commissione ${commissionPct}% sul prezzo di vendita.`}
          >
            {myListings.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-display">Le tue inserzioni</p>
                {myListings.map((listing) => (
                  <MercatoRow
                    key={listing.id}
                    title={`${listing.itemName}${listing.quantity > 1 ? ` ×${listing.quantity}` : ''}`}
                    subtitle={listingSubtitle(listing)}
                    trailing={
                      <span className="text-xs text-[var(--accent-gold)] font-display tabular-nums">
                        {listing.priceRem} Rem
                      </span>
                    }
                    actions={
                      <MercatoActionButton
                        label="Annulla"
                        variant="danger"
                        disabled={busyId === listing.id}
                        onClick={() => handleCancelListing(listing.id)}
                      />
                    }
                  />
                ))}
              </div>
            )}

            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-display mb-2">
              Pubblica dal tuo zaino
            </p>
            {!canCreateListing ? (
              <MercatoEmpty>Hai raggiunto il limite di inserzioni attive.</MercatoEmpty>
            ) : listableItems.length === 0 ? (
              <MercatoEmpty>
                {myListings.length > 0
                  ? 'Tutti gli oggetti vendibili sono già in vendita.'
                  : 'Nessun oggetto disponibile nello zaino.'}
              </MercatoEmpty>
            ) : (
              <div className="space-y-2">
                {listableItems.map((row) => (
                  <MercatoRow
                    key={row.id}
                    title={row.item.name}
                    subtitle={itemSubtitle(row)}
                    actions={
                      <>
                        <MercatoNumInput
                          value={listingPrice[row.id] ?? ''}
                          placeholder="Rem"
                          className="w-16"
                          onChange={(n) => setListingPrice((p) => ({ ...p, [row.id]: n }))}
                        />
                        <MercatoActionButton
                          label="Pubblica"
                          variant="violet"
                          disabled={busyId === row.id}
                          onClick={() => handleCreateListing(row.id)}
                        />
                      </>
                    }
                  />
                ))}
              </div>
            )}
          </MercatoSection>
        </div>
      )}

      {tab === 'immobiliare' && <HousingMarketSection char={char} onCharUpdate={onCharUpdate} />}
    </div>
  )
}
