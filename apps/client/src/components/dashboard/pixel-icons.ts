/**
 * Pixel-icon — specifica GAME_LAYOUT_SPEC §4.
 *
 * Icone 20×20 px che decorano il nome del possessore (ruoli, ordine, premio speciale).
 * Visibili ovunque sia visibile il nome (Mini-Profilo, Lista Presenti, Scheda, chat).
 * Asset in /pixel-icons/*.webp
 *
 * icon = normali icone UI (Font Awesome) per pulsanti/widget.
 */

export const PIXEL_ICON_SIZE = 20;
export const PIXEL_ICON_BASE = "/pixel-icons";

/** Ruolo: admin, moderatore, capo shinigami, shinigami */
export type PixelIconRuolo = "admin" | "moderatore" | "capo-shinigami" | "shinigami";

/** Ordine: mugen-tai, chisen-tai */
export type PixelIconOrdine = "mugen-tai" | "chisen-tai";

/** Premio speciale — da definire */
export type PixelIconPremio = string;

export type PixelIconSet = {
  ruolo?: PixelIconRuolo[];
  ordine?: PixelIconOrdine[];
  premioSpeciale?: PixelIconPremio[];
};

export const PIXEL_ICON_RUOLI: PixelIconRuolo[] = [
  "admin",
  "moderatore",
  "capo-shinigami",
  "shinigami",
];

export const PIXEL_ICON_ORDINI: PixelIconOrdine[] = ["mugen-tai", "chisen-tai"];

/** Mapping ruolo → file. Capo-shinigami usa shinigami (fino a asset dedicato). */
const RUOLO_TO_FILE: Record<PixelIconRuolo, string> = {
  admin: "proprietario",
  moderatore: "moderatore",
  "capo-shinigami": "shinigami",
  shinigami: "shinigami",
};

/** Restituisce il path per un ruolo. */
export function getPixelIconUrlRuolo(ruolo: PixelIconRuolo): string {
  const file = RUOLO_TO_FILE[ruolo] ?? "shinigami";
  return `${PIXEL_ICON_BASE}/${file}.webp`;
}

/** Restituisce il path per ordine (20×20 accanto al nome). */
export function getPixelIconUrlOrdine(ordine: PixelIconOrdine): string {
  return `${PIXEL_ICON_BASE}/${ordine}.png`;
}

/** Etichetta tooltip per premio speciale / milestone Jiga. */
export function labelForPremioPixelIcon(premioId: string): string {
  const labels: Record<string, string> = {
    keishosha: "Erede Madoshō",
    "kanpeki-keishosha": "Erede Perfetto",
    inkyo: "Eremita",
    "sentō-senshi": "Soldato Scelto",
    "sento-senshi": "Soldato Scelto",
    renkinjutsushi: "Alchimista",
    "daisei-renkin": "Opus Magna",
    "daisei-no-renkin": "Opus Magna",
  };
  return labels[premioId] ?? premioId;
}
