export type CondizioneSoggettoId =
  | "toro.batteria"
  | "toro.lanciata"
  | "stack(status)"
  | "grado_pg"
  | "cs_correnti"
  | "hp_pct";

export type CondizioneSoggettoTipo = "bool" | "enum" | "number";

export type CondizioneSoggetto = {
  id: CondizioneSoggettoId;
  label: string;
  tipo: CondizioneSoggettoTipo;
};

export const CONDIZIONE_SOGGETTI: CondizioneSoggetto[] = [
  { id: "toro.batteria", label: "Tōrō — Batteria", tipo: "bool" },
  { id: "toro.lanciata", label: "Lanciata dal Tōrō", tipo: "bool" },
  { id: "stack(status)", label: "Stack di uno status", tipo: "number" },
  { id: "grado_pg", label: "Grado del PG", tipo: "enum" },
  { id: "cs_correnti", label: "CS correnti", tipo: "number" },
  { id: "hp_pct", label: "HP residui (%)", tipo: "number" },
];

export const CONDIZIONE_OPERATORI_BOOL = ["=="] as const;
export const CONDIZIONE_OPERATORI_NUM = ["==", "!=", ">=", "<=", ">", "<"] as const;
export const CONDIZIONE_OPERATORI_ENUM = ["==", "!="] as const;

export const CONDIZIONE_GRADI = [
  "Nemuribito",
  "Hakyō",
  "Bunsekikan",
  "Sentatsu Bunsekikan",
  "Kanteikan",
  "Shin'enkan",
  "Akumu Zankyō",
] as const;

export const CONDIZIONE_VALORI_BOOL = ["true", "false"] as const;

export const CONDIZIONE_VALORI_NUMERICI = [
  "0",
  "1",
  "2",
  "3",
  "5",
  "10",
  "25",
  "50",
  "75",
  "100",
] as const;

export function operatoriPerSoggetto(soggetto: CondizioneSoggetto): readonly string[] {
  if (soggetto.tipo === "bool") return CONDIZIONE_OPERATORI_BOOL;
  if (soggetto.tipo === "enum") return CONDIZIONE_OPERATORI_ENUM;
  return CONDIZIONE_OPERATORI_NUM;
}

export function valoriPerSoggetto(soggetto: CondizioneSoggetto): readonly string[] {
  if (soggetto.tipo === "bool") return CONDIZIONE_VALORI_BOOL;
  if (soggetto.id === "grado_pg") return CONDIZIONE_GRADI;
  return CONDIZIONE_VALORI_NUMERICI;
}

export function buildCondizioneCanonica(
  soggettoId: CondizioneSoggettoId,
  operatore: string,
  valore: string,
  statusNome?: string,
): string {
  if (!soggettoId || !operatore || !valore) return "";
  if (soggettoId === "stack(status)" && statusNome?.trim()) {
    return `stack(${statusNome.trim()}) ${operatore} ${valore}`;
  }
  return `${soggettoId} ${operatore} ${valore}`;
}

export function parseCondizioneCanonica(raw: string | undefined): {
  soggettoId: CondizioneSoggettoId | "";
  operatore: string;
  valore: string;
  statusNome: string;
} {
  const empty = { soggettoId: "" as const, operatore: "", valore: "", statusNome: "" };
  if (!raw?.trim()) return empty;

  const stackMatch = raw.match(/^stack\(([^)]+)\)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
  if (stackMatch) {
    return {
      soggettoId: "stack(status)",
      operatore: stackMatch[2],
      valore: stackMatch[3].trim(),
      statusNome: stackMatch[1].trim(),
    };
  }

  const match = raw.match(/^(\S+)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
  if (!match) return empty;

  const soggettoId = CONDIZIONE_SOGGETTI.find((s) => s.id === match[1])?.id ?? "";
  return {
    soggettoId,
    operatore: match[2],
    valore: match[3].trim(),
    statusNome: "",
  };
}
