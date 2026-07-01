/**
 * Browser delle tecniche Waza — lista sfogliabile con filtro per ramo.
 */

import { useState, type CSSProperties } from 'react'
import './WazaBrowser.css'
import {
  BRANCH_LABELS,
  BRANCH_DESCRIPTIONS,
  SAMPLE_WAZA_STATS,
  WAZA_CON_INCOGNITE,
  WAZA_RANK_UP_GEM_COST,
  WAZA_LAUNCH_TRIGGER_KIND_LABELS,
  WAZA_LAUNCH_TRIGGER_RESOURCE_LABELS,
  WAZA_LAUNCH_TRIGGER_SUBJECT_LABELS,
  WAZA_LAUNCH_BOOST_STAT_LABELS,
  WAZA_WEAPON_CONDITION_TAG_LABELS,
  type WazaDef,
  type WazaBranch,
} from './wazaPool'
import { resolveWazaCombatNumbers, DEMO_WEAPON_TAGS_TORO } from './wazaConditionalResolve'
import { GRADES } from './statPointsConfig'
import { renderBracketTaggedProse } from './wazaBracketProse'
import { SKIRU_POOL } from './skiruPool'
import {
  evalDbwAtRank,
  evalGittataAtRank,
  evalVelAtRank,
  resolveDbw,
  resolveGittataFn,
  resolveVelFn,
} from './wazaRankResolve'
import { extractPoolFormulaInner } from './hydrateWazaForm'
import { useRuntimeWaza } from './RuntimeWazaContext'
import { useWazaAccessori } from './WazaAccessoriContext'

/** Stessi rami dichiarati in wazaBranches / BRANCH_LABELS (inclusi rami aggiunti dal tester). */
const BRANCH_ORDER: WazaBranch[] = Object.keys(BRANCH_LABELS) as WazaBranch[]

function ranksForWazaBulletin(waza: WazaDef): readonly [1, 2, 3] | readonly [1] {
  return waza.type === 'active' ? ([1, 2, 3] as const) : ([1] as const)
}

function formatBulletinFormulaExpr(inner: string | null, rawFnFallback: () => string): string {
  if (inner?.trim()) return `Math.floor(${inner.trim()})`
  return rawFnFallback()
}

function rawFnOneLiner(fn: (...args: unknown[]) => unknown): string {
  const s = fn.toString().replace(/\s+/g, ' ').trim()
  return s.length > 220 ? `${s.slice(0, 217)}…` : s
}

type BulletinFormulaRow = { key: string; title: string; formula: string; sample: string | null }

function buildBulletinFormulaRows(waza: WazaDef): BulletinFormulaRow[] {
  const out: BulletinFormulaRow[] = []
  for (const rank of ranksForWazaBulletin(waza)) {
    if (waza.hasVelocity) {
      const fn = resolveVelFn(waza, rank)
      if (fn) {
        const inner = extractPoolFormulaInner(fn)
        const formula = formatBulletinFormulaExpr(inner, () => rawFnOneLiner(fn as (...args: unknown[]) => unknown))
        const sample = evalVelAtRank(waza, rank, SAMPLE_WAZA_STATS)
        out.push({
          key: `vel-${rank}`,
          title: `Velocità · LVL ${rank}`,
          formula,
          sample: sample != null ? String(sample) : null,
        })
      }
    }
    if (waza.hasDamage) {
      const dbw = resolveDbw(waza, rank)
      const sample = evalDbwAtRank(waza, rank, SAMPLE_WAZA_STATS)
      if (typeof dbw === 'number') {
        out.push({
          key: `dbw-${rank}`,
          title: `Danno base (DBW) · LVL ${rank}`,
          formula: String(dbw),
          sample: sample != null ? String(sample) : String(dbw),
        })
      } else if (typeof dbw === 'function') {
        const inner = extractPoolFormulaInner(dbw)
        const formula = formatBulletinFormulaExpr(inner, () => rawFnOneLiner(dbw as (...args: unknown[]) => unknown))
        out.push({
          key: `dbw-${rank}`,
          title: `Danno base (DBW) · LVL ${rank}`,
          formula,
          sample: sample != null ? String(sample) : null,
        })
      }
    }
    const gitFn = resolveGittataFn(waza, rank)
    const gitSample = evalGittataAtRank(waza, rank, SAMPLE_WAZA_STATS)
    if (gitFn) {
      const inner = extractPoolFormulaInner(gitFn)
      const formula = formatBulletinFormulaExpr(inner, () => rawFnOneLiner(gitFn as (...args: unknown[]) => unknown))
      out.push({
        key: `gittata-${rank}`,
        title: `Gittata · LVL ${rank}`,
        formula,
        sample: gitSample != null ? `${gitSample} m` : null,
      })
    } else if (gitSample != null) {
      const row = waza.quadranteCalcoli?.find((c) => c.label.trim().toLowerCase() === 'gittata')
      out.push({
        key: `gittata-${rank}`,
        title: `Gittata · LVL ${rank}`,
        formula: row?.formula?.trim() ?? '—',
        sample: `${gitSample} m`,
      })
    }
  }
  return out
}

function WazaCalcoliBulletin({ waza }: { waza: WazaDef }) {
  const [bulletinOpen, setBulletinOpen] = useState(false)
  const [bulletinPinned, setBulletinPinned] = useState(false)
  const formulaRows = buildBulletinFormulaRows(waza)
  const hasStructuredGittataInBulletin = formulaRows.some((r) => r.key.startsWith('gittata-'))
  const quadranteRows =
    waza.quadranteCalcoli?.filter((c) => {
      if (c.label.trim().toLowerCase() === 'gittata' && hasStructuredGittataInBulletin) return false
      return true
    }) ?? []
  const hasQ = quadranteRows.length > 0
  if (!hasQ && formulaRows.length === 0) return null

  return (
    <details
      className="wb-bulletin animate__animated animate__fadeIn"
      open={bulletinOpen}
      onToggle={(e) => {
        const o = e.currentTarget.open
        setBulletinOpen(o)
        setBulletinPinned(o)
      }}
      onMouseEnter={() => setBulletinOpen(true)}
      onMouseLeave={() => {
        if (!bulletinPinned) setBulletinOpen(false)
      }}
    >
      <summary title="Clic per fissare apertura; passaggio mouse per anteprima rapida.">
        Bulletin dei calcoli
      </summary>
      <div className="wb-bulletin-body">
        <p className="wb-bulletin-hint">
          Formule ricavate dalle voci attive (velocità, danno, gittata) più eventuali righe extra del quadrante. Esempio
          numerico con stats campione del tester (F/C/D/M/E = 10, LVL e Grado come nell’anteprima tool).
        </p>
        {formulaRows.length > 0 && (
          <div className="wb-bulletin-formulas-block">
            <div className="wb-bulletin-sample-title">Formule (Vel / DBW / Gittata)</div>
            {formulaRows.map((r) => (
              <div key={r.key} className="wb-bulletin-row">
                <span className="wb-bulletin-label">{r.title}</span>
                <code className="wb-bulletin-code">{r.formula}</code>
                {r.sample != null ? (
                  <div className="wb-bulletin-sample-inline">Esempio → {r.sample}</div>
                ) : null}
              </div>
            ))}
          </div>
        )}
        {hasQ && (
          <div className={formulaRows.length > 0 ? 'wb-bulletin-quadrant-extra' : ''}>
            {formulaRows.length > 0 ? (
              <div className="wb-bulletin-sample-title">Altre voci nel quadrante</div>
            ) : null}
            {quadranteRows.map((c, i) => (
              <div key={i} className="wb-bulletin-row">
                <span className="wb-bulletin-label">[{c.label}]</span>
                <code className="wb-bulletin-code">{c.formula}</code>
                {c.note ? (
                  <div style={{ marginTop: 4, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.note}</div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </details>
  )
}

export default function WazaBrowser({
  onEditWaza,
  onDeleteWaza,
}: {
  onEditWaza?: (w: WazaDef) => void
  /** Persistenza dev/API: rimuove la voce da `wazaPool.ts` o invia `pool_entry_delete`. */
  onDeleteWaza?: (w: WazaDef) => void | Promise<void>
} = {}) {
  const { pool: wazaPool, loading: runtimeWazaLoading, fetchError: runtimeWazaErr } =
    useRuntimeWaza()
  const [branchFilter, setBranchFilter] = useState<WazaBranch | 'tutti'>('tutti')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered =
    branchFilter === 'tutti'
      ? wazaPool
      : wazaPool.filter((w) => w.branch === branchFilter)

  const grouped = BRANCH_ORDER.reduce<Record<WazaBranch, WazaDef[]>>(
    (acc, b) => {
      acc[b] = filtered.filter((w) => w.branch === b)
      return acc
    },
    {} as Record<WazaBranch, WazaDef[]>
  )

  return (
    <div>
      {runtimeWazaLoading ? (
        <p style={{ marginBottom: '0.75rem', fontSize: '0.85rem', color: '#a78bfa' }}>
          Caricamento overlay Waza dal server…
        </p>
      ) : null}
      {runtimeWazaErr ? (
        <p style={{ marginBottom: '0.75rem', fontSize: '0.85rem', color: '#f87171' }}>
          Elenco Waza: {runtimeWazaErr} (uso solo bundle locale).
        </p>
      ) : null}
      <section style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', color: '#a270ff', marginBottom: '0.75rem' }}>
          Filtra per ramo
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setBranchFilter('tutti')}
            style={{
              padding: '0.4rem 0.75rem',
              background: branchFilter === 'tutti' ? 'rgba(162,112,255,0.3)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${branchFilter === 'tutti' ? '#a270ff' : 'rgba(255,255,255,0.2)'}`,
              borderRadius: 6,
              color: branchFilter === 'tutti' ? '#fff' : '#888',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            Tutti
          </button>
          {BRANCH_ORDER.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBranchFilter(b)}
              style={{
                padding: '0.4rem 0.75rem',
                background: branchFilter === b ? 'rgba(162,112,255,0.3)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${branchFilter === b ? '#a270ff' : 'rgba(255,255,255,0.2)'}`,
                borderRadius: 6,
                color: branchFilter === b ? '#fff' : '#888',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              {BRANCH_LABELS[b]}
            </button>
          ))}
        </div>
      </section>

      {branchFilter !== 'tutti' && BRANCH_DESCRIPTIONS[branchFilter] && (
        <section style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(162,112,255,0.08)', borderRadius: 8, border: '1px solid rgba(162,112,255,0.2)' }}>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#c4b5fd', margin: 0 }}>
            {BRANCH_DESCRIPTIONS[branchFilter]}
          </p>
        </section>
      )}

      <section>
        <h2 style={{ fontSize: '1rem', color: '#a270ff', marginBottom: '1rem' }}>
          Tecniche ({filtered.length})
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(branchFilter === 'tutti' ? BRANCH_ORDER : [branchFilter]).map(
            (branch) => {
              const list = branchFilter === 'tutti' ? grouped[branch] : filtered
              if (list.length === 0) return null

              return (
                <div key={branch}>
                  {branchFilter === 'tutti' && (
                    <h3
                      style={{
                        fontSize: '0.9rem',
                        color: '#c9a84a',
                        marginBottom: '0.5rem',
                        paddingBottom: '0.25rem',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      {BRANCH_LABELS[branch]}
                    </h3>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {list.map((w) => (
                      <WazaCard
                        key={w.id}
                        waza={w}
                        expanded={expandedId === w.id}
                        onToggle={() =>
                          setExpandedId((id) => (id === w.id ? null : w.id))
                        }
                        onEditWaza={onEditWaza}
                        onDeleteWaza={onDeleteWaza}
                      />
                    ))}
                  </div>
                </div>
              )
            }
          )}
        </div>
      </section>
    </div>
  )
}

const wbCondHint: CSSProperties = { fontSize: '0.72rem', color: '#888', marginTop: '0.35rem' }

function WazaConditionalPanel({ waza }: { waza: WazaDef }) {
  const { merged: accessoriMerged } = useWazaAccessori()
  const tagLabel = (t: string) =>
    accessoriMerged.weapon.labelById[t] ??
    (WAZA_WEAPON_CONDITION_TAG_LABELS as Record<string, string>)[t] ??
    t
  const [simulateToro, setSimulateToro] = useState(false)
  const hasLaunchTags = (waza.weaponTagsOnLaunch?.length ?? 0) > 0
  const hasBranches = (waza.conditionalBranches?.length ?? 0) > 0
  if (!hasLaunchTags && !hasBranches) return null

  const gradeIdx = Math.min(GRADES.length, Math.max(1, SAMPLE_WAZA_STATS.Grado)) - 1
  const dmgMult = GRADES[gradeIdx].dmgMult
  const evalOpts = {
    empathy: SAMPLE_WAZA_STATS.E,
    bonusDmg: 0,
    gradeDmgMult: dmgMult,
  }
  const ctxNoTags = { tags: new Set<string>(), grantorSameTurn: true as boolean | undefined }
  const ctxToro = {
    tags: simulateToro ? DEMO_WEAPON_TAGS_TORO : new Set<string>(),
    grantorSameTurn: true as boolean | undefined,
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      role="presentation"
      style={{
        marginTop: '0.75rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div style={{ fontSize: '0.65rem', letterSpacing: '0.08em', color: 'var(--accent-gold)' }}>
        Tag di contesto (condizioni)
      </div>
      {hasLaunchTags && (
        <p style={{ fontSize: '0.78rem', color: '#aaa', marginTop: '0.35rem', lineHeight: 1.45 }}>
          In chat, tag concessi nel contesto previsto dalla scheda (es. arma):{' '}
          {waza.weaponTagsOnLaunch!.map((t) => tagLabel(t)).join(' · ')}
        </p>
      )}
      {hasBranches && (
        <>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '0.5rem',
              fontSize: '0.8rem',
              color: '#ccc',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={simulateToro}
              onChange={(e) => setSimulateToro(e.target.checked)}
            />
            Simula contesto con tag «toro» (es. dopo passiva Tōrō)
          </label>
          <div style={{ marginTop: '0.5rem', overflowX: 'auto' }}>
            <table style={{ fontSize: '0.75rem', borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ color: 'var(--accent-violet-light)' }}>
                  <th style={{ textAlign: 'left', padding: '0.25rem' }}>Rango</th>
                  <th style={{ textAlign: 'right', padding: '0.25rem' }}>Danno</th>
                  <th style={{ textAlign: 'right', padding: '0.25rem' }}>Velocità</th>
                  <th style={{ textAlign: 'right', padding: '0.25rem' }}>Gittata (m)</th>
                </tr>
              </thead>
              <tbody>
                {([1, 2, 3] as const).map((rank) => {
                  const base = resolveWazaCombatNumbers(waza, rank, SAMPLE_WAZA_STATS, ctxNoTags, evalOpts)
                  const adj = resolveWazaCombatNumbers(waza, rank, SAMPLE_WAZA_STATS, ctxToro, evalOpts)
                  const dmgB = base.damageFinal
                  const dmgA = adj.damageFinal
                  const velB = base.velocityFinal
                  const velA = adj.velocityFinal
                  const gitB = base.gittataFinal
                  const gitA = adj.gittataFinal
                  return (
                    <tr key={rank} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: '#bbb' }}>
                      <td style={{ padding: '0.35rem' }}>LVL {rank}</td>
                      <td style={{ textAlign: 'right', padding: '0.35rem', whiteSpace: 'nowrap' }}>
                        {dmgB != null ? dmgB : '—'}
                        {simulateToro && dmgA != null && dmgA !== dmgB && (
                          <span style={{ color: 'var(--accent-gold)' }}>{' → '}{dmgA}</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', padding: '0.35rem', whiteSpace: 'nowrap' }}>
                        {velB != null ? velB : '—'}
                        {simulateToro && velA != null && velA !== velB && (
                          <span style={{ color: 'var(--accent-gold)' }}>{' → '}{velA}</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', padding: '0.35rem', whiteSpace: 'nowrap' }}>
                        {gitB != null ? gitB : '—'}
                        {simulateToro && gitA != null && gitA !== gitB && (
                          <span style={{ color: 'var(--accent-gold)' }}>{' → '}{gitA}</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p style={wbCondHint}>
            Esempio numerico con stats campione (F/C/D/M/E = 10, grado {SAMPLE_WAZA_STATS.Grado}, M.G. danno ×{dmgMult}).
            {' '}
            In chat la lettura richiede i tag attivi nel contesto rilevante <strong>e</strong> concessione nello stesso turno (eccezioni solo da testo scheda / Master).
          </p>
          {waza.conditionalBranches!.map((b) => (
            <p key={b.id} style={wbCondHint}>
              Ramo «{b.id}»: serve almeno un tag tra [{b.requireAnyWeaponTag.join(', ')}].
            </p>
          ))}
        </>
      )}
    </div>
  )
}

function WazaCard({
  waza,
  expanded,
  onToggle,
  onEditWaza,
  onDeleteWaza,
}: {
  waza: WazaDef
  expanded: boolean
  onToggle: () => void
  onEditWaza?: (w: WazaDef) => void
  onDeleteWaza?: (w: WazaDef) => void | Promise<void>
}) {
  const { pool: runtimeWazaPool } = useRuntimeWaza()
  const sampleCost = waza.costJigo(SAMPLE_WAZA_STATS)

  return (
    <div
      style={{
        padding: '0.75rem 1rem',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.08)',
        cursor: 'pointer',
      }}
      onClick={onToggle}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 600, color: '#fff' }}>
            {waza.id === 'arma-psichica' ? (
              <>
                Tōrō <span style={{ fontSize: '0.75em', opacity: 0.9 }}>(Arma psichica)</span>
              </>
            ) : (
              waza.name
            )}
          </span>
          {WAZA_CON_INCOGNITE.has(waza.id) && (
            <span
              style={{
                fontSize: '0.9rem',
                color: '#f59e0b',
                fontWeight: 700,
                marginLeft: '0.1rem',
              }}
              title="Incognita (X, Y) da risolvere"
            >
              !
            </span>
          )}
          <span
            style={{
              fontSize: '0.7rem',
              padding: '0.15rem 0.4rem',
              background:
                waza.type === 'passive'
                  ? 'rgba(201, 168, 74, 0.12)'
                  : 'rgba(162, 112, 255, 0.18)',
              border: '1px solid',
              borderColor:
                waza.type === 'passive'
                  ? 'rgba(201, 168, 74, 0.35)'
                  : 'rgba(162, 112, 255, 0.35)',
              borderRadius: 4,
              color: waza.type === 'passive' ? 'var(--accent-gold)' : 'var(--accent-violet-light)',
            }}
          >
            {waza.type === 'passive' ? 'Passiva' : 'Attiva'}
          </span>
          {sampleCost > 0 && (
            <span style={{ fontSize: '0.75rem', color: '#c9a84a' }}>
              {waza.id === 'arma-psichica' ? '2J / turno' : waza.id === 'impatto-jigoka' ? '2 J/arma (max 5)' : `${sampleCost} J`}
            </span>
          )}
          {waza.costCs > 0 && (
            <span style={{ fontSize: '0.75rem', color: '#eab308' }}>
              {waza.costCs} CS
            </span>
          )}
        </div>
        <span style={{ fontSize: '0.75rem', color: '#666' }}>
          {expanded ? '▼' : '▶'}
        </span>
      </div>
      {expanded && (
        <>
          {(onEditWaza || onDeleteWaza) && (
            <div
              style={{
                marginTop: '0.5rem',
                display: 'flex',
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              {onEditWaza && (
                <button
                  type="button"
                  className="animate__animated animate__fadeIn"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditWaza(waza)
                  }}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    borderRadius: 6,
                    border: '1px solid var(--accent-gold)',
                    background: 'rgba(201, 168, 74, 0.12)',
                    color: 'var(--accent-gold)',
                    boxShadow: 'var(--shadow-gold)',
                  }}
                >
                  Modifica in Idee e sviluppo
                </button>
              )}
              {onDeleteWaza && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    void onDeleteWaza(waza)
                  }}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    borderRadius: 6,
                    border: '1px solid rgba(255,120,120,0.45)',
                    background: 'rgba(180,60,60,0.15)',
                    color: 'var(--accent-violet-light)',
                  }}
                >
                  Elimina dal pool
                </button>
              )}
            </div>
          )}
          {(waza.description ||
            waza.effect ||
            waza.launchTrigger ||
            waza.prereqSkiruId ||
            waza.prereqWazaId ||
            waza.prereqGradoMin != null ||
            (waza.type === 'active' &&
              (waza.descriptionUpgrade2 ||
                waza.descriptionUpgrade3 ||
                waza.upgradeCostExp2 != null ||
                waza.upgradeCostExp3 != null))) && (
            <div
              style={{
                marginTop: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                fontSize: '0.85rem',
                color: '#aaa',
                lineHeight: 1.5,
              }}
            >
              {waza.type === 'passive' ? (
                <>
                  {waza.description && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.65rem', letterSpacing: '0.08em', color: '#c9a84a', marginBottom: '0.35rem' }}>
                        Descrizione
                      </div>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{renderBracketTaggedProse(waza.description)}</div>
                    </div>
                  )}
                  {waza.effect && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.65rem', letterSpacing: '0.08em', color: '#c9a84a', marginBottom: '0.35rem' }}>
                        Effetto
                      </div>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{renderBracketTaggedProse(waza.effect)}</div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {(waza.description || waza.effect) && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.65rem', letterSpacing: '0.08em', color: '#c9a84a', marginBottom: '0.35rem' }}>
                        WAZA I · LVL 1
                      </div>
                      {waza.description && (
                        <>
                          <div style={{ fontSize: '0.6rem', letterSpacing: '0.1em', color: 'var(--accent-violet)', marginBottom: '0.25rem' }}>
                            Descrizione
                          </div>
                          <div style={{ whiteSpace: 'pre-wrap', marginBottom: waza.effect ? '0.55rem' : 0 }}>
                            {renderBracketTaggedProse(waza.description)}
                          </div>
                        </>
                      )}
                      {waza.effect && (
                        <>
                          <div style={{ fontSize: '0.6rem', letterSpacing: '0.1em', color: 'var(--accent-violet)', marginBottom: '0.25rem' }}>
                            Effetto
                          </div>
                          <div style={{ whiteSpace: 'pre-wrap' }}>{renderBracketTaggedProse(waza.effect)}</div>
                        </>
                      )}
                    </div>
                  )}
                  {(waza.descriptionUpgrade2 || waza.upgradeCostExp2 != null) && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.65rem', letterSpacing: '0.08em', color: '#c9a84a', marginBottom: '0.35rem' }}>
                        WAZA II · LVL 2
                      </div>
                      <div style={{ fontSize: '0.6rem', letterSpacing: '0.1em', color: 'var(--accent-violet)', marginBottom: '0.25rem' }}>
                        Variazione (solo II)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        Upgrade I→II: {WAZA_RANK_UP_GEM_COST} Gem
                        {waza.upgradeCostExp2 != null ? ` + ${waza.upgradeCostExp2} EXP` : ''}
                      </div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0 0 0.35rem', lineHeight: 1.45 }}>
                        È solo il pezzo nuovo al rango II; il cumulativo completo in scheda è I + II (qui sopra non ripetiamo la I).
                      </p>
                      <div style={{ whiteSpace: 'pre-wrap' }}>
                        {waza.descriptionUpgrade2?.trim()
                          ? renderBracketTaggedProse(waza.descriptionUpgrade2)
                          : '—'}
                      </div>
                    </div>
                  )}
                  {(waza.descriptionUpgrade3 || waza.upgradeCostExp3 != null) && (
                    <div>
                      <div style={{ fontSize: '0.65rem', letterSpacing: '0.08em', color: '#c9a84a', marginBottom: '0.35rem' }}>
                        WAZA III · LVL 3
                      </div>
                      <div style={{ fontSize: '0.6rem', letterSpacing: '0.1em', color: 'var(--accent-violet)', marginBottom: '0.25rem' }}>
                        Variazione (solo III)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        Upgrade II→III: {WAZA_RANK_UP_GEM_COST} Gem
                        {waza.upgradeCostExp3 != null ? ` + ${waza.upgradeCostExp3} EXP` : ''}
                      </div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0 0 0.35rem', lineHeight: 1.45 }}>
                        Solo il pezzo nuovo al III; niente ripetizione di I e II (in scheda: I + II + III).
                      </p>
                      <div style={{ whiteSpace: 'pre-wrap' }}>
                        {waza.descriptionUpgrade3?.trim()
                          ? renderBracketTaggedProse(waza.descriptionUpgrade3)
                          : '—'}
                      </div>
                    </div>
                  )}
                </>
              )}
              {waza.launchTrigger && (
                <div style={{ marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.65rem', letterSpacing: '0.08em', color: '#c9a84a', marginBottom: '0.35rem' }}>
                    Trigger al lancio
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--accent-violet-light)' }}>
                    {WAZA_LAUNCH_TRIGGER_KIND_LABELS[waza.launchTrigger.kind]}
                  </div>
                  <div style={{ marginTop: '0.35rem' }}>
                    {WAZA_LAUNCH_TRIGGER_RESOURCE_LABELS[waza.launchTrigger.resource]}
                    {' · '}
                    {WAZA_LAUNCH_TRIGGER_SUBJECT_LABELS[waza.launchTrigger.subject]}
                    {waza.launchTrigger.calcoloLibero && (
                      <> · Calcolo: {waza.launchTrigger.calcoloLibero}</>
                    )}
                  </div>
                  {waza.launchTrigger.kind === 'boost' && waza.launchTrigger.boostTarget === 'statistiche' && (
                    <div style={{ marginTop: '0.35rem', color: '#aaa' }}>
                      Boost statistiche
                      {waza.launchTrigger.boostStatKeys?.length
                        ? `: ${waza.launchTrigger.boostStatKeys.map((k) => WAZA_LAUNCH_BOOST_STAT_LABELS[k]).join(', ')}`
                        : ''}
                      {waza.launchTrigger.boostStatPercent
                        ? ` · ${waza.launchTrigger.boostStatPercent}`
                        : ''}
                    </div>
                  )}
                  {waza.launchTrigger.kind === 'boost' && waza.launchTrigger.boostTarget === 'danno' && (
                    <div style={{ marginTop: '0.35rem', color: '#aaa' }}>
                      Boost danno prossimo attacco: +{waza.launchTrigger.boostDamagePercent ?? '—'}%
                    </div>
                  )}
                  {waza.launchTrigger.timingAzioni && (
                    <div style={{ marginTop: '0.25rem', color: '#888' }}>
                      Durata: {waza.launchTrigger.timingAzioni}
                    </div>
                  )}
                </div>
              )}
              {(waza.prereqSkiruId || waza.prereqWazaId || waza.prereqGradoMin != null) && (
                <div style={{ marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.8rem', color: '#c9a84a' }}>
                  <span style={{ fontWeight: 600 }}>Prerequisiti</span>
                  {waza.prereqSkiruId && (
                    <div style={{ marginTop: '0.35rem', color: '#aaa' }}>
                      Skiru: {SKIRU_POOL.find((s) => s.id === waza.prereqSkiruId)?.name ?? waza.prereqSkiruId}
                    </div>
                  )}
                  {waza.prereqWazaId && (
                    <div style={{ marginTop: '0.35rem', color: '#aaa' }}>
                      Waza:{' '}
                      {runtimeWazaPool.find((x) => x.id === waza.prereqWazaId)?.name ?? waza.prereqWazaId}
                    </div>
                  )}
                  {waza.prereqGradoMin != null && (
                    <div style={{ marginTop: '0.35rem', color: '#aaa' }}>Grado militare min.: {waza.prereqGradoMin}</div>
                  )}
                </div>
              )}
            </div>
          )}
          <WazaConditionalPanel waza={waza} />
          <WazaCalcoliBulletin waza={waza} />
        </>
      )}
    </div>
  )
}
