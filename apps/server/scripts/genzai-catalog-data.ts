/**
 * Sorgente canonica Genzai-dō — testi e meccaniche da genzai-waza-pool (manuale Oyasumi).
 */
import { GENZAI_ACTIVES } from "./genzai-catalog-actives";
import { GENZAI_AVANZATE } from "./genzai-catalog-avanzate";
import { GENZAI_PASSIVES } from "./genzai-catalog-passives";
import type { GenzaiCatalogEntry } from "./genzai-catalog-types";

export type { GenzaiCatalogEntry } from "./genzai-catalog-types";

function desc(kind: "passiva" | "attiva", flavor: string, meccanica: string): string {
  const header =
    kind === "passiva"
      ? "[Genzai-dō · Passiva lignaggio]"
      : "[Genzai-dō · Waza attiva lignaggio]";
  return `${header}\n\n${flavor}\n\n${meccanica}`;
}

export const GENZAI_CATALOG: GenzaiCatalogEntry[] = [
  ...GENZAI_PASSIVES,
  ...GENZAI_ACTIVES,
  ...GENZAI_AVANZATE,
];

export function genzaiDescrizione(entry: GenzaiCatalogEntry): string {
  const kind = entry.cs != null && entry.cs > 0 ? "attiva" : "passiva";
  return desc(kind, entry.flavor, entry.meccanica);
}

export function allGenzaiImplementazioneNotes(): string[] {
  const notes: string[] = [];
  for (const e of GENZAI_CATALOG) {
    for (const n of e.implementazioneNote ?? []) {
      if (!notes.includes(n)) notes.push(n);
    }
  }
  return notes;
}
