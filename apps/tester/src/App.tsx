import { useState, useMemo } from 'react'
import { calculateDerivedStats, type BaseStats } from '@domain/stats/calculator'
import { GRADES, getTotalStatPoints } from './statPointsConfig'
import {
  WAZA_POOL,
  BRANCH_LABELS,
  calcVelocity,
  calcDamage,
  resolveDbw,
  type WazaDef,
  type WazaBranch,
} from './wazaPool'

const STAT_LABELS: Record<keyof BaseStats, string> = {
  strength: 'Forza [F]',
  constitution: 'Costituzione [C]',
  dexterity: 'Destrezza [D]',
  mind: 'Mente [M]',
  empathy: 'Empatia [E]',
}

const CS_INITIATIVE = 5
const CS_PER_TURN = 3
const CS_PER_HIT = 1
const CS_CAPACITY = 20

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
  const [bonusDmg, setBonusDmg] = useState(0)
  const [selectedBranch, setSelectedBranch] = useState<WazaBranch>('do')

  // Simulatore combattimento
  const [combatStarted, setCombatStarted] = useState(false)
  const [currentCs, setCurrentCs] = useState(0)
  const [turnCount, setTurnCount] = useState(0)
  const [currentKotodama, setCurrentKotodama] = useState(0)
  const [currentHp, setCurrentHp] = useState(0)
  const [combatLog, setCombatLog] = useState<string[]>([])

  const grade = GRADES.find((g) => g.id === gradeId) ?? GRADES[0]
  const totalStatPoints = useMemo(
    () => getTotalStatPoints(characterLevel, gradeId),
    [characterLevel, gradeId]
  )
  const currentStatTotal =
    baseStats.strength +
    baseStats.constitution +
    baseStats.dexterity +
    baseStats.mind +
    baseStats.empathy
  const remainingStatPoints = Math.max(0, totalStatPoints - currentStatTotal)

  const derived = calculateDerivedStats(baseStats, tierY)
  const wazaByBranch = useMemo(
    () => WAZA_POOL.filter((w) => w.branch === selectedBranch),
    [selectedBranch]
  )

  const handleStatChange = (key: keyof BaseStats, value: number) => {
    const v = Math.max(0, Math.min(99, value))
    setBaseStats((prev) => {
      const next = { ...prev, [key]: v }
      const sum =
        next.strength +
        next.constitution +
        next.dexterity +
        next.mind +
        next.empathy
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

  const handleStartCombat = () => {
    setCombatStarted(true)
    setCurrentCs(CS_INITIATIVE)
    setTurnCount(1)
    setCurrentKotodama(derived.kotodamaMax)
    setCurrentHp(derived.hpMax)
    setCombatLog([`Iniziativa: +${CS_INITIATIVE} cs, Kotodama: ${derived.kotodamaMax}, HP: ${derived.hpMax}`])
  }

  const handleNextTurn = () => {
    setCurrentCs((c) => c + CS_PER_TURN)
    setTurnCount((t) => t + 1)
    setCombatLog((prev) => [`Turno ${turnCount + 1}: +${CS_PER_TURN} cs`, ...prev].slice(0, 15))
  }

  const handleHitTaken = () => {
    setCurrentCs((c) => c + CS_PER_HIT)
    setCombatLog((prev) => [`Colpo subito: +${CS_PER_HIT} cs`, ...prev].slice(0, 15))
  }

  const handleUseWaza = (w: WazaDef) => {
    const costJigo = w.costJigo({
      D: baseStats.dexterity,
      M: baseStats.mind,
      E: baseStats.empathy,
      LVL: skillLevel,
    })
    if (currentKotodama < costJigo) {
      setCombatLog((prev) => [`${w.name}: Kotodama insufficiente (serve ${costJigo})`, ...prev].slice(0, 15))
      return
    }
    if (w.costCs > 0 && currentCs < w.costCs) {
      setCombatLog((prev) => [`${w.name}: CS insufficienti (serve ${w.costCs})`, ...prev].slice(0, 15))
      return
    }
    setCurrentKotodama((k) => Math.max(0, k - costJigo))
    if (w.costCs > 0) setCurrentCs((c) => Math.max(0, c - w.costCs))
    const vel = w.hasVelocity
      ? calcVelocity(
          baseStats.dexterity,
          baseStats.mind,
          w.velBonus,
          grade.velMult
        )
      : null
    const wazaStats = {
      D: baseStats.dexterity,
      M: baseStats.mind,
      E: baseStats.empathy,
      LVL: skillLevel,
    }
    const dmg = w.hasDamage
      ? calcDamage(
          baseStats.empathy,
          resolveDbw(w.dbw, wazaStats),
          bonusDmg,
          grade.dmgMult
        )
      : null
    const parts = [`${w.name}: -${costJigo} Kotodama`]
    if (w.costCs > 0) parts.push(`-${w.costCs} cs`)
    if (vel != null) parts.push(`Vel: ${vel}`)
    if (dmg != null) parts.push(`Dmg: ${dmg}`)
    setCombatLog((prev) => [parts.join(', '), ...prev].slice(0, 15))
  }

  const handleResetCombat = () => {
    setCombatStarted(false)
    setCurrentCs(0)
    setTurnCount(0)
    setCurrentKotodama(0)
    setCurrentHp(derived.hpMax)
    setCombatLog([])
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <header
        style={{
          marginBottom: '2rem',
          borderBottom: '1px solid rgba(255,255,255,0.15)',
          paddingBottom: '1rem',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#c9a84a' }}>
          Waza & Stats Tester
        </h1>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#888' }}>
          Livello, grado, statistiche, pool tecniche e simulatore combattimento.
        </p>
      </header>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1rem', color: '#a270ff', marginBottom: '1rem' }}>
          Livello e Grado
        </h2>
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
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ minWidth: 80 }}>Grado</span>
            <select
              value={gradeId}
              onChange={(e) => setGradeId(e.target.value)}
              style={{ ...inputStyle, minWidth: 180 }}
            >
              {GRADES.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} — Vel ×{g.velMult} / Dmg ×{g.dmgMult}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div style={statPointsBoxStyle}>
          <span style={{ color: '#22c55e', fontWeight: 600 }}>
            Punti stat totali: {totalStatPoints}
          </span>
          <span
            style={{
              color:
                remainingStatPoints === 0
                  ? '#22c55e'
                  : remainingStatPoints < 0
                    ? '#ef4444'
                    : '#eab308',
              fontWeight: 600,
            }}
          >
            Disponibili: {remainingStatPoints}
          </span>
          {currentStatTotal > totalStatPoints && (
            <button type="button" onClick={resetStatsToFit} style={btnDangerStyle}>
              Ridistribuisci
            </button>
          )}
        </div>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1rem', color: '#a270ff', marginBottom: '1rem' }}>
          Statistiche base (F, C, D, M, E)
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>
          Velocità Waza: D (60%) + M (40%). Danno Waza: E (70%) + DBW + bonus.
        </p>
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
                style={inputStyle}
              />
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ minWidth: 120 }}>Tier Y</span>
            <input
              type="number"
              min={0.1}
              max={5}
              step={0.1}
              value={tierY}
              onChange={(e) => setTierY(parseFloat(e.target.value) || 1)}
              style={{ ...inputStyle, width: 80 }}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ minWidth: 120 }}>Livello skill</span>
            <input
              type="number"
              min={1}
              max={10}
              value={skillLevel}
              onChange={(e) =>
                setSkillLevel(Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1)))
              }
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ minWidth: 100 }}>Bonus Dmg (BA/BO/B)</span>
            <input
              type="number"
              min={0}
              max={99}
              value={bonusDmg}
              onChange={(e) => setBonusDmg(Math.max(0, parseInt(e.target.value, 10) || 0))}
              style={inputStyle}
            />
          </label>
        </div>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1rem', color: '#a270ff', marginBottom: '1rem' }}>
          Statistiche derivate
        </h2>
        <div style={derivedGridStyle}>
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
        </div>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1rem', color: '#a270ff', marginBottom: '1rem' }}>
          Waza — Pool Dō
        </h2>
        <div style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {(Object.keys(BRANCH_LABELS) as WazaBranch[]).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setSelectedBranch(b)}
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                background: selectedBranch === b ? 'rgba(162,112,255,0.3)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${selectedBranch === b ? '#a270ff' : 'rgba(255,255,255,0.2)'}`,
                borderRadius: 4,
                color: selectedBranch === b ? '#fff' : '#888',
                cursor: 'pointer',
              }}
            >
              {BRANCH_LABELS[b]}
            </button>
          ))}
        </div>
        <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1rem' }}>
          Valori calcolati. Clicca per lanciare nel simulatore (se attivo).
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {wazaByBranch.map((def) => {
            const wazaStats = {
              D: baseStats.dexterity,
              M: baseStats.mind,
              E: baseStats.empathy,
              LVL: skillLevel,
            }
            const cost = def.costJigo(wazaStats)
            const vel =
              def.hasVelocity &&
              calcVelocity(
                baseStats.dexterity,
                baseStats.mind,
                def.velBonus,
                grade.velMult
              )
            const dmg =
              def.hasDamage &&
              calcDamage(
                baseStats.empathy,
                resolveDbw(def.dbw, wazaStats),
                bonusDmg,
                grade.dmgMult
              )
            return (
              <div
                key={def.id}
                style={{
                  padding: '0.75rem 1rem',
                  background:
                    def.type === 'passive'
                      ? 'rgba(74,222,128,0.08)'
                      : 'rgba(162,112,255,0.08)',
                  border: `1px solid ${
                    def.type === 'passive'
                      ? 'rgba(74,222,128,0.3)'
                      : 'rgba(162,112,255,0.3)'
                  }`,
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.4rem',
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#fff' }}>{def.name}</span>
                  <span style={{ fontSize: '0.7rem', color: '#888' }}>
                    {def.type === 'passive' ? 'Passiva' : 'Attiva'}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                  {cost > 0 && (
                    <div>
                      Costo: <strong style={{ color: '#c9a84a' }}>{cost}</strong> Jigo-ka
                    </div>
                  )}
                  {def.costCs > 0 && (
                    <div>
                      CS: <strong style={{ color: '#c9a84a' }}>{def.costCs}</strong>
                    </div>
                  )}
                  {vel !== false && vel != null && (
                    <div>
                      Velocità: <strong style={{ color: '#60a5fa' }}>{vel}</strong>
                    </div>
                  )}
                  {dmg !== false && dmg != null && (
                    <div>
                      Danno: <strong style={{ color: '#f87171' }}>{dmg}</strong>
                    </div>
                  )}
                </div>
                {(cost > 0 || def.costCs > 0) && combatStarted && (
                  <button
                    type="button"
                    onClick={() => handleUseWaza(def)}
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      background: 'rgba(34,197,94,0.2)',
                      border: '1px solid #22c55e',
                      borderRadius: 4,
                      color: '#22c55e',
                      cursor: 'pointer',
                    }}
                  >
                    Lancia
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1rem', color: '#a270ff', marginBottom: '1rem' }}>
          Simulatore combattimento
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1rem' }}>
          Start = iniziativa (+5 cs). Turni successivi +3 cs. Colpo subito +1 cs.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '0.75rem',
            marginBottom: '1rem',
          }}
        >
          <div style={counterBoxStyle}>
            <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.25rem' }}>
              Kotodama
            </div>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color:
                  combatStarted && currentKotodama < derived.kotodamaMax * 0.2
                    ? '#ef4444'
                    : '#fff',
              }}
            >
              {combatStarted ? currentKotodama : '—'} / {derived.kotodamaMax}
            </div>
          </div>
          <div style={counterBoxStyle}>
            <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.25rem' }}>
              HP
            </div>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color:
                  combatStarted && currentHp < derived.hpMax * 0.2 ? '#ef4444' : '#fff',
              }}
            >
              {combatStarted ? currentHp : '—'} / {derived.hpMax}
            </div>
          </div>
          <div style={counterBoxStyle}>
            <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.25rem' }}>
              Chrono Stack
            </div>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: currentCs > CS_CAPACITY ? '#ef4444' : '#fff',
              }}
            >
              {currentCs} cs
            </div>
          </div>
          <div style={counterBoxStyle}>
            <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.25rem' }}>
              Turno
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff' }}>
              {turnCount}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          {!combatStarted ? (
            <button
              type="button"
              onClick={handleStartCombat}
              style={btnPrimaryStyle}
            >
              Start (iniziativa +5 cs)
            </button>
          ) : (
            <>
              <button type="button" onClick={handleNextTurn} style={btnSuccessStyle}>
                Turno successivo (+{CS_PER_TURN} cs)
              </button>
              <button type="button" onClick={handleHitTaken} style={btnWarningStyle}>
                Colpo subito (+{CS_PER_HIT} cs)
              </button>
              <button type="button" onClick={handleResetCombat} style={btnMutedStyle}>
                Reset
              </button>
            </>
          )}
        </div>
        {combatLog.length > 0 && (
          <div
            style={{
              padding: '0.75rem',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: '0.8rem',
              color: '#aaa',
              maxHeight: 180,
              overflowY: 'auto',
            }}
          >
            <div style={{ marginBottom: '0.5rem', color: '#888' }}>Log:</div>
            {combatLog.map((line, i) => (
              <div key={i} style={{ marginBottom: '0.25rem' }}>
                {line}
              </div>
            ))}
          </div>
        )}
      </section>

      <footer style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#555' }}>
        Vedi STAT_POINTS_CONFIG.md, WAZA_CALCOLI.md, CHRONO_STACK.md.
      </footer>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: 60,
  padding: '0.35rem',
  background: 'rgba(0,0,0,0.4)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 4,
  color: '#fff',
}

const statPointsBoxStyle: React.CSSProperties = {
  padding: '1rem',
  background: 'rgba(34,197,94,0.1)',
  border: '1px solid rgba(34,197,94,0.4)',
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: '0.5rem',
}

const derivedGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: '0.75rem',
  padding: '1rem',
  background: 'rgba(0,0,0,0.3)',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.1)',
}

const counterBoxStyle: React.CSSProperties = {
  padding: '1rem',
  background: 'rgba(0,0,0,0.3)',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.1)',
}

const btnPrimaryStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  background: 'rgba(34,197,94,0.3)',
  border: '1px solid #22c55e',
  borderRadius: 4,
  color: '#22c55e',
  cursor: 'pointer',
  fontWeight: 600,
}

const btnSuccessStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  background: 'rgba(34,197,94,0.2)',
  border: '1px solid #22c55e',
  borderRadius: 4,
  color: '#22c55e',
  cursor: 'pointer',
  fontWeight: 600,
}

const btnWarningStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  background: 'rgba(234,179,8,0.2)',
  border: '1px solid #eab308',
  borderRadius: 4,
  color: '#eab308',
  cursor: 'pointer',
}

const btnDangerStyle: React.CSSProperties = {
  padding: '0.25rem 0.5rem',
  fontSize: '0.75rem',
  background: 'rgba(239,68,68,0.2)',
  border: '1px solid #ef4444',
  borderRadius: 4,
  color: '#ef4444',
  cursor: 'pointer',
}

const btnMutedStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 4,
  color: '#888',
  cursor: 'pointer',
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.2rem' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>
        {value}
      </div>
    </div>
  )
}

export default App
