/**
 * Ricostruisce lo stato del form Idee e sviluppo (Waza) da una WazaDef già nel pool.
 * Le formule generate dal tool usano return Math.floor(expr); altre forme vengono gestite euristicamente.
 */

import { normalizeFormula } from './wazaFormulaEval'
import type {
  CostJigoTipo,
  DurataType,
  WazaCondRankAltKind,
  WazaConditionalModifiers,
  WazaDef,
  WazaGradoMilitare,
  WazaLaunchBoostStatKey,
  WazaLaunchTrigger,
  WazaLaunchTriggerKind,
  WazaLaunchTriggerResource,
  WazaLaunchTriggerSubject,
  WazaStats,
  WazaWeaponConditionTag,
} from './wazaPool'
import { WAZA_WEAPON_CONDITION_TAGS } from './wazaPool'
import { SAMPLE_WAZA_STATS } from './wazaPool'
import type { WazaType } from './wazaPool'
import type { WazaBranch } from './wazaBranches'
import { BRANCH_LABELS } from './wazaBranches'

const STAT_KEYS = ['F', 'C', 'D', 'M', 'E'] as const
export type StatKeyForForm = (typeof STAT_KEYS)[number]

export interface StructuredFormulaForm {
  stat1: StatKeyForForm
  pct1: number
  stat2: StatKeyForForm
  pct2: number
  bonus: number
}

const DEFAULT_STRUCTURED: StructuredFormulaForm = {
  stat1: 'D',
  pct1: 60,
  stat2: 'M',
  pct2: 40,
  bonus: 0,
}

const DEFAULT_DANNO: StructuredFormulaForm = {
  stat1: 'E',
  pct1: 70,
  stat2: 'M',
  pct2: 0,
  bonus: 0,
}

export const HYDRATE_GITTATA_DEFAULT: StructuredFormulaForm = {
  stat1: 'M',
  pct1: 15,
  stat2: 'D',
  pct2: 10,
  bonus: 2,
}

function sliceBalancedParens(s: string, openParenIdx: number): string | null {
  let depth = 0
  let inStr = false
  let q = ''
  let esc = false
  for (let i = openParenIdx; i < s.length; i++) {
    const c = s[i]
    if (inStr) {
      if (esc) {
        esc = false
        continue
      }
      if (c === '\\') {
        esc = true
        continue
      }
      if (c === q) inStr = false
      continue
    }
    if (c === '"' || c === "'" || c === '`') {
      inStr = true
      q = c
      continue
    }
    if (c === '(') depth++
    else if (c === ')') {
      depth--
      if (depth === 0) return s.slice(openParenIdx + 1, i)
    }
  }
  return null
}

function unwrapInnerMathFloor(expr: string): string {
  const t = expr.trim()
  if (t.startsWith('Math.floor(')) {
    const inner = sliceBalancedParens(t, 'Math.floor('.length - 1)
    if (inner != null) return inner.trim()
  }
  if (t.startsWith('floor(')) {
    const inner = sliceBalancedParens(t, 'floor('.length - 1)
    if (inner != null) return inner.trim()
  }
  return t
}

/** Estrae l’espressione interna usata nelle formule export (argomento di Math.floor). */
export function extractPoolFormulaInner(fn: unknown): string | null {
  if (typeof fn !== 'function') return null
  const raw = fn.toString()
  const ret = raw.lastIndexOf('return ')
  if (ret === -1) return null
  let depth = 0
  let inStr = false
  let q = ''
  let esc = false
  let exprStart = ret + 'return '.length
  while (exprStart < raw.length && /\s/.test(raw[exprStart])) exprStart++
  let i = exprStart
  for (; i < raw.length; i++) {
    const c = raw[i]
    if (inStr) {
      if (esc) {
        esc = false
        continue
      }
      if (c === '\\') {
        esc = true
        continue
      }
      if (c === q) inStr = false
      continue
    }
    if (c === '"' || c === "'" || c === '`') {
      inStr = true
      q = c
      continue
    }
    if (c === '(') depth++
    else if (c === ')') depth--
    if (depth === 0 && c === ';') break
    if (depth === 0 && c === '\n') {
      const rest = raw.slice(i).match(/^\s*\}/)
      if (rest) break
    }
  }
  const expr = raw.slice(exprStart, i).trim().replace(/;$/, '')
  return unwrapInnerMathFloor(expr)
}

function tryParseStructuredFormula(expr: string): StructuredFormulaForm | null {
  const n = normalizeFormula(expr).replace(/\s+/g, ' ')
  const re =
    /^\(\(\(([FCDME]) \* ([0-9.]+)\) \+ \(([FCDME]) \* ([0-9.]+)\)\) \+ ([0-9.-]+)\) \* Grado$/
  const m = n.match(re)
  if (!m) return null
  const [, s1, p1, s2, p2, bonus] = m
  return {
    stat1: s1 as StatKeyForForm,
    pct1: Math.round(Number(p1) * 100),
    stat2: s2 as StatKeyForForm,
    pct2: Math.round(Number(p2) * 100),
    bonus: Number(bonus),
  }
}

/** Ripara artefatti da export errati o da toString() del runtime (`floor2`, doppio Math.floor). */
export function normalizeLiberaFormulaText(expr: string): string {
  return expr
    .replace(/\bfloor2\b/g, 'floor')
    .trim()
}

function applyFormulaFields(
  inner: string | null,
  defaults: StructuredFormulaForm,
): { mode: 'structured' | 'free'; structured: StructuredFormulaForm; libera: string } {
  if (inner == null || inner.trim() === '') {
    return { mode: 'structured', structured: { ...defaults }, libera: '' }
  }
  const parsed = tryParseStructuredFormula(inner)
  if (parsed) return { mode: 'structured', structured: parsed, libera: '' }
  return { mode: 'free', structured: { ...defaults }, libera: normalizeLiberaFormulaText(inner) }
}

function extractCostJigoNumber(costJigo: (s: WazaStats) => number): number {
  const s = costJigo.toString().replace(/\s+/g, ' ')
  const m = s.match(/\(\)\s*=>\s*(\d+)/) || s.match(/return\s+(\d+)/)
  if (m) return Number(m[1])
  try {
    return costJigo(SAMPLE_WAZA_STATS)
  } catch {
    return 0
  }
}

const BRANCH_IDS = new Set(Object.keys(BRANCH_LABELS))

function isWazaBranch(b: string): b is WazaBranch {
  return BRANCH_IDS.has(b)
}

function hydrateLaunchTrigger(
  lt: WazaLaunchTrigger | undefined,
): {
  triggerEnabled: boolean
  triggerKind: WazaLaunchTriggerKind
  triggerResource: WazaLaunchTriggerResource
  triggerSubject: WazaLaunchTriggerSubject
  triggerCalcolo: string
  triggerTiming: string
  boostTarget: 'statistiche' | 'danno'
  boostStatKeys: WazaLaunchBoostStatKey[]
  boostStatPercent: string
  boostDamagePercent: string
} {
  if (!lt) {
    return {
      triggerEnabled: false,
      triggerKind: 'boost',
      triggerResource: 'jigoka',
      triggerSubject: 'caster',
      triggerCalcolo: '',
      triggerTiming: '',
      boostTarget: 'statistiche',
      boostStatKeys: [],
      boostStatPercent: '',
      boostDamagePercent: '',
    }
  }
  const boostTarget = lt.boostTarget ?? 'statistiche'
  return {
    triggerEnabled: true,
    triggerKind: lt.kind,
    triggerResource: lt.kind === 'boost' ? (boostTarget === 'danno' ? 'danno' : 'statistiche') : lt.resource,
    triggerSubject: lt.subject,
    triggerCalcolo: lt.calcoloLibero ?? '',
    triggerTiming: lt.timingAzioni ?? '',
    boostTarget,
    boostStatKeys: lt.boostStatKeys ? [...lt.boostStatKeys] : [],
    boostStatPercent: lt.boostStatPercent ?? '',
    boostDamagePercent: lt.boostDamagePercent ?? '',
  }
}

export interface WazaFormHydration {
  name: string
  type: WazaType
  wazaBranch: WazaBranch
  description: string
  effect: string
  descriptionUpgrade2: string
  descriptionUpgrade3: string
  upgradeCostExp2: number | ''
  upgradeCostExp3: number | ''
  costJigoTipo: CostJigoTipo
  costJigo: number
  costCs: number
  applicaStatus: 'si' | 'no'
  statusApplicabileId: string
  applicaCounter: 'si' | 'no'
  counterApplicabileId: string
  hasVelocity: boolean
  velMode: 'structured' | 'free'
  velStructured: StructuredFormulaForm
  velLibera: string
  hasDamage: boolean
  dannoMode: 'structured' | 'free'
  dannoStructured: StructuredFormulaForm
  dannoLibera: string
  hasGittata: boolean
  gittataMode: 'structured' | 'free'
  gittataStructured: StructuredFormulaForm
  gittataLibera: string
  r2VelReplace: boolean
  r2VelMode: 'structured' | 'free'
  r2VelStructured: StructuredFormulaForm
  r2VelLibera: string
  r2DmgReplace: boolean
  r2DmgMode: 'structured' | 'free'
  r2DmgStructured: StructuredFormulaForm
  r2DmgLibera: string
  r2GittaReplace: boolean
  r2GittaMode: 'structured' | 'free'
  r2GittaStructured: StructuredFormulaForm
  r2GittaLibera: string
  r3VelReplace: boolean
  r3VelMode: 'structured' | 'free'
  r3VelStructured: StructuredFormulaForm
  r3VelLibera: string
  r3DmgReplace: boolean
  r3DmgMode: 'structured' | 'free'
  r3DmgStructured: StructuredFormulaForm
  r3DmgLibera: string
  r3GittaReplace: boolean
  r3GittaMode: 'structured' | 'free'
  r3GittaStructured: StructuredFormulaForm
  r3GittaLibera: string
  durata: DurataType | ''
  haPrerequisiti: 'si' | 'no'
  prereqSkiruId: string
  prereqWazaId: string
  prereqGradoMin: WazaGradoMilitare | ''
  triggerEnabled: boolean
  triggerKind: WazaLaunchTriggerKind
  triggerResource: WazaLaunchTriggerResource
  triggerSubject: WazaLaunchTriggerSubject
  triggerCalcolo: string
  triggerTiming: string
  boostTarget: 'statistiche' | 'danno'
  boostStatKeys: WazaLaunchBoostStatKey[]
  boostStatPercent: string
  boostDamagePercent: string
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

const DEFAULT_WEAPON_CONDITION_TAG: WazaWeaponConditionTag = WAZA_WEAPON_CONDITION_TAGS[0]

function modifiersToRankAlt(m: WazaConditionalModifiers | undefined): {
  kind: WazaCondRankAltKind
  value: number | ''
} {
  if (!m) return { kind: 'none', value: '' }
  if (m.damageMult != null && Number.isFinite(m.damageMult)) {
    return { kind: 'damage', value: m.damageMult }
  }
  if (m.velocityAdd != null && Number.isFinite(m.velocityAdd)) {
    return { kind: 'velocity', value: m.velocityAdd }
  }
  if (m.gittataMetersAdd != null && Number.isFinite(m.gittataMetersAdd)) {
    return { kind: 'gittata', value: m.gittataMetersAdd }
  }
  return { kind: 'none', value: '' }
}

function firstLaunchTag(w: WazaDef): string {
  const t = w.weaponTagsOnLaunch?.[0]
  return (t as string) ?? DEFAULT_WEAPON_CONDITION_TAG
}

function firstRequiredTag(br: WazaDef['conditionalBranches']): string {
  const t = br?.[0]?.requireAnyWeaponTag?.[0]
  return (t as string) ?? DEFAULT_WEAPON_CONDITION_TAG
}

export function hydrationFromWazaDef(w: WazaDef): WazaFormHydration {
  const raw = (w.branch as string) === 'do' ? 'proiezione' : (w.branch as string)
  const branch: WazaBranch = isWazaBranch(raw) ? (raw as WazaBranch) : 'proiezione'
  const isPassive = w.type === 'passive'

  const velInner = w.hasVelocity ? extractPoolFormulaInner(w.velFormula) : null
  const velParts = applyFormulaFields(velInner, DEFAULT_STRUCTURED)

  let dannoMode: 'structured' | 'free' = 'structured'
  let dannoStructured = { ...DEFAULT_DANNO }
  let dannoLibera = ''
  if (w.hasDamage) {
    if (typeof w.dbw === 'number') {
      dannoMode = 'free'
      dannoLibera = String(w.dbw)
      dannoStructured = { ...DEFAULT_DANNO }
    } else {
      const inner = extractPoolFormulaInner(w.dbw)
      const p = applyFormulaFields(inner, DEFAULT_DANNO)
      dannoMode = p.mode
      dannoStructured = p.structured
      dannoLibera = p.libera
    }
  }

  const gittaRow = w.quadranteCalcoli?.find((c) => c.label === 'Gittata')
  const gittaFormula = gittaRow?.formula?.trim() ?? ''
  const hasGittata = Boolean(gittaFormula)
  const gittaNorm = hasGittata ? normalizeFormula(gittaFormula) : ''
  const gittaParsed = hasGittata ? tryParseStructuredFormula(gittaNorm) : null
  const gittataMode = gittaParsed ? 'structured' : hasGittata ? 'free' : 'structured'
  const gittataStructured = gittaParsed ? gittaParsed : { ...HYDRATE_GITTATA_DEFAULT }
  const gittataLibera = gittaParsed ? '' : hasGittata ? gittaFormula : ''

  const mapRankVel = (fn: typeof w.velFormulaRank2) => {
    const inner = fn ? extractPoolFormulaInner(fn) : null
    return applyFormulaFields(inner, DEFAULT_STRUCTURED)
  }
  const mapRankDmg = (fn: typeof w.dbwRank2) => {
    if (!fn) return { mode: 'structured' as const, structured: { ...DEFAULT_DANNO }, libera: '' }
    if (typeof fn === 'number')
      return { mode: 'free' as const, structured: { ...DEFAULT_DANNO }, libera: String(fn) }
    const inner = extractPoolFormulaInner(fn)
    return applyFormulaFields(inner, DEFAULT_DANNO)
  }
  const mapRankGit = (fn: typeof w.gittataFormulaRank2) => {
    const inner = fn ? extractPoolFormulaInner(fn) : null
    return applyFormulaFields(inner, HYDRATE_GITTATA_DEFAULT)
  }

  const r2v = mapRankVel(w.velFormulaRank2)
  const r3v = mapRankVel(w.velFormulaRank3)
  const r2d = mapRankDmg(w.dbwRank2)
  const r3d = mapRankDmg(w.dbwRank3)
  const r2g = mapRankGit(w.gittataFormulaRank2)
  const r3g = mapRankGit(w.gittataFormulaRank3)

  const th = hydrateLaunchTrigger(w.launchTrigger)
  const haPrereq = Boolean(w.prereqSkiruId || w.prereqWazaId || w.prereqGradoMin != null)
  const br0 = w.conditionalBranches?.[0]

  return {
    name: w.name,
    type: w.type,
    wazaBranch: branch,
    description: w.description ?? '',
    effect: w.effect ?? '',
    descriptionUpgrade2: isPassive ? '' : w.descriptionUpgrade2 ?? '',
    descriptionUpgrade3: isPassive ? '' : w.descriptionUpgrade3 ?? '',
    upgradeCostExp2: isPassive || w.upgradeCostExp2 == null ? '' : w.upgradeCostExp2,
    upgradeCostExp3: isPassive || w.upgradeCostExp3 == null ? '' : w.upgradeCostExp3,
    costJigoTipo: w.costJigoTipo ?? 'fisso',
    costJigo: extractCostJigoNumber(w.costJigo),
    costCs: w.costCs,
    applicaStatus: w.applicaStatusId ? 'si' : 'no',
    statusApplicabileId: w.applicaStatusId ?? '',
    applicaCounter: w.applicaCounterId ? 'si' : 'no',
    counterApplicabileId: w.applicaCounterId ?? '',
    hasVelocity: w.hasVelocity,
    velMode: velParts.mode,
    velStructured: velParts.structured,
    velLibera: velParts.libera,
    hasDamage: w.hasDamage,
    dannoMode,
    dannoStructured,
    dannoLibera,
    hasGittata,
    gittataMode,
    gittataStructured,
    gittataLibera,
    r2VelReplace: !isPassive && Boolean(w.velFormulaRank2),
    r2VelMode: r2v.mode,
    r2VelStructured: r2v.structured,
    r2VelLibera: r2v.libera,
    r2DmgReplace: !isPassive && w.dbwRank2 !== undefined,
    r2DmgMode: r2d.mode,
    r2DmgStructured: r2d.structured,
    r2DmgLibera: r2d.libera,
    r2GittaReplace: !isPassive && Boolean(w.gittataFormulaRank2),
    r2GittaMode: r2g.mode,
    r2GittaStructured: r2g.structured,
    r2GittaLibera: r2g.libera,
    r3VelReplace: !isPassive && Boolean(w.velFormulaRank3),
    r3VelMode: r3v.mode,
    r3VelStructured: r3v.structured,
    r3VelLibera: r3v.libera,
    r3DmgReplace: !isPassive && w.dbwRank3 !== undefined,
    r3DmgMode: r3d.mode,
    r3DmgStructured: r3d.structured,
    r3DmgLibera: r3d.libera,
    r3GittaReplace: !isPassive && Boolean(w.gittataFormulaRank3),
    r3GittaMode: r3g.mode,
    r3GittaStructured: r3g.structured,
    r3GittaLibera: r3g.libera,
    durata: w.durata ?? '',
    haPrerequisiti: haPrereq ? 'si' : 'no',
    prereqSkiruId: w.prereqSkiruId ?? '',
    prereqWazaId: w.prereqWazaId ?? '',
    prereqGradoMin: w.prereqGradoMin ?? '',
    grantsWeaponCondition: (w.weaponTagsOnLaunch?.length ?? 0) > 0 ? 'si' : 'no',
    grantCondTag: firstLaunchTag(w),
    readsConditionalBranch: br0 ? 'si' : 'no',
    condBranchId: br0?.id ?? 'cond',
    condReadTag: firstRequiredTag(w.conditionalBranches),
    ...(() => {
      const a1 = modifiersToRankAlt(br0?.byRank[1])
      const a2 = modifiersToRankAlt(br0?.byRank[2])
      const a3 = modifiersToRankAlt(br0?.byRank[3])
      return {
        condRank1AltKind: a1.kind,
        condRank1AltValue: a1.value,
        condRank2AltKind: a2.kind,
        condRank2AltValue: a2.value,
        condRank3AltKind: a3.kind,
        condRank3AltValue: a3.value,
      }
    })(),
    ...th,
  }
}

/**
 * Ricostruisce una WazaDef dal frammento testuale salvato nei contributi (pool_entry / replace).
 * Usa `Function` nel browser solo su stringhe provenienti dalla nostra API.
 */
export function hydrateWazaFromPoolEntrySnippet(entry: string): WazaDef {
  let s = entry.replace(/\r\n/g, '\n').trim()
  const lines = s.split('\n')
  let start = 0
  while (start < lines.length) {
    const t = lines[start]?.trim() ?? ''
    if (t === '' || t.startsWith('//')) {
      start++
      continue
    }
    break
  }
  s = lines.slice(start).join('\n').trim()
  if (s.endsWith(',')) {
    s = s.slice(0, -1).trim()
  }
  try {
    const fn = new Function(`return (${s})`)
    const obj = fn() as unknown
    if (!obj || typeof obj !== 'object' || typeof (obj as WazaDef).id !== 'string') {
      throw new Error('Oggetto Waza non valido')
    }
    return obj as WazaDef
  } catch (e) {
    throw new Error(
      `[hydrateWazaFromPoolEntrySnippet] ${e instanceof Error ? e.message : String(e)}`,
    )
  }
}
