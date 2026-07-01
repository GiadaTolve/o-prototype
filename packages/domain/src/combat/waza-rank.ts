import { isWazaTier, type WazaTier } from './tier'

/** Estrae tier 1–5 da rank DB (es. "T3", "Tier 3", "3"). */
export function parseWazaTierFromRank(rank?: string | null): WazaTier | null {
  if (!rank?.trim()) return null
  const normalized = rank.trim()
  const fromLabel = normalized.match(/(?:^T|^tier\s*)([1-5])$/i)
  if (fromLabel) {
    const n = Number(fromLabel[1])
    return isWazaTier(n) ? n : null
  }
  if (/^[1-5]$/.test(normalized)) {
    const n = Number(normalized)
    return isWazaTier(n) ? n : null
  }
  return null
}
