export type WazaCategoria = "generica" | "do" | "madosho";

export const WAZA_CATEGORIA_LABELS: Record<WazaCategoria, string> = {
  generica: "Generica",
  do: "Sei Vie",
  madosho: "Madoshō",
};

export const WAZA_ATOMI_FILTRO = [
  "DANNO",
  "MOD_DANNO",
  "BUFF_SKIRU",
  "APPLICA_STATUS",
  "EVOCA_COSTRUTTO",
  "MANUALE",
] as const;

export const WAZA_STATO_CODIFICA_META = {
  da_codificare: { emoji: "⚪", label: "Da codificare" },
  automatica: { emoji: "🟢", label: "Automatica" },
  ibrida: { emoji: "🟡", label: "Ibrida" },
  manuale: { emoji: "🔴", label: "Manuale" },
} as const;

export const WAZA_VERSIONE_STATO_LABELS: Record<string, string> = {
  bozza: "Bozza",
  validata: "Validata",
  pubblicata: "Pubblicata",
  superata: "Superata",
};

export function vocabolarioGenitoreKey(categoria: WazaCategoria): string | null {
  if (categoria === "do") return "genitore_do";
  if (categoria === "madosho") return "genitore_madosho";
  return null;
}
