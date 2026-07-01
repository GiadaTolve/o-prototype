import { resolveStatusIdFromTag, getStatusDefinition } from './catalog'

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

/** Sostituisce tag status noti in chat (prima del catch-all generico). */
export function formatStatusTagsInText(text: string): string {
  return text.replace(/\[([^\]]+)\]/g, (full, inner: string) => {
    const id = resolveStatusIdFromTag(inner)
    if (!id) return full
    const def = getStatusDefinition(id)
    const kindClass =
      def.kind === 'emotional'
        ? 'status-emotional-tag'
        : def.kind === 'elemental'
          ? 'status-elemental-tag'
          : 'status-atypical-tag'
    return `<span class="${kindClass}" title="${escapeHtml(def.description)}">${escapeHtml(def.tag)}</span>`
  })
}
