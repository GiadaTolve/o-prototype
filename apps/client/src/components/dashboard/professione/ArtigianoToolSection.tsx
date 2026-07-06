'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from '@/components/ui/Toast'
import { artigianoApi } from '@/lib/artigiano-api'
import { DismantleSection } from '../mercato/DismantleSection'
import {
  MercatoActionButton,
  MercatoEmpty,
  MercatoRow,
  MercatoSection,
} from '../mercato/mercato-ui'
import type { CharacterSummary } from '../types'
import type { ArtigianoBlueprint, ArtigianoRepairRow, ArtigianoToolStatus } from './artigiano-types'

const MATERIAL_LABELS: Record<string, string> = {
  rottame_metallico: 'Rottame',
  componente_meccanico: 'Meccanico',
  componente_fine: 'Componente fine',
  stoffa: 'Stoffa',
  cuoio: 'Cuoio',
  legno: 'Legno',
  reagente: 'Reagente',
}

type Props = {
  char?: CharacterSummary
  roomId?: string | null
  onUpdate?: () => void
}

function formatMaterials(materials: ArtigianoBlueprint['materials']): string {
  return materials
    .map((m) => `${MATERIAL_LABELS[m.materialId] ?? m.materialId} ×${m.quantity}`)
    .join(', ')
}

export function ArtigianoToolSection({ char, roomId, onUpdate }: Props) {
  const [tab, setTab] = useState<'riparazione' | 'costruzione' | 'officina'>('riparazione')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<ArtigianoToolStatus | null>(null)
  const [repairItems, setRepairItems] = useState<ArtigianoRepairRow[]>([])
  const [selectedRepairId, setSelectedRepairId] = useState('')
  const [repairAmount, setRepairAmount] = useState(5)
  const [procedureTargetId, setProcedureTargetId] = useState('')
  const [busy, setBusy] = useState(false)
  const [craftBusyId, setCraftBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [st, rep] = await Promise.all([
        artigianoApi.getToolStatus(),
        artigianoApi.getRepairInventory(),
      ])
      setStatus(st)
      setRepairItems(rep.items)
      const repairable = rep.items.filter((r) => r.canRepair)
      setSelectedRepairId((prev) =>
        prev && repairable.some((r) => r.id === prev) ? prev : repairable[0]?.id ?? '',
      )
      setProcedureTargetId((prev) =>
        prev && repairable.some((r) => r.id === prev) ? prev : repairable[0]?.id ?? '',
      )
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Errore strumento artigiano')
    }
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load, char?.id])

  const selectedRepair = useMemo(
    () => repairItems.find((r) => r.id === selectedRepairId) ?? null,
    [repairItems, selectedRepairId],
  )

  const repairable = useMemo(() => repairItems.filter((r) => r.canRepair), [repairItems])

  const maxRepair = useMemo(() => {
    if (!status || !selectedRepair) return 0
    const missing = Math.max(0, selectedRepair.integrityMax - selectedRepair.integrityCurrent)
    return Math.min(missing, status.dailyBudget.remaining)
  }, [status, selectedRepair])

  const projectBlueprints = useMemo(
    () => status?.blueprints.filter((b) => !b.isProcedure) ?? [],
    [status],
  )

  const procedureBlueprints = useMemo(
    () => status?.blueprints.filter((b) => b.isProcedure) ?? [],
    [status],
  )

  const repair = async () => {
    if (!selectedRepairId) return
    setBusy(true)
    try {
      const result = await artigianoApi.repair({
        inventoryId: selectedRepairId,
        amount: repairAmount,
        roomId: roomId ?? undefined,
      })
      toast.success(`Riparato: +${(result as { applied: number }).applied} INT`)
      await load()
      onUpdate?.()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Riparazione fallita')
    } finally {
      setBusy(false)
    }
  }

  const craft = async (blueprint: ArtigianoBlueprint) => {
    setCraftBusyId(blueprint.id)
    try {
      await artigianoApi.craft({
        blueprintId: blueprint.id,
        inventoryId: blueprint.isProcedure ? procedureTargetId || undefined : undefined,
        roomId: roomId ?? undefined,
      })
      toast.success(blueprint.isProcedure ? `${blueprint.name} eseguito` : `${blueprint.name} costruito`)
      await load()
      onUpdate?.()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Costruzione fallita')
    } finally {
      setCraftBusyId(null)
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Caricamento strumento artigiano…</p>
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
      <div className="flex flex-wrap gap-2 border-b border-[var(--border-color)] pb-2">
        {(
          [
            ['riparazione', 'Riparazione'],
            ['costruzione', 'Costruzione'],
            ['officina', 'Officina'],
          ] as const
        ).map(([id, label]) => (
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
            {label}
          </button>
        ))}
      </div>

      {tab !== 'officina' && (
        <div className="text-[10px] uppercase tracking-wider text-gray-500 font-display">
          Budget integrità oggi:{' '}
          <span className="text-[var(--accent-gold)] tabular-nums">
            {status.dailyBudget.remaining}/{status.dailyBudget.max}
          </span>
        </div>
      )}

      {tab === 'riparazione' && (
        <MercatoSection title="Oggetti da riparare">
          {repairable.length === 0 ? (
            <MercatoEmpty>Nessun oggetto danneggiato nello zaino.</MercatoEmpty>
          ) : (
            <div className="space-y-2">
              {repairable.map((row) => (
                <label
                  key={row.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                    selectedRepairId === row.id
                      ? 'border-[var(--accent-gold)]/50 bg-[var(--accent-gold)]/5'
                      : 'border-[var(--border-color)] bg-black/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="repair-target"
                    checked={selectedRepairId === row.id}
                    onChange={() => setSelectedRepairId(row.id)}
                    className="accent-[var(--accent-gold)]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-display truncate">{row.item.name}</p>
                    <p className="text-[10px] text-gray-500 tabular-nums">
                      INT {row.integrityCurrent}/{row.integrityMax}
                    </p>
                  </div>
                </label>
              ))}
              <div className="mt-3 space-y-2">
                <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-display">
                  Integrità da ripristinare (max {maxRepair})
                </label>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, maxRepair)}
                  value={repairAmount}
                  onChange={(e) => setRepairAmount(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full rounded border border-[var(--border-color)] bg-black/40 px-3 py-2 text-sm text-white"
                />
                <MercatoActionButton
                  label={busy ? '…' : 'Ripara'}
                  disabled={busy || maxRepair < 1}
                  onClick={repair}
                />
              </div>
            </div>
          )}
        </MercatoSection>
      )}

      {tab === 'costruzione' && (
        <div className="space-y-4">
          <MercatoSection title="Progetti">
            {projectBlueprints.length === 0 ? (
              <MercatoEmpty>Sblocca sottoclassi per nuovi progetti.</MercatoEmpty>
            ) : (
              <div className="space-y-2">
                {projectBlueprints.map((bp) => (
                  <MercatoRow
                    key={bp.id}
                    title={bp.name}
                    subtitle={`${bp.description} · ${formatMaterials(bp.materials)}`}
                    actions={
                      <MercatoActionButton
                        label={craftBusyId === bp.id ? '…' : 'Costruisci'}
                        disabled={craftBusyId === bp.id}
                        onClick={() => craft(bp)}
                      />
                    }
                  />
                ))}
              </div>
            )}
          </MercatoSection>

          {procedureBlueprints.length > 0 && (
            <MercatoSection title="Procedure">
              {repairable.length > 0 && (
                <div className="mb-3">
                  <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-display mb-1">
                    Bersaglio procedura
                  </label>
                  <select
                    value={procedureTargetId}
                    onChange={(e) => setProcedureTargetId(e.target.value)}
                    className="w-full rounded border border-[var(--border-color)] bg-black/40 px-2 py-1.5 text-sm text-white"
                  >
                    {repairable.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.item.name} (INT {r.integrityCurrent}/{r.integrityMax})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-2">
                {procedureBlueprints.map((bp) => (
                  <MercatoRow
                    key={bp.id}
                    title={bp.name}
                    subtitle={`${bp.description} · ${formatMaterials(bp.materials)} · budget ${bp.dailyBudgetCost} INT`}
                    actions={
                      <MercatoActionButton
                        label={craftBusyId === bp.id ? '…' : 'Esegui'}
                        disabled={craftBusyId === bp.id || (bp.isProcedure && !procedureTargetId)}
                        onClick={() => craft(bp)}
                      />
                    }
                  />
                ))}
              </div>
            </MercatoSection>
          )}
        </div>
      )}

      {tab === 'officina' && <DismantleSection char={char} onCharUpdate={onUpdate} />}
    </div>
  )
}
