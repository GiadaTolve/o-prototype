/**
 * Tester Combattimento v3 — IR + Tier + CS (@domain/combat).
 * Niente Reflexes, Jigoka, F/C/D/M/E.
 */

import { useMemo, useState } from 'react'
import {
  calculateHpMaxFromSkiru,
  calculateSkiruDerivedStats,
  type SkiruSheet,
} from '@domain/skiru'
import { type WazaTier } from '@domain/combat'
import {
  runCombat,
  createDefaultBuild,
  type CombatBuild,
  type LogEntry,
} from './combatSimulator'

type SkiruSliderKey =
  | 'kensei'
  | 'itten-kokan'
  | 'hansha'
  | 'shintai-kokan'
  | 'dokusei'
  | 'konjou'
  | 'itami'
  | 'undo'

const SKIRU_SLIDERS: { key: SkiruSliderKey; label: string; hint: string }[] = [
  { key: 'kensei', label: 'Kensei', hint: 'IR offensivo fisico' },
  { key: 'itten-kokan', label: 'Itten Kōkan', hint: 'IR offensivo incanalamento' },
  { key: 'hansha', label: 'Hansha', hint: 'IR difensivo fisico' },
  { key: 'shintai-kokan', label: 'Shintai Kōkan', hint: 'IR difensivo incanalamento' },
  { key: 'dokusei', label: 'Dokusei', hint: 'HP (+ Konjou)' },
  { key: 'konjou', label: 'Konjou', hint: 'HP (+ Dokusei)' },
  { key: 'itami', label: 'Itami', hint: 'Mitigazione danno' },
  { key: 'undo', label: 'Undō', hint: 'Movimento (info)' },
]

const defaultSkiru: Record<SkiruSliderKey, number> = {
  kensei: 3,
  'itten-kokan': 2,
  hansha: 2,
  'shintai-kokan': 2,
  dokusei: 2,
  konjou: 2,
  itami: 1,
  undo: 2,
}

function sheetFromSliders(values: Record<SkiruSliderKey, number>): SkiruSheet {
  return { ...values }
}

function BuildForm({
  label,
  name,
  setName,
  skiru,
  setSkiru,
  wazaTier,
  setWazaTier,
}: {
  label: string
  name: string
  setName: (v: string) => void
  skiru: Record<SkiruSliderKey, number>
  setSkiru: React.Dispatch<React.SetStateAction<Record<SkiruSliderKey, number>>>
  wazaTier: WazaTier
  setWazaTier: (v: WazaTier) => void
}) {
  const sheet = useMemo(() => sheetFromSliders(skiru), [skiru])
  const derived = useMemo(() => calculateSkiruDerivedStats(sheet), [sheet])
  const hpMax = calculateHpMaxFromSkiru(sheet)

  const setNode = (key: SkiruSliderKey, value: number) => {
    const v = Math.max(0, Math.min(10, value))
    setSkiru((prev) => ({ ...prev, [key]: v }))
  }

  return (
    <div
      style={{
        padding: '1rem',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 10,
        border: '1px solid rgba(162,112,255,0.3)',
      }}
    >
      <h3 style={{ margin: '0 0 1rem', color: '#a270ff', fontSize: '1rem' }}>{label}</h3>
      <label style={{ display: 'block', marginBottom: '0.75rem' }}>
        Nome
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Es. Tank"
          style={inputStyle}
        />
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
        <span style={{ minWidth: 90 }}>Tier Waza max</span>
        <select
          value={wazaTier}
          onChange={(e) => setWazaTier(Number(e.target.value) as WazaTier)}
          style={{ ...inputStyle, minWidth: 80 }}
        >
          {[1, 2, 3, 4, 5].map((t) => (
            <option key={t} value={t}>
              T{t}
            </option>
          ))}
        </select>
      </label>
      <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.75rem' }}>
        HP: {hpMax} · Mitigazione: {derived.mitigationPercent}% · Mov:{' '}
        {derived.movementMetersPerQuarter} m/q
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.5rem',
        }}
      >
        {SKIRU_SLIDERS.map(({ key, label: nodeLabel, hint }) => (
          <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: '0.75rem', color: '#888' }} title={hint}>
              {nodeLabel}
            </span>
            <input
              type="number"
              min={0}
              max={10}
              value={skiru[key]}
              onChange={(e) => setNode(key, parseInt(e.target.value, 10) || 0)}
              style={{ ...inputStyle, width: 56 }}
            />
          </label>
        ))}
      </div>
    </div>
  )
}

function LogLine({ entry }: { entry: LogEntry }) {
  switch (entry.type) {
    case 'initiative':
      return (
        <div style={{ color: '#60a5fa' }}>
          Iniziativa (coin flip): {entry.firstWho} → {entry.secondWho}
        </div>
      )
    case 'turn_start':
      return (
        <div style={{ color: '#888', marginTop: 4 }}>
          Turno {entry.turn} — {entry.who} | CS: {entry.csBefore}
          {entry.overheatDmg != null && (
            <span style={{ color: '#ef4444' }}> | Overheat: −{entry.overheatDmg} PV</span>
          )}
        </div>
      )
    case 'defaticamento':
      return (
        <div style={{ color: '#eab308', marginLeft: 12 }}>
          → Defaticamento: {entry.who} salta il turno
        </div>
      )
    case 'pass':
      return (
        <div style={{ color: '#888', marginLeft: 12 }}>
          → Passa: {entry.reason}
        </div>
      )
    case 'waza':
      return (
        <div style={{ color: entry.outcome === 'hit' ? '#22c55e' : '#888', marginLeft: 12 }}>
          → T{entry.wazaTier} (−{entry.costCs} CS) IR {entry.irAttacker} vs {entry.irDefender} →{' '}
          {entry.outcome === 'hit'
            ? `${entry.dmg} PV a ${entry.target}`
            : entry.outcome === 'miss'
              ? 'mancato'
              : 'stallo'}
          {entry.outcome === 'hit' && entry.pipeline && (
            <span style={{ color: '#888', fontSize: '0.75rem' }}>
              {' '}
              (base {entry.pipeline.baseDamage}
              {entry.pipeline.shieldAbsorbed > 0 && ` − scudo ${entry.pipeline.shieldAbsorbed}`}
              {entry.pipeline.mitigationPercent > 0 &&
                ` × ${100 - entry.pipeline.mitigationPercent}% Itami`}
              )
            </span>
          )}
        </div>
      )
    case 'hit':
      return (
        <div style={{ color: '#f87171', marginLeft: 20 }}>
          {entry.target}: {entry.targetHpAfter} PV restanti
        </div>
      )
    case 'miss':
      return (
        <div style={{ color: '#888', marginLeft: 20 }}>
          Mancato su {entry.target}
        </div>
      )
    case 'ko':
      return (
        <div style={{ color: '#ef4444', fontWeight: 700, marginTop: 6 }}>
          KO: {entry.who}
        </div>
      )
    case 'timeout':
      return (
        <div style={{ color: '#eab308', fontWeight: 600 }}>
          Timeout — combattimento interrotto
        </div>
      )
    default:
      return null
  }
}

export default function CombatTester() {
  const [nameA, setNameA] = useState('Build A')
  const [nameB, setNameB] = useState('Build B')
  const [skiruA, setSkiruA] = useState({ ...defaultSkiru })
  const [skiruB, setSkiruB] = useState({ ...defaultSkiru })
  const [tierA, setTierA] = useState<WazaTier>(2)
  const [tierB, setTierB] = useState<WazaTier>(2)

  const [result, setResult] = useState<{
    winner: string | null
    turnCount: number
    log: LogEntry[]
  } | null>(null)

  const run = () => {
    const buildA: CombatBuild = {
      ...createDefaultBuild(nameA || 'Build A', tierA),
      skiruSheet: sheetFromSliders(skiruA),
      wazaTier: tierA,
    }
    const buildB: CombatBuild = {
      ...createDefaultBuild(nameB || 'Build B', tierB),
      skiruSheet: sheetFromSliders(skiruB),
      wazaTier: tierB,
    }

    setResult(runCombat(buildA, buildB))
  }

  return (
    <div>
      <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1rem' }}>
        Simulatore v3 — IR, tier/CS, Overheat −2 PV/stack (COMBAT_SPEC).
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        <BuildForm
          label="Build A"
          name={nameA}
          setName={setNameA}
          skiru={skiruA}
          setSkiru={setSkiruA}
          wazaTier={tierA}
          setWazaTier={setTierA}
        />
        <BuildForm
          label="Build B"
          name={nameB}
          setName={setNameB}
          skiru={skiruB}
          setSkiru={setSkiruB}
          wazaTier={tierB}
          setWazaTier={setTierB}
        />
      </div>

      <section style={{ marginBottom: '1rem' }}>
        <button type="button" onClick={run} style={runButtonStyle}>
          Simula combattimento
        </button>
      </section>

      {result && (
        <section
          style={{
            padding: '1rem',
            background: 'rgba(0,0,0,0.4)',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <h3 style={{ margin: '0 0 0.75rem', color: '#c9a84a' }}>
            Esito: {result.winner ? `Vincitore: ${result.winner}` : 'Timeout'} — {result.turnCount}{' '}
            turni
          </h3>
          <div
            style={{
              fontSize: '0.85rem',
              fontFamily: 'monospace',
              maxHeight: 400,
              overflowY: 'auto',
            }}
          >
            {result.log.map((entry, i) => (
              <LogLine key={i} entry={entry} />
            ))}
          </div>
        </section>
      )}

      <footer style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#555' }}>
        +3 CS/turno · +1 CS colpo subito · cap 20 · Overheat −2 PV/stack · max 2 turni → Defaticamento
      </footer>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '0.35rem 0.5rem',
  background: 'rgba(0,0,0,0.4)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 4,
  color: '#fff',
}

const runButtonStyle: React.CSSProperties = {
  padding: '0.6rem 1.5rem',
  background: 'rgba(34,197,94,0.3)',
  border: '1px solid #22c55e',
  borderRadius: 8,
  color: '#22c55e',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '1rem',
}
