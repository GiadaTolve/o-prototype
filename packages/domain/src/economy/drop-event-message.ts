export type DropEventCardData = {
  readonly headline: string
  readonly detail?: string
}

/** Card drop/prendi da messaggio sistema in chat (prefisso 📦). */
export function parseDropEventMessage(content: string): DropEventCardData | null {
  const trimmed = content.trim()
  if (!trimmed.startsWith('📦')) return null

  const ground = trimmed.match(/^📦 A terra compare:\s*(.+?) ×(\d+)\s*$/u)
  if (ground) {
    return {
      headline: 'Loot a terra',
      detail: `${ground[1]} ×${ground[2]}`,
    }
  }

  const pickup = trimmed.match(/^📦 (.+?) raccoglie:\s*(.+?) ×(\d+)\s*$/u)
  if (pickup) {
    return {
      headline: pickup[1]!,
      detail: `${pickup[2]} ×${pickup[3]}`,
    }
  }

  const find = trimmed.match(/^📦 (.+?) trova:\s*(.+)\s*$/u)
  if (find) {
    return {
      headline: find[1]!,
      detail: find[2]!.trim(),
    }
  }

  return {
    headline: 'Evento loot',
    detail: trimmed.replace(/^📦\s*/, ''),
  }
}
