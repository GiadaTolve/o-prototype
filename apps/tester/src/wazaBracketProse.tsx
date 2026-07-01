/**
 * Testo waza con segmenti [tag] evidenziati (tema Dark Arcane via .wit-bracket-tag).
 */

import type { ReactNode } from 'react'

export function renderBracketTaggedProse(text: string | undefined | null): ReactNode {
  if (text == null || !String(text).trim()) return null
  const s = String(text)
  return s.split(/(\[[^\]]+\])/g).map((part, i) =>
    part.startsWith('[') && part.endsWith(']') ? (
      <strong key={i} className="wit-bracket-tag">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}
