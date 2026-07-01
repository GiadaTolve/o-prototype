/** Shinryaku (侵略) — Invasione · Genzai-dō. */

import { getTierValue } from '../../combat/tier'

export const SHINRYAKU_CS_COST = 7
export const SHINRYAKU_WAZA_TIER = 5
export const SHINRYAKU_RESISTANCE_TIER = 4
export const SHINRYAKU_CONSTRUCT_SIZE = 'grande' as const
export const SHINRYAKU_DURATION_TURNS = 3
export const SHINRYAKU_CONTACT_DAMAGE = getTierValue(SHINRYAKU_WAZA_TIER)

export function extractShinryakuLabel(text: string): string | null {
  const m = /\[shinryaku:\s*(?!contatto:)([^\]]+)\]/i.exec(text)
  const q = m?.[1]?.trim()
  return q && q.length > 0 ? q.slice(0, 80) : null
}

/** `[shinryaku:contatto:NomePG]` o `[shinryaku:contatto:id:uuid]` */
export function extractShinryakuContactSpec(text: string): {
  characterId?: string
  nameQuery?: string
} | null {
  const idMatch = /\[shinryaku:\s*contatto:\s*id:([0-9a-f-]{36})\s*\]/i.exec(text)
  if (idMatch) return { characterId: idMatch[1] }
  const nameMatch = /\[shinryaku:\s*contatto:\s*([^\]]+)\]/i.exec(text)
  if (!nameMatch) return null
  const q = nameMatch[1]?.trim()
  return q ? { nameQuery: q } : null
}

export function defaultShinryakuConstructLabel(custom?: string | null): string {
  return custom?.trim() || 'Invasione — Costrutto Grande'
}
