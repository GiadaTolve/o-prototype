/**
 * Popola vocabolari per tag waza — forma bracket (es. [Energetica], [Raggio]).
 * Non usare le forme-indice del manuale (es. «Energetiche», «Costrutti»).
 *
 * Categorie DB:
 *   - consistenza — 7 valori
 *   - categoria   — 10 tipologie (alias concettuale: tipologia)
 *
 * Esegui da apps/server (idempotente, ON CONFLICT aggiorna attivo=TRUE):
 *   bun run seed-vocabolari-waza-tags
 *
 * Neon / produzione (stesso percorso degli altri seed vocabolari):
 *   cd apps/server
 *   DATABASE_URL="$NEON_DATABASE_URL" bun run seed-vocabolari-waza-tags
 */
import postgres from "postgres";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(import.meta.dir, "../../../.env") });

/** Forma bracket — maiuscole e singolare come nelle waza. */
export const VOCAB_CONSISTENZE = [
  "Energetica",
  "Elementale",
  "Liquido",
  "Gassosa",
  "Solido",
  "Sonoro",
  "Nessuna",
] as const;

/** Tipologie waza (tag categoria) — 10 valori, forma bracket. */
export const VOCAB_CATEGORIE_WAZA = [
  "Raggio",
  "Proiettile",
  "Propagazione Conica",
  "Propagazione",
  "Emanazione",
  "Emanazione a Distanza",
  "Contatto",
  "Potenziamento",
  "Costrutto",
  "Scudo",
] as const;

/** Valori obsoleti da disattivare se presenti da seed precedenti. */
const LEGACY_VALORI_DISATTIVARE: ReadonlyArray<{ categoria: string; valore: string }> = [
  { categoria: "consistenza", valore: "Energetiche" },
  { categoria: "consistenza", valore: "Gassoso" },
  { categoria: "categoria", valore: "Costrutti" },
  { categoria: "categoria", valore: "Irraggiamento" },
  { categoria: "categoria", valore: "Setup" },
  { categoria: "consistenza", valore: "Nulla" },
];

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
  let deactivated = 0;
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

    for (const legacy of LEGACY_VALORI_DISATTIVARE) {
      const updated = await tx`
        UPDATE vocabolari
        SET attivo = FALSE
        WHERE categoria = ${legacy.categoria}
          AND valore = ${legacy.valore}
          AND attivo = TRUE
        RETURNING valore
      `;
      deactivated += updated.length;
    }
  });

  console.log("✓ Vocabolario waza tag seedato (forma bracket):");
  console.log(`  consistenza: ${VOCAB_CONSISTENZE.length} voci`);
  for (const v of VOCAB_CONSISTENZE) console.log(`    · [${v}]`);
  console.log(`  categoria: ${VOCAB_CATEGORIE_WAZA.length} voci`);
  for (const v of VOCAB_CATEGORIE_WAZA) console.log(`    · [${v}]`);
  console.log(`  Totale righe upsert: ${count}`);
  if (deactivated > 0) {
    console.log(`  Voci legacy disattivate: ${deactivated}`);
  }
} finally {
  await sql.end();
}
