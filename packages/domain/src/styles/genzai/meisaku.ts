/** Meisaku (銘作) — Opera Prima · Genzai-dō. */

export const MEISAKU_CS_COST = 6

export type GenzaiMeisakuState = {
  active: boolean
  /** Nome/forma dichiarata in chat (opzionale). */
  label?: string
}

export type GenzaiMeisakuMeta = {
  genzaiMeisaku?: GenzaiMeisakuState | null
}

export function readMeisakuState(meta: GenzaiMeisakuMeta | null | undefined): GenzaiMeisakuState | null {
  const m = meta?.genzaiMeisaku
  if (!m?.active) return null
  return m
}

export function extractMeisakuLabel(text: string): string | null {
  const m = /\[meisaku:\s*([^\]]+)\]/i.exec(text)
  const q = m?.[1]?.trim()
  return q && q.length > 0 ? q.slice(0, 80) : null
}

export function activateMeisaku(meta: GenzaiMeisakuMeta, label?: string | null): GenzaiMeisakuMeta {
  return {
    ...meta,
    genzaiMeisaku: { active: true, label: label ?? undefined },
  }
}

export function clearMeisaku(meta: GenzaiMeisakuMeta): GenzaiMeisakuMeta {
  return { ...meta, genzaiMeisaku: null }
}

export function formatMeisakuSegment(meta: GenzaiMeisakuMeta): string | null {
  const m = readMeisakuState(meta)
  if (!m) return null
  return m.label ? `Opera Prima: ${m.label}` : 'Opera Prima attiva'
}
