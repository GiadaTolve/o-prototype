'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { GAME_MAPS, getChatListForZone } from '@/config/map-config'
import { toast } from '@/components/ui/Toast'
import { cacciatoreApi } from '@/lib/cacciatore-api'
import type { CharacterSummary } from '../types'
import {
  MercatoActionButton,
  MercatoEmpty,
  MercatoRow,
  MercatoSection,
} from '../mercato/mercato-ui'
import type { CacciatoreStatusResponse, CacciatoreTrack } from './cacciatore-types'

const MATERIAL_LABELS: Record<string, string> = {
  componente_meccanico: 'Componente meccanico',
}

const BATTUTA_ZONES = GAME_MAPS.ogon.zones.flatMap((zone) =>
  getChatListForZone(zone).map((loc) => ({
    roomId: loc.roomId,
    label: loc.containerLabel
      ? `${loc.label} · ${loc.containerLabel} (${zone.label})`
      : `${loc.label} (${zone.label})`,
  })),
)

type Props = {
  char?: CharacterSummary
  roomId?: string | null
  onUpdate?: () => void
}

function formatRequires(track: CacciatoreTrack): string {
  if (!track.gatherRequires.length) return ''
  const req = track.gatherRequires
    .map((r) => `${MATERIAL_LABELS[r.materialId] ?? r.materialId} ×${r.quantity}`)
    .join(', ')
  return ` · Richiede: ${req}`
}

export function CacciatoreToolSection({ char, roomId, onUpdate }: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<CacciatoreStatusResponse | null>(null)
  const [selectedZone, setSelectedZone] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const st = await cacciatoreApi.getStatus()
      setStatus(st)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Errore strumento cacciatore')
      setStatus(null)
    }
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load, char?.id])

  useEffect(() => {
    if (roomId && BATTUTA_ZONES.some((z) => z.roomId === roomId)) {
      setSelectedZone(roomId)
    } else if (!selectedZone && BATTUTA_ZONES[0]) {
      setSelectedZone(BATTUTA_ZONES[0].roomId)
    }
  }, [roomId, selectedZone])

  const affordableTracks = useMemo(() => {
    if (!status) return []
    return status.tracks.filter((t) => t.gatherUnits <= status.dailyBudget.remaining)
  }, [status])

  const gather = async (track: CacciatoreTrack) => {
    if (!selectedZone) {
      toast.error('Seleziona una zona per la battuta')
      return
    }
    setBusyId(track.id)
    try {
      const result = await cacciatoreApi.gather({
        blueprintId: track.id,
        roomId: selectedZone,
      })
      const loot =
        result.granted.length > 0
          ? result.granted.map((g) => `${g.quantity}× ${g.materialId}`).join(', ')
          : 'effetto narrativo'
      toast.success(
        result.needsScene ? `${result.name}: ${loot} — possibile scena` : `${result.name}: ${loot}`,
      )
      await load()
      onUpdate?.()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Battuta fallita')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Caricamento strumento cacciatore…</p>
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
      <div className="text-[10px] uppercase tracking-wider text-gray-500 font-display">
        Budget raccolta oggi:{' '}
        <span className="text-[var(--accent-gold)] tabular-nums">
          {status.dailyBudget.remaining}/{status.dailyBudget.max}
        </span>
      </div>

      <MercatoSection title="Zona battuta">
        <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-display mb-1">
          Luogo
        </label>
        <select
          value={selectedZone}
          onChange={(e) => setSelectedZone(e.target.value)}
          className="w-full rounded border border-[var(--border-color)] bg-black/40 px-2 py-2 text-sm text-white mb-2"
        >
          {BATTUTA_ZONES.map((z) => (
            <option key={z.roomId} value={z.roomId}>
              {z.label}
            </option>
          ))}
        </select>
        <p className="text-[10px] text-gray-600">
          L&apos;esito viene registrato in chat nella zona scelta (se valida).
        </p>
      </MercatoSection>

      <MercatoSection title="Tracce e prede">
        {status.tracks.length === 0 ? (
          <MercatoEmpty>Sblocca sottoclassi per nuove tracce.</MercatoEmpty>
        ) : (
          <div className="space-y-2">
            {status.tracks.map((track) => {
              const canAfford = track.gatherUnits <= status.dailyBudget.remaining
              return (
                <MercatoRow
                  key={track.id}
                  title={track.name}
                  subtitle={`${track.description} · ${track.yieldsPreview} · ${track.gatherUnits} u Raccolta${formatRequires(track)}${track.needsScene ? ' · scena' : ''}`}
                  actions={
                    <MercatoActionButton
                      label={busyId === track.id ? '…' : 'Battuta'}
                      disabled={!canAfford || busyId === track.id}
                      onClick={() => gather(track)}
                    />
                  }
                />
              )
            })}
          </div>
        )}
        {affordableTracks.length === 0 && status.tracks.length > 0 && (
          <p className="text-[10px] text-gray-600 mt-2">Budget raccolta esaurito per oggi.</p>
        )}
      </MercatoSection>
    </div>
  )
}
