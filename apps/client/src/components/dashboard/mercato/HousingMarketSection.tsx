'use client'

import { useCallback, useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { icons } from '@/lib/icons'
import { api } from '@/lib/api'
import type { CharacterSummary } from '../types'

type HousingTypeRow = {
  id: string
  code: string
  name: string
  squareMeters: number
  dailyRent: number | null
  monthlyRent: number | null
  hpBonus: number
  inventorySlotsBonus: number
  requirements: { paradisePass?: boolean } | null
}

type CurrentHousingRow = {
  id: string
  housingType: { id: string; code: string; name: string; dailyRent: number | null; monthlyRent: number | null }
  evicted: boolean
} | null

type Props = {
  char?: CharacterSummary
  onCharUpdate?: () => void
}

export function HousingMarketSection({ char, onCharUpdate }: Props) {
  const [housingTypes, setHousingTypes] = useState<HousingTypeRow[]>([])
  const [currentHousing, setCurrentHousing] = useState<CurrentHousingRow>(null)
  const [loading, setLoading] = useState(true)
  const [housingLoading, setHousingLoading] = useState(false)
  const [rentingId, setRentingId] = useState<string | null>(null)
  const [leavingHousing, setLeavingHousing] = useState(false)

  const refreshHousing = useCallback(async () => {
    setHousingLoading(true)
    try {
      const [types, housing] = await Promise.all([
        api.get('/housing/types').then((d) => (Array.isArray(d) ? d : []) as HousingTypeRow[]).catch(() => []),
        api.get('/housing/me').then((d) => d as CurrentHousingRow).catch(() => null),
      ])
      setHousingTypes(types)
      setCurrentHousing(housing)
    } finally {
      setHousingLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshHousing().finally(() => setLoading(false))
  }, [refreshHousing])

  const handleRentHousing = async (housingTypeId: string) => {
    const type = housingTypes.find((t) => t.id === housingTypeId)
    const cost = type?.monthlyRent ?? type?.dailyRent ?? 0
    const isSalary = type?.dailyRent != null && type.dailyRent > 0
    const msg = isSalary
      ? `Vuoi assegnarti: ${type?.name}? (Detrazione giornaliera: ${type?.dailyRent} REM)`
      : `Vuoi affittare: ${type?.name}? Costo: ${cost} REM${type?.monthlyRent ? ' mensili' : ''}`
    if (!confirm(msg)) return
    setRentingId(housingTypeId)
    try {
      await api.post('/housing/assign', { housingTypeId })
      await refreshHousing()
      onCharUpdate?.()
      alert('Operazione completata!')
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore durante l'assegnazione/affitto")
    } finally {
      setRentingId(null)
    }
  }

  const handleLeaveHousing = async () => {
    if (
      !confirm(
        "Sei sicuro di voler lasciare la tua abitazione? Perderai l'accesso alla chat privata e le personalizzazioni.",
      )
    )
      return
    setLeavingHousing(true)
    try {
      await api.post('/housing/remove', {})
      setCurrentHousing(null)
      onCharUpdate?.()
      alert('Hai lasciato l\'immobile.')
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Errore durante l'operazione")
    } finally {
      setLeavingHousing(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Caricamento immobili…</p>
  }

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-[var(--accent-violet-light)]/80">
        Affitta o assegna un&apos;abitazione per slot inventario extra e bonus PF.
      </p>

      {currentHousing && !currentHousing.evicted && (
        <div className="p-3 rounded border border-red-500/60 bg-red-500/10 flex items-center justify-between gap-3">
          <p className="text-sm text-red-100">
            <strong>Proprietà attiva:</strong> Risiedi in{' '}
            <strong>{currentHousing.housingType.name}</strong>. Per cambiare abitazione, rescindi prima il contratto.
          </p>
          <button
            type="button"
            onClick={() => void handleLeaveHousing()}
            disabled={leavingHousing}
            className="px-3 py-2 rounded border border-red-400 text-red-200 text-xs font-display uppercase tracking-wider hover:bg-red-500/20 disabled:opacity-50 shrink-0"
          >
            {leavingHousing ? '…' : 'Lascia immobile'}
          </button>
        </div>
      )}

      {housingLoading ? (
        <p className="text-sm text-gray-500">Caricamento listino…</p>
      ) : housingTypes.length === 0 ? (
        <p className="text-sm text-gray-500">Nessuna tipologia di abitazione disponibile.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {housingTypes.map((type) => {
            const isSalary = type.dailyRent != null && type.dailyRent > 0
            const costRem = type.monthlyRent ?? type.dailyRent ?? 0
            const rem = char?.rem ?? 0
            const canAfford = isSalary || rem >= costRem
            const isMyHouse =
              currentHousing && !currentHousing.evicted && currentHousing.housingType.id === type.id
            const hasOtherHouse =
              currentHousing && !currentHousing.evicted && currentHousing.housingType.id !== type.id
            let btnLabel: string
            let disabled = false
            let isOwned = false
            if (isMyHouse) {
              btnLabel = isSalary ? 'Assegnato' : 'Contratto firmato'
              disabled = true
              isOwned = true
            } else if (hasOtherHouse) {
              btnLabel = 'Non disponibile'
              disabled = true
            } else {
              btnLabel = isSalary ? 'Assegnazione' : 'Firma contratto'
              disabled = !canAfford || rentingId !== null
            }
            return (
              <div
                key={type.id}
                className={`p-4 rounded border flex flex-col gap-3 ${
                  isMyHouse
                    ? 'border-green-500/60 bg-green-500/10'
                    : 'border-[var(--border-color)] bg-black/20'
                }`}
              >
                <div className="flex justify-between items-start border-b border-[var(--border-color)] pb-2">
                  <h4 className="font-display text-sm text-[var(--accent-violet)] flex items-center gap-2">
                    <FontAwesomeIcon icon={icons.home} className="w-3 h-3 opacity-70" />
                    {type.name}
                  </h4>
                  <div className="text-right">
                    <span className="text-[var(--accent-gold)] font-mono font-bold block">{costRem} REM</span>
                    <span className="text-[10px] text-gray-500 uppercase">
                      {isSalary ? 'Detrazione' : 'Mensile'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 flex-1">
                  {type.squareMeters} m²
                  {type.requirements?.paradisePass && ' · Richiede Paradise Pass'}
                </p>
                <div className="flex justify-between text-xs py-2 px-3 rounded bg-black/30 border border-[var(--border-color)]">
                  <span className="text-[var(--accent-gold)]">+{type.inventorySlotsBonus} slot</span>
                  <span className="text-red-400/90">+{type.hpBonus} PF</span>
                </div>
                {isOwned ? (
                  <div className="py-2 px-3 rounded border border-green-500/50 text-green-400 text-xs font-display text-center flex items-center justify-center gap-2">
                    <FontAwesomeIcon icon={icons.check} />
                    {btnLabel}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => !disabled && void handleRentHousing(type.id)}
                    disabled={disabled}
                    className="py-2 px-3 rounded border border-[var(--accent-violet)] text-[var(--accent-violet-light)] text-xs font-display uppercase tracking-wider hover:bg-[var(--accent-violet)]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {rentingId === type.id ? '…' : btnLabel}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
