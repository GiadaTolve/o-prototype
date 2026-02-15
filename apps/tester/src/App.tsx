import { useState, useMemo } from 'react'
import { calculateDerivedStats, type BaseStats } from '@domain/stats/calculator'
import type { StatsMap } from './types'
import { calcWazaFormulas } from './wazaFormulas'
import { GRADES, getTotalStatPoints } from './statPointsConfig'
import {
  CS_CAPACITY,
  CS_PER_TURN,
  CS_PER_HIT_TAKEN,
  CS_MOVE_LIMITS,
  overheatDamagePerTurn,
  isOverheated,
} from './chronoStack'

const STAT_LABELS: Record<keyof BaseStats, string> = {
  strength: 'Forza [F]',
  constitution: 'Costituzione [C]',
  dexterity: 'Destrezza [D]',
  mind: 'Mente [M]',
  empathy: 'Empatia [E]',
}

function App() {
  const [characterLevel, setCharacterLevel] = useState(1)
  const [gradeId, setGradeId] = useState<string>(GRADES[0].id)
  const [baseStats, setBaseStats] = useState<BaseStats>({
    strength: 10,
    constitution: 10,
    dexterity: 10,
    mind: 10,
    empathy: 10,
  })
  const [tierY, setTierY] = useState(1)
  const [skillLevel, setSkillLevel] = useState(1)
  const [currentCs, setCurrentCs] = useState(0)
  const [turnCount, setTurnCount] = useState(0)
  const [csLog, setCsLog] = useState<string[]>([])
  const [csConsumeAmount, setCsConsumeAmount] = useState('')

  const totalStatPoints = useMemo(
    () => getTotalStatPoints(characterLevel, gradeId),
    [characterLevel, gradeId]
  )
  const currentStatTotal = baseStats.strength + baseStats.constitution + baseStats.dexterity + baseStats.mind + baseStats.empathy
  const remainingStatPoints = Math.max(0, totalStatPoints - currentStatTotal)

  const derived = calculateDerivedStats(baseStats, tierY)
  const csOverheat = overheatDamagePerTurn(currentCs)
  const csOverheated = isOverheated(currentCs)
  const statsMap: StatsMap = {
    F: baseStats.strength,
    C: baseStats.constitution,
    D: baseStats.dexterity,
    M: baseStats.mind,
    E: baseStats.empathy,
    LVL: skillLevel,
  }
  const wazaResults = calcWazaFormulas(statsMap)

  const handleStatChange = (key: keyof BaseStats, value: number) => {
    const v = Math.max(0, Math.min(99, value))
    setBaseStats((prev) => {
      const next = { ...prev, [key]: v }
      const sum = next.strength + next.constitution + next.dexterity + next.mind + next.empathy
      if (sum > totalStatPoints) return prev
      return next
    })
  }

  const resetStatsToFit = () => {
    const perStat = Math.floor(totalStatPoints / 5)
    const remainder = totalStatPoints % 5
    setBaseStats({
      strength: perStat + (remainder > 0 ? 1 : 0),
      constitution: perStat + (remainder > 1 ? 1 : 0),
      dexterity: perStat + (remainder > 2 ? 1 : 0),
      mind: perStat + (remainder > 3 ? 1 : 0),
      empathy: perStat,
    })
  }

  const handleCsTurn = () => {
    setCurrentCs((c) => c + CS_PER_TURN)
    setTurnCount((t) => t + 1)
    setCsLog((prev) => [`Turno ${turnCount + 1}: +${CS_PER_TURN} cs`, ...prev].slice(0, 10))
  }
  const handleCsHitTaken = () => {
    setCurrentCs((c) => c + CS_PER_HIT_TAKEN)
    setCsLog((prev) => [`Colpo subito: +${CS_PER_HIT_TAKEN} cs`, ...prev].slice(0, 10))
  }
  const handleCsConsume = (amount: number) => {
    if (amount <= 0) return
    setCurrentCs((c) => Math.max(0, c - amount))
    setCsLog((prev) => [`Consumate ${amount} cs`, ...prev].slice(0, 10))
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#c9a84a' }}>
          Waza & Stats Tester
        </h1>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#888' }}>
          Livello, grado, statistiche e formule. Vedi <code>STAT_POINTS_CONFIG.md</code>.
        </p>
      </header>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1rem', color: '#a270ff', marginBottom: '1rem' }}>
          Livello e Grado
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1rem' }}>
          I punti stat dipendono dal livello. Il grado è libero (indicativo). Config in <code>statPointsConfig.ts</code>.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ minWidth: 100 }}>Livello</span>
            <input
              type="number"
              min={1}
              max={50}
              value={characterLevel}
              onChange={(e) => {
                const lvl = Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 1))
                setCharacterLevel(lvl)
              }}
              style={{
                width: 60,
                padding: '0.35rem',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 4,
                color: '#fff',
              }}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ minWidth: 80 }}>Grado</span>
            <select
              value={gradeId}
              onChange={(e) => setGradeId(e.target.value)}
              style={{
                minWidth: 180,
                padding: '0.35rem',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 4,
                color: '#fff',
              }}
            >
              {GRADES.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} — Vel ×{g.velMult} / Dmg ×{g.dmgMult}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div
          style={{
            padding: '1rem',
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.4)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span style={{ color: '#22c55e', fontWeight: 600 }}>
            Punti stat totali: {totalStatPoints}
          </span>
          <span
            style={{
              color: remainingStatPoints === 0 ? '#22c55e' : remainingStatPoints < 0 ? '#ef4444' : '#eab308',
              fontWeight: 600,
            }}
          >
            Disponibili: {remainingStatPoints}
          </span>
          {currentStatTotal > totalStatPoints && (
            <button
              type="button"
              onClick={resetStatsToFit}
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                background: 'rgba(239,68,68,0.2)',
                border: '1px solid #ef4444',
                borderRadius: 4,
                color: '#ef4444',
                cursor: 'pointer',
              }}
            >
              Ridistribuisci
            </button>
          )}
        </div>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1rem', color: '#a270ff', marginBottom: '1rem' }}>
          Statistiche base (F, C, D, M, E)
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          {(Object.keys(STAT_LABELS) as (keyof BaseStats)[]).map((key) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ minWidth: 120 }}>{STAT_LABELS[key]}</span>
              <input
                type="number"
                min={0}
                max={99}
                value={baseStats[key]}
                onChange={(e) => handleStatChange(key, parseInt(e.target.value, 10) || 0)}
                style={{
                  width: 60,
                  padding: '0.35rem',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 4,
                  color: '#fff',
                }}
              />
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ minWidth: 120 }}>Moltiplicatore Y (Tier)</span>
            <input
              type="number"
              min={0.1}
              max={5}
              step={0.1}
              value={tierY}
              onChange={(e) => setTierY(parseFloat(e.target.value) || 1)}
              style={{
                width: 80,
                padding: '0.35rem',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 4,
                color: '#fff',
              }}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ minWidth: 120 }}>Livello skill ($LVL)</span>
            <input
              type="number"
              min={1}
              max={10}
              value={skillLevel}
              onChange={(e) => setSkillLevel(Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1)))}
              style={{
                width: 60,
                padding: '0.35rem',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 4,
                color: '#fff',
              }}
            />
          </label>
        </div>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1rem', color: '#a270ff', marginBottom: '1rem' }}>
          Statistiche derivate
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '0.75rem',
            padding: '1rem',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <StatBox label="HP (Body)" value={derived.hpMax} />
          <StatBox label="Kotodama" value={derived.kotodamaMax} />
          <StatBox label="Riflessi" value={derived.reflexes} />
          <StatBox label="Velocità" value={derived.velocity} />
          <StatBox label="Movimento (m)" value={derived.movement} />
          <StatBox label="Salto (m)" value={derived.jump} />
          <StatBox label="Peso (kg)" value={derived.carryWeight} />
          <StatBox label="Percezione fisica" value={derived.perceptionPhysical} />
          <StatBox label="Percezione spirituale" value={derived.perceptionSpiritual} />
          <StatBox label="Danno CAC" value={derived.meleeDamage} />
          <StatBox label="Danno CAD" value={derived.rangedDamage} />
          <StatBox label="Distanza ingaggio (m)" value={derived.engageDistance} />
          <div style={{ gridColumn: '1 / -1' }}>
            <span style={{ color: '#888', fontSize: '0.8rem' }}>Lancio: </span>
            <span style={{ marginRight: '1rem' }}>Piccole {derived.throwRange.small}m</span>
            <span style={{ marginRight: '1rem' }}>Medie {derived.throwRange.medium}m</span>
            <span style={{ marginRight: '1rem' }}>Grandi {derived.throwRange.large}m</span>
            <span>Giganti {derived.throwRange.giant}m</span>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1rem', color: '#a270ff', marginBottom: '1rem' }}>
          Waza — Ramo Dō (Le vie)
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1rem' }}>
          Valori calcolati in base a F, C, D, M, E e livello skill. Vedi <code>WAZA_CALCOLI.md</code> e <code>CHRONO_STACK.md</code>.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {wazaResults.map((w) => (
            <div
              key={w.name}
              style={{
                padding: '0.75rem 1rem',
                background: w.type === 'passive' ? 'rgba(74,222,128,0.08)' : 'rgba(162,112,255,0.08)',
                border: `1px solid ${w.type === 'passive' ? 'rgba(74,222,128,0.3)' : 'rgba(162,112,255,0.3)'}`,
                borderRadius: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: 600, color: '#fff' }}>{w.name}</span>
                <span style={{ fontSize: '0.7rem', color: '#888' }}>{w.type === 'passive' ? 'Passiva' : 'Attiva'}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                {w.cost != null && <div>Costo: <strong style={{ color: '#c9a84a' }}>{w.cost}</strong> Jigo-ka</div>}
                {w.x != null && <div>{w.xLabel}: <strong style={{ color: '#c9a84a' }}>{w.x}</strong></div>}
                {w.x2 != null && <div>{w.x2Label}: <strong style={{ color: '#c9a84a' }}>{w.x2}</strong></div>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1rem', color: '#a270ff', marginBottom: '1rem' }}>
          Chrono Stack [cs] — Contatore per turno
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1rem' }}>
          Simula l'accumulo turno per turno. Vedi <code>CHRONO_STACK.md</code> per il regolamento.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '0.75rem',
            marginBottom: '1rem',
          }}
        >
          <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.25rem' }}>Stack attuali</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: currentCs > CS_CAPACITY ? '#ef4444' : '#fff' }}>
              {currentCs} cs
            </div>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.25rem' }}>Turno</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff' }}>{turnCount}</div>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.25rem' }}>Capacità</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff' }}>{CS_CAPACITY} cs</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          <button
            type="button"
            onClick={handleCsTurn}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(34,197,94,0.2)',
              border: '1px solid #22c55e',
              borderRadius: 4,
              color: '#22c55e',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Inizio turno (+{CS_PER_TURN} cs)
          </button>
          <button
            type="button"
            onClick={handleCsHitTaken}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(234,179,8,0.2)',
              border: '1px solid #eab308',
              borderRadius: 4,
              color: '#eab308',
              cursor: 'pointer',
            }}
          >
            Colpo subito (+{CS_PER_HIT_TAKEN} cs)
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="number"
              min={1}
              max={99}
              placeholder="Consuma"
              value={csConsumeAmount}
              onChange={(e) => setCsConsumeAmount(e.target.value)}
              style={{
                width: 60,
                padding: '0.5rem',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 4,
                color: '#fff',
              }}
            />
            <button
              type="button"
              onClick={() => {
                const val = parseInt(csConsumeAmount || '0', 10)
                if (val > 0) {
                  handleCsConsume(val)
                  setCsConsumeAmount('')
                }
              }}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(239,68,68,0.2)',
                border: '1px solid #ef4444',
                borderRadius: 4,
                color: '#ef4444',
                cursor: 'pointer',
              }}
            >
              Consuma cs
            </button>
          </div>
          <button
            type="button"
            onClick={() => { setCurrentCs(0); setTurnCount(0); setCsLog([]); }}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 4,
              color: '#888',
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </div>
        {csOverheated && (
          <div
            style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.5)',
              borderRadius: 8,
              color: '#fca5a5',
              fontSize: '0.9rem',
            }}
          >
            <strong>Overheat</strong> — Danno per turno: <strong>-{csOverheat} PV</strong> (fino a scarica)
          </div>
        )}
        {csLog.length > 0 && (
          <div style={{ marginBottom: '1rem', fontSize: '0.8rem', color: '#666' }}>
            Ultimi eventi: {csLog.join(' · ')}
          </div>
        )}
        <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: '#888' }}>Limiti mosse per azione:</div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem',
            fontSize: '0.85rem',
          }}
        >
          {CS_MOVE_LIMITS.map(({ cost, max }) => (
            <div
              key={cost}
              style={{
                padding: '0.5rem 0.75rem',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 4,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>Mosse da {cost} cs</span>
              <span style={{ color: '#c9a84a', fontWeight: 600 }}>max {max}</span>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#555' }}>
        Config: <code>statPointsConfig.ts</code>. Vedi STAT_POINTS_CONFIG.md, WAZA_CALCOLI.md, CHRONO_STACK.md.
      </footer>
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.2rem' }}>{label}</div>
      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>{value}</div>
    </div>
  )
}

export default App
