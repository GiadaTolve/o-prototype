/**
 * Calcolatore pipeline danno — tier → Scudo → Itami → HP.
 */
import { useMemo, useState } from 'react'
import {
  calculateSkiruDerivedStats,
  type SkiruSheet,
} from '@domain/skiru'
import {
  resolveDamageToHp,
  getTierRow,
  MILESTONE_DAMAGE_PERCENT_BONUS,
  CONSTRUCT_SIZES,
  calculateConstructResistance,
  type WazaTier,
  type ConstructSizeId,
} from '@domain/combat'

export default function DamagePipelineTester() {
  const [tier, setTier] = useState<WazaTier>(3)
  const [shield, setShield] = useState(0)
  const [itami, setItami] = useState(3)
  const [milestone, setMilestone] = useState(false)
  const [constructMode, setConstructMode] = useState(false)
  const [genkai, setGenkai] = useState(5)
  const [constructSize, setConstructSize] = useState<ConstructSizeId>('media')

  const effectiveShield = useMemo(() => {
    if (constructMode) return calculateConstructResistance(genkai, tier, constructSize)
    return shield
  }, [constructMode, genkai, tier, constructSize, shield])

  const targetSheet: SkiruSheet = useMemo(() => ({ itami }), [itami])
  const derived = useMemo(() => calculateSkiruDerivedStats(targetSheet), [targetSheet])

  const breakdown = useMemo(
    () =>
      resolveDamageToHp({
        tier,
        shieldResistance: effectiveShield,
        targetSheet,
        skipItamiMitigation: constructMode,
        bonuses: milestone ? { damagePercentBonus: MILESTONE_DAMAGE_PERCENT_BONUS } : undefined,
      }),
    [tier, effectiveShield, targetSheet, milestone, constructMode],
  )

  const tierRow = getTierRow(tier)

  return (
    <div>
      <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1rem' }}>
        Pipeline — Danno base = tier (+ bonus) → Scudo/Costrutto → Itami → PV.
        Costrutto: resistenza = (Genkai + tier) × taglia; niente Itami.
      </p>

      <label style={{ ...labelStyle, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
        <input
          type="checkbox"
          checked={constructMode}
          onChange={(e) => setConstructMode(e.target.checked)}
        />
        Bersaglio = Costrutto (no Itami)
      </label>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <label style={labelStyle}>
          Tier Waza
          <select
            value={tier}
            onChange={(e) => setTier(Number(e.target.value) as WazaTier)}
            style={inputStyle}
          >
            {[1, 2, 3, 4, 5].map((t) => (
              <option key={t} value={t}>
                T{t} ({getTierRow(t as WazaTier).value} dmg · {getTierRow(t as WazaTier).csCost} CS)
              </option>
            ))}
          </select>
        </label>
        <label style={labelStyle}>
          Resistenza Scudo
          <input
            type="number"
            min={0}
            value={constructMode ? effectiveShield : shield}
            disabled={constructMode}
            onChange={(e) => setShield(Math.max(0, Number(e.target.value) || 0))}
            style={inputStyle}
          />
        </label>
        {constructMode && (
          <>
            <label style={labelStyle}>
              Genkai creatore
              <input
                type="number"
                min={0}
                max={10}
                value={genkai}
                onChange={(e) => setGenkai(Math.max(0, Math.min(10, Number(e.target.value) || 0)))}
                style={inputStyle}
              />
            </label>
            <label style={labelStyle}>
              Taglia costrutto
              <select
                value={constructSize}
                onChange={(e) => setConstructSize(e.target.value as ConstructSizeId)}
                style={inputStyle}
              >
                {(Object.keys(CONSTRUCT_SIZES) as ConstructSizeId[]).map((id) => (
                  <option key={id} value={id}>
                    {CONSTRUCT_SIZES[id].label} (×{CONSTRUCT_SIZES[id].resistanceMult})
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        <label style={labelStyle}>
          Itami (bersaglio)
          <input
            type="number"
            min={0}
            max={10}
            value={itami}
            disabled={constructMode}
            onChange={(e) => setItami(Math.max(0, Math.min(10, Number(e.target.value) || 0)))}
            style={inputStyle}
          />
        </label>
        <label style={{ ...labelStyle, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20 }}>
          <input
            type="checkbox"
            checked={milestone}
            onChange={(e) => setMilestone(e.target.checked)}
          />
          Milestone Jiga +15%
        </label>
      </div>

      <section
        style={{
          padding: '1rem',
          background: 'rgba(0,0,0,0.4)',
          borderRadius: 10,
          border: '1px solid rgba(201,168,74,0.35)',
        }}
      >
        <h3 style={{ margin: '0 0 1rem', color: '#c9a84a', fontSize: '1rem' }}>Breakdown</h3>
        <dl style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.8 }}>
          <Row label="Valore tier" value={breakdown.tierValue} />
          <Row label="Danno base (dopo bonus)" value={breakdown.baseDamage} accent />
          <Row label="Assorbito da Scudo/Costrutto" value={breakdown.shieldAbsorbed} />
          <Row label="Dopo resistenza" value={breakdown.afterShield} />
          <Row
            label={constructMode ? 'Mitigazione Itami (n/a costrutto)' : 'Mitigazione Itami'}
            value={constructMode ? '—' : `${derived.mitigationPercent}%`}
          />
          <Row label="Danno HP finale" value={breakdown.hpDamage} highlight />
        </dl>
        <p style={{ margin: '1rem 0 0', fontSize: '0.75rem', color: '#666' }}>
          T{tier}: {tierRow.minGrade} · CS {tierRow.csCost} · tabella {tierRow.value} danno
        </p>
      </section>
    </div>
  )
}

function Row({
  label,
  value,
  accent,
  highlight,
}: {
  label: string
  value: string | number
  accent?: boolean
  highlight?: boolean
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
      <dt style={{ color: '#888' }}>{label}</dt>
      <dd
        style={{
          margin: 0,
          fontFamily: 'monospace',
          color: highlight ? '#22c55e' : accent ? '#c9a84a' : '#ccc',
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
