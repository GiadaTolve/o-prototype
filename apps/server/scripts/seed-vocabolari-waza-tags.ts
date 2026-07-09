/**
 * Popola vocabolari per tag waza (forme canoniche dal manuale ufficiale).
 *
 * Categorie:
 *   - consistenza — 7 valori
 *   - categoria   — 10 tipologie (tag bracket)
 *
 * Esegui da apps/server (idempotente, ON CONFLICT aggiorna attivo=TRUE):
 *   bun run seed-vocabolari-waza-tags
 *
 * Neon (senza toccare .env locale):
 *   DATABASE_URL="$NEON_DATABASE_URL" bun run seed-vocabolari-waza-tags
 */
import postgres from "postgres";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(import.meta.dir, "../../../.env") });

/** Maiuscole e forma esatte dal manuale — non uniformare. */
export const VOCAB_CONSISTENZE = [
  "Sonoro",
  "Elementale",
  "Liquido",
  "Gassoso",
  "Solido",
  "Energetiche",
  "Nessuna",
] as const;

/** Tipologie waza (tag di categoria) — 10 valori, Irraggiamento escluso. */
export const VOCAB_CATEGORIE_WAZA = [
  "Raggio",
  "Proiettile",
  "Propagazione Conica",
  "Propagazione",
  "Emanazione",
  "Emanazione a Distanza",
  "Contatto",
  "Potenziamento",
  "Costrutti",
  "Scudo",
] as const;

const SEED_ROWS: ReadonlyArray<{ categoria: string; valore: string }> = [
  ...VOCAB_CONSISTENZE.map((valore) => ({ categoria: "consistenza", valore })),
  ...VOCAB_CATEGORIE_WAZA.map((valore) => ({ categoria: "categoria", valore })),
];

const sql = postgres(process.env.DATABASE_URL!);

try {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL mancante.");
  }

  let count = 0;
  await sql.begin(async (tx) => {
    for (const row of SEED_ROWS) {
      await tx`
        INSERT INTO vocabolari (categoria, valore, attivo)
        VALUES (${row.categoria}, ${row.valore}, TRUE)
        ON CONFLICT (categoria, valore) DO UPDATE
        SET attivo = TRUE
      `;
      count += 1;
    }
  });

  console.log("✓ Vocabolario waza tag seedato:");
  console.log(`  consistenza: ${VOCAB_CONSISTENZE.length} voci`);
  for (const v of VOCAB_CONSISTENZE) console.log(`    · ${v}`);
  console.log(`  categoria: ${VOCAB_CATEGORIE_WAZA.length} voci`);
  for (const v of VOCAB_CATEGORIE_WAZA) console.log(`    · ${v}`);
  console.log(`  Totale righe upsert: ${count}`);
} finally {
  await sql.end();
}
