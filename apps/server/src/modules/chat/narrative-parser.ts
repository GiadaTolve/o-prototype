/**
 * Parsing Narrativo per chat play-by-chat.
 * 
 * Regole:
 * - Parlato: « ... » → formattato in UI
 * - Tag narrativi: [ ... ] → formattato in UI
 * - EXP: calcolato su caratteri netti (senza parlati)
 * - Anti-spam: validazione lunghezza e rate limiting
 */

export type ParsedMessage = {
  /** Testo originale */
  raw: string;
  /** Testo con parsing applicato (per display) */
  formatted: string;
  /** Caratteri netti (senza parlati) per calcolo EXP */
  netChars: number;
  /** Lista di parlati estratti */
  parlati: string[];
  /** Lista di tag narrativi estratti */
  tagNarrativi: string[];
};

/**
 * Estrae i parlati dal testo (pattern: «...»).
 * Supporta anche varianti: «...», "...", '...'
 */
function extractParlati(text: string): string[] {
  const parlati: string[] = [];
  // Pattern per «...» (guillemets)
  const guillemetPattern = /«([^»]+)»/g;
  let match;
  while ((match = guillemetPattern.exec(text)) !== null) {
    parlati.push(match[1].trim());
  }
  return parlati;
}

/**
 * Estrae i tag narrativi dal testo (pattern: [ ... ]).
 * Non include i tag luogo che sono gestiti separatamente.
 */
function extractTagNarrativi(text: string): string[] {
  const tag: string[] = [];
  // Pattern per [ ... ] (tag narrativi)
  const tagPattern = /\[([^\]]+)\]/g;
  let match;
  while ((match = tagPattern.exec(text)) !== null) {
    tag.push(match[1].trim());
  }
  return tag;
}

/**
 * Rimuove i parlati dal testo per calcolare caratteri netti.
 */
function removeParlati(text: string): string {
  // Rimuove «...»
  return text.replace(/«[^»]+»/g, "").trim();
}

/**
 * Formatta il testo per la visualizzazione:
 * - Parlati «...» → <span class="parlato">...</span>
 * - Tag narrativi [ ... ] → <span class="tag-narrativo">[...]</span>
 */
function formatForDisplay(text: string): string {
  let formatted = text;
  // Formatta parlati
  formatted = formatted.replace(/«([^»]+)»/g, '<span class="parlato">«$1»</span>');
  // Formatta tag narrativi
  formatted = formatted.replace(/\[([^\]]+)\]/g, '<span class="tag-narrativo">[$1]</span>');
  return formatted;
}

/**
 * Calcola i caratteri netti (senza parlati) per il calcolo EXP.
 */
function calculateNetChars(text: string): number {
  const withoutParlati = removeParlati(text);
  // Rimuove anche spazi multipli e newline per il conteggio
  return withoutParlati.replace(/\s+/g, " ").trim().length;
}

/**
 * Valida il messaggio per anti-spam:
 * - Lunghezza minima: 1 carattere (dopo rimozione spazi)
 */
function validateMessage(text: string): { valid: boolean; error?: string } {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: "Messaggio vuoto" };
  }
  return { valid: true };
}

/**
 * Parsa un messaggio narrativo.
 * 
 * @param text Testo del messaggio
 * @returns Oggetto con testo formattato, caratteri netti, parlati e tag narrativi estratti
 */
export function parseNarrativeMessage(text: string): ParsedMessage {
  const validation = validateMessage(text);
  if (!validation.valid) {
    throw new Error(validation.error || "Messaggio non valido");
  }

  const parlati = extractParlati(text);
  const tagNarrativi = extractTagNarrativi(text);
  const netChars = calculateNetChars(text);
  const formatted = formatForDisplay(text);

  return {
    raw: text,
    formatted,
    netChars,
    parlati,
    tagNarrativi,
  };
}

/**
 * Calcola EXP guadagnato basato sui caratteri netti.
 * Formula: EXP = netChars / 10 (arrotondato per difetto).
 * Minimo: 1 EXP per messaggio valido.
 */
export function calculateExpFromNetChars(netChars: number): number {
  if (netChars <= 0) return 0;
  const exp = Math.floor(netChars / 10);
  return Math.max(1, exp); // Minimo 1 EXP per messaggio valido
}
