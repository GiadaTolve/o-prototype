/** Pattern risultato dado risolto in chat: [🎲 50/100] o [🎲 3+2 = 5] */
export const DICE_RESULT_TAG = /\[🎲 ([^\]]+)\]/g

export function containsResolvedDice(text: string): boolean {
  DICE_RESULT_TAG.lastIndex = 0
  return DICE_RESULT_TAG.test(text)
}

/** Etichette interne ai tag dado (es. "50/100", "14"). */
export function extractDiceResultLabels(text: string): string[] {
  const labels: string[] = []
  DICE_RESULT_TAG.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = DICE_RESULT_TAG.exec(text)) !== null) {
    labels.push(m[1].trim())
  }
  return labels
}

/** Testo residuo dopo rimozione tag dado e spazi. */
export function stripDiceTags(text: string): string {
  return text.replace(DICE_RESULT_TAG, '').replace(/\s+/g, ' ').trim()
}

/** Messaggio il cui contenuto sostanziale è solo il tiro dado. */
export function isDiceRollMessage(text: string): boolean {
  if (!containsResolvedDice(text)) return false
  return stripDiceTags(text).length === 0
}

/** Riga chat per messaggio solo dado (prima del parsing HTML). */
export function formatDiceRollLine(labels: string[]): string {
  if (labels.length === 0) return 'Lancia un dado, esito: [🎲 —]'
  return `Lancia un dado, esito: [🎲 ${labels.join(', ')}]`
}

/** @deprecated Usare formatDiceRollLine + narrative parser per il riquadretto 🎲 */
export function formatDiceRollPhrase(labels: string[]): string {
  return formatDiceRollLine(labels).replace(/^Lancia un dado, esito: \[🎲 /, "fa' ").replace(/\]$/, '')
}
