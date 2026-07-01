/**
 * Parsing Narrativo per chat play-by-chat (client-side).
 *
 * Formatta i messaggi per la visualizzazione:
 * - Parlati «...» e < ... > → evidenziati
 * - Tag v3: [waza:…], [cs:X], [tier:N], quarti [N/4], [Scudo], [IR:N]
 * - Tag consistenza/categoria §2.5: [Energetiche], [Propagazione Conica], …
 * - Tag status §2.4: [Ira], [Incendiato], [Emorragia], …
 * - Tag Tōrō §3.1: [toro], [Tōrō]
 * - Tag Gosa §3.2: [Gosa:N]
 * - Dadi: `/d 20`, `/dado 100` → risolti server-side; legacy `[dado:…]` ancora supportato
 */

import { getTierRow, isWazaTier } from '@domain/combat/tier'
import { formatWazaTagsInText } from '@domain/combat/waza-tag-preview'
import { WAZA_TAG_INDEX } from '@domain/combat/waza-tag-index'
import { formatWazaTaxonomyTagsInText } from '@domain/combat/waza-taxonomy'
import { formatStatusTagsInText } from '@domain/combat/status/formatting'
import { formatToroTagsInText } from '@domain/styles/toka/toro'
import { formatGosaTagsInText } from '@domain/styles/genzai/gosa'
import { formatActionStateTagsInText } from '@domain/combat/action-state-summary'

/** Segnaposto privato — protegge i parlati durante highlight e tag HTML. */
const PARL_SLOT = '\uE000'
const PARL_END = '\uE001'

/**
 * Escape caratteri speciali per regex.
 */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stashParlatoSlot(slots: string[], inner: string): string {
  const idx = slots.length
  slots.push(`<span class="parlato">«${inner}»</span>`)
  return `${PARL_SLOT}${idx}${PARL_END}`
}

/** Sostituisce parlati con segnaposto prima di qualsiasi markup HTML. */
function shieldDialogue(text: string): { text: string; slots: string[] } {
  const slots: string[] = []
  let out = text.replace(/«([^»]+)»/g, (_m, inner: string) => stashParlatoSlot(slots, inner))
  // < testo > con spazi (alternativa comune alle guillemets)
  out = out.replace(/<\s+([^>]+?)\s+>/g, (_m, inner: string) => stashParlatoSlot(slots, inner))
  return { text: out, slots }
}

function restoreDialogue(text: string, slots: string[]): string {
  return text.replace(/\uE000(\d+)\uE001/g, (_m, idx: string) => slots[Number(idx)] ?? _m)
}

/**
 * Formatta il testo per la visualizzazione.
 */
export function formatNarrativeText(
  text: string,
  highlightMyNames?: string[]
): string {
  let formatted = text;

  const anglePairs: [string, string][] = [
    ["\u00AB", "\u00BB"],
    ["\u2039", "\u203A"],
    ["\u3008", "\u3009"],
  ];
  for (const [L, R] of anglePairs) {
    const openMH = `${L}span class="my-name-highlight"${R}`;
    const openMH2 = `${L}span class='my-name-highlight'${R}`;
    const closeSpan = `${L}/span${R}`;
    const openParlato = `${L}span class="parlato"${R}`;
    for (const openTag of [openMH, openMH2]) {
      while (formatted.includes(openTag) && formatted.includes(closeSpan)) {
        const idx = formatted.indexOf(openTag);
        const end = formatted.indexOf(closeSpan, idx);
        if (end === -1) break;
        const content = formatted.slice(idx + openTag.length, end);
        formatted =
          formatted.slice(0, idx) +
          `<span class="my-name-highlight">${content}</span>` +
          formatted.slice(end + closeSpan.length);
      }
    }
    formatted = formatted.split(openParlato).join("");
    formatted = formatted.split(closeSpan).join("");
  }
  formatted = formatted.replace(/[\u00AB\u2039\u3008][^\u00BB\u203A\u3009]*span[^\u00BB\u203A\u3009]*[\u00BB\u203A\u3009]/g, "");

  const dialogue = shieldDialogue(formatted);
  formatted = dialogue.text;

  // Tag specifici v3 (prima del catch-all generico)
  formatted = formatted.replace(
    /\[tier:([1-5])\]/gi,
    (_m, tierStr: string) => {
      const n = Number(tierStr)
      if (!isWazaTier(n)) return _m
      const row = getTierRow(n)
      return `<span class="tier-tag" title="Tier §2.10 — ${row.value} danno base · ${row.csCost} CS">${tierStr} · ${row.value} dmg · ${row.csCost} CS</span>`
    }
  )
  formatted = formatted.replace(
    /\[waza:([^\]]+)\]/gi,
    (_m, rawName: string) => {
      const one = formatWazaTagsInText(`[waza:${rawName}]`, WAZA_TAG_INDEX)
      return one
    },
  );
  formatted = formatted.replace(
    /\[cs:(\d+)\]/gi,
    '<span class="cs-tag" title="Chrono Stack">$1 cs</span>'
  );
  formatted = formatted.replace(
    /\[tenkan(?:[^\]]*)?\]/gi,
    (match) => {
      if (/off/i.test(match)) {
        return '<span class="tenkan-tag tenkan-tag--off" title="Tenkan OFF">Corona chiusa</span>'
      }
      return '<span class="tenkan-tag" title="Tenkan ON — accumulo CS">Corona</span>'
    },
  );
  formatted = formatted.replace(
    /\[(\d+)\s*cs\]/gi,
    '<span class="cs-tag" title="Chrono Stack">$1 cs</span>'
  );
  formatted = formatted.replace(
    /\[([1-4])\/4\]/gi,
    '<span class="quarter-tag" title="Quarto turno (4/4)">[$1/4]</span>'
  );
  formatted = formatted.replace(
    /\[scudo\]/gi,
    '<span class="shield-tag" title="Scudo attivo">Scudo</span>'
  );
  formatted = formatted.replace(
    /\[ir:(\d+)\]/gi,
    '<span class="ir-tag" title="Indice di Riuscita (hint read-only)">IR $1</span>'
  );
  formatted = formatted.replace(
    /\[dado:([^\]]+)\]/gi,
    '<span class="dice-tag" title="Dado legacy [dado:…]">🎲 $1</span>'
  );
  formatted = formatted.replace(
    /\[🎲 ([^\]]+)\]/g,
    '<span class="dice-tag" title="Risultato dado">🎲 $1</span>'
  );

  formatted = formatStatusTagsInText(formatted);
  formatted = formatWazaTaxonomyTagsInText(formatted);
  formatted = formatToroTagsInText(formatted);
  formatted = formatGosaTagsInText(formatted);
  formatted = formatActionStateTagsInText(formatted);

  formatted = restoreDialogue(formatted, dialogue.slots);

  if (highlightMyNames && highlightMyNames.length > 0) {
    const names = [...highlightMyNames].filter(Boolean).sort((a, b) => (b?.length ?? 0) - (a?.length ?? 0));
    for (const name of names) {
      if (!name.trim()) continue;
      const escaped = escapeRegex(name.trim());
      const re = new RegExp(`\\b(${escaped})\\b`, "gi");
      formatted = formatted.replace(re, '<span class="my-name-highlight">$1</span>');
    }
  }

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
  const anglePattern = /<\s+([^>]+?)\s+>/g;
  while ((match = anglePattern.exec(text)) !== null) {
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
  const withoutParlati = text
    .replace(/«[^»]+»/g, "")
    .replace(/<\s+[^>]+?\s+>/g, "")
    .trim();
  return withoutParlati.replace(/\s+/g, " ").length;
}
