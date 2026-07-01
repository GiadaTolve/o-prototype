/**
 * Parsing Narrativo per chat play-by-chat.
 *
 * Regole:
 * - Parlato: « ... » → formattato in UI
 * - Tag v3 combat + consistenza/categoria §2.5
 * - Tag narrativi residui: [ ... ] → formattato in UI
 * - EXP: 1 ogni 500 caratteri totali mandati (compreso parlato e tag)
 */
import { getTierRow, isWazaTier } from '@domain/combat/tier'
import { formatWazaTagsInText } from '@domain/combat/waza-tag-preview'
import { WAZA_TAG_INDEX } from '@domain/combat/waza-tag-index'
import { formatWazaTaxonomyTagsInText } from '@domain/combat/waza-taxonomy'
import { formatStatusTagsInText } from '@domain/combat/status/formatting'
import { formatToroTagsInText } from '@domain/styles/toka/toro'
import { formatGosaTagsInText } from '@domain/styles/genzai/gosa'
import { formatActionStateTagsInText } from '@domain/combat/action-state-summary'

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
 * - Tag v3 combat + consistenza/categoria §2.5
 * - Parlati «...» → <span class="parlato">...</span>
 * - Tag narrativi residui [ ... ] → <span class="tag-narrativo">[...]</span>
 */
function formatForDisplay(text: string): string {
  let formatted = text;

  formatted = formatted.replace(
    /\[tier:([1-5])\]/gi,
    (_m, tierStr: string) => {
      const n = Number(tierStr)
      if (!isWazaTier(n)) return _m
      const row = getTierRow(n)
      return `<span class="tier-tag" title="Tier §2.10 — ${row.value} danno · ${row.csCost} CS">${tierStr}</span>`
    },
  )
  formatted = formatted.replace(/\[waza:([^\]]+)\]/gi, (_m, rawName: string) =>
    formatWazaTagsInText(`[waza:${rawName}]`, WAZA_TAG_INDEX),
  )
  formatted = formatted.replace(/\[cs:(\d+)\]/gi, '<span class="cs-tag">$1 cs</span>')
  formatted = formatted.replace(/\[tenkan(?:[^\]]*)?\]/gi, (match) => {
    if (/off/i.test(match)) {
      return '<span class="tenkan-tag tenkan-tag--off" title="Tenkan OFF">Corona chiusa</span>'
    }
    return '<span class="tenkan-tag" title="Tenkan ON — accumulo CS">Corona</span>'
  })
  formatted = formatted.replace(/\[([1-4])\/4\]/gi, '<span class="quarter-tag">[$1/4]</span>')
  formatted = formatted.replace(/\[scudo\]/gi, '<span class="shield-tag">Scudo</span>')
  formatted = formatted.replace(/\[ir:(\d+)\]/gi, '<span class="ir-tag">IR $1</span>')

  formatted = formatStatusTagsInText(formatted)
  formatted = formatWazaTaxonomyTagsInText(formatted)
  formatted = formatToroTagsInText(formatted)
  formatted = formatGosaTagsInText(formatted)
  formatted = formatActionStateTagsInText(formatted)

  formatted = formatted.replace(/«([^»]+)»/g, '<span class="parlato">«$1»</span>');
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

/** Caratteri per 1 EXP in chat (caratteri totali del messaggio). */
export const CHAT_EXP_CHARS_PER_POINT = 500;

/**
 * EXP guadagnato da un messaggio chat: floor(totalChars / 500).
 * Sotto 500 caratteri → 0 EXP (1 azione quest resta >500 totali, v. getActionsPerCharacter).
 */
export function calculateExpFromTotalChars(totalChars: number): number {
  if (totalChars <= 0) return 0;
  return Math.floor(totalChars / CHAT_EXP_CHARS_PER_POINT);
}

/** @deprecated Usare calculateExpFromTotalChars (EXP su caratteri totali, non netti). */
export function calculateExpFromNetChars(netChars: number): number {
  return calculateExpFromTotalChars(netChars);
}
