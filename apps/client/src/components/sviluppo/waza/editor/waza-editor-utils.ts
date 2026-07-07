import type { EffettiSchemaError } from "../../../../../../../schemas/effetti-validator";

export type ValidationIssue = {
  codice?: string;
  messaggio: string;
  percorso?: string;
};

const FIELD_LABELS: Record<string, string> = {
  trigger: "trigger",
  bersaglio: "bersaglio",
  durata: "durata",
  valore: "valore",
  consistenza: "consistenza",
  area: "area",
  status: "status",
  stack: "stack",
  skiru: "skiru",
  testo: "testo",
  taglia: "taglia",
  comportamento: "comportamento",
  resistenza: "resistenza",
  danno: "danno",
  tempo_quarti: "tempo in quarti",
  cs: "CS",
  tier: "tier",
};

const AJV_KEYWORD_IT: Record<string, string> = {
  required: "campo obbligatorio mancante",
  enum: "valore non ammesso",
  const: "valore non valido",
  minimum: "valore troppo basso",
  exclusiveMinimum: "valore troppo basso",
  type: "tipo non valido",
  additionalProperties: "proprietà non consentita",
  oneOf: "struttura non valida per il tipo scelto",
};

export function bloccoIndexFromPath(percorso?: string): number | null {
  if (!percorso) return null;
  const m = percorso.match(/effetti\[(\d+)\]/);
  if (m) return Number(m[1]);
  const m2 = percorso.match(/^\/(\d+)/);
  if (m2) return Number(m2[1]);
  return null;
}

export function formatFieldPath(path: string): string {
  return path
    .replace(/^\//, "")
    .replace(/\//g, " → ")
    .replace(/(\d+)/g, (_, n) => `blocco ${Number(n) + 1}`);
}

export function translateAjvError(error: EffettiSchemaError, bloccoOffset = 0): ValidationIssue {
  const path = error.instancePath || "";
  const bloccoIdx = path.match(/^\/(\d+)/);
  const bloccoNum =
    bloccoIdx != null ? Number(bloccoIdx[1]) + 1 + bloccoOffset : bloccoOffset + 1;
  const field = path.split("/").filter(Boolean).slice(1).join(" → ");
  const fieldLabel = FIELD_LABELS[field.split(" → ").pop() ?? ""] ?? field;
  const keyword = AJV_KEYWORD_IT[error.keyword] ?? error.keyword;
  const detail = error.message ?? keyword;

  let messaggio = detail;
  if (error.keyword === "required" && error.params?.missingProperty) {
    const missing = String(error.params.missingProperty);
    messaggio = `manca il campo «${FIELD_LABELS[missing] ?? missing}»`;
  }

  return {
    codice: "SCHEMA_EFFETTI",
    messaggio: `Blocco ${bloccoNum} — ${fieldLabel || "effetto"}: ${messaggio}`,
    percorso: path ? `effetti[${bloccoNum - 1}]${field ? `.${field.replace(/ → /g, ".")}` : ""}` : undefined,
  };
}

export function translateValidationIssues(
  errori: Array<EffettiSchemaError | ValidationIssue>,
): ValidationIssue[] {
  return errori.map((e) =>
    "keyword" in e ? translateAjvError(e) : { codice: e.codice, messaggio: e.messaggio, percorso: e.percorso },
  );
}

export function extractApiErrorBody(err: unknown): {
  message: string;
  errori: ValidationIssue[];
  avvisi: ValidationIssue[];
} {
  if (err && typeof err === "object") {
    const o = err as Record<string, unknown>;
    const errori = Array.isArray(o.errori) ? (o.errori as ValidationIssue[]) : [];
    const avvisi = Array.isArray(o.avvisi) ? (o.avvisi as ValidationIssue[]) : [];
    const message =
      typeof o.message === "string"
        ? o.message
        : typeof o.error === "string"
          ? o.error
          : err instanceof Error
            ? err.message
            : "Errore sconosciuto";
    return { message, errori, avvisi };
  }
  return {
    message: err instanceof Error ? err.message : "Errore sconosciuto",
    errori: [],
    avvisi: [],
  };
}
