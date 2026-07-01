/** Rakuen (楽園) — Eden · Genzai-dō. */

export const RAKUEN_DURATION_TURNS = 4
export const RAKUEN_CS_COST = 8
export const RAKUEN_REGEN_CS_PER_CONSTRUCT = 2

export type GenzaiEdenState = {
  turnsLeft: number
}

export type EdenDestroyedConstructSnapshot = {
  label: string
  wazaTier: number
  size: string
  stationary: boolean
}

export type GenzaiEdenMeta = {
  genzaiEden?: GenzaiEdenState | null
  /** Costrutti distrutti in Eden — rigenerabili con [eden:rigenera]. */
  genzaiEdenDestroyedQueue?: EdenDestroyedConstructSnapshot[]
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
  if (!e) return { ...meta, genzaiEden: null, genzaiEdenDestroyedQueue: [] }
  const turnsLeft = e.turnsLeft - 1
  if (turnsLeft <= 0) {
    return { ...meta, genzaiEden: null, genzaiEdenDestroyedQueue: [] }
  }
  return { ...meta, genzaiEden: { turnsLeft } }
}

export function recordEdenDestroyedConstruct(
  meta: GenzaiEdenMeta,
  snapshot: EdenDestroyedConstructSnapshot,
): GenzaiEdenMeta {
  if (!readEdenState(meta)) return meta
  const queue = [...(meta.genzaiEdenDestroyedQueue ?? []), snapshot]
  return { ...meta, genzaiEdenDestroyedQueue: queue }
}

export function consumeEdenRegenConstructs(
  meta: GenzaiEdenMeta,
  count: number,
): { meta: GenzaiEdenMeta; snapshots: EdenDestroyedConstructSnapshot[] } {
  const queue = [...(meta.genzaiEdenDestroyedQueue ?? [])]
  const n = Math.min(Math.max(0, Math.floor(count)), queue.length)
  const snapshots = queue.slice(0, n)
  const rest = queue.slice(n)
  return {
    meta: { ...meta, genzaiEdenDestroyedQueue: rest },
    snapshots,
  }
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
