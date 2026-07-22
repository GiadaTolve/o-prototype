/** Omocha (玩具) — Il Giocattolo · Tōka-dō. */

export const OMOCHA_DURATION_TURNS = 3
export const OMOCHA_CS_COST = 5

export type TokaOmochaState = {
  turnsLeft: number
  objectLabel?: string
}

export type TokaOmochaMeta = {
  tokaOmocha?: TokaOmochaState | null
}

export function readOmochaState(meta: TokaOmochaMeta | null | undefined): TokaOmochaState | null {
  const o = meta?.tokaOmocha
  if (!o || o.turnsLeft <= 0) return null
  return o
}

export function extractOmochaObjectLabel(text: string): string | null {
  const m = /\[omocha:\s*([^\]]+)\]/i.exec(text)
  const q = m?.[1]?.trim()
  if (!q || /^spezza$/i.test(q)) return null
  return q.slice(0, 80)
}

export function activateOmocha(meta: TokaOmochaMeta, objectLabel?: string | null): TokaOmochaMeta {
  return {
    ...meta,
    tokaOmocha: {
      turnsLeft: OMOCHA_DURATION_TURNS,
      objectLabel: objectLabel ?? undefined,
    },
  }
}

export function tickOmochaEndOfTurn(meta: TokaOmochaMeta): TokaOmochaMeta {
  const o = readOmochaState(meta)
  if (!o) return { ...meta, tokaOmocha: null }
  const turnsLeft = o.turnsLeft - 1
  if (turnsLeft <= 0) return { ...meta, tokaOmocha: null }
  return { ...meta, tokaOmocha: { ...o, turnsLeft } }
}

export function formatOmochaSegment(meta: TokaOmochaMeta): string | null {
  const o = readOmochaState(meta)
  if (!o) return null
  const obj = o.objectLabel ? ` · ${o.objectLabel}` : ''
  return `Omocha: [Tōrō]${obj} (${o.turnsLeft} turni)`
}
