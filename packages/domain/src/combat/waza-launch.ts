import { listSkiruByDomain } from '../skiru/catalog'
import { getSkiruPoints } from '../skiru/progression'
import type { SkiruSheet } from '../skiru/types'
import { extractGenericheHitTargetSpec } from '../styles/generiche/generiche-effects'
import { buildIndicativeActionIndex } from './resolution'
import { normalizeWazaLookupKey, type WazaTagCatalogEntry } from './waza-tag-preview'
import { buildWazaLaunchInsertLine } from './waza-tag-preview'
import {
  SKIRU_ID_KONJOU,
  SKIRU_ID_SEIMITSU,
  UBAIITO_MENTAL_SKIRU_IDS,
} from './waza-resolve'
import {
  computeDeclaredActionIr,
  extractMechanicTagsFromEffect,
  getSkiruRider,
  wazaEffectDeclaresContact,
} from './waza-skiru-riders'

export type WazaLaunchTargetSpec = {
  characterId?: string
  nameQuery?: string
}

export type WazaLaunchBuildOptions = {
  skiruSheet?: SkiruSheet | null
  declaredSkiruId?: string | null
  csOverride?: number | null
  target?: WazaLaunchTargetSpec | null
  /** Dichiara colpo a segno → `[hit:1]` (danno tier applicato dal motore). */
  declareHit?: boolean
  currentCs?: number | null
  atsuryokuPressure?: number | null
  lastReceivedHitTier?: import('./tier').WazaTier | null
  yuragiParityNext?: boolean
  itoIrBonus?: number | null
}

/** Skiru investite utilizzabili come incanalamento (chi/jin/ten, escluso Sōkaiju). */
export function listInvestedChannelSkiru(sheet: SkiruSheet | null | undefined): Array<{
  id: string
  name: string
  points: number
  domain: string
}> {
  if (!sheet) return []
  return listSkiruByDomain('chi')
    .concat(listSkiruByDomain('jin'), listSkiruByDomain('ten'))
    .filter(
      (s) =>
        s.kind === 'standard' &&
        s.branchId !== 'sokaiju' &&
        getSkiruPoints(sheet, s.id) > 0,
    )
    .map((s) => ({
      id: s.id,
      name: s.name,
      points: getSkiruPoints(sheet, s.id),
      domain: s.domain,
    }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, 'it'))
}

const RANGED_TAG_RE = /proiettile|raggio|emissione|propagazione/i
const JIN_CHANNEL_IDS = ['itten-kokan', 'juuryoku-kokan', 'shintai-kokan'] as const
const OFFENSIVE_RIDER_IDS = ['bakuryoku', 'goatsu', 'shintai-kokan', 'seimitsu'] as const

function skiruInvested(sheet: SkiruSheet, id: string): boolean {
  return getSkiruPoints(sheet, id) > 0
}

function addInvestedSkiru(sheet: SkiruSheet, ids: readonly string[], out: Set<string>) {
  for (const id of ids) {
    if (skiruInvested(sheet, id)) out.add(id)
  }
}

function sortSkiruCandidates(sheet: SkiruSheet, ids: Iterable<string>): string[] {
  return [...ids]
    .filter((id) => skiruInvested(sheet, id))
    .sort(
      (a, b) =>
        getSkiruPoints(sheet, b) - getSkiruPoints(sheet, a) ||
        a.localeCompare(b, 'it'),
    )
}

export type WazaLaunchSkiruContext = Pick<
  WazaTagCatalogEntry,
  'poolId' | 'effect' | 'description' | 'isPassive'
>

/**
 * Skiru candidate al lancio — solo quelle pertinenti alla waza (non l'intera scheda).
 */
export function resolveRelevantLaunchSkiruCandidates(
  sheet: SkiruSheet,
  entry?: WazaLaunchSkiruContext | null,
): string[] {
  if (!entry || entry.isPassive) return []

  const effect = (entry.effect ?? entry.description ?? '').trim()
  const tags = extractMechanicTagsFromEffect(effect)
  const candidates = new Set<string>()
  const isRanged = tags.some((t) => RANGED_TAG_RE.test(t))
  const isPotenziamento = tags.some((t) => /potenziamento/i.test(t))
  const isContact = wazaEffectDeclaresContact(effect)

  if (entry.poolId === 'ubaiito-filo-rubato' || /Skiru mentali/i.test(effect)) {
    addInvestedSkiru(sheet, UBAIITO_MENTAL_SKIRU_IDS, candidates)
  }
  if (/\(Konjou\)/i.test(effect) && skiruInvested(sheet, SKIRU_ID_KONJOU)) {
    candidates.add(SKIRU_ID_KONJOU)
  }

  if (isContact) {
    addInvestedSkiru(sheet, ['shintai-kokan'], candidates)
    for (const def of listSkiruByDomain('chi')) {
      if (def.branchId === 'tosou' && skiruInvested(sheet, def.id)) candidates.add(def.id)
    }
  }

  if (isRanged || entry.poolId === 'michishirube-luce-guida') {
    if (skiruInvested(sheet, SKIRU_ID_SEIMITSU)) candidates.add(SKIRU_ID_SEIMITSU)
    addInvestedSkiru(sheet, JIN_CHANNEL_IDS, candidates)
    for (const def of listSkiruByDomain('chi')) {
      if (def.branchId === 'binsho' && skiruInvested(sheet, def.id)) candidates.add(def.id)
    }
  }

  if (isPotenziamento) {
    addInvestedSkiru(sheet, JIN_CHANNEL_IDS, candidates)
  }

  const offensiveWaza = !isPotenziamento
  for (const id of OFFENSIVE_RIDER_IDS) {
    if (!skiruInvested(sheet, id) || !getSkiruRider(id)) continue
    if (id === 'shintai-kokan' && !isContact) continue
    if (
      id === 'seimitsu' &&
      !isRanged &&
      entry.poolId !== 'michishirube-luce-guida'
    ) {
      continue
    }
    if ((id === 'bakuryoku' || id === 'goatsu') && !offensiveWaza) continue
    candidates.add(id)
  }

  if (candidates.size === 0) {
    const indicative = buildIndicativeActionIndex(sheet)
    if (skiruInvested(sheet, indicative.physicalSkiruId)) {
      candidates.add(indicative.physicalSkiruId)
    }
    if (skiruInvested(sheet, indicative.channelingSkiruId)) {
      candidates.add(indicative.channelingSkiruId)
    }
  }

  return sortSkiruCandidates(sheet, candidates)
}

/** Skiru dichiarata automaticamente al lancio (miglior candidata pertinente). */
export function resolveAutoLaunchSkiruId(
  sheet: SkiruSheet | null | undefined,
  entry?: WazaLaunchSkiruContext | null,
): string | null {
  if (!sheet || !entry || entry.isPassive) return null

  const candidates = resolveRelevantLaunchSkiruCandidates(sheet, entry)
  if (candidates.length > 0) return candidates[0] ?? null

  const indicative = buildIndicativeActionIndex(sheet)
  const chiPts = getSkiruPoints(sheet, indicative.physicalSkiruId)
  const jinPts = getSkiruPoints(sheet, indicative.channelingSkiruId)
  if (chiPts <= 0 && jinPts <= 0) return null
  return chiPts >= jinPts ? indicative.physicalSkiruId : indicative.channelingSkiruId
}

export function extractLaunchSkiruId(text: string): string | null {
  const m = /\[skiru:\s*([a-z0-9-]+)\s*\]/i.exec(text)
  return m?.[1]?.trim().toLowerCase() ?? null
}

export function extractLaunchCsOverride(text: string): number | null {
  const m = /\[cs:(\d+)\]/i.exec(text)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

export function extractLaunchTierFromText(text: string): number | null {
  const m = /\[tier:(\d+)\]/i.exec(text)
  if (!m) return null
  const n = Number(m[1])
  if (!Number.isFinite(n) || n < 1 || n > 5) return null
  return n
}

/** `[hit:1]` o `[colpito:1]` — colpo dichiarato a segno. */
export function extractHitDeclaredFromText(text: string): boolean {
  return /\[(?:hit|colpito):1\]/i.test(text)
}

/** Bersaglio da `[target:…]` o `[generiche:colpito:…]`. */
export function extractWazaLaunchTargetSpec(text: string): WazaLaunchTargetSpec | null {
  const fromGeneriche = extractGenericheHitTargetSpec(text)
  if (fromGeneriche) return fromGeneriche
  const idMatch = /\[target:\s*id:([0-9a-f-]{36})\s*\]/i.exec(text)
  if (idMatch) return { characterId: idMatch[1] }
  const nameMatch = /\[target:\s*([^\]]+)\]/i.exec(text)
  if (!nameMatch) return null
  const q = nameMatch[1]?.trim()
  if (!q || /^id:/i.test(q)) return null
  return { nameQuery: q }
}

function buildTargetTag(target: WazaLaunchTargetSpec): string {
  if (target.characterId) return `[target:id:${target.characterId}]`
  if (target.nameQuery) return `[target:${target.nameQuery}]`
  return ''
}

/**
 * Riga completa per chat: waza + tier/cs/ir + skiru dichiarata + bersaglio.
 * Per automazioni status colpito, duplica anche `[generiche:colpito:…]` se c'è target.
 */
export function buildFullWazaLaunchLine(
  wazaName: string,
  index: ReadonlyMap<string, WazaTagCatalogEntry>,
  options?: WazaLaunchBuildOptions,
): string {
  const base = buildWazaLaunchInsertLine(wazaName, index, {
    skiruSheet: options?.skiruSheet,
    currentCs: options?.currentCs,
    atsuryokuPressure: options?.atsuryokuPressure,
    lastReceivedHitTier: options?.lastReceivedHitTier,
    yuragiParityNext: options?.yuragiParityNext,
    itoIrBonus: options?.itoIrBonus,
    declaredSkiruId: options?.declaredSkiruId,
    csOverride: options?.csOverride,
  })
  const parts = [base]
  if (options?.declaredSkiruId) {
    parts.push(`[skiru:${options.declaredSkiruId}]`)
  }
  if (options?.target) {
    const targetTag = buildTargetTag(options.target)
    if (targetTag) {
      parts.push(targetTag)
      if (options.target.characterId) {
        parts.push(`[generiche:colpito:id:${options.target.characterId}]`)
      } else if (options.target.nameQuery) {
        parts.push(`[generiche:colpito:${options.target.nameQuery}]`)
      }
    }
  }
  if (options?.declareHit) {
    parts.push('[hit:1]')
  }
  return parts.join(' ')
}

export type ParsedWazaSlashCommand = {
  wazaQuery: string
  skiruId?: string
  cs?: number
  target?: string
  origine?: string
}

/** `/waza <nome> --skiru <id> [--cs N] [--target Nome] [--origine id]` */
export function parseWazaSlashCommand(line: string): ParsedWazaSlashCommand | null {
  const trimmed = line.trim()
  if (!/^\/waza\b/i.test(trimmed)) return null
  const body = trimmed.replace(/^\/waza\s+/i, '').trim()
  if (!body) return null

  const tokens: string[] = []
  const re = /(?:[^\s"']+|"[^"]*"|'[^']*')+/g
  let m: RegExpExecArray | null
  while ((m = re.exec(body)) !== null) {
    const t = m[0].replace(/^['"]|['"]$/g, '')
    if (t) tokens.push(t)
  }
  if (tokens.length === 0) return null

  const out: ParsedWazaSlashCommand = { wazaQuery: '' }
  const wazaParts: string[] = []
  let i = 0
  while (i < tokens.length && !tokens[i].startsWith('--')) {
    wazaParts.push(tokens[i])
    i++
  }
  out.wazaQuery = wazaParts.join(' ').trim()
  if (!out.wazaQuery) return null

  while (i < tokens.length) {
    const flag = tokens[i]?.toLowerCase()
    const val = tokens[i + 1]
    if (flag === '--skiru' && val) {
      out.skiruId = val.toLowerCase()
      i += 2
      continue
    }
    if (flag === '--cs' && val) {
      const n = Number(val)
      if (Number.isFinite(n)) out.cs = n
      i += 2
      continue
    }
    if (flag === '--target' && val) {
      out.target = val
      i += 2
      continue
    }
    if (flag === '--origine' && val) {
      out.origine = val
      i += 2
      continue
    }
    i++
  }
  return out
}

function resolveWazaNameFromQuery(
  query: string,
  index: ReadonlyMap<string, WazaTagCatalogEntry>,
): string | null {
  const key = normalizeWazaLookupKey(query)
  const entry = index.get(key)
  if (entry) return entry.name
  for (const [k, e] of index) {
    if (k.includes(key) || key.includes(k)) return e.name
  }
  return null
}

/** Se il messaggio è solo `/waza …`, lo espande in tag chat. */
export function expandWazaSlashCommandInMessage(
  text: string,
  index: ReadonlyMap<string, WazaTagCatalogEntry>,
  options?: WazaLaunchBuildOptions,
): string {
  const parsed = parseWazaSlashCommand(text)
  if (!parsed) return text
  const wazaName = resolveWazaNameFromQuery(parsed.wazaQuery, index)
  if (!wazaName) return text

  const target =
    parsed.target != null
      ? ({ nameQuery: parsed.target } satisfies WazaLaunchTargetSpec)
      : options?.target

  const line = buildFullWazaLaunchLine(wazaName, index, {
    ...options,
    declaredSkiruId: parsed.skiruId ?? options?.declaredSkiruId,
    csOverride: parsed.cs ?? options?.csOverride,
    target: target ?? undefined,
  })

  const origine =
    parsed.origine != null ? ` [origine:${parsed.origine}]` : ''
  return line + origine
}

export function resolveLaunchIrFromMessage(
  text: string,
  sheet: SkiruSheet | null | undefined,
  fallbackIr: number | null,
): number | null {
  const declared = extractLaunchSkiruId(text)
  if (declared && sheet) return computeDeclaredActionIr(sheet, declared)
  return fallbackIr
}
