/**
 * Aggiunge waza_versioni.skiru_ir (slug Skiru ammissibili per l'IR al lancio).
 *
 * Esegui da apps/server:
 *   bun run add-waza-versioni-skiru-ir
 */
import postgres from "postgres";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(import.meta.dir, "../../../.env") });

const sql = postgres(process.env.DATABASE_URL!);

try {
  await sql.begin(async (tx) => {
    await tx`
      ALTER TABLE waza_versioni
      ADD COLUMN IF NOT EXISTS skiru_ir JSONB NOT NULL DEFAULT '[]'::jsonb
    `;
  });
  console.log("✓ Colonna waza_versioni.skiru_ir pronta (jsonb[], default []).");
} finally {
  await sql.end();
}
