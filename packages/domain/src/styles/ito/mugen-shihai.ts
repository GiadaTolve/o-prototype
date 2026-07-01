/** Mugen-Shihai (夢幻支配) — Dominazione Onirica · Itō-dō. */

export const MUGEN_SHIHAI_DURATION_TURNS = 4
export const MUGEN_SHIHAI_CS_COST = 8
export const MUGEN_SHIHAI_BREAK_DAMAGE = 12

export type ItoMugenShihaiState = {
  turnsLeft: number
}

export type ItoMugenShihaiMeta = {
  itoMugenShihai?: ItoMugenShihaiState | null
}

export function readMugenShihaiState(
  meta: ItoMugenShihaiMeta | null | undefined,
): ItoMugenShihaiState | null {
  const z = meta?.itoMugenShihai
  if (!z || z.turnsLeft <= 0) return null
  return z
}

export function activateMugenShihai(meta: ItoMugenShihaiMeta): ItoMugenShihaiMeta {
  return {
    ...meta,
    itoMugenShihai: { turnsLeft: MUGEN_SHIHAI_DURATION_TURNS },
  }
}

export function breakMugenShihai(meta: ItoMugenShihaiMeta): ItoMugenShihaiMeta {
  return { ...meta, itoMugenShihai: null }
}

export function tickMugenShihaiEndOfTurn(meta: ItoMugenShihaiMeta): ItoMugenShihaiMeta {
  const z = readMugenShihaiState(meta)
  if (!z) return { ...meta, itoMugenShihai: null }
  const turnsLeft = z.turnsLeft - 1
  if (turnsLeft <= 0) return { ...meta, itoMugenShihai: null }
  return { ...meta, itoMugenShihai: { turnsLeft } }
}

export function formatMugenShihaiSegment(meta: ItoMugenShihaiMeta): string | null {
  const z = readMugenShihaiState(meta)
  if (!z) return null
  return `Dominazione Onirica: raggio 10 m (${z.turnsLeft} turni)`
}
