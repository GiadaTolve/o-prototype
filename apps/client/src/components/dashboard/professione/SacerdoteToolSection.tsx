'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from '@/components/ui/Toast'
import { sacerdoteApi } from '@/lib/sacerdote-api'
import type { CharacterSummary } from '../types'
import {
  MercatoActionButton,
  MercatoEmpty,
  MercatoRow,
  MercatoSection,
} from '../mercato/mercato-ui'
import type { SacerdoteOfudaRow, SacerdoteRite, SacerdoteStatusResponse } from './sacerdote-types'

const MATERIAL_LABELS: Record<string, string> = {
  carta: 'Carta',
  erba_comune: 'Erba comune',
  erba_rara: 'Erba rara',
  frammento_onirico: 'Frammento onirico',
  componente_fine: 'Componente fine',
  trofeo_maggiore: 'Trofeo maggiore',
}

type Props = {
  char?: CharacterSummary
  roomId?: string | null
  onUpdate?: () => void
}

function formatMaterials(materials: SacerdoteRite['materials']): string {
  return materials
    .map((m) => `${MATERIAL_LABELS[m.materialId] ?? m.materialId} ×${m.quantity}`)
    .join(', ')
}

export function SacerdoteToolSection({ char, roomId, onUpdate }: Props) {
  const [tab, setTab] = useState<'fabbricazione' | 'reliquiario'>('fabbricazione')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<SacerdoteStatusResponse | null>(null)
  const [consecratedPlace, setConsecratedPlace] = useState(false)
  const [craftBusyId, setCraftBusyId] = useState<string | null>(null)
  const [activateBusyId, setActivateBusyId] = useState<string | null>(null)
  const [consumeBusyId, setConsumeBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const st = await sacerdoteApi.getStatus()
      setStatus(st)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Errore strumento sacerdote')
      setStatus(null)
    }
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load, char?.id])

  const activeOfuda = useMemo(
    () => status?.ofuda.filter((o) => o.status === 'active') ?? [],
    [status],
  )

  const craft = async (rite: SacerdoteRite) => {
    setCraftBusyId(rite.id)
    try {
      await sacerdoteApi.craft({
        blueprintId: rite.id,
        consecratedPlace: status?.pathHints.requiresConsecratedPlace ? consecratedPlace : undefined,
        roomId: roomId ?? undefined,
      })
      toast.success(`${rite.name} fabbricato`)
      await load()
      onUpdate?.()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Fabbricazione fallita')
    } finally {
      setCraftBusyId(null)
    }
  }

  const activate = async (rite: SacerdoteRite) => {
    if (rite.inInventory <= 0) {
      toast.error('Nessun Ofuda in inventario — fabbricalo prima')
      return
    }
    setActivateBusyId(rite.id)
    try {
      await sacerdoteApi.activate({
        blueprintId: rite.id,
        roomId: roomId ?? undefined,
      })
      toast.success(`${rite.name} attivato`)
      await load()
      onUpdate?.()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Attivazione fallita')
    } finally {
      setActivateBusyId(null)
    }
  }

  const consume = async (ofuda: SacerdoteOfudaRow) => {
    setConsumeBusyId(ofuda.id)
    try {
      await sacerdoteApi.consume(ofuda.id, { roomId: roomId ?? undefined })
      toast.success('Ofuda consumato')
      await load()
      onUpdate?.()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Consumo fallito')
    } finally {
      setConsumeBusyId(null)
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Caricamento Reliquiario…</p>
  }

  if (error) {
    return (
      <p className="text-xs text-red-400 border border-red-900/50 bg-red-950/30 rounded px-3 py-2">
        {error}
      </p>
    )
  }

  if (!status) return null

  return (
    <div className="space-y-4">
      <div className="flex gap-2 text-[10px] uppercase tracking-wider font-display">
        <button
          type="button"
          onClick={() => setTab('fabbricazione')}
          className={`px-2 py-1 rounded border ${tab === 'fabbricazione' ? 'border-[var(--accent-gold)] text-[var(--accent-gold)]' : 'border-[var(--border-color)] text-gray-500'}`}
        >
          Fabbricazione
        </button>
        <button
          type="button"
          onClick={() => setTab('reliquiario')}
          className={`px-2 py-1 rounded border ${tab === 'reliquiario' ? 'border-[var(--accent-gold)] text-[var(--accent-gold)]' : 'border-[var(--border-color)] text-gray-500'}`}
        >
          Reliquiario
        </button>
      </div>

      <div className="text-[10px] uppercase tracking-wider text-gray-500 font-display">
        Ofuda attivi:{' '}
        <span className="text-[var(--accent-gold)] tabular-nums">
          {status.dailyBudget.ofudaActive.remaining}/{status.dailyBudget.ofudaActive.max}
        </span>
        {' · '}
        Potere max:{' '}
        <span className="text-[var(--accent-violet-light)] tabular-nums">{status.limits.maxPower}</span>
      </div>

      {tab === 'fabbricazione' ? (
        <MercatoSection title="Riti">
          {status.pathHints.requiresConsecratedPlace && (
            <label className="flex items-center gap-2 text-xs text-gray-400 mb-2">
              <input
                type="checkbox"
                checked={consecratedPlace}
                onChange={(e) => setConsecratedPlace(e.target.checked)}
              />
              Luogo consacrato (Jareiba)
            </label>
          )}
          {status.pathHints.yumetokiDoubleTime && (
            <p className="text-[10px] text-gray-600 mb-2">
              Sentiero Yumetoki: ogni Ofuda richiede il doppio del tempo narrativo.
            </p>
          )}
          {status.rites.length === 0 ? (
            <MercatoEmpty>Sblocca sottoclassi per nuovi riti.</MercatoEmpty>
          ) : (
            <div className="space-y-2">
              {status.rites.map((rite) => (
                <MercatoRow
                  key={rite.id}
                  title={rite.name}
                  subtitle={`${rite.description} · Potere ${rite.power} · ${formatMaterials(rite.materials)} · in inventario: ${rite.inInventory}`}
                  actions={
                    <MercatoActionButton
                      label={craftBusyId === rite.id ? '…' : 'Fabbrica'}
                      disabled={craftBusyId === rite.id}
                      onClick={() => craft(rite)}
                    />
                  }
                />
              ))}
            </div>
          )}
        </MercatoSection>
      ) : (
        <>
          <MercatoSection title="Attiva da inventario">
            {status.rites.filter((r) => r.inInventory > 0).length === 0 ? (
              <MercatoEmpty>Nessun Ofuda in inventario.</MercatoEmpty>
            ) : (
              <div className="space-y-2">
                {status.rites
                  .filter((r) => r.inInventory > 0)
                  .map((rite) => (
                    <MercatoRow
                      key={rite.id}
                      title={rite.name}
                      subtitle={`Potere ${rite.power} · disponibili: ${rite.inInventory}`}
                      actions={
                        <MercatoActionButton
                          label={activateBusyId === rite.id ? '…' : 'Attiva'}
                          disabled={
                            activateBusyId === rite.id ||
                            status.dailyBudget.ofudaActive.remaining <= 0
                          }
                          onClick={() => activate(rite)}
                        />
                      }
                    />
                  ))}
              </div>
            )}
          </MercatoSection>

          <MercatoSection title="Ofuda attivi">
            {activeOfuda.length === 0 ? (
              <MercatoEmpty>Nessun Ofuda attivo.</MercatoEmpty>
            ) : (
              <div className="space-y-2">
                {activeOfuda.map((ofuda) => (
                  <MercatoRow
                    key={ofuda.id}
                    title={ofuda.blueprintName}
                    subtitle={`Potere ${ofuda.power}${ofuda.notes ? ` · ${ofuda.notes}` : ''}`}
                    actions={
                      <MercatoActionButton
                        label={consumeBusyId === ofuda.id ? '…' : 'Consuma'}
                        disabled={consumeBusyId === ofuda.id}
                        onClick={() => consume(ofuda)}
                      />
                    }
                  />
                ))}
              </div>
            )}
          </MercatoSection>
        </>
      )}
    </div>
  )
}
