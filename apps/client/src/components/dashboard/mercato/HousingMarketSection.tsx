'use client'

import { useCallback, useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { icons } from '@/lib/icons'
import { toast } from '@/components/ui/Toast'
import { api } from '@/lib/api'
import type { CharacterSummary } from '../types'
import { MercatoEmpty, MercatoSection } from './mercato-ui'
import type { HousingCatalogItem } from './mercato-types'

const PLACEHOLDER_ICON = '/dark-fantasy-ui/icon-placeholder.svg'

type CurrentHousingRow = {
  id: string
  housingType: {
    id: string
    code: string
    name: string
    dailyRent: number | null
    monthlyRent: number | null
  }
  nextDueDate: string | null
  hasPaidCurrentMonth: boolean
  daysOverdue: number
  evicted: boolean
  chatRoomId: string | null
} | null

type Props = {
  char?: CharacterSummary
  onCharUpdate?: () => void
}

function HousingCatalogCard({
  type,
  char,
  currentHousing,
  rentingId,
  onRent,
}: {
  type: HousingCatalogItem
  char?: CharacterSummary
  currentHousing: CurrentHousingRow
  rentingId: string | null
  onRent: (id: string) => void
}) {
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
    btnLabel = isSalary ? 'Assegnato' : 'Contratto attivo'
    disabled = true
    isOwned = true
  } else if (hasOtherHouse) {
    btnLabel = 'Non disponibile'
    disabled = true
  } else {
    btnLabel = isSalary ? 'Richiedi assegnazione' : 'Firma contratto'
    disabled = !canAfford || rentingId !== null
  }

  return (
    <div
      className={`flex gap-3 p-3 rounded-lg border ${
        isMyHouse
          ? 'border-[var(--accent-gold)]/50 bg-[var(--accent-gold)]/5'
          : 'border-[var(--border-color)] bg-black/25'
      }`}
    >
      <img
        src={type.iconUrl || PLACEHOLDER_ICON}
        alt={type.name}
        width={100}
        height={100}
        className="w-[100px] h-[100px] shrink-0 rounded border border-white/10 bg-black/40 object-cover p-2"
        onError={(e) => {
          ;(e.target as HTMLImageElement).src = PLACEHOLDER_ICON
        }}
      />
      <div className="min-w-0 flex-1 flex flex-col gap-1.5">
        <div>
          <p className="font-display text-sm text-white">{type.name}</p>
          {type.nameRomaji && (
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{type.nameRomaji}</p>
          )}
        </div>
        {type.description && (
          <p className="text-xs text-gray-400 leading-relaxed">{type.description}</p>
        )}
        {type.effectText && (
          <p className="text-[11px] text-[var(--accent-violet-light)]/90">{type.effectText}</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <div>
            <span className="text-sm text-[var(--accent-gold)] font-display tabular-nums block">
              {costRem} Rem
            </span>
            <span className="text-[10px] text-gray-500 uppercase">
              {isSalary ? 'Detrazione giornaliera' : 'Mensile'}
            </span>
          </div>
          {isOwned ? (
            <div className="px-3 py-1.5 rounded border border-[var(--accent-gold)]/40 text-[var(--accent-gold)] text-[10px] uppercase tracking-wider flex items-center gap-1.5">
              <FontAwesomeIcon icon={icons.check} className="w-3 h-3" />
              {btnLabel}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => !disabled && onRent(type.id)}
              disabled={disabled}
              className="px-3 py-1.5 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-[10px] uppercase tracking-wider hover:bg-[var(--accent-gold)]/10 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {rentingId === type.id ? '…' : btnLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function HousingMarketSection({ char, onCharUpdate }: Props) {
  const [housingTypes, setHousingTypes] = useState<HousingCatalogItem[]>([])
  const [currentHousing, setCurrentHousing] = useState<CurrentHousingRow>(null)
  const [loading, setLoading] = useState(true)
  const [housingLoading, setHousingLoading] = useState(false)
  const [rentingId, setRentingId] = useState<string | null>(null)
  const [leavingHousing, setLeavingHousing] = useState(false)
  const [payingRent, setPayingRent] = useState(false)

  const refreshHousing = useCallback(async () => {
    setHousingLoading(true)
    try {
      const [types, housing] = await Promise.all([
        api.get('/housing/types').then((d) => (Array.isArray(d) ? d : []) as HousingCatalogItem[]).catch(() => []),
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
      : `Vuoi affittare: ${type?.name}? Costo: ${cost} REM mensili`
    if (!confirm(msg)) return
    setRentingId(housingTypeId)
    try {
      await api.post('/housing/assign', { housingTypeId })
      await refreshHousing()
      onCharUpdate?.()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Errore durante l'assegnazione/affitto")
    } finally {
      setRentingId(null)
    }
  }

  const handlePayRent = async () => {
    if (!confirm("Vuoi pagare l'affitto mensile ora?")) return
    setPayingRent(true)
    try {
      await api.post('/housing/pay-rent', {})
      await refreshHousing()
      onCharUpdate?.()
      toast.success('Affitto pagato.')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Errore durante il pagamento')
    } finally {
      setPayingRent(false)
    }
  }

  const openHousingChat = () => {
    if (!currentHousing?.chatRoomId) return
    window.dispatchEvent(
      new CustomEvent('openHousingChat', { detail: { roomId: currentHousing.chatRoomId } }),
    )
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
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Errore durante l'operazione")
    } finally {
      setLeavingHousing(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Caricamento immobili…</p>
  }

  return (
    <div className="space-y-4">
      {currentHousing && !currentHousing.evicted && (
        <MercatoSection title="Abitazione attuale">
          <div className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-[var(--accent-violet-light)]">
                  Risiedi in <strong className="text-white">{currentHousing.housingType.name}</strong>.
                </p>
                {currentHousing.housingType.monthlyRent != null && currentHousing.housingType.monthlyRent > 0 && (
                  <div className="mt-2 space-y-1 text-xs text-gray-400">
                    <p>Affitto: {currentHousing.housingType.monthlyRent} REM/mese</p>
                    {currentHousing.nextDueDate && (
                      <p>
                        Scadenza:{' '}
                        {new Date(currentHousing.nextDueDate).toLocaleDateString('it-IT')}
                        {currentHousing.daysOverdue > 0 && (
                          <span className="text-red-400 ml-2">
                            ({currentHousing.daysOverdue} giorni di ritardo)
                          </span>
                        )}
                      </p>
                    )}
                    <p>
                      Pagato questo mese:{' '}
                      <span
                        className={
                          currentHousing.hasPaidCurrentMonth
                            ? 'text-[var(--accent-violet-light)]'
                            : 'text-[var(--accent-gold)]'
                        }
                      >
                        {currentHousing.hasPaidCurrentMonth ? 'Sì' : 'No'}
                      </span>
                    </p>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                {currentHousing.housingType.monthlyRent != null &&
                  currentHousing.housingType.monthlyRent > 0 &&
                  !currentHousing.hasPaidCurrentMonth && (
                    <button
                      type="button"
                      onClick={() => void handlePayRent()}
                      disabled={payingRent}
                      className="px-3 py-2 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs font-display uppercase tracking-wider hover:bg-[var(--accent-gold)]/10 disabled:opacity-50"
                    >
                      {payingRent ? '…' : 'Paga affitto'}
                    </button>
                  )}
                {currentHousing.chatRoomId && (
                  <button
                    type="button"
                    onClick={openHousingChat}
                    className="px-3 py-2 rounded border border-[var(--accent-violet)]/50 text-[var(--accent-violet-light)] text-xs font-display uppercase tracking-wider hover:bg-[var(--accent-violet)]/10"
                  >
                    <FontAwesomeIcon icon={icons.message} className="w-3 h-3 mr-1" />
                    Chat casa
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleLeaveHousing()}
                  disabled={leavingHousing}
                  className="px-3 py-2 rounded border border-red-900/50 text-red-400 text-xs font-display uppercase tracking-wider hover:bg-red-950/30 disabled:opacity-50"
                >
                  {leavingHousing ? '…' : 'Lascia immobile'}
                </button>
              </div>
            </div>
            {currentHousing.housingType.monthlyRent != null &&
              !currentHousing.hasPaidCurrentMonth &&
              currentHousing.daysOverdue === 0 && (
                <p className="text-[11px] text-gray-500 border-t border-[var(--border-color)] pt-2">
                  Il Locatario ti invierà un messaggio alla scadenza (15 del mese) se l&apos;affitto non risulta
                  saldato.
                </p>
              )}
          </div>
        </MercatoSection>
      )}

      <MercatoSection
        title="Catalogo immobiliare"
        hint="Affitta o assegna un'abitazione per slot inventario extra, bonus PF e chat casa privata."
      >
        {housingLoading ? (
          <p className="text-sm text-gray-500">Caricamento listino…</p>
        ) : housingTypes.length === 0 ? (
          <MercatoEmpty>
            Nessuna abitazione in catalogo — esegui il seed housing o aggiungi tipologie da Gestione.
          </MercatoEmpty>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {housingTypes.map((type) => (
              <HousingCatalogCard
                key={type.id}
                type={type}
                char={char}
                currentHousing={currentHousing}
                rentingId={rentingId}
                onRent={(id) => void handleRentHousing(id)}
              />
            ))}
          </div>
        )}
      </MercatoSection>
    </div>
  )
}
