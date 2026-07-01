import {
  formatLevelLabel,
  getLevelFromExp,
  getLevelUpProgress,
  getParagonFromExp,
  isParagonPlayer,
  LEVEL_CAP,
} from '@domain/progression'

export {
  formatLevelLabel,
  getLevelFromExp,
  getLevelUpProgress,
  getParagonFromExp,
  isParagonPlayer,
  LEVEL_CAP,
}

/** Classe Tailwind per nome in lista presenti (paragon = viola luminoso). */
export function presentiNameClass(opts: {
  isMe?: boolean
  isShadow?: boolean
  paragon?: number
  expTotal?: number
}): string {
  const paragon =
    opts.paragon ?? (opts.expTotal != null ? getParagonFromExp(opts.expTotal) : 0)
  if (opts.isMe) return 'text-[var(--accent-gold)]'
  if (opts.isShadow) return 'text-amber-400/90'
  if (paragon > 0) {
    return 'text-[var(--accent-violet-light)] [text-shadow:0_0_10px_var(--glow-violet)]'
  }
  return 'text-white'
}

/** Suffisso opzionale dopo il nome (es. " ★2"). */
export function presentiParagonSuffix(paragon?: number, expTotal?: number): string {
  const p = paragon ?? (expTotal != null ? getParagonFromExp(expTotal) : 0)
  return p > 0 ? ` ★${p}` : ''
}

export function resolveLevelFromExp(expTotal: number): { level: number; paragon: number; label: string } {
  const level = getLevelFromExp(expTotal)
  const paragon = getParagonFromExp(expTotal)
  return { level, paragon, label: formatLevelLabel(level, paragon) }
}
