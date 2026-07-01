/** Estrae l'ultimo quarto turno dichiarato nel testo ([1/4]…[4/4]). */
export function parseQuarterFromText(text: string): number | null {
  const matches = [...text.matchAll(/\[([1-4])\/4\]/gi)]
  if (matches.length === 0) return null
  const last = matches[matches.length - 1][1]
  const n = Number(last)
  return n >= 1 && n <= 4 ? n : null
}
