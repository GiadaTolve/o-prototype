'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from '@/components/ui/Toast'
import { artigianoApi } from '@/lib/artigiano-api'
import type { CharacterSummary } from '../types'
import type { DismantleInventoryRow } from './dismantle-types'
import {
  MercatoActionButton,
  MercatoEmpty,
  MercatoRow,
  MercatoSection,
} from './mercato-ui'

const CATEGORY_LABELS: Record<string, string> = {
  junk: 'Junk',
  materiale: 'Materiale',
  consumabile: 'Consumabile',
  equipaggiamento: 'Equipaggiamento',
  costrutto_materiale: 'Costrutto',
  oggetto_trama: 'Trama',
}

function formatCategory(category: string): string {
  return CATEGORY_LABELS[category] ?? category
}


function itemSubtitle(row: DismantleInventoryRow): string {
  const parts = [formatCategory(row.economy.category)]
  if (row.economy.isBroken) parts.push('rotto')
  if (row.economy.integrityMax != null && row.economy.integrityCurrent != null) {
    parts.push(`INT ${row.economy.integrityCurrent}/${row.economy.integrityMax}`)
  }
  return parts.join(' · ')
}

type Props = {
  char?: CharacterSummary
  onCharUpdate?: () => void
}

export function DismantleSection({ char, onCharUpdate }: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notArtigiano, setNotArtigiano] = useState(false)
  const [items, setItems] = useState<DismantleInventoryRow[]>([])
  const [remainingToday, setRemainingToday] = useState(0)
  const [dailyMax, setDailyMax] = useState(10)
  const [usedToday, setUsedToday] = useState(0)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    setError(null)
    setNotArtigiano(false)
    try {
      const data = await artigianoApi.getDismantleInventory()
      setItems(data.items.filter((row) => row.location === 'CARRY'))
      setRemainingToday(data.dismantle.remainingToday)
      setUsedToday(data.dismantle.usedToday)
      setDailyMax(data.dismantle.dailyMax)
      setSelected(new Set())
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Errore caricamento officina'
      if (msg.includes('Artigiani') || msg.includes('Shokunin')) {
        setNotArtigiano(true)
      } else {
        setError(msg)
      }
      setItems([])
    }
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load, char?.id])

  const dismantlable = useMemo(
    () => items.filter((row) => row.canDismantle && !row.isEquipped),
    [items],
  )

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < remainingToday) next.add(id)
      return next
    })
  }

  const runDismantle = async (inventoryIds: string[]) => {
    if (inventoryIds.length === 0) return
    setBusyId(inventoryIds.join(','))
    try {
      const result = await artigianoApi.dismantle(inventoryIds)
      toast.success(
        result.dismantled.length === 1
          ? `Smantellato. Materiali in zaino.`
          : `Smantellati ${result.dismantled.length} oggetti. Materiali in zaino.`,
      )
      onCharUpdate?.()
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Smantellamento fallito')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Caricamento officina…</p>
  }

  if (notArtigiano) {
    return (
      <MercatoSection
        title="Officina Artigiano"
        hint="Solo chi ha sbloccato Shokunin (Artigiano) nell'albero Skiru può smantellare."
      >
        <MercatoEmpty>
          Non hai ancora il gate Shokunin (Artigiano) nell&apos;albero Skiru. Junk e equipaggiamento rotto si
          recuperano qui quando sarai Artigiano.
        </MercatoEmpty>
      </MercatoSection>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-red-400 border border-red-900/50 bg-red-950/30 rounded px-3 py-2">{error}</p>
      )}

      <MercatoSection
        title="Smantellamento"
        hint={`Junk e oggetti rotti (integrità 0) → materiali. Limite ${dailyMax}/giorno — oggi ${usedToday} usati, ${remainingToday} rimasti.`}
      >
        {dismantlable.length === 0 ? (
          <MercatoEmpty>Nessun oggetto smantellabile nello zaino.</MercatoEmpty>
        ) : (
          <>
            {selected.size > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-3 pb-3 border-b border-[var(--border-color)]/50">
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-display">
                  {selected.size} selezionati
                </span>
                <MercatoActionButton
                  label="Smantella selezionati"
                  variant="violet"
                  disabled={busyId != null}
                  onClick={() => runDismantle([...selected])}
                />
                <MercatoActionButton
                  label="Annulla"
                  onClick={() => setSelected(new Set())}
                />
              </div>
            )}
            <div className="space-y-2">
              {items.map((row) => {
                const can = row.canDismantle && !row.isEquipped
                const isSelected = selected.has(row.id)
                return (
                  <MercatoRow
                    key={row.id}
                    title={`${row.item.name}${row.quantity > 1 ? ` ×${row.quantity}` : ''}`}
                    subtitle={
                      can
                        ? itemSubtitle(row)
                        : row.dismantleBlockReason ?? itemSubtitle(row)
                    }
                    trailing={
                      can ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!isSelected && selected.size >= remainingToday}
                          onChange={() => toggleSelect(row.id)}
                          className="accent-[var(--accent-violet)]"
                          aria-label={`Seleziona ${row.item.name}`}
                        />
                      ) : undefined
                    }
                    actions={
                      can ? (
                        <MercatoActionButton
                          label="Smantella"
                          variant="violet"
                          disabled={busyId != null || remainingToday < 1}
                          onClick={() => runDismantle([row.id])}
                        />
                      ) : (
                        <span className="text-[10px] text-gray-600 uppercase tracking-wide">—</span>
                      )
                    }
                  />
                )
              })}
            </div>
          </>
        )}
      </MercatoSection>
    </div>
  )
}
