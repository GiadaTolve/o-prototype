/**
 * Valori waza personalizzati dalla scheda Skiru (Ultimate Manual).
 * Registry per poolId — non parsing fragile del testo effetto.
 */
import { computeIndicativeActionIr } from './resolution'
import { CONSTRUCT_SIZES, calculateConstructResistance, type ConstructSizeId } from './constructs'
import { getTierValue, isWazaTier, type WazaTier } from './tier'
import {
  calculateMitigationPercentFromSkiru,
  calculateMovementMetersPerQuarterFromSkiru,
  SKIRU_ID_ITAMI,
  SKIRU_ID_UNDO,
} from '../skiru/derived-stats'
import { getSkiruPoints } from '../skiru/progression'
import type { SkiruSheet } from '../skiru/types'
import { JUNKAN_BUN_BASE, resolveJunkanBunCapacity } from '../styles/naikan/junkan'
import {
  KADEN_METAMORPHOSIS_CS,
  resolveKadenState,
} from '../styles/hado/kaden'
import { YURAGI_IR_PARITY_BONUS } from '../styles/hensei/yuragi'
import { nagoriCollateralLabel } from '../styles/hensei/nagori'

export type WazaResolveContext = {
  sheet: SkiruSheet
  wazaTier?: WazaTier | null
  /** Taglia costrutto quando la waza ne crea uno (default Media). */
  constructSize?: ConstructSizeId
  /** Waza con tag [Costrutto] — abilita riga Resistenza generica. */
  isConstructWaza?: boolean
  /** Via del Dō (es. naikan → Capacità Junkan). */
  styleId?: string | null
  /** Testo meccanico per confronti d'Indice impliciti. */
  description?: string | null
  /** CS attuali — Hadō Pressione / Kaatsu. */
  currentCs?: number | null
  /** Stack Kaden (Hadō). */
  kadenPressure?: number | null
  /** Tier ultimo colpo subìto — Junnō / Hibiki-Gaeshi. */
  lastReceivedHitTier?: WazaTier | null
  /** Prossima waza Hensei cambia consistenza → bonus parità Yuragi. */
  yuragiParityNext?: boolean
  /** Bonus IR da Tensione Itō (stack fili attivi). */
  itoIrBonus?: number | null
  /** Nagori — consistenza abbandonata nell'ultimo shift (bonus collaterale). */
  nagoriCollateralFrom?: import('../styles/hensei/nagori').ConsistencyKind | null
}

export type WazaResolvedLine = {
  label: string
  value: string
  hint?: string
}

export type WazaPersonalValues = {
  poolId: string
  lines: WazaResolvedLine[]
}

export const SKIRU_ID_SEIMITSU = 'seimitsu'
export const SKIRU_ID_KONJOU = 'konjou'

/** Skiru mentali citate da Ubaiito (Itō-dō). */
export const UBAIITO_MENTAL_SKIRU_IDS = ['fudoshin', 'kansatsu'] as const

export type MentalIndexMode = 'best' | 'sum'

/**
 * Regola confermata per confronti d'Indice con Skiru mentali (es. Ubaiito):
 * IR = max tra le Skiru elencate nel testo waza; il giocatore dichiara quale guida l'azione.
 */
export const DEFAULT_MENTAL_INDEX_MODE: MentalIndexMode = 'best'

const TEISHUHA_BASE_RANGE_M = 8
const TEISHUHA_BATTERY_RANGE_M = 16
const FUANTEI_EXTRA_RANGE_M = 4

export const TIER_VALUE_REFERENCE = 'T1=4 · T2=8 · T3=12 · T4=17 · T5=23'

/** Bonus da tier colpo subìto (Junnō resistenza / Hibiki danno). */
export function resolveReactiveTierBonus(tier: WazaTier): number {
  return getTierValue(tier)
}

const MICHISHIRUBE_BASE_RANGE_M = 8
const MICHISHIRUBE_RANGE_PER_SEIMITSU_M = 1
const KYOMEI_METERS_PER_HIT = 2
const TOBI_KAKE_MOVEMENT_MULTIPLIER = 2
const AYATSURI_MEDIA_MOVEMENT_MULT = 0.75

export function resolveMichishirubeProjectileRangeMeters(sheet: SkiruSheet): number {
  const seimitsu = getSkiruPoints(sheet, SKIRU_ID_SEIMITSU)
  return MICHISHIRUBE_BASE_RANGE_M + MICHISHIRUBE_RANGE_PER_SEIMITSU_M * seimitsu
}

export function resolveConstructResistanceFromSheet(
  sheet: SkiruSheet,
  wazaTier: WazaTier,
  size: ConstructSizeId = 'media',
): number {
  return calculateConstructResistance(0, wazaTier, size)
}

export function resolveMentalSkiruIndex(
  sheet: SkiruSheet,
  skiruIds: readonly string[],
  mode: MentalIndexMode = DEFAULT_MENTAL_INDEX_MODE,
): number {
  const points = skiruIds.map((id) => getSkiruPoints(sheet, id))
  if (mode === 'sum') return points.reduce((a, b) => a + b, 0)
  return points.length > 0 ? Math.max(...points) : 0
}

/** IR = punti della Skiru citata esplicitamente nel testo waza (es. Konjou). */
export function resolveExplicitSkiruIndex(sheet: SkiruSheet, skiruId: string): number {
  return getSkiruPoints(sheet, skiruId)
}

export function resolveAyatsuriConstructMovementMeters(
  sheet: SkiruSheet,
  size: ConstructSizeId,
): number {
  const movement = calculateMovementMetersPerQuarterFromSkiru(sheet)
  if (size === 'piccola') return movement
  if (size === 'media') return Math.round(movement * AYATSURI_MEDIA_MOVEMENT_MULT * 10) / 10
  return movement
}

function junkanCapacityLine(sheet: SkiruSheet): WazaResolvedLine {
  const itami = getSkiruPoints(sheet, SKIRU_ID_ITAMI)
  const capacity = resolveJunkanBunCapacity(sheet)
  return {
    label: 'Capacità Junkan',
    value: `${capacity} Bun`,
    hint: `${JUNKAN_BUN_BASE} + ${itami} Itami`,
  }
}

function movementLine(sheet: SkiruSheet): WazaResolvedLine {
  const undo = getSkiruPoints(sheet, SKIRU_ID_UNDO)
  const meters = calculateMovementMetersPerQuarterFromSkiru(sheet)
  return {
    label: 'Movimento',
    value: `${meters} m / quarto`,
    hint: `2 + 1,5 × ${undo} (Undō)`,
  }
}

function mitigationLine(sheet: SkiruSheet): WazaResolvedLine | null {
  const itami = getSkiruPoints(sheet, SKIRU_ID_ITAMI)
  if (itami <= 0) return null
  const pct = calculateMitigationPercentFromSkiru(sheet)
  return {
    label: 'Mitigazione Itami',
    value: `−${pct}% danno`,
    hint: `3% × ${itami} (max 30%)`,
  }
}

function indexContestLines(sheet: SkiruSheet, description?: string | null): WazaResolvedLine[] {
  const text = description ?? ''
  if (!/confronto d['\u2019]Indice/i.test(text)) return []

  if (/\(Konjou\)/i.test(text)) {
    const konjou = resolveExplicitSkiruIndex(sheet, SKIRU_ID_KONJOU)
    return [
      {
        label: 'IR confronto (Konjou)',
        value: String(konjou),
        hint: 'Entrambe le parti usano i punti Konjou come IR per questo confronto.',
      },
    ]
  }

  const ir = computeIndicativeActionIr(sheet)
  return [
    {
      label: 'IR indicativo',
      value: String(ir),
      hint: 'Media arrotondata delle migliori Skiru Chi e Jin in scheda; in gioco valgono le Skiru narrate.',
    },
  ]
}

function michishirubeLines(sheet: SkiruSheet): WazaResolvedLine[] {
  const seimitsu = getSkiruPoints(sheet, SKIRU_ID_SEIMITSU)
  const meters = resolveMichishirubeProjectileRangeMeters(sheet)
  return [
    {
      label: 'Gittata (via Tōrō)',
      value: `${meters} m`,
      hint: `${MICHISHIRUBE_BASE_RANGE_M} m + ${seimitsu} × Seimitsu`,
    },
  ]
}

function constructResistanceLine(ctx: WazaResolveContext): WazaResolvedLine | null {
  const tier = ctx.wazaTier
  if (!tier || !isWazaTier(tier)) return null
  const size = ctx.constructSize ?? 'media'
  const mult = CONSTRUCT_SIZES[size].resistanceMult
  const resistance = resolveConstructResistanceFromSheet(ctx.sheet, tier, size)
  return {
    label: `Resistenza (${CONSTRUCT_SIZES[size].label})`,
    value: String(resistance),
    hint: `(tier ${tier}) × ${mult}`,
  }
}

function ubaiitoLines(sheet: SkiruSheet): WazaResolvedLine[] {
  const fudoshin = getSkiruPoints(sheet, 'fudoshin')
  const kansatsu = getSkiruPoints(sheet, 'kansatsu')
  const best = resolveMentalSkiruIndex(sheet, UBAIITO_MENTAL_SKIRU_IDS)
  return [
    { label: 'Fudōshin', value: String(fudoshin) },
    { label: 'Kansatsu', value: String(kansatsu) },
    {
      label: 'IR confronto',
      value: String(best),
      hint: 'Max tra le Skiru mentali narrative (Fudōshin o Kansatsu). Vs IR del creatore.',
    },
  ]
}

function ayatsuriLines(sheet: SkiruSheet): WazaResolvedLine[] {
  const piccola = resolveAyatsuriConstructMovementMeters(sheet, 'piccola')
  const media = resolveAyatsuriConstructMovementMeters(sheet, 'media')
  return [
    movementLine(sheet),
    {
      label: 'Movimento costrutto Piccola',
      value: `${piccola} m / quarto`,
    },
    {
      label: 'Movimento costrutto Media',
      value: `${media} m / quarto`,
      hint: `${piccola} × 0,75`,
    },
  ]
}

function kyomeiLines(sheet: SkiruSheet): WazaResolvedLine[] {
  const movement = calculateMovementMetersPerQuarterFromSkiru(sheet)
  const hitsPerQuarter = Math.max(1, Math.floor(movement / KYOMEI_METERS_PER_HIT))
  return [
    movementLine(sheet),
    {
      label: 'Colpi Kyōmei (max / quarto)',
      value: String(hitsPerQuarter),
      hint: `1 colpo ogni ${KYOMEI_METERS_PER_HIT} m percorsi`,
    },
  ]
}

function tobiKakeLines(sheet: SkiruSheet): WazaResolvedLine[] {
  const movement = calculateMovementMetersPerQuarterFromSkiru(sheet)
  const threshold = Math.round(movement * TOBI_KAKE_MOVEMENT_MULTIPLIER * 10) / 10
  return [
    movementLine(sheet),
    {
      label: 'Slancio minimo (turno)',
      value: `${threshold} m`,
      hint: `Doppio Movimento prima del colpo a Contatto`,
    },
  ]
}

function shokaSublimazioneLines(sheet: SkiruSheet): WazaResolvedLine[] {
  return [junkanCapacityLine(sheet)]
}

function naikanPotenziamentoBase(sheet: SkiruSheet): WazaResolvedLine[] {
  return [junkanCapacityLine(sheet)]
}

function hariTsumeLines(sheet: SkiruSheet): WazaResolvedLine[] {
  const capacity = resolveJunkanBunCapacity(sheet)
  return [
    ...naikanPotenziamentoBase(sheet),
    {
      label: 'Potenziamento colpo',
      value: '+3 Bun',
      hint: 'Ripartiti su Binshō e Kairyoku (Indice e danno). Max Capacità Junkan: ' + capacity,
    },
  ]
}

function seniGakeLines(sheet: SkiruSheet): WazaResolvedLine[] {
  return [
    ...naikanPotenziamentoBase(sheet),
    { label: 'Fibre Bianche', value: '+2 Kairyoku' },
    { label: 'Fibre Neuromuscolari', value: '+2 Binshō' },
    { label: 'Fibre Rosse', value: '+2 Nintai' },
  ]
}

function gekiRyuLines(sheet: SkiruSheet): WazaResolvedLine[] {
  return [
    ...naikanPotenziamentoBase(sheet),
    {
      label: 'Fase impulso (2 turni)',
      value: '+3 Binshō',
    },
    {
      label: 'Contraccolpo (2 turni)',
      value: '−3 Binshō',
    },
  ]
}

function tsuboUchiLines(): WazaResolvedLine[] {
  return [
    {
      label: 'Danno extra progressivo',
      value: '+2 → +4 → +6',
      hint: 'Cap +6 sullo stesso Punto di Pressione',
    },
  ]
}

function reactiveTierLine(
  ctx: WazaResolveContext,
  label: string,
): WazaResolvedLine {
  const tier = ctx.lastReceivedHitTier
  if (tier && isWazaTier(tier)) {
    const val = resolveReactiveTierBonus(tier)
    return {
      label,
      value: `+${val}`,
      hint: `Ultimo colpo subìto: tier ${tier}`,
    }
  }
  return {
    label,
    value: 'Per tier colpo',
    hint: TIER_VALUE_REFERENCE,
  }
}

function kadenStyleLines(ctx: WazaResolveContext): WazaResolvedLine[] {
  const cs = ctx.currentCs
  const pressure = ctx.kadenPressure ?? 0
  const lines: WazaResolvedLine[] = []
  if (cs != null && cs >= KADEN_METAMORPHOSIS_CS) {
    lines.push({
      label: 'Pressione attiva',
      value: '+1 tier',
      hint: `CS ${cs} ≥ ${KADEN_METAMORPHOSIS_CS} — Kaatsu / Emanazione·Propagazione·Energetica`,
    })
  }
  if (pressure > 0) {
    const state = resolveKadenState(pressure, cs ?? 0)
    lines.push({
      label: 'Kaden',
      value: `${pressure} stack`,
      hint: `+${state.damageBonusPercent}% danno waza`,
    })
  }
  return lines
}

function yuragiStyleLines(ctx: WazaResolveContext): WazaResolvedLine[] {
  return [
    {
      label: 'Parità Yuragi',
      value: `+${YURAGI_IR_PARITY_BONUS} IR`,
      hint: 'Al cambio consistenza rispetto alla waza precedente',
    },
  ]
}

function nagoriCollateralLines(ctx: WazaResolveContext): WazaResolvedLine[] {
  const from = ctx.nagoriCollateralFrom
  if (!from) return []
  return [
    {
      label: 'Nagori collaterale',
      value: nagoriCollateralLabel(from),
      hint: `Residuo da consistenza ${from} abbandonata`,
    },
  ]
}

function itoStyleLines(ctx: WazaResolveContext): WazaResolvedLine[] {
  const bonus = ctx.itoIrBonus ?? 0
  if (bonus <= 0) return []
  return [
    {
      label: 'Tensione Itō',
      value: `+${bonus} IR`,
      hint: 'Fili tesi sul campo — bonus al lancio waza',
    },
  ]
}

function junnoLines(ctx: WazaResolveContext): WazaResolvedLine[] {
  return [reactiveTierLine(ctx, 'Resistenza vs consistenza')]
}

function hibikiGaeshiLines(ctx: WazaResolveContext): WazaResolvedLine[] {
  return [reactiveTierLine(ctx, 'Danno extra (eco)')]
}

function kaatsuLines(ctx: WazaResolveContext): WazaResolvedLine[] {
  const fromState = kadenStyleLines(ctx)
  if (fromState.length > 0) return fromState
  return [
    {
      label: 'Pressione (Kaatsu)',
      value: `CS ≥ ${KADEN_METAMORPHOSIS_CS}`,
      hint: 'Prossima Emanazione / Propagazione / Energetica: +1 tier',
    },
  ]
}

function renkinSokuLines(ctx: WazaResolveContext): WazaResolvedLine[] {
  return [
    ...yuragiStyleLines(ctx),
    {
      label: 'Regola Yuragi',
      value: 'No stessa Consistenza ×2',
      hint: 'Ogni cambio attiva effetto alchemico della nuova consistenza',
    },
  ]
}

function teishuhaLines(): WazaResolvedLine[] {
  return [
    {
      label: 'Sfera rivelazione',
      value: `${TEISHUHA_BASE_RANGE_M} m`,
      hint: `Con Costrutto Batteria: ${TEISHUHA_BATTERY_RANGE_M} m`,
    },
  ]
}

function fuanteiLines(): WazaResolvedLine[] {
  return [
    {
      label: 'Bonus gittata',
      value: `+${FUANTEI_EXTRA_RANGE_M} m`,
      hint: 'Emanazione / Propagazione Conica / Emissione a distanza (+1 CS)',
    },
  ]
}

function datsuiSacrificeLines(sheet: SkiruSheet, kind: 'scudo' | 'proiettile'): WazaResolvedLine[] {
  return [
    ...naikanPotenziamentoBase(sheet),
    {
      label: kind === 'scudo' ? 'Resistenza Scudo' : 'Danno proiettile',
      value: 'Σ Bun sacrificati',
      hint: 'Somma dei Bun rimossi al lancio',
    },
  ]
}

/** Tooltip compatto per tag chat. */
export function formatPersonalValuesHint(lines: WazaResolvedLine[], max = 4): string {
  return lines
    .slice(0, max)
    .map((l) => `${l.label}: ${l.value}`)
    .join(' · ')
}

/**
 * IR suggerito al lancio waza in chat — rispetta Skiru esplicite (Konjou, mentali, Ubaiito).
 */
export function resolveWazaLaunchIr(ctx: WazaResolveContext, poolId?: string | null): number {
  const text = ctx.description ?? ''
  let ir: number
  if (poolId === 'ubaiito-filo-rubato' || /Skiru mentali/i.test(text)) {
    ir = resolveMentalSkiruIndex(ctx.sheet, UBAIITO_MENTAL_SKIRU_IDS)
  } else if (/\(Konjou\)/i.test(text)) {
    ir = resolveExplicitSkiruIndex(ctx.sheet, SKIRU_ID_KONJOU)
  } else {
    ir = computeIndicativeActionIr(ctx.sheet)
  }
  if (ctx.yuragiParityNext) {
    ir += YURAGI_IR_PARITY_BONUS
  }
  const itoBonus = ctx.itoIrBonus ?? 0
  if (itoBonus > 0) {
    ir += itoBonus
  }
  if (ctx.nagoriCollateralFrom === 'energetico') {
    ir += 1
  }
  return ir
}

type WazaResolver = (ctx: WazaResolveContext) => WazaPersonalValues

const WAZA_RESOLVERS: Record<string, WazaResolver> = {
  'michishirube-luce-guida': (ctx) => ({
    poolId: 'michishirube-luce-guida',
    lines: michishirubeLines(ctx.sheet),
  }),
  'ubaiito-filo-rubato': (ctx) => ({
    poolId: 'ubaiito-filo-rubato',
    lines: ubaiitoLines(ctx.sheet),
  }),
  'ayatsuri-filo-burattinaio': (ctx) => ({
    poolId: 'ayatsuri-filo-burattinaio',
    lines: ayatsuriLines(ctx.sheet),
  }),
  'kyomei-risonanza-della-fiamma': (ctx) => ({
    poolId: 'kyomei-risonanza-della-fiamma',
    lines: kyomeiLines(ctx.sheet),
  }),
  'tobi-kake-slancio-carica': (ctx) => ({
    poolId: 'tobi-kake-slancio-carica',
    lines: tobiKakeLines(ctx.sheet),
  }),
  'shoka-sublimazione': (ctx) => ({
    poolId: 'shoka-sublimazione',
    lines: shokaSublimazioneLines(ctx.sheet),
  }),
  'hari-tsume-carico-trattenuto': (ctx) => ({
    poolId: 'hari-tsume-carico-trattenuto',
    lines: hariTsumeLines(ctx.sheet),
  }),
  'seni-gake-avvolgimento-fibre': (ctx) => ({
    poolId: 'seni-gake-avvolgimento-fibre',
    lines: seniGakeLines(ctx.sheet),
  }),
  'geki-ryu-corrente-violenta': (ctx) => ({
    poolId: 'geki-ryu-corrente-violenta',
    lines: gekiRyuLines(ctx.sheet),
  }),
  'tsubo-uchi-colpo-punto': () => ({
    poolId: 'tsubo-uchi-colpo-punto',
    lines: tsuboUchiLines(),
  }),
  'datsui-tate-scudo-spogliato': (ctx) => ({
    poolId: 'datsui-tate-scudo-spogliato',
    lines: datsuiSacrificeLines(ctx.sheet, 'scudo'),
  }),
  'datsui-yumi-arco-spogliato': (ctx) => ({
    poolId: 'datsui-yumi-arco-spogliato',
    lines: datsuiSacrificeLines(ctx.sheet, 'proiettile'),
  }),
  'junno-pelle-apprende': (ctx) => ({
    poolId: 'junno-pelle-apprende',
    lines: junnoLines(ctx),
  }),
  'hibiki-gaeshi-eco-risposta': (ctx) => ({
    poolId: 'hibiki-gaeshi-eco-risposta',
    lines: hibikiGaeshiLines(ctx),
  }),
  'kaatsu-sovrapressione': (ctx) => ({
    poolId: 'kaatsu-sovrapressione',
    lines: kaatsuLines(ctx),
  }),
  'renkin-soku-regole-alchemiche': (ctx) => ({
    poolId: 'renkin-soku-regole-alchemiche',
    lines: renkinSokuLines(ctx),
  }),
  'teishuha-onda-bassa': () => ({
    poolId: 'teishuha-onda-bassa',
    lines: teishuhaLines(),
  }),
  'toshi-investimento-energetico': (ctx) => ({
    poolId: 'toshi-investimento-energetico',
    lines: [
      {
        label: 'Investimento',
        value: ctx.currentCs != null ? `CS disponibili ${ctx.currentCs}` : '—',
        hint: 'Tag [investimento:+N] · riscossione [investimento:riscuoti]',
      },
    ],
  }),
  'shakkin-indebitamento': () => ({
    poolId: 'shakkin-indebitamento',
    lines: [
      {
        label: 'Debito',
        value: '×2 iniziali · max ×6 · 5 danno/stack',
        hint: 'Tag [debito:NomePG] · restituzione [debito:restituisci]',
      },
    ],
  }),
  'fuantei-deflagrazione-instabile': () => ({
    poolId: 'fuantei-deflagrazione-instabile',
    lines: fuanteiLines(),
  }),
}

function dedupeLines(lines: WazaResolvedLine[]): WazaResolvedLine[] {
  const seen = new Set<string>()
  const out: WazaResolvedLine[] = []
  for (const line of lines) {
    if (seen.has(line.label)) continue
    seen.add(line.label)
    out.push(line)
  }
  return out
}

/**
 * Calcola righe «Valori per te» per una waza del catalogo.
 * Ritorna null se non ci sono formule registrate per il poolId / contesto.
 */
export function resolveWazaPersonalValues(
  poolId: string | null | undefined,
  ctx: WazaResolveContext,
): WazaPersonalValues | null {
  if (!poolId?.trim()) return null

  const lines: WazaResolvedLine[] = []

  const specific = WAZA_RESOLVERS[poolId]
  if (specific) {
    lines.push(...specific(ctx).lines)
  } else {
    if (ctx.isConstructWaza) {
      const line = constructResistanceLine(ctx)
      if (line) lines.push(line)
    }
    if (ctx.styleId === 'naikan') {
      lines.push(junkanCapacityLine(ctx.sheet))
    }
    if (ctx.styleId === 'hado') {
      lines.push(...kadenStyleLines(ctx))
    }
    if (ctx.styleId === 'hensei') {
      lines.push(...yuragiStyleLines(ctx))
    }
    if (ctx.styleId === 'ito') {
      lines.push(...itoStyleLines(ctx))
    }
    lines.push(...indexContestLines(ctx.sheet, ctx.description))
  }

  if (lines.length === 0) return null
  const nagoriLines = nagoriCollateralLines(ctx)
  if (nagoriLines.length > 0) {
    lines.push(...nagoriLines)
  }
  return { poolId, lines: dedupeLines(lines) }
}
