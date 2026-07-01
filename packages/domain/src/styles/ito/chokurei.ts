/** Chokurei (勅令) — Decreto · Itō-dō. */

export const CHOKUREI_CS_COST = 6
export const CHOKUREI_DECRETO_TURNS = 2

export type ItoDecretoState = {
  text: string
  turnsLeft: number
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

export function imposeDecreto(meta: ItoChokureiMeta, decreeText: string): ItoChokureiMeta {
  return {
    ...meta,
    itoDecreto: { text: decreeText.trim(), turnsLeft: CHOKUREI_DECRETO_TURNS },
  }
}

export function tickDecretoEndOfTurn(meta: ItoChokureiMeta): ItoChokureiMeta {
  const d = readDecretoState(meta)
  if (!d) return { ...meta, itoDecreto: null }
  const turnsLeft = d.turnsLeft - 1
  if (turnsLeft <= 0) return { ...meta, itoDecreto: null }
  return { ...meta, itoDecreto: { ...d, turnsLeft } }
}

export function formatDecretoSegment(meta: ItoChokureiMeta): string | null {
  const d = readDecretoState(meta)
  if (!d) return null
  const short = d.text.length > 48 ? `${d.text.slice(0, 45)}…` : d.text
  return `Decreto: «${short}» (${d.turnsLeft} turni)`
}
