/** Shokushin (触診) — Lettura del Corpo · Naikan-dō. */

export const SHOKUSHIN_CS_COST = 3

export type NaikanReadTarget = {
  characterId: string
  displayName: string
  depth: number
  bonusTierNextHit: number
}

export type NaikanShokushinMeta = {
  naikanReadTarget?: NaikanReadTarget | null
}

export function readShokushinTarget(meta: NaikanShokushinMeta | null | undefined): NaikanReadTarget | null {
  const t = meta?.naikanReadTarget
  if (!t?.characterId) return null
  return t
}

export function extractLetturaTargetSpec(text: string): { characterId?: string; nameQuery?: string } | null {
  const idMatch = /\[lettura:\s*id:([0-9a-f-]{36})\s*\]/i.exec(text)
  if (idMatch) return { characterId: idMatch[1] }
  const nameMatch = /\[lettura:\s*(?!id:)([^\]]+)\]/i.exec(text)
  if (!nameMatch) return null
  const q = nameMatch[1]?.trim()
  return q ? { nameQuery: q } : null
}

export function applyShokushinReading(
  meta: NaikanShokushinMeta,
  target: { characterId: string; displayName: string },
): NaikanShokushinMeta {
  return {
    ...meta,
    naikanReadTarget: {
      characterId: target.characterId,
      displayName: target.displayName,
      depth: 1,
      bonusTierNextHit: 1,
    },
  }
}

/** Colpo subito dal bersaglio letto → approfondisce la lettura. */
export function deepenShokushinReading(meta: NaikanShokushinMeta, fromCharacterId: string): NaikanShokushinMeta {
  const t = readShokushinTarget(meta)
  if (!t || t.characterId !== fromCharacterId) return meta
  return {
    ...meta,
    naikanReadTarget: {
      ...t,
      depth: Math.min(5, t.depth + 1),
    },
  }
}

export function getShokushinOffensiveTierBonus(
  meta: NaikanShokushinMeta | null | undefined,
  targetCharacterId: string,
): number {
  const t = readShokushinTarget(meta)
  if (!t || t.characterId !== targetCharacterId) return 0
  return t.bonusTierNextHit
}

/** Dopo un colpo andato a segno sul bersaglio letto. */
export function consumeShokushinOffensiveBonus(
  meta: NaikanShokushinMeta,
): NaikanShokushinMeta {
  const t = readShokushinTarget(meta)
  if (!t || t.bonusTierNextHit <= 0) return meta
  return {
    ...meta,
    naikanReadTarget: { ...t, bonusTierNextHit: 0 },
  }
}

export function formatShokushinSegment(meta: NaikanShokushinMeta): string | null {
  const t = readShokushinTarget(meta)
  if (!t) return null
  return `Lettura: ${t.displayName} (prof. ${t.depth}, +${t.bonusTierNextHit} tier prossimo colpo)`
}

/** Scambio colpo tra lettore e bersaglio letto (bonus tier + approfondimento). */
export function processShokushinHitExchange(
  attackerMeta: NaikanShokushinMeta,
  defenderMeta: NaikanShokushinMeta,
  attackerId: string,
  defenderId: string,
): {
  attackerMeta: NaikanShokushinMeta
  defenderMeta: NaikanShokushinMeta
  offensiveBonusConsumed: boolean
  readingDeepened: boolean
} {
  let nextAttacker = attackerMeta
  let nextDefender = defenderMeta
  let offensiveBonusConsumed = false
  let readingDeepened = false

  const bonus = getShokushinOffensiveTierBonus(attackerMeta, defenderId)
  if (bonus > 0) {
    nextAttacker = consumeShokushinOffensiveBonus(attackerMeta)
    offensiveBonusConsumed = true
  }

  const readerOnDefender = readShokushinTarget(defenderMeta)
  if (readerOnDefender?.characterId === attackerId) {
    nextDefender = deepenShokushinReading(defenderMeta, attackerId)
    readingDeepened = true
  }

  return { attackerMeta: nextAttacker, defenderMeta: nextDefender, offensiveBonusConsumed, readingDeepened }
}
