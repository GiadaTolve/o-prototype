import { and, eq } from "drizzle-orm";
import { db } from "../../plugins/db";
import { vocabolari } from "../../db/schema";
import type { WazaValidationIssue } from "./waza-admin-derive";

/** Normalizza slug Skiru: trim, lowercase, deduplica, ordine alfabetico. */
export function normalizeSkiruIr(input: string[] | undefined | null): string[] {
  if (!input || !Array.isArray(input)) return [];
  const unique = new Set<string>();
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    const slug = raw.trim().toLowerCase();
    if (slug) unique.add(slug);
  }
  return [...unique].sort((a, b) => a.localeCompare(b));
}

let cachedSkiruSlugs: Set<string> | null = null;

export async function loadActiveSkiruSlugs(): Promise<Set<string>> {
  if (cachedSkiruSlugs) return cachedSkiruSlugs;
  const rows = await db.query.vocabolari.findMany({
    where: and(eq(vocabolari.categoria, "skiru"), eq(vocabolari.attivo, true)),
    columns: { valore: true },
  });
  cachedSkiruSlugs = new Set(rows.map((row) => row.valore.toLowerCase()));
  return cachedSkiruSlugs;
}

/** Invalida la cache (utile nei test). */
export function resetSkiruVocabCache(): void {
  cachedSkiruSlugs = null;
}

export function validateSkiruIrSlugs(
  skiruIr: string[],
  allowed: Set<string>,
): WazaValidationIssue[] {
  const errori: WazaValidationIssue[] = [];
  for (const slug of skiruIr) {
    if (!allowed.has(slug.toLowerCase())) {
      errori.push({
        codice: "SKIRU_IR_NON_VALIDA",
        messaggio: `Skiru «${slug}» non presente nel vocabolario attivo.`,
        percorso: "skiruIr",
      });
    }
  }
  return errori;
}

/** Avviso (non errore): waza attiva senza Skiru papabili per l'IR. */
export function warnAttivaSenzaSkiruIr(
  tipo: "passiva" | "attiva",
  skiruIr: string[],
): WazaValidationIssue[] {
  if (tipo === "attiva" && skiruIr.length === 0) {
    return [
      {
        codice: "SKIRU_IR_MANCANTE",
        messaggio:
          "Waza attiva senza Skiru papabili per l'IR: indica almeno una Skiru ammissibile al lancio.",
        percorso: "skiruIr",
      },
    ];
  }
  return [];
}
