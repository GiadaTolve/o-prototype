/**
 * Aggiunge waza.legacy_id (FK opzionale verso skills.id) per tracciabilità sync legacy.
 *
 * Esegui da apps/server PRIMA del primo sync:
 *   bun run add-waza-legacy-id
 */
import postgres from "postgres";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(import.meta.dir, "../../../.env") });

const sql = postgres(process.env.DATABASE_URL!);

try {
  await sql.begin(async (tx) => {
    await tx`
      ALTER TABLE waza
      ADD COLUMN IF NOT EXISTS legacy_id UUID REFERENCES skills(id) ON DELETE SET NULL
    `;
    await tx`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_waza_legacy_id_unique
      ON waza(legacy_id)
      WHERE legacy_id IS NOT NULL
    `;
  });
  console.log("✓ Colonna waza.legacy_id pronta (nullable, UNIQUE).");
} finally {
  await sql.end();
}
