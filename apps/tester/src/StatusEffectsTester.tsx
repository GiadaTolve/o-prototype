/**
 * Tester Status §2.4 — stack, decay, modificatori combattimento.
 */
import { useMemo, useState } from 'react'
import {
  STATUS_DEFINITIONS,
  ELEMENTAL_STATUS_BY_ELEMENT,
  applyStatus,
  applyElementalStatus,
  tickStatusEndOfCharacterTurn,
  onSuccessfulHitTaken,
  onConfrontationStatusEvent,
  compileStatusModifiers,
  statusToOffensiveDamageBonuses,
  statusToDamageTakenFlatBonus,
  adjustCsCostFromStatus,
  createStatusContainer,
  type StatusId,
  type ElementId,
  type StatusContainer,
} from '@domain/combat'
import { getTierRow, resolveDamageToHp, type WazaTier } from '@domain/combat'

const EMOTIONAL: StatusId[] = ['ira', 'tristezza', 'disperazione', 'beatitudine', 'euforia']
const ELEMENTAL: StatusId[] = ['incendiato', 'sovraccarico', 'torpore', 'appesantimento', 'vertigini']
const ATYPICAL: StatusId[] = [
  'emorragia',
  'debitore',
  'metamorfosi',
  'trance_onirica',
  'sigillato',
  'macchiato',
]

export default function StatusEffectsTester() {
  const [container, setContainer] = useState<StatusContainer>(() => createStatusContainer())
  const [targetKind, setTargetKind] = useState<'character' | 'construct'>('character')
  const [currentCs, setCurrentCs] = useState(8)
  const [wazaTier, setWazaTier] = useState<WazaTier>(3)
  const [tickLog, setTickLog] = useState<string[]>([])

  const activeContainer = useMemo(
    () => ({ ...container, targetKind }),
    [container, targetKind],
  )

  const modifiers = useMemo(() => compileStatusModifiers(activeContainer), [activeContainer])

  const offensiveBonuses = useMemo(
    () => statusToOffensiveDamageBonuses(activeContainer, wazaTier),
    [activeContainer, wazaTier],
  )

  const takenFlat = useMemo(
    () => statusToDamageTakenFlatBonus(activeContainer, wazaTier),
    [activeContainer, wazaTier],
  )

  const adjustedCs = useMemo(
    () => adjustCsCostFromStatus(getTierRow(wazaTier).csCost, activeContainer),
    [activeContainer, wazaTier],
  )

  const pipelinePreview = useMemo(() => {
    const base = resolveDamageToHp({
      tier: wazaTier,
      targetSheet: { itami: 3 },
      bonuses: offensiveBonuses,
    })
    if (takenFlat <= 0) return base
    return resolveDamageToHp({
      tier: wazaTier,
      targetSheet: { itami: 3 },
      bonuses: {
        ...offensiveBonuses,
        flatBonus: (offensiveBonuses.flatBonus ?? 0) + takenFlat,
      },
    })
  }, [wazaTier, offensiveBonuses, takenFlat])

  const toggleStatus = (id: StatusId) => {
    const has = container.statuses.some((s) => s.id === id)
    setContainer(
      has
        ? { ...container, statuses: container.statuses.filter((s) => s.id !== id) }
        : applyStatus(container, id),
    )
  }

  const applyElement = (element: ElementId) => {
    setContainer(applyElementalStatus(container, element))
  }

  const runTick = () => {
    const result = tickStatusEndOfCharacterTurn(activeContainer, { currentCs })
    setContainer(result.container)
    setTickLog(result.log)
  }

  return (
    <div>
      <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1rem' }}>
        Motore status §2.4 — stack = durata turni (emotivi); decay a fine turno PG; modificatori
        compilati per CS/danno/IR.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <label style={labelStyle}>
          Target
          <select
            value={targetKind}
            onChange={(e) => setTargetKind(e.target.value as 'character' | 'construct')}
            style={inputStyle}
          >
            <option value="character">Personaggio</option>
            <option value="construct">Costrutto</option>
          </select>
        </label>
        <label style={labelStyle}>
          CS attuale (Beatitudine)
          <input
            type="number"
            min={0}
            value={currentCs}
            onChange={(e) => setCurrentCs(Math.max(0, Number(e.target.value) || 0))}
            style={inputStyle}
          />
        </label>
        <label style={labelStyle}>
          Tier waza preview
          <select
            value={wazaTier}
            onChange={(e) => setWazaTier(Number(e.target.value) as WazaTier)}
            style={inputStyle}
          >
            {[1, 2, 3, 4, 5].map((t) => (
              <option key={t} value={t}>
                T{t}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Section title="Emotivi">
        <StatusGrid ids={EMOTIONAL} container={container} onToggle={toggleStatus} />
      </Section>

      <Section title="Elementali (durata 3 turni)">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          {(Object.keys(ELEMENTAL_STATUS_BY_ELEMENT) as ElementId[]).map((el) => (
            <button
              key={el}
              type="button"
              onClick={() => applyElement(el)}
              style={chipBtn}
            >
              {ELEMENTAL_STATUS_BY_ELEMENT[el].label} → {STATUS_DEFINITIONS[ELEMENTAL_STATUS_BY_ELEMENT[el].statusId].tag}
            </button>
          ))}
        </div>
        <StatusGrid ids={ELEMENTAL} container={container} onToggle={toggleStatus} />
      </Section>

      <Section title="Atipici (Madoshō)">
        <StatusGrid ids={ATYPICAL} container={container} onToggle={toggleStatus} />
      </Section>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1.5rem' }}>
        <button type="button" onClick={runTick} style={actionBtn}>
          Fine turno PG (decay + DoT)
        </button>
        <button
          type="button"
          onClick={() => setContainer(onSuccessfulHitTaken(container))}
          style={actionBtn}
        >
          Colpo subito (Macchiato −1)
        </button>
        <button
          type="button"
          onClick={() =>
            setContainer(onConfrontationStatusEvent(container, { won: true, tookDamage: false }))
          }
          style={actionBtn}
        >
          Euforia +1 (vittoria confronto)
        </button>
        <button
          type="button"
          onClick={() => setContainer(createStatusContainer(targetKind))}
          style={{ ...actionBtn, opacity: 0.7 }}
        >
          Pulisci
        </button>
      </div>

      {tickLog.length > 0 && (
        <p style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '1rem' }}>
          Tick: {tickLog.join(' · ')}
        </p>
      )}

      <section style={panelStyle}>
        <h3 style={panelTitle}>Modificatori compilati</h3>
        <dl style={dlStyle}>
          <Row label="CS cost (T tier base)" value={`${getTierRow(wazaTier).csCost} → ${adjustedCs}`} />
          <Row label="Offensive tier bonus" value={modifiers.offensiveTierBonus} />
          <Row label="Damage taken tier bonus" value={modifiers.damageTakenTierBonus} />
          <Row label="Danno ×" value={modifiers.damageMultiplier} />
          <Row label="Movimento ×" value={modifiers.movementMultiplier} />
          <Row label="IR bonus" value={modifiers.indexBonus} />
          <Row label="+CS/turno" value={modifiers.bonusCsPerTurn} />
          <Row label="Blocca CS gain" value={modifiers.blockCsGain ? 'sì' : 'no'} />
          <Row label="Blocca Waza" value={modifiers.blockWaza ? 'sì' : 'no'} />
          <Row label="Pipeline HP preview" value={pipelinePreview.hpDamage} highlight />
        </dl>
        {container.statuses.length > 0 && (
          <p style={{ margin: '1rem 0 0', fontSize: '0.75rem', color: '#666' }}>
            Attivi:{' '}
            {container.statuses
              .map((s) => `${STATUS_DEFINITIONS[s.id].tag} (${s.stacks})`)
              .join(', ')}
          </p>
        )}
      </section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '1rem' }}>
      <h4 style={{ margin: '0 0 0.5rem', color: '#c9a84a', fontSize: '0.85rem' }}>{title}</h4>
      {children}
    </section>
  )
}

function StatusGrid({
  ids,
  container,
  onToggle,
}: {
  ids: StatusId[]
  container: StatusContainer
  onToggle: (id: StatusId) => void
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {ids.map((id) => {
        const def = STATUS_DEFINITIONS[id]
        const active = container.statuses.find((s) => s.id === id)
        return (
          <button
            key={id}
            type="button"
            onClick={() => onToggle(id)}
            title={def.description}
            style={{
              ...chipBtn,
              borderColor: active ? 'rgba(201,168,74,0.8)' : 'rgba(255,255,255,0.15)',
              background: active ? 'rgba(201,168,74,0.2)' : 'rgba(0,0,0,0.35)',
            }}
          >
            {def.tag}
            {active ? ` (${active.stacks})` : ''}
          </button>
        )
      })}
    </div>
  )
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string
  value: string | number
  highlight?: boolean
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
      <dt style={{ color: '#888' }}>{label}</dt>
      <dd
        style={{
          margin: 0,
          fontFamily: 'monospace',
          color: highlight ? '#22c55e' : '#ccc',
          fontWeight: highlight ? 700 : 400,
        }}
      >
        {value}
      </dd>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  fontSize: '0.75rem',
  color: '#888',
}

const inputStyle: React.CSSProperties = {
  padding: '0.4rem 0.5rem',
  background: 'rgba(0,0,0,0.4)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 4,
  color: '#fff',
}

const chipBtn: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: '0.72rem',
  borderRadius: 4,
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(0,0,0,0.35)',
  color: '#ddd',
  cursor: 'pointer',
}

const actionBtn: React.CSSProperties = {
  ...chipBtn,
  padding: '6px 12px',
  color: '#c9a84a',
  borderColor: 'rgba(201,168,74,0.45)',
}

const panelStyle: React.CSSProperties = {
  padding: '1rem',
  background: 'rgba(0,0,0,0.4)',
  borderRadius: 10,
  border: '1px solid rgba(201,168,74,0.35)',
}

const panelTitle: React.CSSProperties = {
  margin: '0 0 1rem',
  color: '#c9a84a',
  fontSize: '1rem',
}

const dlStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '0.9rem',
  lineHeight: 1.8,
}
