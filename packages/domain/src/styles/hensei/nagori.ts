/** Nagori (名残) — Principio di Instabilità · Hensei-dō. */

export const NAGORI_DURATION_TURNS = 3
export const NAGORI_CS_COST = 3

export type ConsistencyKind = 'solido' | 'liquido' | 'gassoso' | 'sonoro' | 'elementale' | 'energetico'

export type HenseiNagoriState = {
  turnsLeft: number
  /** Ultimo cambio consistenza dichiarato in chat (bonus residuo). */
  lastFrom?: ConsistencyKind
  lastTo?: ConsistencyKind
}

export type HenseiNagoriMeta = {
  henseiNagori?: HenseiNagoriState | null
}

const CONSISTENCY_ALIASES: Record<string, ConsistencyKind> = {
  solido: 'solido',
  liquido: 'liquido',
  gassoso: 'gassoso',
  sonoro: 'sonoro',
  elementale: 'elementale',
  energetico: 'energetico',
  energetica: 'energetico',
}

export function readNagoriState(meta: HenseiNagoriMeta | null | undefined): HenseiNagoriState | null {
  const n = meta?.henseiNagori
  if (!n || n.turnsLeft <= 0) return null
  return n
}

export function activateNagori(meta: HenseiNagoriMeta): HenseiNagoriMeta {
  return {
    ...meta,
    henseiNagori: { turnsLeft: NAGORI_DURATION_TURNS },
  }
}

export function tickNagoriEndOfTurn(meta: HenseiNagoriMeta): HenseiNagoriMeta {
  const n = readNagoriState(meta)
  if (!n) return { ...meta, henseiNagori: null }
  const turnsLeft = n.turnsLeft - 1
  if (turnsLeft <= 0) return { ...meta, henseiNagori: null }
  return { ...meta, henseiNagori: { ...n, turnsLeft } }
}

/** `[yuragi:liquido→solido]` o `[consistenza:da:liquido:a:solido]` */
export function extractConsistencyShift(text: string): { from: ConsistencyKind; to: ConsistencyKind } | null {
  const arrow = /\[yuragi:\s*([a-z]+)\s*(?:→|->)\s*([a-z]+)\s*\]/i.exec(text)
  if (arrow) {
    const from = CONSISTENCY_ALIASES[arrow[1].toLowerCase()]
    const to = CONSISTENCY_ALIASES[arrow[2].toLowerCase()]
    if (from && to && from !== to) return { from, to }
  }
  const verbose = /\[consistenza:\s*da:([a-z]+)\s*a:([a-z]+)\s*\]/i.exec(text)
  if (verbose) {
    const from = CONSISTENCY_ALIASES[verbose[1].toLowerCase()]
    const to = CONSISTENCY_ALIASES[verbose[2].toLowerCase()]
    if (from && to && from !== to) return { from, to }
  }
  return null
}

export function nagoriCollateralLabel(from: ConsistencyKind): string {
  switch (from) {
    case 'solido':
      return '+1 tier danno'
    case 'liquido':
      return '+4 m gittata'
    case 'gassoso':
      return '+1 turno durata'
    case 'sonoro':
      return 'ignora 1 tier Resistenza/Scudo'
    case 'elementale':
      return '+1 stack elementale abbandonato'
    case 'energetico':
      return 'priorità parità IR'
    default:
      return ''
  }
}

export function recordNagoriShift(
  meta: HenseiNagoriMeta,
  shift: { from: ConsistencyKind; to: ConsistencyKind },
): HenseiNagoriMeta {
  const n = readNagoriState(meta)
  if (!n) return meta
  return {
    ...meta,
    henseiNagori: { ...n, lastFrom: shift.from, lastTo: shift.to },
  }
}

/** Consuma il bonus collaterale dopo l'uso su un colpo/waza. */
export function clearNagoriCollateral(meta: HenseiNagoriMeta): HenseiNagoriMeta {
  const n = readNagoriState(meta)
  if (!n?.lastFrom) return meta
  return {
    ...meta,
    henseiNagori: { ...n, lastFrom: undefined, lastTo: undefined },
  }
}

/** Bonus collaterali Nagori applicabili al prossimo colpo/waza dopo uno shift. */
export function compileNagoriCollateralModifiers(
  meta: HenseiNagoriMeta | null | undefined,
): Partial<import('../../combat/status/types').StatusCombatModifiers> {
  const n = readNagoriState(meta)
  if (!n?.lastFrom) return {}
  switch (n.lastFrom) {
    case 'solido':
      return { offensiveTierBonus: 1 }
    case 'liquido':
      return { bonusRangeMeters: 4 }
    case 'gassoso':
      return { bonusDurationTurns: 1 }
    case 'sonoro':
      return { shieldPenetrationTier: 1 }
    case 'elementale':
      return { nagoriElementalStackBonus: 1 }
    case 'energetico':
      return { indexBonus: 1 }
    default:
      return {}
  }
}

export function formatNagoriSegment(meta: HenseiNagoriMeta): string | null {
  const n = readNagoriState(meta)
  if (!n) return null
  if (n.lastFrom && n.lastTo) {
    return `Nagori: ${n.lastFrom}→${n.lastTo} (${nagoriCollateralLabel(n.lastFrom)}) · ${n.turnsLeft}t`
  }
  return `Nagori attivo (${n.turnsLeft} turni)`
}
