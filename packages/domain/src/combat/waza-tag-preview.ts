import { computeIndicativeActionIr } from './resolution'
import { computeDeclaredActionIr } from './waza-skiru-riders'
import { getTierRow, type WazaTier } from './tier'
import { parseWazaTierFromRank } from './waza-rank'
import {
  formatPersonalValuesHint,
  resolveWazaLaunchIr,
  resolveWazaPersonalValues,
  type WazaResolveContext,
} from './waza-resolve'
import { STYLE_LABELS, styleIdFromBranchLabel, type StyleId } from '../progression/style-hexagon'
import type { SkiruSheet } from '../skiru/types'

/** Flag UI per il pannello di lancio — derivati dal data file, mergiati nell'index. */
export type WazaLaunchFlags = {
  needsGiurisdizioneCategory?: boolean
  needsSuturaKind?: boolean
  needsDecreto?: boolean
  needsNagoriShift?: boolean
  needsTarget?: boolean
  allowsSurprise?: boolean
  needsMeisakuLabel?: boolean
  needsQuarto?: boolean
  needsDelayedEffect?: boolean
  /** Card vai solo al Master (effetto mediato, nessun confronto IR/Danno visibile a tutti). */
  masterOnlyCard?: boolean
  needsMacchiatoSpend?: boolean
  needsTrasformaTag?: boolean
  trasformaDimensione?: 'consistenza' | 'categoria'
  trasformaFromOptions?: string[]
  trasformaToOptions?: string[]
  needsSeniGake?: boolean
  /** Waza bersaglio-debito: aggiunge `[debito:nome]` al lancio. */
  needsDebitoTag?: boolean
}

export type WazaTagCatalogEntry = {
  name: string
  rank: string | null
  styleId: StyleId | null
  isPassive: boolean
  description?: string
  /** Slug wazaPool — per resolve Skiru. */
  poolId?: string
  /** Testo meccanico (effetto) per formule e confronti IR. */
  effect?: string
  /** Flag UI pannello di lancio (mergiati dall'index, assenti nel file generato). */
  launchFlags?: WazaLaunchFlags
}

export type WazaTagPreview = {
  name: string
  found: boolean
  isPassive: boolean
  styleId: StyleId | null
  styleLabel: string | null
  tier: number | null
  csCost: number | null
  damage: number | null
  description: string | null
  /** Valori calcolati da Skiru (tooltip / lancio). */
  personalHint: string | null
}

export function normalizeWazaLookupKey(name: string): string {
  return name
    .trim()
    .replace(/[—–−]/g, '-')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

export function buildWazaTagIndex(
  entries: readonly WazaTagCatalogEntry[],
): ReadonlyMap<string, WazaTagCatalogEntry> {
  const map = new Map<string, WazaTagCatalogEntry>()
  for (const entry of entries) {
    const key = normalizeWazaLookupKey(entry.name)
    if (!key) continue
    if (!map.has(key)) map.set(key, entry)
  }
  return map
}

export function resolveWazaTagPreview(
  rawName: string,
  index: ReadonlyMap<string, WazaTagCatalogEntry>,
): WazaTagPreview {
  const name = rawName.trim()
  const entry = index.get(normalizeWazaLookupKey(name))
  if (!entry) {
    return {
      name,
      found: false,
      isPassive: false,
      styleId: null,
      styleLabel: null,
      tier: null,
      csCost: null,
      damage: null,
      description: null,
      personalHint: null,
    }
  }

  const styleLabel = entry.styleId ? STYLE_LABELS[entry.styleId] : null
  const description = entry.description?.trim() || null

  if (entry.isPassive) {
    return {
      name: entry.name,
      found: true,
      isPassive: true,
      styleId: entry.styleId,
      styleLabel,
      tier: null,
      csCost: null,
      damage: null,
      description,
      personalHint: null,
    }
  }

  const tier = parseWazaTierFromRank(entry.rank)
  if (tier == null) {
    return {
      name: entry.name,
      found: true,
      isPassive: false,
      styleId: entry.styleId,
      styleLabel,
      tier: null,
      csCost: null,
      damage: null,
      description,
      personalHint: null,
    }
  }

  const row = getTierRow(tier)
  return {
    name: entry.name,
    found: true,
    isPassive: false,
    styleId: entry.styleId,
    styleLabel,
    tier,
    csCost: row.csCost,
    damage: row.value,
    description,
    personalHint: null,
  }
}

function buildResolveContext(
  entry: WazaTagCatalogEntry,
  sheet: SkiruSheet,
  extras?: Pick<
    WazaResolveContext,
    'currentCs' | 'kadenPressure' | 'lastReceivedHitTier' | 'yuragiParityNext' | 'itoIrBonus' | 'nagoriCollateralFrom'
  >,
): WazaResolveContext {
  const tier = parseWazaTierFromRank(entry.rank)
  const mechanics = (entry.effect ?? entry.description ?? '').trim()
  return {
    sheet,
    wazaTier: tier,
    styleId: entry.styleId,
    description: mechanics,
    isConstructWaza: mechanics.includes('[Costrutto]'),
    ...extras,
  }
}

/** Arricchisce anteprima con valori Skiru (gittata, IR, Junkan…). */
export function enrichWazaTagPreviewWithSkiru(
  preview: WazaTagPreview,
  entry: WazaTagCatalogEntry | undefined,
  sheet?: SkiruSheet | null,
  extras?: Pick<
    WazaResolveContext,
    'currentCs' | 'kadenPressure' | 'lastReceivedHitTier' | 'yuragiParityNext' | 'itoIrBonus' | 'nagoriCollateralFrom'
  >,
): WazaTagPreview {
  if (!sheet || !entry?.poolId) return preview
  const values = resolveWazaPersonalValues(entry.poolId, {
    ...buildResolveContext(entry, sheet, extras),
  })
  const hint = values ? formatPersonalValuesHint(values.lines) : null
  if (!hint) return preview
  return { ...preview, personalHint: hint }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildWazaTagTitle(preview: WazaTagPreview): string {
  const parts: string[] = []
  if (preview.styleLabel) parts.push(preview.styleLabel)
  if (preview.isPassive) {
    parts.push('Dō passiva')
  } else if (preview.tier != null) {
    parts.push(`Tier ${preview.tier}`)
    if (preview.csCost != null) parts.push(`${preview.csCost} CS`)
    if (preview.damage != null) parts.push(`${preview.damage} danno base`)
  }
  if (preview.personalHint) parts.push(preview.personalHint)
  if (preview.description) parts.push(preview.description)
  if (!preview.found) parts.unshift('Waza non in catalogo — verifica nome')
  return parts.join(' · ')
}

export function buildWazaTagHtml(preview: WazaTagPreview): string {
  const title = escapeHtml(buildWazaTagTitle(preview))
  const displayName = escapeHtml(preview.name)
  const passiveClass = preview.isPassive ? ' waza-tag--passive' : ''
  const unknownClass = !preview.found ? ' waza-tag--unknown' : ''

  if (preview.isPassive || preview.tier == null) {
    return `<span class="waza-tag${passiveClass}${unknownClass}" title="${title}">${displayName}</span>`
  }

  const meta = `T${preview.tier}·${preview.csCost}CS`
  return `<span class="waza-tag${unknownClass}" title="${title}"><span class="waza-tag-name">${displayName}</span><span class="waza-tag-meta">${meta}</span></span>`
}

/** Sostituisce [waza:Nome] con span arricchiti (tier/CS da catalogo). */
export function formatWazaTagsInText(
  text: string,
  index: ReadonlyMap<string, WazaTagCatalogEntry>,
): string {
  return text.replace(/\[waza:([^\]]+)\]/gi, (_m, rawName: string) => {
    const preview = resolveWazaTagPreview(rawName, index)
    return buildWazaTagHtml(preview)
  })
}

/** Estrae i nomi waza da tag [waza:…] nel testo chat (ordine di comparsa). */
export function extractWazaTagNames(text: string): string[] {
  const names: string[] = []
  const re = /\[waza:([^\]]+)\]/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const name = m[1]?.trim()
    if (name) names.push(name)
  }
  return names
}

/** Legge [ir:N] dal messaggio (IR dichiarato al lancio). */
export function extractIrTagFromText(text: string): number | null {
  const m = /\[ir:(\d+)\]/i.exec(text)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

/** Rimuove tag waza/lancio dal corpo mostrato (la striscia li sostituisce in UI). */
export function removeWazaTagsFromText(text: string): string {
  return text
    .replace(/\s*\[waza:[^\]]+\]/gi, '')
    .replace(/\s*\[tier:\d+\]/gi, '')
    .replace(/\s*\[cs:\d+\]/gi, '')
    .replace(/\s*\[ir:\d+\]/gi, '')
    .replace(/\s*\[skiru:[^\]]+\]/gi, '')
    .replace(/\s*\[target:[^\]]+\]/gi, '')
    .replace(/\s*\[generiche:\s*colpito:[^\]]+\]/gi, '')
    .replace(/\s*\[origine:[^\]]+\]/gi, '')
    .replace(/\s*\[(?:hit|colpito):1\]/gi, '')
    .replace(/\s*\[taglia:[^\]]+\]/gi, '')
    .replace(/\s*\[sticker:[^\]]+\]/gi, '')
    .replace(/\s*\[kaden:[^\]]+\]/gi, '')
    .replace(/\s*\[quarto:[^\]]+\]/gi, '')
    .replace(/\s*\[setup:1\]/gi, '')
    .replace(/\s*\[sorpresa:1\]/gi, '')
    .replace(/\s*\[trasforma:[^\]]+\]/gi, '')
    .replace(/\s*\[costrutto:[^\]]+\]/gi, '')
    .replace(/\s*\[cedi-controllo:[^\]]+\]/gi, '')
    .replace(/\s*\[macchiato-spend:[^\]]+\]/gi, '')
    .replace(/\s*\[seni-gake:[^\]]+\]/gi, '')
    .replace(/^\s+/, '')
}

/**
 * Riga da inserire in chat al lancio: tag waza + tier/CS/IR suggeriti (attive).
 * La striscia in UI legge gli stessi tag dal messaggio grezzo.
 */
export function buildWazaLaunchInsertLine(
  wazaName: string,
  index: ReadonlyMap<string, WazaTagCatalogEntry>,
  options?: {
    skiruSheet?: SkiruSheet | null
    declaredSkiruId?: string | null
    csOverride?: number | null
    currentCs?: number | null
    kadenPressure?: number | null
    lastReceivedHitTier?: WazaTier | null
    yuragiParityNext?: boolean
    itoIrBonus?: number | null
    /**
     * IR già calcolato a monte (es. dal pannello, dalla coppia di Skiru papabili
     * scelte a mano via `calculateSuccessIndex`). Se presente vince: emette `[ir:N]`
     * così com'è, senza ricalcolare da una singola Skiru dichiarata.
     */
    irOverride?: number | null
  },
): string {
  const entry = index.get(normalizeWazaLookupKey(wazaName.trim()))
  const resolveExtras = options
    ? {
        currentCs: options.currentCs,
        kadenPressure: options.kadenPressure,
        lastReceivedHitTier: options.lastReceivedHitTier,
        yuragiParityNext: options.yuragiParityNext,
        itoIrBonus: options.itoIrBonus,
      }
    : undefined
  let preview = resolveWazaTagPreview(wazaName, index)
  if (options?.skiruSheet && entry) {
    preview = enrichWazaTagPreviewWithSkiru(preview, entry, options.skiruSheet, resolveExtras)
  }
  const tag = `[waza:${preview.name}]`
  if (preview.isPassive || preview.tier == null || preview.csCost == null) {
    return tag
  }
  const cs =
    options?.csOverride != null && Number.isFinite(options.csOverride)
      ? Math.max(0, Math.round(options.csOverride))
      : preview.csCost
  let line = `${tag} [tier:${preview.tier}] [cs:${cs}]`
  const hasIrOverride =
    options?.irOverride != null && Number.isFinite(options.irOverride)
  if (hasIrOverride) {
    // L'IR è già completo di media coppia + modificatori: emettilo così com'è.
    line += ` [ir:${Math.max(0, Math.round(options!.irOverride as number))}]`
  } else if (options?.skiruSheet) {
    let ir: number
    if (options.declaredSkiruId) {
      ir = computeDeclaredActionIr(
        options.skiruSheet,
        options.declaredSkiruId,
        entry?.effect ?? entry?.description ?? null,
      )
    } else if (entry?.poolId) {
      ir = resolveWazaLaunchIr(
        buildResolveContext(entry, options.skiruSheet, resolveExtras),
        entry.poolId,
      )
    } else {
      ir = computeIndicativeActionIr(options.skiruSheet)
    }
    if (options.yuragiParityNext) ir += 2
    if (options.itoIrBonus && options.itoIrBonus > 0) ir += options.itoIrBonus
    line += ` [ir:${ir}]`
  }
  return line
}

/** Risolve styleId da branch waza pool (per generator). */
export function styleIdForWazaBranch(branch: string): StyleId | null {
  return styleIdFromBranchLabel(branch)
}
