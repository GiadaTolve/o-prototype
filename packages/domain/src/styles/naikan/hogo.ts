import type { StatusCombatModifiers } from '../../combat/status/types'

/** Hōgō (縫合) — Sutura dell'Ego · Naikan-dō. */

export const HOGO_CS_COST = 7
export const HOGO_DURATION_TURNS = 3
export const HOGO_BREAK_CS_COST = 4

export type HogosuturaKind = 'offensiva' | 'stile' | 'elementale'

export type NaikanSuturaState = {
  kind: HogosuturaKind
  fromCharacterId: string
  fromDisplayName: string
  turnsLeft: number
}

export type NaikanHogoMeta = {
  naikanSutura?: NaikanSuturaState | null
}

const KIND_ALIASES: Record<string, HogosuturaKind> = {
  offensiva: 'offensiva',
  stile: 'stile',
  elementale: 'elementale',
}

export function readSuturaState(meta: NaikanHogoMeta | null | undefined): NaikanSuturaState | null {
  const s = meta?.naikanSutura
  if (!s || s.turnsLeft <= 0) return null
  return s
}

/** `[sutura:NomePG:offensiva]` o `[sutura:NomePG:stile]` */
export function extractSuturaSpec(text: string): {
  characterId?: string
  nameQuery?: string
  kind?: HogosuturaKind
} | null {
  const idMatch = /\[sutura:\s*id:([0-9a-f-]{36})\s*:\s*([a-z]+)\s*\]/i.exec(text)
  if (idMatch) {
    const kind = KIND_ALIASES[idMatch[2].toLowerCase()]
    if (kind) return { characterId: idMatch[1], kind }
  }
  const nameMatch = /\[sutura:\s*(?!id:|spezza|restituisci)([^:]+)\s*:\s*([a-z]+)\s*\]/i.exec(text)
  if (nameMatch) {
    const kind = KIND_ALIASES[nameMatch[2].toLowerCase()]
    if (kind) return { nameQuery: nameMatch[1].trim(), kind }
  }
  return null
}

export function hasSuturaBreakTag(text: string): boolean {
  return /\[sutura:\s*spezza\s*\]/i.test(text)
}

export function applySutura(
  victimMeta: NaikanHogoMeta,
  from: { characterId: string; displayName: string },
  kind: HogosuturaKind,
): NaikanHogoMeta {
  return {
    ...victimMeta,
    naikanSutura: {
      kind,
      fromCharacterId: from.characterId,
      fromDisplayName: from.displayName,
      turnsLeft: HOGO_DURATION_TURNS,
    },
  }
}

export function breakSutura(meta: NaikanHogoMeta): NaikanHogoMeta {
  return { ...meta, naikanSutura: null }
}

export function tickSuturaEndOfTurn(meta: NaikanHogoMeta): NaikanHogoMeta {
  const s = readSuturaState(meta)
  if (!s) return { ...meta, naikanSutura: null }
  const turnsLeft = s.turnsLeft - 1
  if (turnsLeft <= 0) return { ...meta, naikanSutura: null }
  return { ...meta, naikanSutura: { ...s, turnsLeft } }
}

const KIND_LABELS: Record<HogosuturaKind, string> = {
  offensiva: 'Offensiva',
  stile: 'Stile',
  elementale: 'Elementale',
}

export function formatSuturaSegment(meta: NaikanHogoMeta): string | null {
  const s = readSuturaState(meta)
  if (!s) return null
  const malus =
    s.kind === 'offensiva'
      ? ' · −3 IR'
      : s.kind === 'elementale'
        ? ' · status congelati'
        : s.kind === 'stile'
          ? ' · passiva sigillata'
          : ''
  return `Sutura ${KIND_LABELS[s.kind]} (${s.turnsLeft}t) · da ${s.fromDisplayName}${malus}`
}

/** Malus numerici / flag combattimento quando la Sutura è sul bersaglio. */
export function compileSuturaModifiers(
  meta: NaikanHogoMeta | null | undefined,
): Partial<StatusCombatModifiers> {
  const s = readSuturaState(meta)
  if (!s) return {}
  if (s.kind === 'offensiva') return { indexBonus: -3 }
  if (s.kind === 'elementale') return { blockStatusDecay: true }
  return {}
}
