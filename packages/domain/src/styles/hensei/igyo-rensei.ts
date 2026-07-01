/** Igyō-Rensei (異形錬成) — Insegnamenti di Tucker · Hensei-dō. */

export const IGYO_RENSEI_CS_COST = 5

export type IgyoForcedConsistency = 'solido' | 'liquido' | 'gassoso' | 'elementale'

export type HenseiIgyoState = {
  forcedTo: IgyoForcedConsistency
  /** Etichetta costrutto/scudo bersaglio (opzionale). */
  targetLabel?: string
}

export type HenseiIgyoMeta = {
  henseiIgyoLast?: HenseiIgyoState | null
}

const CONSISTENCY_ALIASES: Record<string, IgyoForcedConsistency> = {
  solido: 'solido',
  liquido: 'liquido',
  gassoso: 'gassoso',
  elementale: 'elementale',
}

/** `[igyo:liquido]` o `[igyo:solido→liquido]` (usa la consistenza di arrivo). */
export function extractIgyoForceSpec(text: string): {
  to: IgyoForcedConsistency
  targetLabel?: string
} | null {
  const shift = /\[igyo:\s*([a-z]+)\s*(?:→|->)\s*([a-z]+)\s*\]/i.exec(text)
  if (shift) {
    const to = CONSISTENCY_ALIASES[shift[2].toLowerCase()]
    if (to) return { to }
  }
  const single = /\[igyo:\s*([a-z]+)\s*\]/i.exec(text)
  if (single) {
    const to = CONSISTENCY_ALIASES[single[1].toLowerCase()]
    if (to) return { to }
  }
  const target = /\[igyo:bersaglio:\s*([^\]]+)\]/i.exec(text)
  const label = target?.[1]?.trim()
  if (label) {
    const base = extractIgyoForceSpec(text.replace(/\[igyo:bersaglio:[^\]]+\]/i, ''))
    if (base) return { ...base, targetLabel: label.slice(0, 80) }
  }
  return null
}

export function recordIgyoForce(
  meta: HenseiIgyoMeta,
  spec: { to: IgyoForcedConsistency; targetLabel?: string },
): HenseiIgyoMeta {
  return {
    ...meta,
    henseiIgyoLast: {
      forcedTo: spec.to,
      targetLabel: spec.targetLabel,
    },
  }
}

const EFFECT_LABELS: Record<IgyoForcedConsistency, string> = {
  solido: 'Immobile 1t · +2 tier Resistenza',
  liquido: '−50% Resistenza · zona Liquido 4 m',
  gassoso: 'Nube Gassosa 4 m · 2 turni',
  elementale: 'Esplosione elementale 4 m · distrutto',
}

export function formatIgyoSegment(meta: HenseiIgyoMeta): string | null {
  const i = meta?.henseiIgyoLast
  if (!i) return null
  const target = i.targetLabel ? ` su ${i.targetLabel}` : ''
  return `Igyō-Rensei: forzato [${i.forcedTo}]${target} (${EFFECT_LABELS[i.forcedTo]})`
}
