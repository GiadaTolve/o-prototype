/** Inserisce `[tag]` in un textarea alla posizione del cursore. */
export function insertBracketTagAtTextarea(
  textarea: HTMLTextAreaElement | null,
  tagLabel: string,
  onFallback?: (next: string) => void,
  getFallback?: () => string,
): boolean {
  const snippet = `[${tagLabel}]`
  if (!textarea) {
    if (onFallback && getFallback) onFallback(getFallback() + snippet)
    return false
  }
  const start = textarea.selectionStart ?? textarea.value.length
  const end = textarea.selectionEnd ?? start
  const before = textarea.value.slice(0, start)
  const after = textarea.value.slice(end)
  const next = before + snippet + after
  textarea.value = next
  const cursor = start + snippet.length
  textarea.selectionStart = cursor
  textarea.selectionEnd = cursor
  textarea.focus()
  onFallback?.(next)
  return true
}
