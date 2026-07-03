/**
 * Pixel-icon — specifica GAME_LAYOUT_SPEC.
 *
 * Icone 20×20 px che decorano il nome del possessore (ruoli, ordine, premio speciale).
 * Visibili ovunque sia visibile il nome (Mini-Profilo, Lista Presenti, Scheda, chat).
 * Asset in /pixel-icons/*.webp
 *
 * icon = normali icone UI (Font Awesome) per pulsanti/widget.
 */

export const PIXEL_ICON_SIZE = 20;
export const PIXEL_ICON_BASE = "/pixel-icons";

/** Ruolo staff: admin, moderatore, fixer (dev), capo shinigami, shinigami */
export type PixelIconRuolo = "admin" | "moderatore" | "fixer" | "capo-shinigami" | "shinigami";

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
  "fixer",
  "capo-shinigami",
  "shinigami",
];

/** Pannelli sbloccati dalla pixel-icon ruolo (icona staff === ruolo). */
export const STAFF_ROLE_ACCESS_HINT: Record<PixelIconRuolo, string> = {
  admin: "Tutto",
  moderatore: "Tutto (no modifica ruoli)",
  fixer: "Sviluppo",
  "capo-shinigami": "Shinigami + comandi master",
  shinigami: "Shinigami + comandi master",
};

export function descriptionForRuoloPixelIcon(ruolo: PixelIconRuolo): string {
  return STAFF_ROLE_ACCESS_HINT[ruolo];
}

export function optionLabelForRuoloPixelIcon(ruolo: PixelIconRuolo): string {
  return labelForRuoloPixelIcon(ruolo);
}

export const PIXEL_ICON_ORDINI: PixelIconOrdine[] = ["mugen-tai", "chisen-tai"];

/** Mapping ruolo → file. Capo-shinigami usa shinigami (fino a asset dedicato). */
const RUOLO_TO_FILE: Record<PixelIconRuolo, string> = {
  admin: "proprietario",
  moderatore: "moderatore",
  fixer: "fixer",
  "capo-shinigami": "shinigami",
  shinigami: "shinigami",
};

/** Etichetta tooltip per pixel-icon ruolo. */
export function labelForRuoloPixelIcon(ruolo: PixelIconRuolo): string {
  const labels: Record<PixelIconRuolo, string> = {
    admin: "Proprietario",
    moderatore: "Moderatore",
    fixer: "Fixer",
    "capo-shinigami": "Capo Shinigami",
    shinigami: "Shinigami",
  };
  return labels[ruolo];
}

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
