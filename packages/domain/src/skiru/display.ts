/** Etichetta UI: Romaji (Kanji) — Nome italiano. */
export function formatSkiruDisplayName(
  italian: string,
  romaji?: string,
  kanji?: string,
): string {
  if (!romaji?.trim()) return italian
  const jp = kanji?.trim() ? `${romaji} (${kanji})` : romaji
  return `${jp} — ${italian}`
}
