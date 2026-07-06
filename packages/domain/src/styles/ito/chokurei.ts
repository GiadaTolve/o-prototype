/** Chokurei (勅令) — Decreto · Itō-dō. */

import { extractWazaTaxonomyFromText } from '../../combat/waza-taxonomy'

export const CHOKUREI_CS_COST = 6
export const CHOKUREI_DECRETO_TURNS = 2

export type DecretoEffectKind =
  | 'invert_projectile'
  | 'freeze_waza'
  | 'block_direction'
  | 'swap_constructs'
  | 'generic'

export type ItoDecretoState = {
  text: string
  turnsLeft: number
  /** Un solo decreto imposto per turno. */
  imposedThisTurn: boolean
}

export type ItoChokureiMeta = {
  itoDecreto?: ItoDecretoState | null
}

export function readDecretoState(meta: ItoChokureiMeta | null | undefined): ItoDecretoState | null {
  const d = meta?.itoDecreto
  if (!d || d.turnsLeft <= 0 || !d.text.trim()) return null
  return d
}

/** `[decreto: Quella Proiettile torna al mittente]` */
export function extractDecretoText(text: string): string | null {
  const m = /\[decreto:\s*([^\]]+)\]/i.exec(text)
  const q = m?.[1]?.trim()
  return q && q.length > 0 ? q.slice(0, 200) : null
}

export function hasDecretoApplyTag(text: string): boolean {
  return /\[decreto:\s*applica\s*\]/i.test(text)
}

export function inferDecretoEffectKind(decretoText: string): DecretoEffectKind {
  const t = decretoText.toLowerCase()
  if (/proiettile/.test(t) && /(mittente|indietro|ritorn)/.test(t)) return 'invert_projectile'
  if (/si ferma|congel|ferm/.test(t)) return 'freeze_waza'
  if (/non pu[oò] muoversi|direzione negata|blocca/.test(t)) return 'block_direction'
  if (/scambiano di posto|scambia/.test(t) && /costrutt/.test(t)) return 'swap_constructs'
  return 'generic'
}

export function decretoAppliesToWaza(decretoText: string, wazaEffectOrDescription: string): boolean {
  const kind = inferDecretoEffectKind(decretoText)
  const { categories } = extractWazaTaxonomyFromText(wazaEffectOrDescription)
  if (kind === 'invert_projectile') {
    return categories.some((c) => c.id === 'proiettile')
  }
  if (kind === 'swap_constructs') {
    return categories.some((c) => c.id === 'costrutti')
  }
  return kind !== 'generic' || categories.length > 0
}

export function canImposeDecreto(meta: ItoChokureiMeta): boolean {
  const d = readDecretoState(meta)
  return !d?.imposedThisTurn
}

export function imposeDecreto(meta: ItoChokureiMeta, decreeText: string): ItoChokureiMeta {
  return {
    ...meta,
    itoDecreto: {
      text: decreeText.trim(),
      turnsLeft: CHOKUREI_DECRETO_TURNS,
      imposedThisTurn: true,
    },
  }
}

export function tryApplyDecreto(
  meta: ItoChokureiMeta,
  wazaEffectText: string,
): { ok: true; meta: ItoChokureiMeta; effect: DecretoEffectKind } | { ok: false; reason: string } {
  const d = readDecretoState(meta)
  if (!d) return { ok: false, reason: 'Nessun Decreto attivo.' }
  if (!decretoAppliesToWaza(d.text, wazaEffectText)) {
    return { ok: false, reason: 'Il Decreto non si applica a questa waza.' }
  }
  return { ok: true, meta, effect: inferDecretoEffectKind(d.text) }
}

export function tickDecretoEndOfTurn(meta: ItoChokureiMeta): ItoChokureiMeta {
  const d = readDecretoState(meta)
  if (!d) return { ...meta, itoDecreto: null }
  const turnsLeft = d.turnsLeft - 1
  if (turnsLeft <= 0) return { ...meta, itoDecreto: null }
  return {
    ...meta,
    itoDecreto: { ...d, turnsLeft },
  }
}

export function formatDecretoSegment(meta: ItoChokureiMeta): string | null {
  const d = readDecretoState(meta)
  if (!d) return null
  const short = d.text.length > 48 ? `${d.text.slice(0, 45)}…` : d.text
  return `Decreto: «${short}» (${d.turnsLeft} turni)`
}
