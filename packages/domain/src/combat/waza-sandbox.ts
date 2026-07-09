import { getSkiruDef, SKIRU_CATALOG } from '../skiru/catalog'
import { getSkiruPoints } from '../skiru/progression'
import type { SkiruSheet } from '../skiru/types'
import { calculateSuccessIndex, type ActionIndexInput } from './resolution'
import { getTierValue, isWazaTier, type WazaTier } from './tier'
import { resolveDamageToHp } from './damage-pipeline'

/** Mappa slug/nome Skiru → punti (es. { Seimitsu: 2, Kensei: 3 }). */
export type SandboxSkiruMap = Readonly<Record<string, number>>

export type SandboxLanciatore = {
  skiru: SandboxSkiruMap
  cs?: number
  hp?: number
  grado?: string
  stato?: Readonly<Record<string, unknown>>
  /** Skiru fisica scelta per l'IR (slug o nome). */
  skiruIrFisica?: string
  /** Skiru incanalamento scelta per l'IR (slug o nome). */
  skiruIrIncanalamento?: string
}

export type SandboxBersaglio = {
  hp: number
  /** Resistenza Scudo/Costrutto (sottratta prima della mitigazione). */
  scudo?: number
  /** Punti Itami diretti (alternativa a skiru.itami). */
  itami?: number
  skiru?: SandboxSkiruMap
  status?: Readonly<Record<string, number>>
}

export type SandboxOpzioni = {
  /** Se false, il confronto IR fallisce e il danno non si applica. */
  vinciConfrontoIndice?: boolean
}

export type WazaSandboxInput = {
  effetti: readonly unknown[]
  tier: number | null
  skiruIr?: readonly string[]
  contesto: {
    lanciatore: SandboxLanciatore
    bersaglio: SandboxBersaglio
    opzioni?: SandboxOpzioni
  }
}

export type WazaSandboxLogLine = {
  step: number
  kind: 'info' | 'calc' | 'master' | 'warn'
  text: string
}

export type WazaSandboxResult = {
  righe: WazaSandboxLogLine[]
  ir: {
    fisicaId: string
    incanalamentoId: string
    fisicaPunti: number
    incanalamentoPunti: number
    media: number
    indice: number
  } | null
  dannoBase: number | null
  dannoFinaleHp: number | null
  hpBersaglioDopo: number | null
  gittataM: number | null
}

type Blocco = Record<string, unknown>
type ValoreBlocco = Record<string, unknown>

/** Risolve slug Skiru da id, nome italiano o romaji (case-insensitive). */
export function resolveSkiruSlug(ref: string): string {
  const norm = ref.trim().toLowerCase()
  if (!norm) return ref
  for (const def of SKIRU_CATALOG) {
    if (def.id === norm) return def.id
    if (def.name.toLowerCase() === norm) return def.id
    if (def.nameRomaji?.toLowerCase() === norm) return def.id
  }
  return norm
}

export function buildSandboxSkiruSheet(map: SandboxSkiruMap | undefined | null): SkiruSheet {
  const sheet: Record<string, number> = {}
  if (!map) return sheet
  for (const [key, raw] of Object.entries(map)) {
    const pts = Number(raw)
    if (!Number.isFinite(pts)) continue
    sheet[resolveSkiruSlug(key)] = Math.max(0, Math.floor(pts))
  }
  return sheet
}

export function buildTargetSkiruSheet(bersaglio: SandboxBersaglio): SkiruSheet {
  const sheet = buildSandboxSkiruSheet(bersaglio.skiru)
  if (bersaglio.itami != null && Number.isFinite(bersaglio.itami)) {
    return { ...sheet, itami: Math.max(0, Math.floor(bersaglio.itami)) }
  }
  return sheet
}

function skiruLabel(id: string): string {
  return getSkiruDef(id)?.name ?? id
}

/** Risolve un blocco `valore` in numero usando le Skiru del lanciatore. */
export function resolveValoreNumerico(
  valore: unknown,
  tier: WazaTier | null,
  lanciatoreSheet: SkiruSheet,
): { value: number | null; detail: string } {
  if (!valore || typeof valore !== 'object') {
    return { value: null, detail: 'valore mancante' }
  }
  const v = valore as ValoreBlocco
  switch (String(v.tipo)) {
    case 'FISSO': {
      const n = Number(v.n)
      return Number.isFinite(n)
        ? { value: n, detail: `${n}` }
        : { value: null, detail: 'fisso non valido' }
    }
    case 'TIER': {
      if (tier == null) return { value: null, detail: 'tier assente' }
      const tv = getTierValue(tier)
      return { value: tv, detail: `tier ${tier} → ${tv}` }
    }
    case 'TIER_DELTA': {
      if (tier == null) return { value: null, detail: 'tier assente' }
      const delta = Number(v.n)
      if (!Number.isFinite(delta)) return { value: null, detail: 'delta tier non valido' }
      const tv = getTierValue(tier) + delta
      return { value: tv, detail: `tier ${tier} ${delta >= 0 ? '+' : ''}${delta} → ${tv}` }
    }
    case 'FORMULA': {
      const base = Number(v.base)
      const perPunto = Number(v.per_punto)
      const skiruRef = String(v.skiru ?? '')
      if (!Number.isFinite(base) || !Number.isFinite(perPunto) || !skiruRef.trim()) {
        return { value: null, detail: 'formula incompleta' }
      }
      const skiruId = resolveSkiruSlug(skiruRef)
      const pts = getSkiruPoints(lanciatoreSheet, skiruId)
      const total = base + perPunto * pts
      return {
        value: total,
        detail: `${base} ${perPunto >= 0 ? '+' : ''}${perPunto}×${skiruLabel(skiruId)}(${pts}) = ${total}`,
      }
    }
    default:
      return { value: null, detail: `tipo valore «${String(v.tipo)}» non risolto in sandbox` }
  }
}

function parseCondizione(raw: unknown): {
  soggettoId: string
  operatore: string
  valore: string
  statusNome?: string
} {
  const s = typeof raw === 'string' ? raw.trim() : ''
  if (!s) return { soggettoId: '', operatore: '', valore: '' }
  const stack = /^stack\(([^)]+)\)\s*(==|!=|>=|<=|>|<)\s*(.+)$/i.exec(s)
  if (stack) {
    return {
      soggettoId: 'stack(status)',
      operatore: stack[2]!,
      valore: stack[3]!.trim(),
      statusNome: stack[1]!.trim(),
    }
  }
  const parts = s.split(/\s+/)
  return {
    soggettoId: parts[0] ?? '',
    operatore: parts[1] ?? '',
    valore: parts.slice(2).join(' '),
  }
}

function compareNumeric(a: number, op: string, b: number): boolean {
  switch (op) {
    case '==':
      return a === b
    case '!=':
      return a !== b
    case '>=':
      return a >= b
    case '<=':
      return a <= b
    case '>':
      return a > b
    case '<':
      return a < b
    default:
      return false
  }
}

/** Valuta condizioni canoniche semplici per la sandbox. */
export function evaluateSandboxCondizione(
  condizione: unknown,
  lanciatore: SandboxLanciatore,
  bersaglio: SandboxBersaglio,
): boolean {
  const parsed = parseCondizione(condizione)
  if (!parsed.soggettoId || !parsed.operatore) return true

  if (parsed.soggettoId === 'toro.batteria') {
    const val = lanciatore.stato?.['toro.batteria']
    const boolVal = val === true || val === 'true'
    return parsed.valore === 'true' ? boolVal : !boolVal
  }
  if (parsed.soggettoId === 'toro.lanciata') {
    const val = lanciatore.stato?.['toro.lanciata']
    const boolVal = val === true || val === 'true'
    return parsed.valore === 'true' ? boolVal : !boolVal
  }
  if (parsed.soggettoId === 'grado_pg') {
    const grado = (lanciatore.grado ?? '').trim()
    return parsed.operatore === '!='
      ? grado.toLowerCase() !== parsed.valore.toLowerCase()
      : grado.toLowerCase() === parsed.valore.toLowerCase()
  }
  if (parsed.soggettoId === 'cs_correnti') {
    const cs = lanciatore.cs ?? 0
    const target = Number(parsed.valore)
    return Number.isFinite(target) ? compareNumeric(cs, parsed.operatore, target) : false
  }
  if (parsed.soggettoId === 'hp_pct') {
    const hp = lanciatore.hp ?? 0
    const target = Number(parsed.valore)
    return Number.isFinite(target) ? compareNumeric(hp, parsed.operatore, target) : false
  }
  if (parsed.soggettoId === 'stack(status)' && parsed.statusNome) {
    const stacks = bersaglio.status ?? {}
    const current = Number(stacks[parsed.statusNome] ?? 0)
    const target = Number(parsed.valore)
    return Number.isFinite(target) ? compareNumeric(current, parsed.operatore, target) : false
  }
  return true
}

function pickDefaultIrPair(
  skiruIr: readonly string[] | undefined,
  lanciatoreSheet: SkiruSheet,
): { fisicaId: string; incanalamentoId: string } {
  const candidates = (skiruIr ?? [])
    .map((s) => resolveSkiruSlug(s))
    .filter((id) => getSkiruPoints(lanciatoreSheet, id) > 0)

  let fisicaId = candidates.find((id) => getSkiruDef(id)?.domain === 'chi') ?? candidates[0] ?? 'bakuryoku'
  let incanalamentoId =
    candidates.find((id) => getSkiruDef(id)?.domain === 'jin' && id !== fisicaId) ??
    candidates.find((id) => id !== fisicaId) ??
    'kensei'

  if (fisicaId === incanalamentoId) {
    incanalamentoId = candidates.find((id) => id !== fisicaId) ?? 'kensei'
  }

  return { fisicaId, incanalamentoId }
}

function resolveIrPair(
  input: WazaSandboxInput,
  lanciatoreSheet: SkiruSheet,
): { fisicaId: string; incanalamentoId: string } {
  const l = input.contesto.lanciatore
  if (l.skiruIrFisica && l.skiruIrIncanalamento) {
    return {
      fisicaId: resolveSkiruSlug(l.skiruIrFisica),
      incanalamentoId: resolveSkiruSlug(l.skiruIrIncanalamento),
    }
  }
  return pickDefaultIrPair(input.skiruIr, lanciatoreSheet)
}

function asBlocco(raw: unknown): Blocco | null {
  return raw && typeof raw === 'object' ? (raw as Blocco) : null
}

function pushLine(
  righe: WazaSandboxLogLine[],
  step: { current: number },
  kind: WazaSandboxLogLine['kind'],
  text: string,
): void {
  righe.push({ step: step.current++, kind, text })
}

/**
 * Esegue una simulazione in-memory della waza: IR, gittata, pipeline danno.
 * Riutilizza `calculateSuccessIndex`, `resolveDamageToHp`, `getTierValue`.
 */
export function runWazaSandbox(input: WazaSandboxInput): WazaSandboxResult {
  const righe: WazaSandboxLogLine[] = []
  const step = { current: 1 }
  const tier: WazaTier | null =
    input.tier != null && isWazaTier(input.tier) ? input.tier : null
  const lanciatoreSheet = buildSandboxSkiruSheet(input.contesto.lanciatore.skiru)
  const bersaglioSheet = buildTargetSkiruSheet(input.contesto.bersaglio)
  const vinceIr = input.contesto.opzioni?.vinciConfrontoIndice !== false

  const { fisicaId, incanalamentoId } = resolveIrPair(input, lanciatoreSheet)
  const irInput: ActionIndexInput = {
    physicalSkiruId: fisicaId,
    channelingSkiruId: incanalamentoId,
    quartersSpent: 1,
  }
  const irBreakdown = calculateSuccessIndex(lanciatoreSheet, irInput)
  pushLine(
    righe,
    step,
    'calc',
    `IR: (${skiruLabel(fisicaId)} ${irBreakdown.physicalPoints} + ${skiruLabel(incanalamentoId)} ${irBreakdown.channelingPoints}) ÷ 2 = ${irBreakdown.rawAverage} → ${irBreakdown.successIndex}`,
  )

  if (!vinceIr) {
    pushLine(righe, step, 'warn', 'Confronto IR perso: il danno offensivo non si applica.')
    return {
      righe,
      ir: {
        fisicaId,
        incanalamentoId,
        fisicaPunti: irBreakdown.physicalPoints,
        incanalamentoPunti: irBreakdown.channelingPoints,
        media: irBreakdown.rawAverage,
        indice: irBreakdown.successIndex,
      },
      dannoBase: null,
      dannoFinaleHp: null,
      hpBersaglioDopo: input.contesto.bersaglio.hp,
      gittataM: null,
    }
  }

  let effectiveTier = tier
  let dannoBase: number | null = null
  let gittataM: number | null = null
  let hasDannoBlocco = false

  // Fase 1: modificatori tier (MOD_DANNO) prima del danno base.
  for (const raw of input.effetti) {
    const blocco = asBlocco(raw)
    if (!blocco || String(blocco.tipo ?? '') !== 'MOD_DANNO') continue
    const condOk = blocco.condizione
      ? evaluateSandboxCondizione(blocco.condizione, input.contesto.lanciatore, input.contesto.bersaglio)
      : true
    const condLabel = blocco.condizione ? ` (cond: ${String(blocco.condizione)})` : ''
    if (!condOk) {
      pushLine(righe, step, 'info', `MOD_DANNO${condLabel}: condizione non soddisfatta, ignorato.`)
      continue
    }
    const valore = blocco.valore
    if (valore && typeof valore === 'object' && String((valore as ValoreBlocco).tipo) === 'TIER_DELTA') {
      const delta = Number((valore as ValoreBlocco).n)
      if (effectiveTier != null && Number.isFinite(delta)) {
        const next = effectiveTier + delta
        if (isWazaTier(next)) {
          pushLine(
            righe,
            step,
            'calc',
            `MOD_DANNO${condLabel}: tier ${effectiveTier} → ${next} (${delta >= 0 ? '+' : ''}${delta})`,
          )
          effectiveTier = next
        }
      }
    }
  }

  for (const raw of input.effetti) {
    const blocco = asBlocco(raw)
    if (!blocco) continue
    const tipo = String(blocco.tipo ?? '')

    if (tipo === 'MANUALE') {
      const testo = typeof blocco.testo === 'string' ? blocco.testo.trim() : ''
      if (testo) pushLine(righe, step, 'master', `Master: «${testo}»`)
      continue
    }

    if (tipo === 'MOD_GITTATA') {
      const resolved = resolveValoreNumerico(blocco.valore, tier, lanciatoreSheet)
      if (resolved.value != null) {
        gittataM = resolved.value
        pushLine(righe, step, 'calc', `Gittata: ${resolved.detail} m`)
      } else {
        pushLine(righe, step, 'warn', `Gittata: ${resolved.detail}`)
      }
      continue
    }

    if (tipo === 'MOD_DANNO') {
      const valore = blocco.valore
      if (valore && typeof valore === 'object' && String((valore as ValoreBlocco).tipo) === 'TIER_DELTA') {
        continue
      }
      const condOk = blocco.condizione
        ? evaluateSandboxCondizione(blocco.condizione, input.contesto.lanciatore, input.contesto.bersaglio)
        : true
      if (!condOk) continue
      const resolved = resolveValoreNumerico(valore, effectiveTier, lanciatoreSheet)
      if (resolved.value != null) {
        dannoBase = (dannoBase ?? 0) + resolved.value
        pushLine(righe, step, 'calc', `MOD_DANNO: +${resolved.detail}`)
      }
      continue
    }

    if (tipo === 'DANNO') {
      hasDannoBlocco = true
      const resolved = resolveValoreNumerico(blocco.valore, effectiveTier, lanciatoreSheet)
      if (resolved.value != null) {
        dannoBase = resolved.value
        pushLine(
          righe,
          step,
          'calc',
          `DANNO: ${effectiveTier != null ? `tier ${effectiveTier}` : 'valore'} → ${resolved.detail}`,
        )
      }
    }
  }

  if (dannoBase == null && effectiveTier != null && hasDannoBlocco) {
    dannoBase = getTierValue(effectiveTier)
    pushLine(righe, step, 'calc', `DANNO implicito: tier ${effectiveTier} → ${dannoBase}`)
  }

  if (dannoBase == null) {
    return {
      righe,
      ir: {
        fisicaId,
        incanalamentoId,
        fisicaPunti: irBreakdown.physicalPoints,
        incanalamentoPunti: irBreakdown.channelingPoints,
        media: irBreakdown.rawAverage,
        indice: irBreakdown.successIndex,
      },
      dannoBase: null,
      dannoFinaleHp: null,
      hpBersaglioDopo: input.contesto.bersaglio.hp,
      gittataM,
    }
  }

  const scudo = Math.max(0, input.contesto.bersaglio.scudo ?? 0)
  const pipeline = resolveDamageToHp({
    tier: effectiveTier ?? (tier as WazaTier) ?? 1,
    bonuses: { flatBonus: dannoBase - getTierValue(effectiveTier ?? tier ?? 1) },
    targetSheet: bersaglioSheet,
    shieldResistance: scudo,
  })

  const itamiPts = getSkiruPoints(bersaglioSheet, 'itami')
  const mitigPct = pipeline.mitigationPercent
  pushLine(
    righe,
    step,
    'calc',
    `Pipeline: (${pipeline.baseDamage} − ${scudo} scudo) × (1 − 0,03×${itamiPts}) = ${pipeline.afterShield} × ${(1 - mitigPct / 100).toFixed(2)} → ${pipeline.hpDamage} HP`,
  )

  const hpPrima = input.contesto.bersaglio.hp
  const hpDopo = Math.max(0, hpPrima - pipeline.hpDamage)
  pushLine(righe, step, 'calc', `HP bersaglio: ${hpPrima} → ${hpDopo}`)

  return {
    righe,
    ir: {
      fisicaId,
      incanalamentoId,
      fisicaPunti: irBreakdown.physicalPoints,
      incanalamentoPunti: irBreakdown.channelingPoints,
      media: irBreakdown.rawAverage,
      indice: irBreakdown.successIndex,
    },
    dannoBase: pipeline.baseDamage,
    dannoFinaleHp: pipeline.hpDamage,
    hpBersaglioDopo: hpDopo,
    gittataM,
  }
}
