'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from '@/components/ui/Toast'
import { medicoApi } from '@/lib/medico-api'
import type { CharacterSummary } from '../types'
import type { MedicoBlueprint, MedicoHealTarget, MedicoStatusResponse } from './medico-types'
import { MercatoActionButton, MercatoEmpty, MercatoRow, MercatoSection } from '../mercato/mercato-ui'

const MATERIAL_LABELS: Record<string, string> = {
  rottame_metallico: 'Rottame',
  componente_meccanico: 'Meccanico',
  componente_fine: 'Componente fine',
  stoffa: 'Stoffa',
  cuoio: 'Cuoio',
  legno: 'Legno',
  carta: 'Carta',
  reagente: 'Reagente',
  erba_comune: 'Erba comune',
  erba_rara: 'Erba rara',
  carne: 'Carne',
  carne_pregiata: 'Carne pregiata',
  frammento_onirico: 'Frammento onirico',
  trofeo: 'Trofeo',
  trofeo_maggiore: 'Trofeo maggiore',
  carburante: 'Carburante',
}

type Props = {
  char?: CharacterSummary
  roomId?: string | null
  onUpdate?: () => void
}

function formatMaterials(materials: MedicoBlueprint['materials']): string {
  if (!materials.length) return '—'
  return materials
    .map((m) => `${MATERIAL_LABELS[m.materialId] ?? m.materialId} ×${m.quantity}`)
    .join(', ')
}

export function MedicoToolSection({ char, roomId, onUpdate }: Props) {
  const [tab, setTab] = useState<'cura' | 'preparati'>('cura')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<MedicoStatusResponse | null>(null)
  const [targets, setTargets] = useState<MedicoHealTarget[]>([])
  const [selectedTargetId, setSelectedTargetId] = useState<string>('')
  const [healAmount, setHealAmount] = useState(5)
  const [busy, setBusy] = useState(false)
  const [craftBusyId, setCraftBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [st, tg] = await Promise.all([medicoApi.getStatus(), medicoApi.getHealTargets()])
      setStatus(st)
      setTargets(tg.targets)
      setSelectedTargetId((prev) => {
        if (prev && tg.targets.some((t) => t.id === prev)) return prev
        const wounded = tg.targets.find((t) => t.hpCurrent < t.hpMax)
        return wounded?.id ?? tg.targets[0]?.id ?? ''
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Errore strumento medico')
      setStatus(null)
      setTargets([])
    }
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load, char?.id])

  const selectedTarget = useMemo(
    () => targets.find((t) => t.id === selectedTargetId) ?? null,
    [targets, selectedTargetId],
  )

  const maxHeal = useMemo(() => {
    if (!status || !selectedTarget) return 0
    const missing = Math.max(0, selectedTarget.hpMax - selectedTarget.hpCurrent)
    return Math.min(missing, status.dailyBudget.remaining)
  }, [status, selectedTarget])

  const heal = async () => {
    if (!selectedTargetId || healAmount < 1) return
    setBusy(true)
    try {
      const result = await medicoApi.heal({
        targetCharacterId: selectedTargetId,
        amount: healAmount,
        roomId: roomId ?? undefined,
      })
      toast.success(`Cura applicata: +${result.applied} HP`)
      await load()
      onUpdate?.()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Cura fallita')
    } finally {
      setBusy(false)
    }
  }

  const craft = async (blueprintId: string) => {
    setCraftBusyId(blueprintId)
    try {
      const result = await medicoApi.craft(blueprintId)
      toast.success(
        result.procedure ? `${result.name} eseguito` : `${result.name} aggiunto all'inventario`,
      )
      await load()
      onUpdate?.()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Preparazione fallita')
    } finally {
      setCraftBusyId(null)
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500 p-4">Caricamento strumento medico…</p>
  }

  if (error) {
    return (
      <p className="text-xs text-red-400 border border-red-900/50 bg-red-950/30 rounded px-3 py-2 m-4">
        {error}
      </p>
    )
  }

  if (!status) return null

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-[var(--border-color)] pb-2">
        {(['cura', 'preparati'] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`text-[10px] uppercase tracking-widest font-display px-3 py-1.5 rounded border transition-colors motion-reduce:transition-none ${
              tab === id
                ? 'border-[var(--accent-gold)] text-[var(--accent-gold)] bg-[var(--accent-gold)]/10'
                : 'border-[var(--border-color)] text-gray-500 hover:text-[var(--accent-violet-light)]'
            }`}
          >
            {id === 'cura' ? 'Cura' : 'Preparati'}
          </button>
        ))}
      </div>

      <div className="text-[10px] uppercase tracking-wider text-gray-500 font-display">
        Budget cura oggi:{' '}
        <span className="text-[var(--accent-gold)] tabular-nums">
          {status.dailyBudget.remaining}/{status.dailyBudget.max}
        </span>
      </div>

      {tab === 'cura' && (
        <MercatoSection title="Bersaglio">
          {targets.length === 0 ? (
            <MercatoEmpty>Nessun bersaglio online.</MercatoEmpty>
          ) : (
            <div className="space-y-2">
              {targets.map((t) => (
                <label
                  key={t.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                    selectedTargetId === t.id
                      ? 'border-[var(--accent-gold)]/50 bg-[var(--accent-gold)]/5'
                      : 'border-[var(--border-color)] bg-black/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="medico-target"
                    checked={selectedTargetId === t.id}
                    onChange={() => setSelectedTargetId(t.id)}
                    className="accent-[var(--accent-gold)]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-display truncate">
                      {t.name}
                      {t.isSelf ? ' (tu)' : ''}
                    </p>
                    <p className="text-[10px] text-gray-500 tabular-nums">
                      HP {t.hpCurrent}/{t.hpMax}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="mt-4 space-y-2">
            <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-display">
              HP da curare (max {maxHeal})
            </label>
            <input
              type="number"
              min={1}
              max={Math.max(1, maxHeal)}
              value={healAmount}
              onChange={(e) => setHealAmount(Math.max(1, Number(e.target.value) || 1))}
              className="w-full rounded border border-[var(--border-color)] bg-black/40 px-3 py-2 text-sm text-white"
            />
            <MercatoActionButton
              label={busy ? 'Cura in corso…' : 'Applica cura'}
              disabled={busy || maxHeal < 1 || !selectedTargetId}
              onClick={heal}
            />
            {roomId && (
              <p className="text-[10px] text-gray-600">
                L&apos;azione verrà registrata in chat se sei in una room valida.
              </p>
            )}
          </div>
        </MercatoSection>
      )}

      {tab === 'preparati' && (
        <MercatoSection title="Ricette sbloccate">
          {status.blueprints.length === 0 ? (
            <MercatoEmpty>Sblocca sottoclassi per nuove ricette.</MercatoEmpty>
          ) : (
            <div className="space-y-2">
              {status.blueprints.map((bp) => (
                <MercatoRow
                  key={bp.id}
                  title={bp.name}
                  subtitle={`${bp.description} · Materiali: ${formatMaterials(bp.materials)}`}
                  actions={
                    <MercatoActionButton
                      label={craftBusyId === bp.id ? '…' : 'Prepara'}
                      disabled={craftBusyId === bp.id}
                      onClick={() => craft(bp.id)}
                    />
                  }
                />
              ))}
            </div>
          )}
        </MercatoSection>
      )}
    </div>
  )
}
