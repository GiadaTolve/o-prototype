/**
 * Parsing Narrativo per chat play-by-chat (client-side).
 * 
 * Formatta i messaggi per la visualizzazione:
 * - Parlati «...» → evidenziati
 * - Tag narrativi [ ... ] → evidenziati
 */

/**
 * Formatta il testo per la visualizzazione:
 * - Parlati «...» o <...> → <span class="parlato">...</span>
 * - Tag narrativi [ ... ] → <span class="tag-narrativo">[...]</span>
 */
export function formatNarrativeText(text: string): string {
  let formatted = text;
  // Formatta parlati «...» o <...>
  formatted = formatted.replace(/«([^»]+)»/g, '<span class="parlato">«$1»</span>');
  formatted = formatted.replace(/<([^>]+)>/g, '<span class="parlato">«$1»</span>');
  // Formatta tag narrativi [ ... ]
  formatted = formatted.replace(/\[([^\]]+)\]/g, '<span class="tag-narrativo">[$1]</span>');
  return formatted;
}

/**
 * Estrae i parlati dal testo (per anteprima o validazione).
 */
export function extractParlati(text: string): string[] {
  const parlati: string[] = [];
  const pattern = /«([^»]+)»/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    parlati.push(match[1].trim());
  }
  return parlati;
}

/**
 * Estrae i tag narrativi dal testo (per anteprima o validazione).
 */
export function extractTagNarrativi(text: string): string[] {
  const tag: string[] = [];
  const pattern = /\[([^\]]+)\]/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    tag.push(match[1].trim());
  }
  return tag;
}

/**
 * Calcola caratteri netti (senza parlati) per anteprima EXP (non ufficiale, solo indicativo).
 */
export function calculateNetCharsPreview(text: string): number {
  // Rimuove parlati «...»
  const withoutParlati = text.replace(/«[^»]+»/g, "").trim();
  // Rimuove spazi multipli
  return withoutParlati.replace(/\s+/g, " ").trim().length;
}
