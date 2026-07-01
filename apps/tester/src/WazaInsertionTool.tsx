/**
 * Idee e Sviluppo — Tool di inserimento Waza
 * Modulo per prototipare e inserire nuove waza a sistema.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import './WazaInsertionTool.css'
import { getWazaManualTierSummary } from '@domain/combat/waza-tier-infer'
import {
  BRANCH_LABELS,
  DURATA_LABELS,
  SAMPLE_WAZA_STATS,
  type WazaBranch,
  type WazaType,
  type WazaDef,
  type DurataType,
  type CostJigoTipo,
  type WazaGradoMilitare,
  WAZA_GRADO_MILITARE_VALUES,
  WAZA_RANK_UP_GEM_COST,
  WAZA_LAUNCH_TRIGGER_KIND_LABELS,
  WAZA_LAUNCH_TRIGGER_RESOURCE_LABELS,
  WAZA_LAUNCH_TRIGGER_SUBJECT_LABELS,
  type WazaLaunchTrigger,
  type WazaLaunchTriggerKind,
  type WazaLaunchTriggerResource,
  type WazaLaunchTriggerSubject,
  WAZA_LAUNCH_BOOST_STAT_KEYS,
  WAZA_LAUNCH_BOOST_STAT_LABELS,
  type WazaLaunchBoostTarget,
  type WazaLaunchBoostStatKey,
  WAZA_WEAPON_CONDITION_TAGS,
  type WazaConditionalBranch,
  type WazaConditionalModifiers,
  type WazaCondRankAltKind,
} from './wazaPool'
import { SKIRU_POOL } from './skiruPool'
import type { MadoshoDef } from './madoshoPool'
import type { PattiDef } from './pattiPool'
import {
  appendOyasumiPoolEntry,
  canPersistAuthoringToPool,
  deleteOyasumiPoolEntry,
  replaceOyasumiPoolEntry,
  type OyasumiAppendPoolKind,
} from './authoringApi'
import { hydrationFromWazaDef } from './hydrateWazaForm'
import { MADOSHO_RAMO_LABELS, type MadoshoRamo } from './madoshoTaxonomy'
import { PATTI_RAMO_LABELS, type PattiRamo } from './pattiTaxonomy'
import { formulaFromString, formulaToFn, safeEvalFormula } from './wazaFormulaEval'
import { evalDbwAtRank, evalGittataAtRank, evalVelAtRank } from './wazaRankResolve'
import { renderBracketTaggedProse } from './wazaBracketProse'
import { useRuntimeWaza } from './RuntimeWazaContext'
import { useWazaAccessori } from './WazaAccessoriContext'
import { WazaTaxonomyInsertPanel } from './WazaTaxonomyInsertPanel'
import { insertBracketTagAtTextarea } from './wazaAuthoringHelpers'

export type WazaInsertionToolKind = 'waza' | 'madosho' | 'patti'

type AuthoringDraft = WazaDef | MadoshoDef | PattiDef

function branchLabelFor(kind: WazaInsertionToolKind, branchId: string): string {
  if (kind === 'waza') return BRANCH_LABELS[branchId as WazaBranch]
  if (kind === 'madosho') return MADOSHO_RAMO_LABELS[branchId as MadoshoRamo]
  return PATTI_RAMO_LABELS[branchId as PattiRamo]
}

const KIND_META: Record<
  WazaInsertionToolKind,
  { title: string; poolHint: string; entityName: string; defaultIdFallback: string }
> = {
  waza: {
    title: 'Tool inserimento Waza',
    poolHint: 'wazaPool.ts',
    entityName: 'Waza',
    defaultIdFallback: 'nuova-waza',
  },
  madosho: {
    title: 'Tool inserimento Madōsho (clan)',
    poolHint: 'madoshoPool.ts',
    entityName: 'Madōsho',
    defaultIdFallback: 'nuovo-madosho',
  },
  patti: {
    title: 'Tool inserimento Patti (premio)',
    poolHint: 'pattiPool.ts',
    entityName: 'Patto',
    defaultIdFallback: 'nuovo-patto',
  },
}

/** Deriva i rami da wazaBranches (es. “generiche”) — niente lista hardcoded. */
const BRANCH_OPTIONS: WazaBranch[] = Object.keys(BRANCH_LABELS) as WazaBranch[]

const MADOSHO_BRANCH_OPTIONS: MadoshoRamo[] = Object.keys(MADOSHO_RAMO_LABELS) as MadoshoRamo[]
const PATTI_BRANCH_OPTIONS: PattiRamo[] = Object.keys(PATTI_RAMO_LABELS) as PattiRamo[]

const DURATA_OPTIONS: DurataType[] = ['mantenimento', 'un_turno', 'utilizzo', 'due_turni', 'tre_turni', 'quattro_turni']

const LAUNCH_TRIGGER_KINDS: WazaLaunchTriggerKind[] = ['boost', 'sconto', 'raccolta', 'deficit']
const LAUNCH_TRIGGER_RESOURCES: WazaLaunchTriggerResource[] = ['jigoka', 'chrono_stack', 'statistiche']
const LAUNCH_TRIGGER_SUBJECTS: WazaLaunchTriggerSubject[] = ['caster', 'avversario']

/** Statistiche usabili nelle formule strutturate */
const STAT_KEYS = ['F', 'C', 'D', 'M', 'E'] as const
type StatKey = (typeof STAT_KEYS)[number]

/** Formula strutturata: [((S1×p1)+(S2×p2))+bonus]×Grado — Grado applicato automaticamente */
export interface StructuredFormulaInput {
  stat1: StatKey
  pct1: number
  stat2: StatKey
  pct2: number
  bonus: number
}

/** Converte formula strutturata in stringa eseguibile */
function structuredToFormula(s: StructuredFormulaInput): string {
  const p1 = s.pct1 / 100
  const p2 = s.pct2 / 100
  return `(((${s.stat1} * ${p1}) + (${s.stat2} * ${p2})) + ${s.bonus}) * Grado`
}

/** Suffisso descrittivo per status applicato (tag visibile in scheda) */
function statusTagSuffix(statusId: string, labelById: Record<string, string>): string {
  const label = labelById[statusId] ?? statusId
  return ` [ Status ] ${label}`
}

function counterTagSuffix(counterId: string, labelById: Record<string, string>): string {
  const label = labelById[counterId] ?? counterId
  return ` [ Counter ] ${label}`
}

/** Suffissi [ Status ] / [ Counter ] vanno sull’effetto se presente; altrimenti sulla descrizione. */
function buildNarrativeAndEffect(
  narrative: string,
  effectRaw: string,
  applicaStatus: 'si' | 'no',
  statusId: string,
  applicaCounter: 'si' | 'no',
  counterId: string,
  statusLabelById: Record<string, string>,
  counterLabelById: Record<string, string>,
): { description?: string; effect?: string } {
  let sfx = ''
  if (applicaStatus === 'si' && statusId) sfx += statusTagSuffix(statusId, statusLabelById)
  if (applicaCounter === 'si' && counterId) sfx += counterTagSuffix(counterId, counterLabelById)
  const n = narrative.trim()
  const e = effectRaw.trim()
  if (e) {
    return {
      description: n || undefined,
      effect: (e + sfx).trim() || undefined,
    }
  }
  const descCombined = (n + sfx).trim()
  return { description: descCombined || undefined, effect: undefined }
}

/** Genera id slug da nome */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function escapeForPoolString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
}

const POOL_FORMULA_STATS =
  'const F=s.F,C=s.C,D=s.D,M=s.M,E=s.E,LVL=s.LVL,Grado=s.Grado,floor=Math.floor'

/** Snippet `(s) => { …; return Math.floor(expr) }` per `wazaPool.ts` (REF = Riflessi se compare nell’espressione). */
function poolExportStatFormula(propName: string, expr: string): string {
  const trimmed = expr.trim().replace(/\bfloor2\b/g, 'floor')
  if (!trimmed) return ''
  const needsRef = /\bREF\b/.test(trimmed)
  const refClause = needsRef ? '; const REF=reflexesFromWazaStats(s)' : ''
  return `    ${propName}: (s) => { ${POOL_FORMULA_STATS}${refClause}; return Math.floor(${trimmed}) },`
}

function poolExportDbwLine(expr: string): string {
  const trimmed = expr.trim().replace(/\bfloor2\b/g, 'floor')
  if (!trimmed) return ''
  const needsRef = /\bREF\b/.test(trimmed)
  const refClause = needsRef ? '; const REF=reflexesFromWazaStats(s)' : ''
  return `dbw: (s) => { ${POOL_FORMULA_STATS}${refClause}; return Math.floor(${trimmed}) },`
}

function serializeLaunchTriggerForExport(lt: WazaLaunchTrigger): string {
  const lines = [
    `    launchTrigger: {`,
    `      kind: '${lt.kind}',`,
    `      resource: '${lt.resource}',`,
    `      calcoloLibero: "${escapeForPoolString(lt.calcoloLibero)}",`,
    `      subject: '${lt.subject}',`,
    `      timingAzioni: "${escapeForPoolString(lt.timingAzioni)}",`,
  ]
  if (lt.kind === 'boost' && lt.boostTarget) {
    lines.push(`      boostTarget: '${lt.boostTarget}',`)
    if (lt.boostTarget === 'statistiche') {
      if (lt.boostStatKeys?.length) {
        lines.push(`      boostStatKeys: [${lt.boostStatKeys.map((k) => `'${k}'`).join(', ')}],`)
      }
      if (lt.boostStatPercent?.trim()) {
        lines.push(
          `      boostStatPercent: "${escapeForPoolString(lt.boostStatPercent.trim())}",`,
        )
      }
    } else if (lt.boostTarget === 'danno' && lt.boostDamagePercent?.trim()) {
      lines.push(
        `      boostDamagePercent: "${escapeForPoolString(lt.boostDamagePercent.trim())}",`,
      )
    }
  }
  lines.push(`    },`)
  return `${lines.join('\n')}\n`
}

function packRankAlt(kind: WazaCondRankAltKind, value: number | ''): WazaConditionalModifiers | undefined {
  if (kind === 'none' || value === '' || !Number.isFinite(Number(value))) return undefined
  const n = Number(value)
  if (kind === 'damage') return { damageMult: n }
  if (kind === 'velocity') return { velocityAdd: n }
  if (kind === 'gittata') return { gittataMetersAdd: n }
  return undefined
}

const COND_RANK_ALT_SELECT: { value: WazaCondRankAltKind; label: string }[] = [
  { value: 'none', label: 'Nessuno' },
  { value: 'damage', label: 'Modifica danno' },
  { value: 'velocity', label: 'Modifica velocità' },
  { value: 'gittata', label: 'Modifica gittata' },
]

type WeaponConditionFormSlice = {
  grantsWeaponCondition: 'si' | 'no'
  grantCondTag: string
  readsConditionalBranch: 'si' | 'no'
  condBranchId: string
  condReadTag: string
  condRank1AltKind: WazaCondRankAltKind
  condRank1AltValue: number | ''
  condRank2AltKind: WazaCondRankAltKind
  condRank2AltValue: number | ''
  condRank3AltKind: WazaCondRankAltKind
  condRank3AltValue: number | ''
}

function weaponConditionFieldsFromFormSlice(
  s: WeaponConditionFormSlice,
): Pick<WazaDef, 'weaponTagsOnLaunch' | 'conditionalBranches'> {
  let weaponTagsOnLaunch: string[] | undefined
  if (s.grantsWeaponCondition === 'si') {
    weaponTagsOnLaunch = [s.grantCondTag]
  }

  let conditionalBranches: WazaConditionalBranch[] | undefined
  if (s.readsConditionalBranch === 'si') {
    const requireAnyWeaponTag: string[] = [s.condReadTag]
    const byRank: WazaConditionalBranch['byRank'] = {}
    const p1 = packRankAlt(s.condRank1AltKind, s.condRank1AltValue)
    const p2 = packRankAlt(s.condRank2AltKind, s.condRank2AltValue)
    const p3 = packRankAlt(s.condRank3AltKind, s.condRank3AltValue)
    if (p1) byRank[1] = p1
    if (p2) byRank[2] = p2
    if (p3) byRank[3] = p3
    if (Object.keys(byRank).length > 0) {
      conditionalBranches = [
        {
          id: (s.condBranchId || 'cond').trim() || 'cond',
          requireAnyWeaponTag,
          byRank,
        },
      ]
    }
  }

  const out: Pick<WazaDef, 'weaponTagsOnLaunch' | 'conditionalBranches'> = {}
  if (weaponTagsOnLaunch) out.weaponTagsOnLaunch = weaponTagsOnLaunch
  if (conditionalBranches) out.conditionalBranches = conditionalBranches
  return out
}

function serializeWeaponConditionForPool(
  fields: Pick<WazaDef, 'weaponTagsOnLaunch' | 'conditionalBranches'>,
): string {
  let str = ''
  if (fields.weaponTagsOnLaunch?.length) {
    str += `    weaponTagsOnLaunch: [${fields.weaponTagsOnLaunch.map((t) => `'${t}'`).join(', ')}],\n`
  }
  if (fields.conditionalBranches?.length) {
    str += `    conditionalBranches: [\n`
    for (const b of fields.conditionalBranches) {
      str += `      {\n        id: '${b.id.replace(/'/g, "\\'")}',\n        requireAnyWeaponTag: [${b.requireAnyWeaponTag.map((t) => `'${t}'`).join(', ')}],\n        byRank: {`
      for (const rk of [1, 2, 3] as const) {
        const m = b.byRank[rk]
        if (!m || !Object.keys(m).length) continue
        const bits: string[] = []
        if (m.damageMult != null) bits.push(`damageMult: ${m.damageMult}`)
        if (m.velocityAdd != null) bits.push(`velocityAdd: ${m.velocityAdd}`)
        if (m.gittataMetersAdd != null) bits.push(`gittataMetersAdd: ${m.gittataMetersAdd}`)
        if (bits.length) str += `\n          ${rk}: { ${bits.join(', ')} },`
      }
      str += `\n        },\n      },\n`
    }
    str += `    ],\n`
  }
  return str
}

/** Builder UI per formula strutturata [((S1×p1)+(S2×p2))+bonus]×Grado */
function StructuredFormulaBuilder({
  value,
  onChange,
}: {
  value: StructuredFormulaInput
  onChange: (v: StructuredFormulaInput) => void
}) {
  return (
    <div className="wit-formula-strip">
      <span className="wit-op">[</span>
      <span className="wit-op">(</span>
      <select
        className="wit-select wit-select--compact"
        value={value.stat1}
        onChange={(e) => onChange({ ...value, stat1: e.target.value as StatKey })}
      >
        {STAT_KEYS.map((k) => (
          <option key={k} value={k}>{k}</option>
        ))}
      </select>
      <span className="wit-op">×</span>
      <input
        type="number"
        className="wit-input wit-inline-num"
        value={value.pct1}
        onChange={(e) => onChange({ ...value, pct1: parseFloat(e.target.value) || 0 })}
        min={0}
        max={100}
        step={5}
        placeholder="%"
      />
      <span className="wit-op">+</span>
      <select
        className="wit-select wit-select--compact"
        value={value.stat2}
        onChange={(e) => onChange({ ...value, stat2: e.target.value as StatKey })}
      >
        {STAT_KEYS.map((k) => (
          <option key={k} value={k}>{k}</option>
        ))}
      </select>
      <span className="wit-op">×</span>
      <input
        type="number"
        className="wit-input wit-inline-num"
        value={value.pct2}
        onChange={(e) => onChange({ ...value, pct2: parseFloat(e.target.value) || 0 })}
        min={0}
        max={100}
        step={5}
        placeholder="%"
      />
      <span className="wit-op">)</span>
      <span className="wit-op">+</span>
      <input
        type="number"
        className="wit-input wit-inline-num"
        value={value.bonus}
        onChange={(e) => onChange({ ...value, bonus: parseFloat(e.target.value) || 0 })}
        min={0}
        step={1}
        placeholder="bonus"
      />
      <span className="wit-op">] × Grado</span>
      <span className="wit-formula-hint">Grado applicato automaticamente</span>
    </div>
  )
}

function RankFormulaTierOverrides({
  tierLvl,
  showPanel,
  hasVelocity,
  hasDamage,
  hasGittata,
  velReplace,
  setVelReplace,
  velMode,
  setVelMode,
  velStructured,
  setVelStructured,
  velLibera,
  setVelLibera,
  dmgReplace,
  setDmgReplace,
  dmgMode,
  setDmgMode,
  dmgStructured,
  setDmgStructured,
  dmgLibera,
  setDmgLibera,
  gittaReplace,
  setGittaReplace,
  gittaMode,
  setGittaMode,
  gittaStructured,
  setGittaStructured,
  gittaLibera,
  setGittaLibera,
  radioPrefix,
  entityName,
}: {
  tierLvl: 2 | 3
  showPanel: boolean
  hasVelocity: boolean
  hasDamage: boolean
  hasGittata: boolean
  velReplace: boolean
  setVelReplace: (v: boolean) => void
  velMode: 'structured' | 'free'
  setVelMode: (v: 'structured' | 'free') => void
  velStructured: StructuredFormulaInput
  setVelStructured: (v: StructuredFormulaInput) => void
  velLibera: string
  setVelLibera: (v: string) => void
  dmgReplace: boolean
  setDmgReplace: (v: boolean) => void
  dmgMode: 'structured' | 'free'
  setDmgMode: (v: 'structured' | 'free') => void
  dmgStructured: StructuredFormulaInput
  setDmgStructured: (v: StructuredFormulaInput) => void
  dmgLibera: string
  setDmgLibera: (v: string) => void
  gittaReplace: boolean
  setGittaReplace: (v: boolean) => void
  gittaMode: 'structured' | 'free'
  setGittaMode: (v: 'structured' | 'free') => void
  gittaStructured: StructuredFormulaInput
  setGittaStructured: (v: StructuredFormulaInput) => void
  gittaLibera: string
  setGittaLibera: (v: string) => void
  radioPrefix: string
  entityName: string
}) {
  if (!showPanel) return null
  const hintStats = { ...SAMPLE_WAZA_STATS, LVL: tierLvl }
  const roman = tierLvl === 2 ? 'II' : 'III'

  return (
    <div className="wit-subpanel wit-subpanel--rank-form">
      <span className="wit-label">Formule · {entityName} {roman}</span>
      <span className="wit-hint">
        Sostituiscono velocità, danno o gittata del rango base (LVL 1) quando il personaggio ha LVL ≥ {tierLvl}. Attiva prima la stessa voce nel pannello Formule.
      </span>

      {hasVelocity && (
        <div className="wit-field">
          <label className="wit-label wit-label--inline">
            <input
              type="checkbox"
              checked={velReplace}
              onChange={(e) => setVelReplace(e.target.checked)}
            />
            Sostituisci velocità
          </label>
          {velReplace && (
            <>
              <div className="wit-choice-row">
                {(['structured', 'free'] as const).map((m) => (
                  <label key={`${radioPrefix}-vel-${m}`} className="wit-choice">
                    <input
                      type="radio"
                      name={`${radioPrefix}-velMode`}
                      checked={velMode === m}
                      onChange={() => setVelMode(m)}
                    />
                    <span>{m === 'structured' ? 'Strutturata' : 'Libera'}</span>
                  </label>
                ))}
              </div>
              {velMode === 'structured' ? (
                <>
                  <StructuredFormulaBuilder value={velStructured} onChange={setVelStructured} />
                  <span className="wit-hint">
                    Esempio LVL {tierLvl} →{' '}
                    {safeEvalFormula(formulaToFn(structuredToFormula(velStructured)), hintStats) ?? '—'}
                  </span>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    value={velLibera}
                    onChange={(e) => setVelLibera(e.target.value)}
                    className="wit-input"
                    placeholder="Formula velocità…"
                  />
                  {velLibera.trim() && (
                    <span className="wit-hint">
                      Esempio → {safeEvalFormula(formulaFromString(velLibera), hintStats) ?? 'errore formula'}
                    </span>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}

      {hasDamage && (
        <div className="wit-field">
          <label className="wit-label wit-label--inline">
            <input
              type="checkbox"
              checked={dmgReplace}
              onChange={(e) => setDmgReplace(e.target.checked)}
            />
            Sostituisci danno
          </label>
          {dmgReplace && (
            <>
              <div className="wit-choice-row">
                {(['structured', 'free'] as const).map((m) => (
                  <label key={`${radioPrefix}-dmg-${m}`} className="wit-choice">
                    <input
                      type="radio"
                      name={`${radioPrefix}-dmgMode`}
                      checked={dmgMode === m}
                      onChange={() => setDmgMode(m)}
                    />
                    <span>{m === 'structured' ? 'Strutturata' : 'Libera'}</span>
                  </label>
                ))}
              </div>
              {dmgMode === 'structured' ? (
                <>
                  <StructuredFormulaBuilder value={dmgStructured} onChange={setDmgStructured} />
                  <span className="wit-hint">
                    Esempio LVL {tierLvl} →{' '}
                    {safeEvalFormula(formulaToFn(structuredToFormula(dmgStructured)), hintStats) ?? '—'}
                  </span>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    value={dmgLibera}
                    onChange={(e) => setDmgLibera(e.target.value)}
                    className="wit-input"
                    placeholder="Formula danno…"
                  />
                  {dmgLibera.trim() && (
                    <span className="wit-hint">
                      Esempio → {safeEvalFormula(formulaFromString(dmgLibera), hintStats) ?? 'errore formula'}
                    </span>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}

      {hasGittata && (
        <div className="wit-field">
          <label className="wit-label wit-label--inline">
            <input
              type="checkbox"
              checked={gittaReplace}
              onChange={(e) => setGittaReplace(e.target.checked)}
            />
            Sostituisci gittata
          </label>
          {gittaReplace && (
            <>
              <div className="wit-choice-row">
                {(['structured', 'free'] as const).map((m) => (
                  <label key={`${radioPrefix}-git-${m}`} className="wit-choice">
                    <input
                      type="radio"
                      name={`${radioPrefix}-gittaMode`}
                      checked={gittaMode === m}
                      onChange={() => setGittaMode(m)}
                    />
                    <span>{m === 'structured' ? 'Strutturata' : 'Libera'}</span>
                  </label>
                ))}
              </div>
              {gittaMode === 'structured' ? (
                <>
                  <StructuredFormulaBuilder value={gittaStructured} onChange={setGittaStructured} />
                  <span className="wit-hint">
                    Esempio LVL {tierLvl} →{' '}
                    {safeEvalFormula(formulaToFn(structuredToFormula(gittaStructured)), hintStats) ?? '—'} m
                  </span>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    value={gittaLibera}
                    onChange={(e) => setGittaLibera(e.target.value)}
                    className="wit-input"
                    placeholder="Formula gittata…"
                  />
                  {gittaLibera.trim() && (
                    <span className="wit-hint">
                      Esempio → {safeEvalFormula(formulaFromString(gittaLibera), hintStats) ?? 'errore formula'} m
                    </span>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

const DEFAULT_STRUCTURED: StructuredFormulaInput = {
  stat1: 'D',
  pct1: 60,
  stat2: 'M',
  pct2: 40,
  bonus: 0,
}

const DEFAULT_DANNO: StructuredFormulaInput = { stat1: 'E', pct1: 70, stat2: 'M', pct2: 0, bonus: 0 }

export default function WazaInsertionTool({
  kind = 'waza',
  initialWazaFromPool = null,
  initialWazaHydrateKey = 0,
  onHydratedWazaFromPool,
}: {
  kind?: WazaInsertionToolKind
  /** Carica una Waza del pool nel form (solo kind waza). */
  initialWazaFromPool?: WazaDef | null
  /** Incrementa (es. timestamp) per rieditare la stessa voce. */
  initialWazaHydrateKey?: number
  onHydratedWazaFromPool?: () => void
} = {}) {
  const meta = KIND_META[kind]
  const { pool: runtimeWazaPool, refetch: refetchRuntimeWaza } = useRuntimeWaza()
  const { merged: accessoriMerged } = useWazaAccessori()
  const weaponTagIds = accessoriMerged.weapon.tagIds
  const weaponTagLabels = accessoriMerged.weapon.labelById
  const statusIds = accessoriMerged.status.ids
  const statusLabelById = accessoriMerged.status.labelById
  const counterIds = accessoriMerged.counter.ids
  const counterLabelById = accessoriMerged.counter.labelById
  const replacePoolEntryIdRef = useRef<string | null>(null)
  const descRef = useRef<HTMLTextAreaElement>(null)
  const effectRef = useRef<HTMLTextAreaElement>(null)
  const [taxonomyField, setTaxonomyField] = useState<'desc' | 'effect'>('effect')
  const [poolReplaceIntent, setPoolReplaceIntent] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<WazaType>('passive')
  const [wazaBranch, setWazaBranch] = useState<WazaBranch>('proiezione')
  const [madoshoBranch, setMadoshoBranch] = useState<MadoshoRamo>(
    () => MADOSHO_BRANCH_OPTIONS[0] ?? ('legame' as MadoshoRamo),
  )
  const [pattiBranch, setPattiBranch] = useState<PattiRamo>(
    () => PATTI_BRANCH_OPTIONS[0] ?? ('patto' as PattiRamo),
  )
  const [description, setDescription] = useState('')
  const [effect, setEffect] = useState('')
  const [descriptionUpgrade2, setDescriptionUpgrade2] = useState('')
  const [descriptionUpgrade3, setDescriptionUpgrade3] = useState('')
  const [upgradeCostExp2, setUpgradeCostExp2] = useState<number | ''>('')
  const [upgradeCostExp3, setUpgradeCostExp3] = useState<number | ''>('')
  const [costJigoTipo, setCostJigoTipo] = useState<CostJigoTipo>('fisso')
  const [costJigo, setCostJigo] = useState(0)
  const [costCs, setCostCs] = useState(0)
  const [applicaStatus, setApplicaStatus] = useState<'si' | 'no'>('no')
  const [statusApplicabileId, setStatusApplicabileId] = useState<string>('')
  const [applicaCounter, setApplicaCounter] = useState<'si' | 'no'>('no')
  const [counterApplicabileId, setCounterApplicabileId] = useState<string>('')
  const [hasVelocity, setHasVelocity] = useState(false)
  const [velMode, setVelMode] = useState<'structured' | 'free'>('structured')
  const [velStructured, setVelStructured] = useState<StructuredFormulaInput>(DEFAULT_STRUCTURED)
  const [velLibera, setVelLibera] = useState('')
  const [hasDamage, setHasDamage] = useState(false)
  const [dannoMode, setDannoMode] = useState<'structured' | 'free'>('structured')
  const [dannoStructured, setDannoStructured] = useState<StructuredFormulaInput>(DEFAULT_DANNO)
  const [dannoLibera, setDannoLibera] = useState('')
  const [hasGittata, setHasGittata] = useState(false)
  const [gittataMode, setGittataMode] = useState<'structured' | 'free'>('structured')
  const [gittataStructured, setGittataStructured] = useState<StructuredFormulaInput>({ stat1: 'M', pct1: 15, stat2: 'D', pct2: 10, bonus: 2 })
  const [gittataLibera, setGittataLibera] = useState('')
  const [r2VelReplace, setR2VelReplace] = useState(false)
  const [r2VelMode, setR2VelMode] = useState<'structured' | 'free'>('structured')
  const [r2VelStructured, setR2VelStructured] = useState<StructuredFormulaInput>(DEFAULT_STRUCTURED)
  const [r2VelLibera, setR2VelLibera] = useState('')
  const [r2DmgReplace, setR2DmgReplace] = useState(false)
  const [r2DmgMode, setR2DmgMode] = useState<'structured' | 'free'>('structured')
  const [r2DmgStructured, setR2DmgStructured] = useState<StructuredFormulaInput>(DEFAULT_DANNO)
  const [r2DmgLibera, setR2DmgLibera] = useState('')
  const [r2GittaReplace, setR2GittaReplace] = useState(false)
  const [r2GittaMode, setR2GittaMode] = useState<'structured' | 'free'>('structured')
  const [r2GittaStructured, setR2GittaStructured] = useState<StructuredFormulaInput>({
    stat1: 'M', pct1: 15, stat2: 'D', pct2: 10, bonus: 2,
  })
  const [r2GittaLibera, setR2GittaLibera] = useState('')
  const [r3VelReplace, setR3VelReplace] = useState(false)
  const [r3VelMode, setR3VelMode] = useState<'structured' | 'free'>('structured')
  const [r3VelStructured, setR3VelStructured] = useState<StructuredFormulaInput>(DEFAULT_STRUCTURED)
  const [r3VelLibera, setR3VelLibera] = useState('')
  const [r3DmgReplace, setR3DmgReplace] = useState(false)
  const [r3DmgMode, setR3DmgMode] = useState<'structured' | 'free'>('structured')
  const [r3DmgStructured, setR3DmgStructured] = useState<StructuredFormulaInput>(DEFAULT_DANNO)
  const [r3DmgLibera, setR3DmgLibera] = useState('')
  const [r3GittaReplace, setR3GittaReplace] = useState(false)
  const [r3GittaMode, setR3GittaMode] = useState<'structured' | 'free'>('structured')
  const [r3GittaStructured, setR3GittaStructured] = useState<StructuredFormulaInput>({
    stat1: 'M', pct1: 15, stat2: 'D', pct2: 10, bonus: 2,
  })
  const [r3GittaLibera, setR3GittaLibera] = useState('')
  const [durata, setDurata] = useState<DurataType | ''>('')
  const [haPrerequisiti, setHaPrerequisiti] = useState<'si' | 'no'>('no')
  const [prereqSkiruId, setPrereqSkiruId] = useState('')
  const [prereqWazaId, setPrereqWazaId] = useState('')
  const [prereqGradoMin, setPrereqGradoMin] = useState<WazaGradoMilitare | ''>('')
  const [triggerEnabled, setTriggerEnabled] = useState(false)
  const [triggerCalcolo, setTriggerCalcolo] = useState('')
  const [triggerResource, setTriggerResource] = useState<WazaLaunchTriggerResource>('jigoka')
  const [triggerSubject, setTriggerSubject] = useState<WazaLaunchTriggerSubject>('caster')
  const [triggerKind, setTriggerKind] = useState<WazaLaunchTriggerKind>('boost')
  const [triggerTiming, setTriggerTiming] = useState('')
  const [boostTarget, setBoostTarget] = useState<WazaLaunchBoostTarget>('statistiche')
  const [boostStatKeys, setBoostStatKeys] = useState<WazaLaunchBoostStatKey[]>([])
  const [boostStatPercent, setBoostStatPercent] = useState('')
  const [boostDamagePercent, setBoostDamagePercent] = useState('')
  const [grantsWeaponCondition, setGrantsWeaponCondition] = useState<'si' | 'no'>('no')
  const [grantCondTag, setGrantCondTag] = useState<string>(() => WAZA_WEAPON_CONDITION_TAGS[0])
  const [readsConditionalBranch, setReadsConditionalBranch] = useState<'si' | 'no'>('no')
  const [condBranchId, setCondBranchId] = useState('cond')
  const [condReadTag, setCondReadTag] = useState<string>(() => WAZA_WEAPON_CONDITION_TAGS[0])

  useEffect(() => {
    if (kind !== 'waza') return
    const fallback = weaponTagIds[0] ?? WAZA_WEAPON_CONDITION_TAGS[0]
    setGrantCondTag((t) => (weaponTagIds.includes(t) ? t : fallback))
    setCondReadTag((t) => (weaponTagIds.includes(t) ? t : fallback))
  }, [kind, weaponTagIds])
  const [condRank1AltKind, setCondRank1AltKind] = useState<WazaCondRankAltKind>('none')
  const [condRank1AltValue, setCondRank1AltValue] = useState<number | ''>('')
  const [condRank2AltKind, setCondRank2AltKind] = useState<WazaCondRankAltKind>('none')
  const [condRank2AltValue, setCondRank2AltValue] = useState<number | ''>('')
  const [condRank3AltKind, setCondRank3AltKind] = useState<WazaCondRankAltKind>('none')
  const [condRank3AltValue, setCondRank3AltValue] = useState<number | ''>('')
  const [draftWaza, setDraftWaza] = useState<AuthoringDraft | null>(null)
  const [exportCode, setExportCode] = useState('')
  const [poolSaveMsg, setPoolSaveMsg] = useState<string | null>(null)
  const [poolSaveErr, setPoolSaveErr] = useState<string | null>(null)
  const [deletePoolIdDraft, setDeletePoolIdDraft] = useState('')
  const poolPersist = canPersistAuthoringToPool()

  const tierSummary = useMemo(
    () => getWazaManualTierSummary(costCs, type === 'passive'),
    [costCs, type],
  )

  const insertTaxonomyTag = (tagLabel: string) => {
    if (taxonomyField === 'desc') {
      insertBracketTagAtTextarea(descRef.current, tagLabel, setDescription, () => description)
    } else {
      insertBracketTagAtTextarea(effectRef.current, tagLabel, setEffect, () => effect)
    }
  }

  const appendPoolKind: OyasumiAppendPoolKind =
    kind === 'waza' ? 'waza' : kind === 'madosho' ? 'madosho' : 'patti'
  const poolTsFile =
    kind === 'waza' ? 'wazaPool.ts' : kind === 'madosho' ? 'madoshoPool.ts' : 'pattiPool.ts'

  useEffect(() => {
    const opts = Object.keys(MADOSHO_RAMO_LABELS) as MadoshoRamo[]
    if (opts.length === 0) return
    if (!opts.includes(madoshoBranch)) setMadoshoBranch(opts[0])
  }, [madoshoBranch, MADOSHO_RAMO_LABELS])

  useEffect(() => {
    const opts = Object.keys(PATTI_RAMO_LABELS) as PattiRamo[]
    if (opts.length === 0) return
    if (!opts.includes(pattiBranch)) setPattiBranch(opts[0])
  }, [pattiBranch, PATTI_RAMO_LABELS])

  useEffect(() => {
    if (kind !== 'waza' || !initialWazaFromPool || initialWazaHydrateKey === 0) return
    const h = hydrationFromWazaDef(initialWazaFromPool)
    setName(h.name)
    setType(h.type)
    setWazaBranch(h.wazaBranch)
    setDescription(h.description)
    setEffect(h.effect)
    setDescriptionUpgrade2(h.descriptionUpgrade2)
    setDescriptionUpgrade3(h.descriptionUpgrade3)
    setUpgradeCostExp2(h.upgradeCostExp2)
    setUpgradeCostExp3(h.upgradeCostExp3)
    setCostJigoTipo(h.costJigoTipo)
    setCostJigo(h.costJigo)
    setCostCs(h.costCs)
    setApplicaStatus(h.applicaStatus)
    setStatusApplicabileId(h.statusApplicabileId)
    setApplicaCounter(h.applicaCounter)
    setCounterApplicabileId(h.counterApplicabileId)
    setHasVelocity(h.hasVelocity)
    setVelMode(h.velMode)
    setVelStructured(h.velStructured)
    setVelLibera(h.velLibera)
    setHasDamage(h.hasDamage)
    setDannoMode(h.dannoMode)
    setDannoStructured(h.dannoStructured)
    setDannoLibera(h.dannoLibera)
    setHasGittata(h.hasGittata)
    setGittataMode(h.gittataMode)
    setGittataStructured(h.gittataStructured)
    setGittataLibera(h.gittataLibera)
    setR2VelReplace(h.r2VelReplace)
    setR2VelMode(h.r2VelMode)
    setR2VelStructured(h.r2VelStructured)
    setR2VelLibera(h.r2VelLibera)
    setR2DmgReplace(h.r2DmgReplace)
    setR2DmgMode(h.r2DmgMode)
    setR2DmgStructured(h.r2DmgStructured)
    setR2DmgLibera(h.r2DmgLibera)
    setR2GittaReplace(h.r2GittaReplace)
    setR2GittaMode(h.r2GittaMode)
    setR2GittaStructured(h.r2GittaStructured)
    setR2GittaLibera(h.r2GittaLibera)
    setR3VelReplace(h.r3VelReplace)
    setR3VelMode(h.r3VelMode)
    setR3VelStructured(h.r3VelStructured)
    setR3VelLibera(h.r3VelLibera)
    setR3DmgReplace(h.r3DmgReplace)
    setR3DmgMode(h.r3DmgMode)
    setR3DmgStructured(h.r3DmgStructured)
    setR3DmgLibera(h.r3DmgLibera)
    setR3GittaReplace(h.r3GittaReplace)
    setR3GittaMode(h.r3GittaMode)
    setR3GittaStructured(h.r3GittaStructured)
    setR3GittaLibera(h.r3GittaLibera)
    setDurata(h.durata)
    setHaPrerequisiti(h.haPrerequisiti)
    setPrereqSkiruId(h.prereqSkiruId)
    setPrereqWazaId(h.prereqWazaId)
    setPrereqGradoMin(h.prereqGradoMin)
    setTriggerEnabled(h.triggerEnabled)
    setTriggerKind(h.triggerKind)
    setTriggerResource(h.triggerResource)
    setTriggerSubject(h.triggerSubject)
    setTriggerCalcolo(h.triggerCalcolo)
    setTriggerTiming(h.triggerTiming)
    setBoostTarget(h.boostTarget)
    setBoostStatKeys(h.boostStatKeys)
    setBoostStatPercent(h.boostStatPercent)
    setBoostDamagePercent(h.boostDamagePercent)
    setGrantsWeaponCondition(h.grantsWeaponCondition)
    setGrantCondTag(h.grantCondTag)
    setReadsConditionalBranch(h.readsConditionalBranch)
    setCondBranchId(h.condBranchId)
    setCondReadTag(h.condReadTag)
    setCondRank1AltKind(h.condRank1AltKind)
    setCondRank1AltValue(h.condRank1AltValue)
    setCondRank2AltKind(h.condRank2AltKind)
    setCondRank2AltValue(h.condRank2AltValue)
    setCondRank3AltKind(h.condRank3AltKind)
    setCondRank3AltValue(h.condRank3AltValue)
    replacePoolEntryIdRef.current = initialWazaFromPool.id
    setPoolReplaceIntent(true)
    setDraftWaza(null)
    setExportCode('')
    setPoolSaveMsg(null)
    setPoolSaveErr(null)
    onHydratedWazaFromPool?.()
    // Solo key + voce: evita re-idratazioni se il parent passa onHydrated instabile.
  }, [kind, initialWazaFromPool, initialWazaHydrateKey])

  const handlePreview = () => {
    const id = slugify(name.trim()) || meta.defaultIdFallback
    const effectiveBranch =
      kind === 'waza' ? wazaBranch : kind === 'madosho' ? madoshoBranch : pattiBranch
    const isPassive = type === 'passive'

    const gittataFormula = hasGittata
      ? gittataMode === 'structured' ? structuredToFormula(gittataStructured) : gittataLibera
      : ''
    const gittataEntry =
      hasGittata && gittataFormula
        ? { label: 'Gittata', formula: gittataFormula, note: gittataMode === 'structured' ? 'Grado applicato automaticamente' : '' }
        : null

    const finalQuadrante = gittataEntry ? [gittataEntry] : []

    const velFormulaFn = hasVelocity
      ? velMode === 'structured' ? formulaToFn(structuredToFormula(velStructured)) : formulaFromString(velLibera)
      : undefined
    const dbwFn = hasDamage
      ? dannoMode === 'structured' ? formulaToFn(structuredToFormula(dannoStructured)) : formulaFromString(dannoLibera)
      : undefined

    const velFormulaRank2Fn =
      !isPassive &&
      r2VelReplace &&
      hasVelocity
        ? r2VelMode === 'structured'
          ? formulaToFn(structuredToFormula(r2VelStructured))
          : formulaFromString(r2VelLibera)
        : undefined
    const velFormulaRank3Fn =
      !isPassive &&
      r3VelReplace &&
      hasVelocity
        ? r3VelMode === 'structured'
          ? formulaToFn(structuredToFormula(r3VelStructured))
          : formulaFromString(r3VelLibera)
        : undefined
    const dbwRank2Fn =
      !isPassive &&
      r2DmgReplace &&
      hasDamage
        ? r2DmgMode === 'structured'
          ? formulaToFn(structuredToFormula(r2DmgStructured))
          : formulaFromString(r2DmgLibera)
        : undefined
    const dbwRank3Fn =
      !isPassive &&
      r3DmgReplace &&
      hasDamage
        ? r3DmgMode === 'structured'
          ? formulaToFn(structuredToFormula(r3DmgStructured))
          : formulaFromString(r3DmgLibera)
        : undefined
    const gittataFormulaRank2Fn =
      !isPassive &&
      r2GittaReplace &&
      hasGittata
        ? r2GittaMode === 'structured'
          ? formulaToFn(structuredToFormula(r2GittaStructured))
          : formulaFromString(r2GittaLibera)
        : undefined
    const gittataFormulaRank3Fn =
      !isPassive &&
      r3GittaReplace &&
      hasGittata
        ? r3GittaMode === 'structured'
          ? formulaToFn(structuredToFormula(r3GittaStructured))
          : formulaFromString(r3GittaLibera)
        : undefined
    const { description: descOut, effect: effectOut } = buildNarrativeAndEffect(
      description,
      effect,
      applicaStatus,
      statusApplicabileId,
      applicaCounter,
      counterApplicabileId,
      statusLabelById,
      counterLabelById,
    )

    const waza = {
      id,
      name: name.trim() || (kind === 'waza' ? 'Nuova Waza' : kind === 'madosho' ? 'Nuovo Madōsho' : 'Nuovo Patto'),
      type,
      branch: effectiveBranch,
      description: descOut,
      effect: effectOut,
      descriptionUpgrade2: isPassive ? undefined : descriptionUpgrade2.trim() || undefined,
      descriptionUpgrade3: isPassive ? undefined : descriptionUpgrade3.trim() || undefined,
      upgradeCostExp2:
        isPassive || upgradeCostExp2 === '' ? undefined : Math.max(0, Number(upgradeCostExp2)),
      upgradeCostExp3:
        isPassive || upgradeCostExp3 === '' ? undefined : Math.max(0, Number(upgradeCostExp3)),
      quadranteCalcoli: finalQuadrante.length > 0 ? finalQuadrante : undefined,
      costJigo: () => costJigo,
      costJigoTipo,
      costCs,
      velBonus: 0,
      velFormula: velFormulaFn,
      velFormulaRank2: velFormulaRank2Fn,
      velFormulaRank3: velFormulaRank3Fn,
      dbw: dbwFn ?? 0,
      dbwRank2: dbwRank2Fn,
      dbwRank3: dbwRank3Fn,
      hasVelocity,
      hasDamage,
      gittataFormulaRank2: gittataFormulaRank2Fn,
      gittataFormulaRank3: gittataFormulaRank3Fn,
      durata: durata || undefined,
      applicaStatusId: applicaStatus === 'si' && statusApplicabileId ? statusApplicabileId : undefined,
      applicaCounterId: applicaCounter === 'si' && counterApplicabileId ? counterApplicabileId : undefined,
      prereqSkiruId: haPrerequisiti === 'si' && prereqSkiruId ? prereqSkiruId : undefined,
      prereqWazaId: haPrerequisiti === 'si' && prereqWazaId.trim() ? prereqWazaId.trim() : undefined,
      prereqGradoMin: haPrerequisiti === 'si' && prereqGradoMin !== '' ? prereqGradoMin : undefined,
      launchTrigger: triggerEnabled
        ? (() => {
            const resource: WazaLaunchTriggerResource =
              triggerKind === 'boost'
                ? boostTarget === 'danno'
                  ? 'danno'
                  : 'statistiche'
                : triggerResource
            const base: WazaLaunchTrigger = {
              kind: triggerKind,
              resource,
              calcoloLibero: triggerKind === 'boost' ? '' : triggerCalcolo.trim(),
              subject: triggerSubject,
              timingAzioni: triggerTiming.trim(),
            }
            if (triggerKind === 'boost') {
              base.boostTarget = boostTarget
              if (boostTarget === 'statistiche') {
                if (boostStatKeys.length > 0) {
                  base.boostStatKeys = [...boostStatKeys].sort() as WazaLaunchBoostStatKey[]
                }
                if (boostStatPercent.trim()) base.boostStatPercent = boostStatPercent.trim()
              } else if (boostDamagePercent.trim()) {
                base.boostDamagePercent = boostDamagePercent.trim()
              }
            }
            return base
          })()
        : undefined,
      ...weaponConditionFieldsFromFormSlice({
        grantsWeaponCondition,
        grantCondTag,
        readsConditionalBranch,
        condBranchId,
        condReadTag,
        condRank1AltKind,
        condRank1AltValue,
        condRank2AltKind,
        condRank2AltValue,
        condRank3AltKind,
        condRank3AltValue,
      }),
    }
    setDraftWaza(waza as AuthoringDraft)
    setExportCode('')
  }

  const buildExportedPoolEntry = (): string | null => {
    if (!draftWaza) return null
    const isPassive = draftWaza.type === 'passive'
    const q = draftWaza.quadranteCalcoli
    const quadranteStr = q?.length
      ? `    quadranteCalcoli: [\n${q.map((r) => `      { label: '${(r.label || '').replace(/'/g, "\\'")}', formula: '${(r.formula || '').replace(/'/g, "\\'")}', note: '${(r.note || '').replace(/'/g, "\\'")}' }`).join(',\n')}\n    ],`
      : ''
    const velFormulaExpr = hasVelocity
      ? velMode === 'structured' ? structuredToFormula(velStructured) : velLibera
      : ''
    const velFormulaStr =
      hasVelocity && velFormulaExpr ? poolExportStatFormula('velFormula', velFormulaExpr) : ''
    const dbwExpr = hasDamage
      ? dannoMode === 'structured' ? structuredToFormula(dannoStructured) : dannoLibera
      : ''
    const dbwStr = hasDamage && dbwExpr ? poolExportDbwLine(dbwExpr) : 'dbw: 0,'

    const velR2Expr =
      r2VelReplace && hasVelocity
        ? r2VelMode === 'structured'
          ? structuredToFormula(r2VelStructured)
          : r2VelLibera
        : ''
    const velR2Str =
      !isPassive && velR2Expr.trim() !== ''
        ? `${poolExportStatFormula('velFormulaRank2', velR2Expr)}\n`
        : ''
    const velR3Expr =
      r3VelReplace && hasVelocity
        ? r3VelMode === 'structured'
          ? structuredToFormula(r3VelStructured)
          : r3VelLibera
        : ''
    const velR3Str =
      !isPassive && velR3Expr.trim() !== ''
        ? `${poolExportStatFormula('velFormulaRank3', velR3Expr)}\n`
        : ''

    const dbwR2Expr =
      r2DmgReplace && hasDamage
        ? r2DmgMode === 'structured'
          ? structuredToFormula(r2DmgStructured)
          : r2DmgLibera
        : ''
    const dbwR2Str =
      !isPassive && dbwR2Expr.trim() !== ''
        ? `${poolExportStatFormula('dbwRank2', dbwR2Expr)}\n`
        : ''
    const dbwR3Expr =
      r3DmgReplace && hasDamage
        ? r3DmgMode === 'structured'
          ? structuredToFormula(r3DmgStructured)
          : r3DmgLibera
        : ''
    const dbwR3Str =
      !isPassive && dbwR3Expr.trim() !== ''
        ? `${poolExportStatFormula('dbwRank3', dbwR3Expr)}\n`
        : ''

    const gittaR2Expr =
      r2GittaReplace && hasGittata
        ? r2GittaMode === 'structured'
          ? structuredToFormula(r2GittaStructured)
          : r2GittaLibera
        : ''
    const gittaR2Str =
      !isPassive && gittaR2Expr.trim() !== ''
        ? `${poolExportStatFormula('gittataFormulaRank2', gittaR2Expr)}\n`
        : ''
    const gittaR3Expr =
      r3GittaReplace && hasGittata
        ? r3GittaMode === 'structured'
          ? structuredToFormula(r3GittaStructured)
          : r3GittaLibera
        : ''
    const gittaR3Str =
      !isPassive && gittaR3Expr.trim() !== ''
        ? `${poolExportStatFormula('gittataFormulaRank3', gittaR3Expr)}\n`
        : ''

    const durataStr = durata ? `    durata: '${durata}',\n` : ''
    const costJigoTipoStr = `    costJigoTipo: '${costJigoTipo}',\n`
    const applicaStatusStr =
      applicaStatus === 'si' && statusApplicabileId
        ? `    applicaStatusId: '${statusApplicabileId}',\n`
        : ''
    const applicaCounterStr =
      applicaCounter === 'si' && counterApplicabileId
        ? `    applicaCounterId: '${counterApplicabileId}',\n`
        : ''
    const prereqSkiruStr = draftWaza.prereqSkiruId
      ? `    prereqSkiruId: '${draftWaza.prereqSkiruId.replace(/'/g, "\\'")}',\n`
      : ''
    const prereqWazaStr = draftWaza.prereqWazaId
      ? `    prereqWazaId: '${draftWaza.prereqWazaId.replace(/'/g, "\\'")}',\n`
      : ''
    const prereqGradoStr =
      draftWaza.prereqGradoMin != null ? `    prereqGradoMin: ${draftWaza.prereqGradoMin},\n` : ''
    const descUp2Str =
      !isPassive && draftWaza.descriptionUpgrade2
        ? `    descriptionUpgrade2: "${escapeForPoolString(draftWaza.descriptionUpgrade2)}",\n`
        : ''
    const descUp3Str =
      !isPassive && draftWaza.descriptionUpgrade3
        ? `    descriptionUpgrade3: "${escapeForPoolString(draftWaza.descriptionUpgrade3)}",\n`
        : ''
    const upExp2Str =
      !isPassive && draftWaza.upgradeCostExp2 != null
        ? `    upgradeCostExp2: ${draftWaza.upgradeCostExp2},\n`
        : ''
    const upExp3Str =
      !isPassive && draftWaza.upgradeCostExp3 != null
        ? `    upgradeCostExp3: ${draftWaza.upgradeCostExp3},\n`
        : ''
    const descLine =
      draftWaza.description != null && draftWaza.description !== ''
        ? `    description: "${escapeForPoolString(draftWaza.description)}",\n`
        : ''
    const effectLine =
      draftWaza.effect != null && draftWaza.effect !== ''
        ? `    effect: "${escapeForPoolString(draftWaza.effect)}",\n`
        : ''
    const proseExport =
      descLine + effectLine !== '' ? descLine + effectLine : `    description: "",\n`
    const lt = draftWaza.launchTrigger
    const ltStr = lt ? serializeLaunchTriggerForExport(lt) : ''
    const wcSlice = weaponConditionFieldsFromFormSlice({
      grantsWeaponCondition,
      grantCondTag,
      readsConditionalBranch,
      condBranchId,
      condReadTag,
      condRank1AltKind,
      condRank1AltValue,
      condRank2AltKind,
      condRank2AltValue,
      condRank3AltKind,
      condRank3AltValue,
    })
    const wcStr = serializeWeaponConditionForPool(wcSlice)

    const code = `  // ${meta.entityName}: ${draftWaza.name.replace(/\n/g, ' ')}
  {
    id: '${draftWaza.id}',
    name: '${draftWaza.name.replace(/'/g, "\\'")}',
    type: '${draftWaza.type}',
    branch: '${draftWaza.branch}',
${proseExport}${descUp2Str}${descUp3Str}${upExp2Str}${upExp3Str}${quadranteStr ? quadranteStr + '\n' : ''}${costJigoTipoStr}    costJigo: () => ${costJigo},
    costCs: ${costCs},
    velBonus: 0,${velFormulaStr ? '\n' + velFormulaStr : ''}
${velR2Str}${velR3Str}    ${dbwStr}
${dbwR2Str}${dbwR3Str}${gittaR2Str}${gittaR3Str}    hasVelocity: ${hasVelocity},
    hasDamage: ${hasDamage},${durataStr ? '\n' + durataStr : ''}${applicaStatusStr}${applicaCounterStr}${prereqSkiruStr}${prereqWazaStr}${prereqGradoStr}${ltStr}${wcStr}
  },`
    return code
  }

  const handleExport = () => {
    const code = buildExportedPoolEntry()
    if (code != null) setExportCode(code)
  }

  const handleSaveToPool = async () => {
    setPoolSaveMsg(null)
    setPoolSaveErr(null)
    const code = buildExportedPoolEntry()
    if (code == null) {
      setPoolSaveErr('Esegui prima Preview, poi salva.')
      return
    }
    const replaceId = replacePoolEntryIdRef.current
    try {
      if (replaceId) {
        await replaceOyasumiPoolEntry(appendPoolKind, code, replaceId)
        setExportCode(code)
        replacePoolEntryIdRef.current = draftWaza?.id ?? replaceId
        setPoolSaveMsg(
          `Voce aggiornata in src/${poolTsFile} (sostituito blocco id «${replaceId}»). HMR in dev; altrimenti «Esporta».`,
        )
      } else {
        await appendOyasumiPoolEntry(appendPoolKind, code)
        setExportCode(code)
        setPoolSaveMsg(
          `Voce aggiunta a src/${poolTsFile}. Con «npm run dev» attivo l’elenco si aggiorna via HMR; in tutti gli altri casi usa «Esporta» e incolla a mano.`,
        )
      }
      if (appendPoolKind === 'waza') await refetchRuntimeWaza()
    } catch (e) {
      setPoolSaveErr(e instanceof Error ? e.message : String(e))
    }
  }

  const handleDeleteCurrentFromPool = async () => {
    setPoolSaveMsg(null)
    setPoolSaveErr(null)
    const removeId = replacePoolEntryIdRef.current
    if (!removeId) {
      setPoolSaveErr('Nessuna voce in modifica. Per Madōsho/Patto usa «Elimina per id» sotto.')
      return
    }
    if (!window.confirm(`Eliminare dal pool la voce con id «${removeId}» (${meta.poolHint})?`)) return
    try {
      await deleteOyasumiPoolEntry(appendPoolKind, removeId)
      setPoolSaveMsg(`Voce «${removeId}» rimossa da src/${poolTsFile}.`)
      if (appendPoolKind === 'waza') await refetchRuntimeWaza()
      handleReset()
    } catch (e) {
      setPoolSaveErr(e instanceof Error ? e.message : String(e))
    }
  }

  const handleDeleteByIdFromPool = async () => {
    setPoolSaveMsg(null)
    setPoolSaveErr(null)
    const removeId = deletePoolIdDraft.trim()
    if (!removeId) {
      setPoolSaveErr('Inserisci l’id slug da rimuovere.')
      return
    }
    if (!window.confirm(`Eliminare dal pool la voce «${removeId}» (${meta.poolHint})?`)) return
    try {
      await deleteOyasumiPoolEntry(appendPoolKind, removeId)
      setDeletePoolIdDraft('')
      setPoolSaveMsg(`Voce «${removeId}» rimossa da src/${poolTsFile}.`)
      if (appendPoolKind === 'waza') await refetchRuntimeWaza()
      if (replacePoolEntryIdRef.current === removeId) handleReset()
    } catch (e) {
      setPoolSaveErr(e instanceof Error ? e.message : String(e))
    }
  }

  const handleReset = () => {
    setName('')
    setType('passive')
    setWazaBranch('proiezione')
    setMadoshoBranch(MADOSHO_BRANCH_OPTIONS[0] ?? ('legame' as MadoshoRamo))
    setPattiBranch(PATTI_BRANCH_OPTIONS[0] ?? ('patto' as PattiRamo))
    setDescription('')
    setEffect('')
    setDescriptionUpgrade2('')
    setDescriptionUpgrade3('')
    setUpgradeCostExp2('')
    setUpgradeCostExp3('')
    setCostJigoTipo('fisso')
    setCostJigo(0)
    setCostCs(0)
    setApplicaStatus('no')
    setStatusApplicabileId('')
    setApplicaCounter('no')
    setCounterApplicabileId('')
    setHasVelocity(false)
    setVelMode('structured')
    setVelStructured(DEFAULT_STRUCTURED)
    setVelLibera('')
    setHasDamage(false)
    setDannoMode('structured')
    setDannoStructured(DEFAULT_DANNO)
    setDannoLibera('')
    setHasGittata(false)
    setGittataMode('structured')
    setGittataStructured({ stat1: 'M', pct1: 15, stat2: 'D', pct2: 10, bonus: 2 })
    setGittataLibera('')
    setR2VelReplace(false)
    setR2VelMode('structured')
    setR2VelStructured(DEFAULT_STRUCTURED)
    setR2VelLibera('')
    setR2DmgReplace(false)
    setR2DmgMode('structured')
    setR2DmgStructured(DEFAULT_DANNO)
    setR2DmgLibera('')
    setR2GittaReplace(false)
    setR2GittaMode('structured')
    setR2GittaStructured({ stat1: 'M', pct1: 15, stat2: 'D', pct2: 10, bonus: 2 })
    setR2GittaLibera('')
    setR3VelReplace(false)
    setR3VelMode('structured')
    setR3VelStructured(DEFAULT_STRUCTURED)
    setR3VelLibera('')
    setR3DmgReplace(false)
    setR3DmgMode('structured')
    setR3DmgStructured(DEFAULT_DANNO)
    setR3DmgLibera('')
    setR3GittaReplace(false)
    setR3GittaMode('structured')
    setR3GittaStructured({ stat1: 'M', pct1: 15, stat2: 'D', pct2: 10, bonus: 2 })
    setR3GittaLibera('')
    setDurata('')
    setHaPrerequisiti('no')
    setPrereqSkiruId('')
    setPrereqWazaId('')
    setPrereqGradoMin('')
    setTriggerEnabled(false)
    setTriggerCalcolo('')
    setTriggerResource('jigoka')
    setTriggerSubject('caster')
    setTriggerKind('boost')
    setTriggerTiming('')
    setBoostTarget('statistiche')
    setBoostStatKeys([])
    setBoostStatPercent('')
    setBoostDamagePercent('')
    setGrantsWeaponCondition('no')
    setGrantCondTag(weaponTagIds[0] ?? WAZA_WEAPON_CONDITION_TAGS[0])
    setReadsConditionalBranch('no')
    setCondBranchId('cond')
    setCondReadTag(weaponTagIds[0] ?? WAZA_WEAPON_CONDITION_TAGS[0])
    setCondRank1AltKind('none')
    setCondRank1AltValue('')
    setCondRank2AltKind('none')
    setCondRank2AltValue('')
    setCondRank3AltKind('none')
    setCondRank3AltValue('')
    setDraftWaza(null)
    setExportCode('')
    setPoolSaveMsg(null)
    setPoolSaveErr(null)
    replacePoolEntryIdRef.current = null
    setPoolReplaceIntent(false)
  }

  return (
    <div className="wit animate__animated animate__fadeIn">
      <section className="wit-hero">
        <h2>{meta.title}</h2>
        {kind === 'waza' && poolReplaceIntent && (
          <p className="wit-hero-legend" style={{ borderLeft: '3px solid var(--accent-gold)', paddingLeft: '0.75rem' }}>
            Stai modificando una voce già nel pool: <strong>Salva nel pool (dev)</strong> sostituisce il blocco della tecnica originale (riferimento id). Usa <strong>Azzera form</strong> per uscire dalla modalità modifica.
          </p>
        )}
        <p>
          Compila il form per prototipare una nuova scheda ({meta.entityName}). Usa <strong>Preview</strong> per validare, poi <strong>Esporta codice</strong> o <strong>Salva nel pool (dev)</strong> per aggiungere la voce a{' '}
          <code className="wit-inline-code">{meta.poolHint}</code> (solo con <code className="wit-inline-code">npm run dev</code>); altrimenti copia il testo. Lo shape resta <code className="wit-inline-code">WazaDef</code>.
        </p>
        <p className="wit-hero-legend">
          <strong>Parametri formule</strong>, dal profilo personaggio:{' '}
          <span className="wit-kbd">F</span> Forza, <span className="wit-kbd">C</span> Costituzione, <span className="wit-kbd">D</span> Destrezza, <span className="wit-kbd">M</span> Mente, <span className="wit-kbd">E</span> Empatia,{' '}
          <span className="wit-kbd">REF</span> Riflessi (Reflexes), derivata{' '}
          <span className="wit-formula-hint">floor(Y×(0,4×M + 0,6×D))</span> come in dominio Oyasumi; nelle formule libere del tester il valore è calcolato con Y=1,{' '}
          <span className="wit-kbd">LVL</span> Livello skill, <span className="wit-kbd">Grado</span> Grado Militare 1–7, <span className="wit-kbd">floor</span> arrotondamento per difetto.
        </p>
      </section>

      <form
        className="wit-form"
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return
          const t = e.target
          if (t instanceof HTMLInputElement && (t.type === 'text' || t.type === 'search')) {
            e.preventDefault()
          }
        }}
        onSubmit={(e) => {
          e.preventDefault()
          try {
            handlePreview()
          } catch (err) {
            console.error(err)
          }
        }}
      >
        <div className="wit-panel">
          <h3 className="wit-panel-title">Identità</h3>
          <div className="wit-field">
            <label className="wit-label" htmlFor="wit-name">Nome *</label>
            <input
              id="wit-name"
              type="text"
              className="wit-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="es. Estensione"
            />
            <span className="wit-hint">L’id in export e in anteprima è lo slug del nome, generato automaticamente.</span>
          </div>

          <div className="wit-row">
            <div className="wit-field">
              <label className="wit-label" htmlFor="wit-type">Tipo</label>
              <select id="wit-type" value={type} onChange={(e) => setType(e.target.value as WazaType)} className="wit-select">
                <option value="passive">Passive</option>
                <option value="active">Active</option>
              </select>
            </div>
            <div className="wit-field">
              <label className="wit-label" htmlFor="wit-branch">
                {kind === 'waza' ? 'Ramo (Via)' : kind === 'madosho' ? 'Ramo Madōsho' : 'Ramo patto'}
              </label>
              {kind === 'waza' && (
                <select
                  id="wit-branch"
                  value={wazaBranch}
                  onChange={(e) => setWazaBranch(e.target.value as WazaBranch)}
                  className="wit-select"
                >
                  {BRANCH_OPTIONS.map((b) => (
                    <option key={b} value={b}>{BRANCH_LABELS[b]}</option>
                  ))}
                </select>
              )}
              {kind === 'madosho' && (
                <select
                  id="wit-branch"
                  value={madoshoBranch}
                  onChange={(e) => setMadoshoBranch(e.target.value as MadoshoRamo)}
                  className="wit-select"
                >
                  {MADOSHO_BRANCH_OPTIONS.map((b) => (
                    <option key={b} value={b}>{MADOSHO_RAMO_LABELS[b]}</option>
                  ))}
                </select>
              )}
              {kind === 'patti' && (
                <select
                  id="wit-branch"
                  value={pattiBranch}
                  onChange={(e) => setPattiBranch(e.target.value as PattiRamo)}
                  className="wit-select"
                >
                  {PATTI_BRANCH_OPTIONS.map((b) => (
                    <option key={b} value={b}>{PATTI_RAMO_LABELS[b]}</option>
                  ))}
                </select>
              )}
              <span className="wit-hint">
                {kind !== 'waza' && (
                  <>I rami sono in <code className="wit-inline-code">madoshoTaxonomy.ts</code> /{' '}
                  <code className="wit-inline-code">pattiTaxonomy.ts</code> (tools dedicati + Salva su disco). </>
                )}
              </span>
            </div>
            <div className="wit-field">
              <label className="wit-label" htmlFor="wit-durata">Durata</label>
              <select id="wit-durata" value={durata} onChange={(e) => setDurata(e.target.value as DurataType | '')} className="wit-select wit-select-durata">
                <option value="">—</option>
                {DURATA_OPTIONS.map((d) => (
                  <option key={d} value={d}>{DURATA_LABELS[d]}</option>
                ))}
              </select>
              <span className="wit-hint">Indica per quanti turni dura l’effetto della waza.</span>
            </div>
          </div>

          <div className="wit-field">
            <label className="wit-label" htmlFor="wit-desc">Descrizione{type === 'active' ? ` · ${meta.entityName} I` : ''}</label>
            <textarea
              id="wit-desc"
              ref={descRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                type === 'active'
                  ? 'Narrativa / scena Waza I (LVL 1)…'
                  : 'Narrativa della passive…'
              }
              className="wit-textarea"
            />
          </div>
          <div className="wit-field">
            <label className="wit-label" htmlFor="wit-effect">Effetto{type === 'active' ? ` · ${meta.entityName} I` : ''}</label>
            <textarea
              id="wit-effect"
              ref={effectRef}
              value={effect}
              onChange={(e) => setEffect(e.target.value)}
              placeholder="Meccanica, tag tra [parentesi quadre]…"
              className="wit-textarea"
            />
            <span className="wit-hint">I segmenti tra [ ] vengono evidenziati in anteprima.</span>
          </div>

          {kind === 'waza' && (
            <WazaTaxonomyInsertPanel
              activeField={taxonomyField}
              onActiveFieldChange={setTaxonomyField}
              onInsertTag={insertTaxonomyTag}
            />
          )}
        </div>

        <div className="wit-panel">
            <h3 className="wit-panel-title">Trigger al lancio (opz.)</h3>
            <p className="wit-hint wit-hint--flush-top">
              Disponibile per passive, attive, Madōsho e Patto. Espelli in chat effetti in catena (sconti, risorse, boost); qui strutturi scheda ed export.
            </p>
            <div className="wit-field">
              <label className="wit-label wit-label--inline">
                <input
                  type="checkbox"
                  checked={triggerEnabled}
                  onChange={(e) => setTriggerEnabled(e.target.checked)}
                />
                Attiva trigger
              </label>
            </div>
            {triggerEnabled && (
              <>
                <div className="wit-field">
                  <label className="wit-label" htmlFor="wit-trig-kind">Regola (macro-tipologia)</label>
                  <select
                    id="wit-trig-kind"
                    className="wit-select"
                    value={triggerKind}
                    onChange={(e) => {
                      const v = e.target.value as WazaLaunchTriggerKind
                      setTriggerKind(v)
                      if (v !== 'boost') {
                        setBoostTarget('statistiche')
                        setBoostStatKeys([])
                        setBoostStatPercent('')
                        setBoostDamagePercent('')
                      }
                    }}
                  >
                    {LAUNCH_TRIGGER_KINDS.map((k) => (
                      <option key={k} value={k}>{WAZA_LAUNCH_TRIGGER_KIND_LABELS[k]}</option>
                    ))}
                  </select>
                </div>

                {triggerKind === 'boost' && (
                  <div className="wit-subpanel wit-subpanel--trigger-boost">
                    <p className="wit-label wit-label--block-mt">Cosa boostare</p>
                    <div className="wit-choice-row">
                      {(['statistiche', 'danno'] as const).map((t) => (
                        <label key={t} className="wit-choice">
                          <input
                            type="radio"
                            name="wit-boost-target"
                            checked={boostTarget === t}
                            onChange={() => setBoostTarget(t)}
                          />
                          <span>{t === 'statistiche' ? 'Statistiche' : 'Danno'}</span>
                        </label>
                      ))}
                    </div>
                    {boostTarget === 'statistiche' && (
                      <>
                        <p className="wit-hint wit-hint--flush-top">Seleziona una o più statistiche.</p>
                        <div className="wit-choice-row wit-choice-row--wrap">
                          {WAZA_LAUNCH_BOOST_STAT_KEYS.map((k) => (
                            <label key={k} className="wit-choice">
                              <input
                                type="checkbox"
                                checked={boostStatKeys.includes(k)}
                                onChange={() => {
                                  setBoostStatKeys((prev) =>
                                    prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
                                  )
                                }}
                              />
                              <span>{WAZA_LAUNCH_BOOST_STAT_LABELS[k]}</span>
                            </label>
                          ))}
                        </div>
                        <div className="wit-field">
                          <label className="wit-label" htmlFor="wit-boost-stat-pct">Percentuale di boost</label>
                          <input
                            id="wit-boost-stat-pct"
                            type="text"
                            className="wit-input"
                            value={boostStatPercent}
                            onChange={(e) => setBoostStatPercent(e.target.value)}
                            placeholder="es. 10, 15%, +20%"
                          />
                        </div>
                      </>
                    )}
                    {boostTarget === 'danno' && (
                      <div className="wit-field">
                        <label className="wit-label" htmlFor="wit-boost-dmg-pct">Bonus danno (colpo successivo all’attivazione)</label>
                        <div className="wit-inline-boost-dmg">
                          <span className="wit-op" aria-hidden>+</span>
                          <input
                            id="wit-boost-dmg-pct"
                            type="text"
                            className="wit-input wit-input--inline-pct"
                            value={boostDamagePercent}
                            onChange={(e) => setBoostDamagePercent(e.target.value)}
                            placeholder="10"
                            inputMode="decimal"
                          />
                          <span className="wit-suffix">%</span>
                        </div>
                        <span className="wit-hint">
                          Si applica al danno percentuale del prossimo attacco dopo il lancio in chat di questa tecnica.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {triggerKind !== 'boost' && (
                  <>
                    <div className="wit-field">
                      <label className="wit-label" htmlFor="wit-trig-calc">Calcolo libero</label>
                      <input
                        id="wit-trig-calc"
                        type="text"
                        className="wit-input"
                        value={triggerCalcolo}
                        onChange={(e) => setTriggerCalcolo(e.target.value)}
                        placeholder="es. -10%, +2, -1"
                      />
                    </div>
                    <div className="wit-field">
                      <label className="wit-label" htmlFor="wit-trig-res">Risorsa colpita</label>
                      <select
                        id="wit-trig-res"
                        className="wit-select"
                        value={triggerResource}
                        onChange={(e) => setTriggerResource(e.target.value as WazaLaunchTriggerResource)}
                      >
                        {LAUNCH_TRIGGER_RESOURCES.map((r) => (
                          <option key={r} value={r}>{WAZA_LAUNCH_TRIGGER_RESOURCE_LABELS[r]}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div className="wit-field">
                  <label className="wit-label" htmlFor="wit-trig-subj">Soggetto</label>
                  <select
                    id="wit-trig-subj"
                    className="wit-select"
                    value={triggerSubject}
                    onChange={(e) => setTriggerSubject(e.target.value as WazaLaunchTriggerSubject)}
                  >
                    {LAUNCH_TRIGGER_SUBJECTS.map((s) => (
                      <option key={s} value={s}>{WAZA_LAUNCH_TRIGGER_SUBJECT_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                <div className="wit-field">
                  <label className="wit-label" htmlFor="wit-trig-timing">Timing · Quante azioni dura?</label>
                  <input
                    id="wit-trig-timing"
                    type="text"
                    className="wit-input"
                    value={triggerTiming}
                    onChange={(e) => setTriggerTiming(e.target.value)}
                    placeholder="es. 1, fino al prossimo turno, fino alla prossima Waza tramite Tōrō"
                  />
                </div>
              </>
            )}
          </div>

        {kind === 'waza' && (
          <div className="wit-panel">
            <h3 className="wit-panel-title">Tag di contesto (condizioni)</h3>
            <p className="wit-hint wit-hint--flush-top">
              <strong>Conferisce:</strong> la waza, dichiarata in chat, può aggiungere tag nel contesto di gioco previsto dalla scheda (oggi il caso più visibile è l’arma; in futuro altri ambiti).
              <strong> Legge:</strong> questa scheda può definire un <strong>effetto alternativo</strong> per LVL I–III (al massimo un tipo per rango: danno, velocità o gittata) se il contesto espone il tag richiesto: in calcolo, <strong>modifica danno</strong> moltiplica il danno già risolto; <strong>modifica velocità / gittata</strong> somma al valore già risolto a quel rango.
              Regola <strong>stesso turno</strong>: in gioco la condizione per leggere i tag vale solo se la waza che li ha <em>concessi</em> è stata lanciata <strong>nello stesso turno</strong> da questo personaggio, prima della tecnica che legge (ordine validato dal Master).
            </p>

            <div className="wit-field">
              <p className="wit-label wit-label--block-mt">Conferisce tag</p>
              <div
                className="wit-choice-row"
                style={{ flexWrap: 'wrap', alignItems: 'center', gap: '0.65rem' }}
              >
                {(['no', 'si'] as const).map((v) => (
                  <label key={`grant-${v}`} className="wit-choice">
                    <input
                      type="radio"
                      name="wit-grants-cond"
                      checked={grantsWeaponCondition === v}
                      onChange={() => setGrantsWeaponCondition(v)}
                    />
                    <span>{v === 'si' ? 'Sì' : 'No'}</span>
                  </label>
                ))}
                {grantsWeaponCondition === 'si' && (
                  <label className="wit-label wit-label--inline" style={{ margin: 0 }}>
                    <span className="wit-sr-only">Tag concesso</span>
                    <select
                      className="wit-select"
                      value={grantCondTag}
                      onChange={(e) => setGrantCondTag(e.target.value)}
                      aria-label="Tag concesso nel contesto di gioco"
                    >
                      {weaponTagIds.map((t) => (
                        <option key={t} value={t}>
                          {weaponTagLabels[t] ?? t}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            </div>

            <div className="wit-field">
              <p className="wit-label wit-label--block-mt">Legge tag</p>
              <div
                className="wit-choice-row"
                style={{ flexWrap: 'wrap', alignItems: 'center', gap: '0.65rem' }}
              >
                {(['no', 'si'] as const).map((v) => (
                  <label key={`read-${v}`} className="wit-choice">
                    <input
                      type="radio"
                      name="wit-reads-cond"
                      checked={readsConditionalBranch === v}
                      onChange={() => {
                        setReadsConditionalBranch(v)
                        if (v === 'no') {
                          setCondBranchId('cond')
                          setCondReadTag(weaponTagIds[0] ?? WAZA_WEAPON_CONDITION_TAGS[0])
                          setCondRank1AltKind('none')
                          setCondRank1AltValue('')
                          setCondRank2AltKind('none')
                          setCondRank2AltValue('')
                          setCondRank3AltKind('none')
                          setCondRank3AltValue('')
                        }
                      }}
                    />
                    <span>{v === 'si' ? 'Sì' : 'No'}</span>
                  </label>
                ))}
                {readsConditionalBranch === 'si' && (
                  <label className="wit-label wit-label--inline" style={{ margin: 0 }}>
                    <span className="wit-sr-only">Tag richiesto</span>
                    <select
                      className="wit-select"
                      value={condReadTag}
                      onChange={(e) => setCondReadTag(e.target.value)}
                      aria-label="Tag richiesto nel contesto per attivare il ramo condizionale"
                    >
                      {weaponTagIds.map((t) => (
                        <option key={t} value={t}>
                          {weaponTagLabels[t] ?? t}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            </div>
            {readsConditionalBranch === 'si' && (
              <>
                <div className="wit-field">
                  <label className="wit-label" htmlFor="wit-cond-branch-id">Id ramo (slug breve)</label>
                  <input
                    id="wit-cond-branch-id"
                    type="text"
                    className="wit-input"
                    value={condBranchId}
                    onChange={(e) => setCondBranchId(e.target.value)}
                    placeholder="es. da-toro"
                  />
                </div>
                <p className="wit-hint" style={{ marginTop: 0 }}>
                  Per ogni LVL scegli al massimo un effetto alternativo. <strong>Modifica danno</strong> = moltiplicatore sul danno finale (es. 2);{' '}
                  <strong>Modifica velocità</strong> = somma alla velocità; <strong>Modifica gittata</strong> = metri aggiunti. Solo i ranghi con effetto valorizzato entrano in export.
                </p>
                {([1, 2, 3] as const).map((rk) => {
                  const kind = rk === 1 ? condRank1AltKind : rk === 2 ? condRank2AltKind : condRank3AltKind
                  const val = rk === 1 ? condRank1AltValue : rk === 2 ? condRank2AltValue : condRank3AltValue
                  const setKind =
                    rk === 1 ? setCondRank1AltKind : rk === 2 ? setCondRank2AltKind : setCondRank3AltKind
                  const setVal =
                    rk === 1 ? setCondRank1AltValue : rk === 2 ? setCondRank2AltValue : setCondRank3AltValue
                  const roman = rk === 1 ? 'I' : rk === 2 ? 'II' : 'III'
                  return (
                    <div
                      key={rk}
                      className="wit-field"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.65rem' }}
                    >
                      <p className="wit-label" style={{ marginBottom: '0.35rem' }}>
                        LVL {roman} — effetto alternativo (un solo tipo per questo rango)
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
                        <div>
                          <label className="wit-label" style={{ fontSize: '0.72rem' }} htmlFor={`wit-cond-r${rk}-kind`}>
                            Tipo
                          </label>
                          <select
                            id={`wit-cond-r${rk}-kind`}
                            className="wit-select"
                            value={kind}
                            onChange={(e) => {
                              setKind(e.target.value as WazaCondRankAltKind)
                              setVal('')
                            }}
                          >
                            {COND_RANK_ALT_SELECT.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label
                            className="wit-label"
                            style={{ fontSize: '0.72rem' }}
                            htmlFor={`wit-cond-r${rk}-val`}
                          >
                            Valore
                          </label>
                          <input
                            id={`wit-cond-r${rk}-val`}
                            type="number"
                            step="any"
                            className="wit-input wit-input--narrow"
                            style={{ width: '5.5rem' }}
                            disabled={kind === 'none'}
                            value={val === '' ? '' : val}
                            onChange={(e) => {
                              const raw = e.target.value
                              setVal(raw === '' ? '' : Number(raw))
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}

        {type === 'active' && (
        <div className="wit-panel">
          <h3 className="wit-panel-title">Ranghi {meta.entityName} · II e III</h3>
          <p className="wit-hint wit-hint--flush-top">
            Ogni salita <strong>I → II</strong> o <strong>II → III</strong> costa <strong>{WAZA_RANK_UP_GEM_COST} Gem</strong> più le <strong>EXP</strong> indicate sotto. In scheda il testo al rango II è base + variazione II; al rango III è base + II + III. <strong>LVL</strong> nelle formule è 1 / 2 / 3 (come per le Waza).
          </p>
          <div className="wit-field">
            <label className="wit-label" htmlFor="wit-desc2">Variazione · {meta.entityName} II</label>
            <textarea
              id="wit-desc2"
              value={descriptionUpgrade2}
              onChange={(e) => setDescriptionUpgrade2(e.target.value)}
              placeholder="Testo aggiunto al primo upgrade (si accoda alla descrizione base)…"
              className="wit-textarea"
            />
          </div>
          <RankFormulaTierOverrides
            tierLvl={2}
            showPanel={hasVelocity || hasDamage || hasGittata}
            hasVelocity={hasVelocity}
            hasDamage={hasDamage}
            hasGittata={hasGittata}
            velReplace={r2VelReplace}
            setVelReplace={setR2VelReplace}
            velMode={r2VelMode}
            setVelMode={setR2VelMode}
            velStructured={r2VelStructured}
            setVelStructured={setR2VelStructured}
            velLibera={r2VelLibera}
            setVelLibera={setR2VelLibera}
            dmgReplace={r2DmgReplace}
            setDmgReplace={setR2DmgReplace}
            dmgMode={r2DmgMode}
            setDmgMode={setR2DmgMode}
            dmgStructured={r2DmgStructured}
            setDmgStructured={setR2DmgStructured}
            dmgLibera={r2DmgLibera}
            setDmgLibera={setR2DmgLibera}
            gittaReplace={r2GittaReplace}
            setGittaReplace={setR2GittaReplace}
            gittaMode={r2GittaMode}
            setGittaMode={setR2GittaMode}
            gittaStructured={r2GittaStructured}
            setGittaStructured={setR2GittaStructured}
            gittaLibera={r2GittaLibera}
            setGittaLibera={setR2GittaLibera}
            radioPrefix="r2"
            entityName={meta.entityName}
          />
          <div className="wit-field">
            <label className="wit-label" htmlFor="wit-exp2">EXP per passaggio I → II</label>
            <input
              id="wit-exp2"
              type="number"
              className="wit-input wit-input-exp-upgrade"
              min={0}
              value={upgradeCostExp2 === '' ? '' : upgradeCostExp2}
              onChange={(e) => {
                const v = e.target.value
                setUpgradeCostExp2(v === '' ? '' : parseInt(v, 10) || 0)
              }}
              placeholder="opz."
            />
            <span className="wit-hint">Oltre alle {WAZA_RANK_UP_GEM_COST} Gem. Lascia vuoto se non definito.</span>
          </div>
          <div className="wit-field">
            <label className="wit-label" htmlFor="wit-desc3">Variazione · {meta.entityName} III</label>
            <textarea
              id="wit-desc3"
              value={descriptionUpgrade3}
              onChange={(e) => setDescriptionUpgrade3(e.target.value)}
              placeholder="Testo aggiunto al secondo upgrade…"
              className="wit-textarea"
            />
          </div>
          <RankFormulaTierOverrides
            tierLvl={3}
            showPanel={hasVelocity || hasDamage || hasGittata}
            hasVelocity={hasVelocity}
            hasDamage={hasDamage}
            hasGittata={hasGittata}
            velReplace={r3VelReplace}
            setVelReplace={setR3VelReplace}
            velMode={r3VelMode}
            setVelMode={setR3VelMode}
            velStructured={r3VelStructured}
            setVelStructured={setR3VelStructured}
            velLibera={r3VelLibera}
            setVelLibera={setR3VelLibera}
            dmgReplace={r3DmgReplace}
            setDmgReplace={setR3DmgReplace}
            dmgMode={r3DmgMode}
            setDmgMode={setR3DmgMode}
            dmgStructured={r3DmgStructured}
            setDmgStructured={setR3DmgStructured}
            dmgLibera={r3DmgLibera}
            setDmgLibera={setR3DmgLibera}
            gittaReplace={r3GittaReplace}
            setGittaReplace={setR3GittaReplace}
            gittaMode={r3GittaMode}
            setGittaMode={setR3GittaMode}
            gittaStructured={r3GittaStructured}
            setGittaStructured={setR3GittaStructured}
            gittaLibera={r3GittaLibera}
            setGittaLibera={setR3GittaLibera}
            radioPrefix="r3"
            entityName={meta.entityName}
          />
          <div className="wit-field">
            <label className="wit-label" htmlFor="wit-exp3">EXP per passaggio II → III</label>
            <input
              id="wit-exp3"
              type="number"
              className="wit-input wit-input-exp-upgrade"
              min={0}
              value={upgradeCostExp3 === '' ? '' : upgradeCostExp3}
              onChange={(e) => {
                const v = e.target.value
                setUpgradeCostExp3(v === '' ? '' : parseInt(v, 10) || 0)
              }}
              placeholder="opz."
            />
            <span className="wit-hint">Oltre alle {WAZA_RANK_UP_GEM_COST} Gem.</span>
          </div>
        </div>
        )}

        <div className="wit-panel">
          <h3 className="wit-panel-title">Prerequisiti</h3>
          <div className="wit-field">
            <span className="wit-label">Prerequisiti</span>
            <div className="wit-choice-row">
              {(['no', 'si'] as const).map((v) => (
                <label key={`prereq-${v}`} className="wit-choice">
                  <input
                    type="radio"
                    name="prerequisitiWaza"
                    checked={haPrerequisiti === v}
                    onChange={() => {
                      setHaPrerequisiti(v)
                      if (v === 'no') {
                        setPrereqSkiruId('')
                        setPrereqWazaId('')
                        setPrereqGradoMin('')
                      }
                    }}
                  />
                  <span>{v === 'si' ? 'Sì' : 'No'}</span>
                </label>
              ))}
            </div>
            {haPrerequisiti === 'si' && (
              <>
                <p className="wit-label wit-label--block-mt">Prerequisiti richiesti</p>
                <div className="wit-row wit-row--prereq">
                  <div className="wit-field">
                    <label className="wit-label" htmlFor="wit-prereq-skiru">Skiru</label>
                    <select
                      id="wit-prereq-skiru"
                      className="wit-select"
                      value={prereqSkiruId}
                      onChange={(e) => setPrereqSkiruId(e.target.value)}
                    >
                      <option value="">— Scegli Skiru…</option>
                      {SKIRU_POOL.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  {kind === 'waza' && (
                    <div className="wit-field">
                      <label className="wit-label" htmlFor="wit-prereq-waza">Waza prerequisito</label>
                      <select
                        id="wit-prereq-waza"
                        className="wit-select"
                        value={prereqWazaId}
                        onChange={(e) => setPrereqWazaId(e.target.value)}
                      >
                        <option value="">— Nessuna / altra scheda…</option>
                        {[...runtimeWazaPool]
                          .sort((a, b) => a.name.localeCompare(b.name, 'it'))
                          .map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name} ({w.id})
                            </option>
                          ))}
                      </select>
                      <span className="wit-hint">Es. passiva da avere già in elenco (Tōrō, ecc.).</span>
                    </div>
                  )}
                  {kind !== 'waza' && (
                    <div className="wit-field">
                      <label className="wit-label" htmlFor="wit-prereq-waza-txt">Waza prerequisito (id)</label>
                      <input
                        id="wit-prereq-waza-txt"
                        type="text"
                        className="wit-input"
                        value={prereqWazaId}
                        onChange={(e) => setPrereqWazaId(e.target.value)}
                        placeholder="slug id da wazaPool…"
                      />
                    </div>
                  )}
                  <div className="wit-field">
                    <label className="wit-label" htmlFor="wit-prereq-grado">Grado militare</label>
                    <select
                      id="wit-prereq-grado"
                      className="wit-select wit-select-durata"
                      value={prereqGradoMin === '' ? '' : String(prereqGradoMin)}
                      onChange={(e) => {
                        const raw = e.target.value
                        setPrereqGradoMin(raw === '' ? '' : (Number(raw) as WazaGradoMilitare))
                      }}
                    >
                      <option value="">—</option>
                      {WAZA_GRADO_MILITARE_VALUES.map((g) => (
                        <option key={g} value={g}>Grado {g}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <span className="wit-hint">
                  Opzionale per ciascuna tendina: export include solo i campi valorizzati.
                </span>
              </>
            )}
          </div>
        </div>

        <div className="wit-panel">
          <h3 className="wit-panel-title">Costi</h3>
          <div className="wit-field">
            <span className="wit-label">Jigoka</span>
            <div className="wit-choice-row">
              {(['fisso', 'mantenimento'] as const).map((t) => (
                <label key={t} className="wit-choice">
                  <input
                    type="radio"
                    name="costJigoTipo"
                    checked={costJigoTipo === t}
                    onChange={() => setCostJigoTipo(t)}
                  />
                  <span>{t === 'fisso' ? 'Fisso — paghi al lancio' : 'Mantenimento — Jigoka a ogni turno attivo'}</span>
                </label>
              ))}
            </div>
            <p className="wit-hint">
              {costJigoTipo === 'fisso'
                ? 'Lanci la waza, paghi una volta il valore sotto; in scheda come tag [Costo Jigoka].'
                : 'Indica quanti Jigoka spendi ogni turno per tenerla attiva; in scheda come tag [Mantenimento Jigoka].'}
            </p>
            <div className="wit-input-with-suffix">
              <input
                type="number"
                className="wit-input wit-inline-num"
                value={costJigo}
                onChange={(e) => setCostJigo(parseInt(e.target.value, 10) || 0)}
                min={0}
                style={{ width: 96 }}
              />
              <span className="wit-suffix">J</span>
            </div>
          </div>

          <div className="wit-field">
            <label className="wit-label" htmlFor="wit-cs">Costo CS</label>
            <input
              id="wit-cs"
              type="number"
              className="wit-input wit-inline-num"
              value={costCs}
              onChange={(e) => setCostCs(parseInt(e.target.value, 10) || 0)}
              min={0}
              style={{ width: 80 }}
            />
            <span className="wit-hint">Chrono Stack per lanciare la waza. Usa 0 se non consuma CS.</span>
            {kind === 'waza' && (
              <div className="wit-tier-summary" aria-live="polite">
                {tierSummary.note ? (
                  <p className="wit-hint">{tierSummary.note}</p>
                ) : (
                  <p className="wit-tier-summary-line">
                    <span className="wit-tag-gold">{tierSummary.rankLabel}</span>
                    <span className="wit-tier-sep">·</span>
                    <span>{tierSummary.csCost} CS tabella</span>
                    <span className="wit-tier-sep">·</span>
                    <span>{tierSummary.damage} danno base</span>
                    <span className="wit-tier-sep">·</span>
                    <span>grado min. {tierSummary.minGrade}</span>
                  </p>
                )}
                <p className="wit-hint wit-hint--flush-top">
                  Rank DB suggerito: <code className="wit-inline-code">{tierSummary.rankLabel ?? '—'}</code> (sync-waza-manual).
                  In chat usa anche <code className="wit-inline-code">[tier:N]</code> se serve esplicitare.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="wit-panel">
          <h3 className="wit-panel-title">Status e counter</h3>
          <div className="wit-field">
            <span className="wit-label">Applica status</span>
            <div className="wit-choice-row">
              {(['no', 'si'] as const).map((v) => (
                <label key={v} className="wit-choice">
                  <input
                    type="radio"
                    name="applicaStatus"
                    checked={applicaStatus === v}
                    onChange={() => {
                      setApplicaStatus(v)
                      if (v !== 'si') setStatusApplicabileId('')
                    }}
                  />
                  <span>{v === 'si' ? 'Sì' : 'No'}</span>
                </label>
              ))}
            </div>
            {applicaStatus === 'si' && (
              <select
                value={statusApplicabileId}
                onChange={(e) => setStatusApplicabileId(e.target.value)}
                className="wit-select"
                style={{ minWidth: 260, marginTop: '0.5rem' }}
              >
                <option value="">Scegli uno status…</option>
                {statusIds.map((id) => (
                  <option key={id} value={id}>{statusLabelById[id] ?? id}</option>
                ))}
              </select>
            )}
            <span className="wit-hint">
              Con <strong>No</strong> non viene aggiunto alcun tag. Se <strong>Sì</strong>, in export si aggiunge <span className="wit-kbd">[ Status ] nome</span> in coda alla descrizione.
            </span>
          </div>

          <div className="wit-field">
            <span className="wit-label">Applica counter</span>
            <div className="wit-choice-row">
              {(['no', 'si'] as const).map((v) => (
                <label key={`ctr-${v}`} className="wit-choice">
                  <input
                    type="radio"
                    name="applicaCounter"
                    checked={applicaCounter === v}
                    onChange={() => {
                      setApplicaCounter(v)
                      if (v !== 'si') setCounterApplicabileId('')
                    }}
                  />
                  <span>{v === 'si' ? 'Sì' : 'No'}</span>
                </label>
              ))}
            </div>
            {applicaCounter === 'si' && (
              <select
                value={counterApplicabileId}
                onChange={(e) => setCounterApplicabileId(e.target.value)}
                className="wit-select"
                style={{ minWidth: 260, marginTop: '0.5rem' }}
              >
                <option value="">Scegli un counter…</option>
                {counterIds.map((id) => (
                  <option key={id} value={id}>{counterLabelById[id] ?? id}</option>
                ))}
              </select>
            )}
            <span className="wit-hint">
              Con <strong>No</strong> nessun counter in export. Se <strong>Sì</strong>, dopo eventuale status si aggiunge <span className="wit-kbd">[ Counter ] nome</span>.
            </span>
          </div>
        </div>

        <div className="wit-panel">
          <h3 className="wit-panel-title">Formule</h3>
          <div className="wit-field">
            <label className="wit-label wit-label--inline">
              <input type="checkbox" checked={hasVelocity} onChange={(e) => setHasVelocity(e.target.checked)} />
              Velocità
            </label>
            {hasVelocity && (
              <div className="wit-subpanel">
                <div className="wit-choice-row">
                  {(['structured', 'free'] as const).map((m) => (
                    <label key={m} className="wit-choice">
                      <input type="radio" name="velMode" checked={velMode === m} onChange={() => setVelMode(m)} />
                      <span>{m === 'structured' ? 'Strutturata' : 'Libera'}</span>
                    </label>
                  ))}
                </div>
                {velMode === 'structured' ? (
                  <>
                    <StructuredFormulaBuilder value={velStructured} onChange={setVelStructured} />
                    <span className="wit-hint">
                      Esempio → {safeEvalFormula(formulaToFn(structuredToFormula(velStructured)), SAMPLE_WAZA_STATS) ?? '—'}
                    </span>
                  </>
                ) : (
                  <>
                    <input type="text" value={velLibera} onChange={(e) => setVelLibera(e.target.value)} placeholder="es. ((D * 0.6) + (M * 0.4) + 0) * Grado" className="wit-input" />
                    {velLibera.trim() && (
                      <span className="wit-hint">
                        Esempio → {safeEvalFormula(formulaFromString(velLibera), SAMPLE_WAZA_STATS) ?? 'errore formula'}
                      </span>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="wit-field">
            <label className="wit-label wit-label--inline">
              <input type="checkbox" checked={hasDamage} onChange={(e) => setHasDamage(e.target.checked)} />
              Danno
            </label>
            {hasDamage && (
              <div className="wit-subpanel">
                <div className="wit-choice-row">
                  {(['structured', 'free'] as const).map((m) => (
                    <label key={m} className="wit-choice">
                      <input type="radio" name="dannoMode" checked={dannoMode === m} onChange={() => setDannoMode(m)} />
                      <span>{m === 'structured' ? 'Strutturata' : 'Libera'}</span>
                    </label>
                  ))}
                </div>
                {dannoMode === 'structured' ? (
                  <>
                    <StructuredFormulaBuilder value={dannoStructured} onChange={setDannoStructured} />
                    <span className="wit-hint">
                      Esempio Danno → {safeEvalFormula(formulaToFn(structuredToFormula(dannoStructured)), SAMPLE_WAZA_STATS) ?? '—'}
                    </span>
                  </>
                ) : (
                  <>
                    <input type="text" value={dannoLibera} onChange={(e) => setDannoLibera(e.target.value)} placeholder="es. 8 + floor(M/5) + Grado" className="wit-input" />
                    {dannoLibera.trim() && (
                      <span className="wit-hint">
                        Esempio Danno → {safeEvalFormula(formulaFromString(dannoLibera), SAMPLE_WAZA_STATS) ?? 'errore formula'}
                      </span>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="wit-field">
            <label className="wit-label wit-label--inline">
              <input type="checkbox" checked={hasGittata} onChange={(e) => setHasGittata(e.target.checked)} />
              Gittata
            </label>
            {hasGittata && (
              <div className="wit-subpanel">
                <div className="wit-choice-row">
                  {(['structured', 'free'] as const).map((m) => (
                    <label key={m} className="wit-choice">
                      <input type="radio" name="gittataMode" checked={gittataMode === m} onChange={() => setGittataMode(m)} />
                      <span>{m === 'structured' ? 'Strutturata' : 'Libera'}</span>
                    </label>
                  ))}
                </div>
                {gittataMode === 'structured' ? (
                  <>
                    <StructuredFormulaBuilder value={gittataStructured} onChange={setGittataStructured} />
                    <span className="wit-hint">
                      Esempio → {safeEvalFormula(formulaToFn(structuredToFormula(gittataStructured)), SAMPLE_WAZA_STATS) ?? '—'} m
                    </span>
                  </>
                ) : (
                  <>
                    <input type="text" value={gittataLibera} onChange={(e) => setGittataLibera(e.target.value)} placeholder="es. 2 + floor(M * 0.15) + floor(D * 0.1) + 2 * Grado" className="wit-input" />
                    {gittataLibera.trim() && (
                      <span className="wit-hint">
                        Esempio → {safeEvalFormula(formulaFromString(gittataLibera), SAMPLE_WAZA_STATS) ?? 'errore formula'} m
                      </span>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="wit-actions">
          <button type="submit" className="wit-btn">Preview</button>
          <button type="button" onClick={handleReset} className="wit-btn wit-btn--secondary">Reset</button>
        </div>
      </form>

      {draftWaza && (
        <section className="wit-preview animate__animated animate__fadeInUp">
          <h3>Anteprima</h3>
          <div className="wit-preview-body">
            <p className="wit-preview-header">
              <strong className="wit-preview-name">{draftWaza.name}</strong>
              <span className="wit-preview-meta">
                {' · '}
                {draftWaza.type} · {branchLabelFor(kind, draftWaza.branch)}
                {durata && <> · Durata: {DURATA_LABELS[durata]}</>}
              </span>
            </p>
            <p className="wit-preview-id">{draftWaza.id}</p>

            {draftWaza.type === 'passive' ? (
              <>
                {draftWaza.description && (
                  <div className="wit-rank-block">
                    <div className="wit-rank-label">Descrizione</div>
                    <div className="wit-rank-body">{renderBracketTaggedProse(draftWaza.description)}</div>
                  </div>
                )}
                {draftWaza.effect && (
                  <div className="wit-rank-block">
                    <div className="wit-rank-label">Effetto</div>
                    <div className="wit-rank-body">{renderBracketTaggedProse(draftWaza.effect)}</div>
                  </div>
                )}
              </>
            ) : (
              <>
                {(draftWaza.description || draftWaza.effect) && (
                  <div className="wit-rank-block">
                    <div className="wit-rank-label">{meta.entityName} I · LVL 1</div>
                    {draftWaza.description && (
                      <>
                        <div className="wit-prose-section-label">Descrizione</div>
                        <div className="wit-rank-body">{renderBracketTaggedProse(draftWaza.description)}</div>
                      </>
                    )}
                    {draftWaza.effect && (
                      <>
                        <div className="wit-prose-section-label">Effetto</div>
                        <div className="wit-rank-body">{renderBracketTaggedProse(draftWaza.effect)}</div>
                      </>
                    )}
                  </div>
                )}
                {(draftWaza.descriptionUpgrade2 || draftWaza.upgradeCostExp2 != null) && (
                  <div className="wit-rank-block">
                    <div className="wit-rank-label">{meta.entityName} II · LVL 2</div>
                    <span className="wit-hint wit-rank-cost">
                      Costo upgrade I→II: {WAZA_RANK_UP_GEM_COST} Gem
                      {draftWaza.upgradeCostExp2 != null ? ` + ${draftWaza.upgradeCostExp2} EXP` : ''}
                    </span>
                    <div className="wit-prose-section-label">Variazione (solo II)</div>
                    <p className="wit-hint" style={{ marginTop: 0 }}>
                      Solo il testo II; in scheda si aggiunge al rango I (nessun cumulativo ripetuto nella sezione III sotto).
                    </p>
                    <div className="wit-rank-body">
                      {draftWaza.descriptionUpgrade2?.trim()
                        ? renderBracketTaggedProse(draftWaza.descriptionUpgrade2)
                        : '—'}
                    </div>
                  </div>
                )}
                {(draftWaza.descriptionUpgrade3 || draftWaza.upgradeCostExp3 != null) && (
                  <div className="wit-rank-block">
                    <div className="wit-rank-label">{meta.entityName} III · LVL 3</div>
                    <span className="wit-hint wit-rank-cost">
                      Costo upgrade II→III: {WAZA_RANK_UP_GEM_COST} Gem
                      {draftWaza.upgradeCostExp3 != null ? ` + ${draftWaza.upgradeCostExp3} EXP` : ''}
                    </span>
                    <div className="wit-prose-section-label">Variazione (solo III)</div>
                    <p className="wit-hint" style={{ marginTop: 0 }}>
                      Solo il testo III; cumulativo in scheda = I + II + III.
                    </p>
                    <div className="wit-rank-body">
                      {draftWaza.descriptionUpgrade3?.trim()
                        ? renderBracketTaggedProse(draftWaza.descriptionUpgrade3)
                        : '—'}
                    </div>
                  </div>
                )}
              </>
            )}
            {draftWaza.launchTrigger && (
              <div className="wit-rank-block">
                <div className="wit-rank-label">Trigger al lancio</div>
                <div className="wit-rank-body wit-trigger-preview">
                  <div>
                    <span className="wit-tag-gold">{WAZA_LAUNCH_TRIGGER_KIND_LABELS[draftWaza.launchTrigger.kind]}</span>
                  </div>
                  <div>
                    Risorsa: {WAZA_LAUNCH_TRIGGER_RESOURCE_LABELS[draftWaza.launchTrigger.resource]}
                    {' · '}
                    Soggetto: {WAZA_LAUNCH_TRIGGER_SUBJECT_LABELS[draftWaza.launchTrigger.subject]}
                  </div>
                  {draftWaza.launchTrigger.calcoloLibero && (
                    <div>Calcolo: {draftWaza.launchTrigger.calcoloLibero}</div>
                  )}
                  {draftWaza.launchTrigger.kind === 'boost' && draftWaza.launchTrigger.boostTarget === 'statistiche' && (
                    <div>
                      Boost statistiche
                      {draftWaza.launchTrigger.boostStatKeys?.length ? (
                        <>
                          : {draftWaza.launchTrigger.boostStatKeys.map((k) => WAZA_LAUNCH_BOOST_STAT_LABELS[k]).join(', ')}
                        </>
                      ) : null}
                      {draftWaza.launchTrigger.boostStatPercent ? (
                        <> · {draftWaza.launchTrigger.boostStatPercent}</>
                      ) : null}
                    </div>
                  )}
                  {draftWaza.launchTrigger.kind === 'boost' && draftWaza.launchTrigger.boostTarget === 'danno' && (
                    <div>
                      Boost danno prossimo attacco: +
                      {draftWaza.launchTrigger.boostDamagePercent ?? '—'}%
                    </div>
                  )}
                  {draftWaza.launchTrigger.timingAzioni && (
                    <div>Azioni / durata: {draftWaza.launchTrigger.timingAzioni}</div>
                  )}
                </div>
              </div>
            )}
            {kind === 'waza' &&
              (() => {
                const dw = draftWaza as WazaDef
                const hasGrant = (dw.weaponTagsOnLaunch?.length ?? 0) > 0
                const hasRead = (dw.conditionalBranches?.length ?? 0) > 0
                if (!hasGrant && !hasRead) return null
                return (
                  <div className="wit-rank-block">
                    <div className="wit-rank-label">Tag di contesto (condizioni)</div>
                    <div className="wit-rank-body wit-trigger-preview">
                      {hasGrant && (
                        <div>
                          <span className="wit-tag-gold">Conferisce</span>
                          {' · '}
                          tag: {(dw.weaponTagsOnLaunch ?? []).join(', ')}
                          {' · '}
                          validità letture: <strong>stesso turno</strong>
                        </div>
                      )}
                      {hasRead && (
                        <div style={{ marginTop: hasGrant ? '0.5rem' : 0 }}>
                          <span className="wit-tag-gold">Legge</span>
                          {' · '}
                          attiva modificatori solo se i tag richiesti sono presenti nel contesto previsto e la concessione è nello{' '}
                          <strong>stesso turno</strong> (Master).
                          {dw.conditionalBranches?.map((b) => (
                            <div key={b.id} style={{ marginTop: '0.35rem', fontSize: '0.88rem', color: '#aaa' }}>
                              Ramo «{b.id}»: richiede [{b.requireAnyWeaponTag.join(', ')}]
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}
            {(draftWaza.prereqSkiruId != null ||
              draftWaza.prereqWazaId != null ||
              draftWaza.prereqGradoMin != null) && (
              <p className="wit-preview-statline">
                <span className="wit-tag-gold">Prerequisiti</span>
                {draftWaza.prereqSkiruId != null && (
                  <> Skiru: {SKIRU_POOL.find((s) => s.id === draftWaza.prereqSkiruId)?.name ?? draftWaza.prereqSkiruId}</>
                )}
                {draftWaza.prereqWazaId != null && (
                  <>
                    {draftWaza.prereqSkiruId != null ? ' · ' : ' '}
                    Waza:{' '}
                    {kind === 'waza'
                      ? runtimeWazaPool.find((w) => w.id === draftWaza.prereqWazaId)?.name ??
                        draftWaza.prereqWazaId
                      : draftWaza.prereqWazaId}
                  </>
                )}
                {draftWaza.prereqGradoMin != null && (
                  <>
                    {(draftWaza.prereqSkiruId != null || draftWaza.prereqWazaId != null) ? ' · ' : ' '}
                    Grado min.: {draftWaza.prereqGradoMin}
                  </>
                )}
              </p>
            )}
            <p className="wit-preview-statline">
              {costJigoTipo === 'fisso' ? (
                <><span className="wit-tag-gold">[Costo Jigoka]</span> {draftWaza.costJigo(SAMPLE_WAZA_STATS)} J</>
              ) : (
                <><span className="wit-tag-gold">[Mantenimento Jigoka]</span> {draftWaza.costJigo(SAMPLE_WAZA_STATS)} J/turno</>
              )}
              {draftWaza.costCs > 0 && (
                <>
                  {' · '}
                  CS: {draftWaza.costCs}
                  {kind === 'waza' && tierSummary.rankLabel && (
                    <>
                      {' · '}
                      <span className="wit-tag-gold">{tierSummary.rankLabel}</span>
                      {' '}
                      ({tierSummary.damage} dmg · {tierSummary.csCost} CS tabella)
                    </>
                  )}
                </>
              )}
            </p>
            {(hasVelocity || hasDamage || hasGittata) && (
              <div className="wit-rank-block">
                <div className="wit-rank-label">Valori di esempio · stats campione</div>
                {(draftWaza.type === 'active' ? ([1, 2, 3] as const) : ([1] as const)).map((rank) => {
                  const vVel = hasVelocity ? evalVelAtRank(draftWaza as WazaDef, rank, SAMPLE_WAZA_STATS) : null
                  const vDmg = hasDamage ? evalDbwAtRank(draftWaza as WazaDef, rank, SAMPLE_WAZA_STATS) : null
                  const vGit = hasGittata ? evalGittataAtRank(draftWaza as WazaDef, rank, SAMPLE_WAZA_STATS) : null
                  if (vVel == null && vDmg == null && vGit == null) return null
                  return (
                    <p key={rank} className="wit-preview-statline" style={{ display: 'block', marginTop: rank === 1 ? '0.25rem' : '0.45rem' }}>
                      <span className="wit-tag-gold">LVL {rank}</span>
                      {vVel != null && <> · Vel: {vVel}</>}
                      {vDmg != null && <> · Danno: {vDmg}</>}
                      {vGit != null && <> · Gittata: {vGit} m</>}
                    </p>
                  )
                })}
              </div>
            )}
          </div>
          <div className="wit-preview-actions">
            <button type="button" onClick={handleExport} className="wit-btn">
              Esporta codice
            </button>
            <button
              type="button"
              onClick={handleSaveToPool}
              className="wit-btn wit-btn--secondary"
              disabled={!poolPersist}
              title={!poolPersist ? 'Salvataggio non disponibile in questo ambiente' : undefined}
            >
              Salva nel pool (dev)
            </button>
            {poolReplaceIntent ? (
              <button
                type="button"
                onClick={handleDeleteCurrentFromPool}
                className="wit-btn wit-btn--secondary"
                disabled={!poolPersist}
                title={!poolPersist ? 'Salvataggio non disponibile in questo ambiente' : undefined}
                style={{ borderColor: 'rgba(255,120,120,0.45)' }}
              >
                Elimina questa voce dal pool
              </button>
            ) : null}
          </div>
          <div className="wit-panel" style={{ marginTop: '1rem' }}>
            <h3 className="wit-panel-title">Elimina dal pool per id</h3>
            <p className="wit-hint wit-hint--flush-top">
              Utile per Madōsho/Patto o per rimuovere senza aprire il form. Richiede dev server o API contributi.
            </p>
            <div className="wit-row" style={{ alignItems: 'flex-end', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div className="wit-field" style={{ flex: '1 1 200px' }}>
                <label className="wit-label" htmlFor="pool-delete-id">
                  Id slug voce
                </label>
                <input
                  id="pool-delete-id"
                  className="wit-input"
                  value={deletePoolIdDraft}
                  onChange={(e) => setDeletePoolIdDraft(e.target.value)}
                  placeholder="es. mia-waza"
                  autoComplete="off"
                />
              </div>
              <button
                type="button"
                className="wit-btn wit-btn--secondary"
                disabled={!poolPersist || !deletePoolIdDraft.trim()}
                onClick={handleDeleteByIdFromPool}
              >
                Elimina dal pool
              </button>
            </div>
          </div>
          {poolSaveMsg && <p className="wit-hint wit-hint--flush-top">{poolSaveMsg}</p>}
          {poolSaveErr && (
            <p className="wit-hint wit-hint--flush-top" style={{ color: 'var(--accent-violet)' }}>
              {poolSaveErr}
            </p>
          )}
          {exportCode && (
            <>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(exportCode)}
                className="wit-btn wit-btn--small"
                style={{ marginTop: '1rem', display: 'block' }}
              >
                Copia codice
              </button>
              <pre className="wit-code-block">
                <code>{exportCode}</code>
              </pre>
            </>
          )}
        </section>
      )}
    </div>
  )
}
