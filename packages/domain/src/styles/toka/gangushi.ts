/** Gangushi (玩具師) — Il Giocattolaio · Tōka-dō. */

export const GANGUSHI_DURATION_TURNS = 3
export const GANGUSHI_CS_COST = 7

export type TokaGangushiState = {
  turnsLeft: number
}

export type TokaGangushiMeta = {
  tokaGangushi?: TokaGangushiState | null
}

export function readGangushiState(meta: TokaGangushiMeta | null | undefined): TokaGangushiState | null {
  const g = meta?.tokaGangushi
  if (!g || g.turnsLeft <= 0) return null
  return g
}

export function activateGangushi(meta: TokaGangushiMeta): TokaGangushiMeta {
  return {
    ...meta,
    tokaGangushi: { turnsLeft: GANGUSHI_DURATION_TURNS },
  }
}

export function tickGangushiEndOfTurn(meta: TokaGangushiMeta): TokaGangushiMeta {
  const g = readGangushiState(meta)
  if (!g) return { ...meta, tokaGangushi: null }
  const turnsLeft = g.turnsLeft - 1
  if (turnsLeft <= 0) return { ...meta, tokaGangushi: null }
  return { ...meta, tokaGangushi: { turnsLeft } }
}

export function formatGangushiSegment(meta: TokaGangushiMeta): string | null {
  const g = readGangushiState(meta)
  if (!g) return null
  return `Gangushi: oggetti [Tōrō] (${g.turnsLeft} turni)`
}
