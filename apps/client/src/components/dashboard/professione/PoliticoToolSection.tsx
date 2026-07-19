'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from '@/components/ui/Toast'
import { api } from '@/lib/api'
import { politicoApi } from '@/lib/politico-api'
import type { CharacterSummary } from '../types'
import {
  MercatoActionButton,
  MercatoEmpty,
  MercatoRow,
  MercatoSection,
} from '../mercato/mercato-ui'
import type { PactLeverage, PoliticoPactRow, PoliticoStatusResponse } from './politico-types'

const LEVERAGE_LABELS: Record<PactLeverage, string> = {
  formale: 'Formale',
  popolare: 'Popolare',
  sotterranea: 'Sotterranea',
  neutro: 'Neutro',
}

type Props = {
  char?: CharacterSummary
  roomId?: string | null
  onUpdate?: () => void
}

export function PoliticoToolSection({ char, roomId, onUpdate }: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<PoliticoStatusResponse | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [counterparty, setCounterparty] = useState('')
  const [leverage, setLeverage] = useState<PactLeverage>('neutro')
  const [notes, setNotes] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [alboUmani, setAlboUmani] = useState<{ id: string; nome: string; tier: number }[]>([])

  const load = useCallback(async () => {
    setError(null)
    try {
      const st = await politicoApi.getStatus()
      setStatus(st)
      setLeverage((prev) =>
        st.allowedLeverages.includes(prev) ? prev : (st.allowedLeverages[0] ?? 'neutro'),
      )
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Errore strumento politico')
      setStatus(null)
    }
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load, char?.id])

  /** Spec Shinigami §6: PNG umani dell'Albo condivisi con Tool Politico (se account Shinigami). */
  useEffect(() => {
    void api
      .get('/shinigami/combat/albo?tipo=umano')
      .then((d) => {
        const items = (d as { items?: { id: string; nome: string; tier: number }[] }).items ?? []
        setAlboUmani(items)
      })
      .catch(() => setAlboUmani([]))
  }, [char?.id])

  useEffect(() => {
    if (!status) return
    if (selectedTemplate && status.templates.some((t) => t.id === selectedTemplate)) return
    setSelectedTemplate(status.templates[0]?.id ?? '')
  }, [status, selectedTemplate])

  const selectedTemplateDef = useMemo(
    () => status?.templates.find((t) => t.id === selectedTemplate) ?? null,
    [status, selectedTemplate],
  )

  const canCreate = useMemo(() => {
    if (!status || !selectedTemplateDef) return false
    return (
      status.dailyBudget.pactActive.remaining > 0 &&
      selectedTemplateDef.weight <= status.limits.maxWeight
    )
  }, [status, selectedTemplateDef])

  const createPact = async () => {
    if (!selectedTemplate || !counterparty.trim()) {
      toast.error('Indica modello e controparte')
      return
    }
    setCreating(true)
    try {
      await politicoApi.createPact({
        templateId: selectedTemplate,
        counterpartyName: counterparty.trim(),
        leverage,
        notes: notes.trim() || undefined,
        roomId: roomId ?? undefined,
      })
      toast.success('Patto registrato')
      setCounterparty('')
      setNotes('')
      await load()
      onUpdate?.()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Registrazione Patto fallita')
    } finally {
      setCreating(false)
    }
  }

  const invokePact = async (pact: PoliticoPactRow) => {
    setBusyId(pact.id)
    try {
      await politicoApi.invokePact(pact.id, { roomId: roomId ?? undefined })
      toast.success('Patto richiamato in chat')
      await load()
      onUpdate?.()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Richiamo Patto fallito')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Caricamento Registro Patti…</p>
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
      <div className="flex flex-wrap gap-4 text-[10px] uppercase tracking-wider text-gray-500 font-display">
        <span>
          Patti attivi:{' '}
          <span className="text-[var(--accent-gold)] tabular-nums">
            {status.dailyBudget.pactActive.remaining}/{status.dailyBudget.pactActive.max}
          </span>
        </span>
        <span>
          Peso max per Patto:{' '}
          <span className="text-[var(--accent-violet-light)] tabular-nums">{status.limits.maxWeight}</span>
        </span>
      </div>

      <MercatoSection title="Nuovo Patto">
        {status.templates.length === 0 ? (
          <MercatoEmpty>Sblocca sottoclassi per nuovi modelli.</MercatoEmpty>
        ) : (
          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-display">
              Modello
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full rounded border border-[var(--border-color)] bg-black/40 px-2 py-2 text-sm text-white"
            >
              {status.templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (Peso {t.weight})
                </option>
              ))}
            </select>
            {selectedTemplateDef && (
              <p className="text-[10px] text-gray-600">{selectedTemplateDef.description}</p>
            )}
            <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-display mt-2">
              Controparte
            </label>
            {alboUmani.length > 0 && (
              <select
                value=""
                onChange={(e) => {
                  const name = e.target.value
                  if (name) setCounterparty(name)
                }}
                className="w-full mb-1.5 rounded border border-[var(--border-color)] bg-black/40 px-2 py-2 text-sm text-white"
              >
                <option value="">Da Albo PNG (umani)…</option>
                {alboUmani.map((n) => (
                  <option key={n.id} value={n.nome}>
                    {n.nome} · T{n.tier}
                  </option>
                ))}
              </select>
            )}
            <input
              value={counterparty}
              onChange={(e) => setCounterparty(e.target.value)}
              placeholder="Nome PG, fazione o PNG Albo"
              maxLength={120}
              className="w-full rounded border border-[var(--border-color)] bg-black/40 px-2 py-2 text-sm text-white"
            />
            <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-display mt-2">
              Leva
            </label>
            <select
              value={leverage}
              onChange={(e) => setLeverage(e.target.value as PactLeverage)}
              className="w-full rounded border border-[var(--border-color)] bg-black/40 px-2 py-2 text-sm text-white"
            >
              {status.allowedLeverages.map((l) => (
                <option key={l} value={l}>
                  {LEVERAGE_LABELS[l]}
                </option>
              ))}
            </select>
            <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-display mt-2">
              Note (opzionale)
            </label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Clausole, luogo, scadenza narrativa…"
              maxLength={500}
              className="w-full rounded border border-[var(--border-color)] bg-black/40 px-2 py-2 text-sm text-white"
            />
            <MercatoActionButton
              label={creating ? '…' : 'Registra Patto'}
              disabled={!canCreate || creating || !counterparty.trim()}
              onClick={createPact}
            />
            {!canCreate && status.templates.length > 0 && (
              <p className="text-[10px] text-gray-600">
                {status.dailyBudget.pactActive.remaining <= 0
                  ? 'Hai raggiunto il massimo di Patti attivi.'
                  : 'Modello oltre il tuo limite di Peso.'}
              </p>
            )}
            <p className="text-[10px] text-gray-600">
              L&apos;atto viene registrato in chat se sei in una stanza valida.
            </p>
          </div>
        )}
      </MercatoSection>

      <MercatoSection title="Registro Patti">
        {status.pacts.length === 0 ? (
          <MercatoEmpty>Nessun Patto registrato.</MercatoEmpty>
        ) : (
          <div className="space-y-2">
            {status.pacts.map((pact) => (
              <MercatoRow
                key={pact.id}
                title={`${pact.templateName} — ${pact.counterpartyName}`}
                subtitle={`Peso ${pact.weight} · ${LEVERAGE_LABELS[pact.leverage]} · ${pact.status}${pact.notes ? ` · ${pact.notes}` : ''}`}
                actions={
                  pact.status === 'active' ? (
                    <MercatoActionButton
                      label={busyId === pact.id ? '…' : 'Richiama'}
                      disabled={busyId === pact.id}
                      onClick={() => invokePact(pact)}
                    />
                  ) : undefined
                }
              />
            ))}
          </div>
        )}
      </MercatoSection>
    </div>
  )
}
