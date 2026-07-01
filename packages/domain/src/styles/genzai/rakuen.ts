/** Rakuen (楽園) — Eden · Genzai-dō. */

export const RAKUEN_DURATION_TURNS = 4
export const RAKUEN_CS_COST = 8
export const RAKUEN_REGEN_CS_PER_CONSTRUCT = 2

export type GenzaiEdenState = {
  turnsLeft: number
}

export type GenzaiEdenMeta = {
  genzaiEden?: GenzaiEdenState | null
}

export function readEdenState(meta: GenzaiEdenMeta | null | undefined): GenzaiEdenState | null {
  const e = meta?.genzaiEden
  if (!e || e.turnsLeft <= 0) return null
  return e
}

export function activateEden(meta: GenzaiEdenMeta): GenzaiEdenMeta {
  return {
    ...meta,
    genzaiEden: { turnsLeft: RAKUEN_DURATION_TURNS },
  }
}

export function tickEdenEndOfTurn(meta: GenzaiEdenMeta): GenzaiEdenMeta {
  const e = readEdenState(meta)
  if (!e) return { ...meta, genzaiEden: null }
  const turnsLeft = e.turnsLeft - 1
  if (turnsLeft <= 0) return { ...meta, genzaiEden: null }
  return { ...meta, genzaiEden: { turnsLeft } }
}

export function formatEdenSegment(meta: GenzaiEdenMeta): string | null {
  const e = readEdenState(meta)
  if (!e) return null
  return `Eden: raggio 10 m · Gosa sospeso (${e.turnsLeft} turni) · rigenera [eden:rigenera] (−${RAKUEN_REGEN_CS_PER_CONSTRUCT} CS/costr.)`
}

/** `[eden:rigenera]` o `[eden:rigenera:2]` — rigenerazione costrutti distrutti in Eden. */
export function extractEdenRegenCount(text: string): number | null {
  const m = /\[eden:\s*rigenera(?::\s*(\d+))?\s*\]/i.exec(text)
  if (!m) return null
  if (m[1]) {
    const n = Number(m[1])
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1
  }
  return 1
}
