/** Categorie waza nel catalogo admin. Tsukime e premi: modulo futuro. */
export const WAZA_CATEGORIE = ["generica", "do", "madosho"] as const;
export type WazaCategoria = (typeof WAZA_CATEGORIE)[number];

/** Etichette UI per categoria (categoria `do` = sei Vie, non un genitore). */
export const WAZA_CATEGORIA_LABELS: Record<WazaCategoria, string> = {
  generica: "Generica",
  do: "Sei Vie (Dō)",
  madosho: "Madoshō",
};

/** Vocabolario DB: genitori ammessi per categoria `do` — una delle sei Vie. */
export const GENITORI_DO = [
  "Tōka-dō",
  "Genzai-dō",
  "Itō-dō",
  "Naikan-dō",
  "Hensei-dō",
  "Hadō-dō",
] as const;

/** Vocabolario DB: genitori ammessi per categoria `madosho` (scuole ereditarie). */
export const GENITORI_MADOSHO = [
  "Rin'gai",
  "Gōkaon",
  "Nakigara",
  "Hataori",
  "Ikiryō",
] as const;

export const VOCABOLARIO_GENITORE_BY_CATEGORIA: Record<
  Exclude<WazaCategoria, "generica">,
  "genitore_do" | "genitore_madosho"
> = {
  do: "genitore_do",
  madosho: "genitore_madosho",
};

export function isWazaCategoria(value: string): value is WazaCategoria {
  return (WAZA_CATEGORIE as readonly string[]).includes(value);
}
