/**
 * Converte le colonne delle statistiche (strength, constitution, etc.) in integer.
 * Gestisce colonne attualmente jsonb (estrazione da scalare/oggetto) o text/numeric.
 *
 * Esegui:  cd apps/server && bun run fix-stats-column-types
 * Poi:     bun run db:push
 *
 * Richiede: Postgres avviato, DATABASE_URL in .env.
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "../../.env") });

const STAT_COLUMNS = ["strength", "constitution", "dexterity", "mind", "empathy"] as const;
const STAT_KEYS: Record<(typeof STAT_COLUMNS)[number], string> = {
  strength: "f",
  constitution: "c",
  dexterity: "d",
  mind: "m",
  empathy: "e",
};

/** Usa to_jsonb(col): accetta integer e jsonb, restituisce sempre jsonb. Niente subquery (USING non le permette). */
function usingExpr(col: (typeof STAT_COLUMNS)[number]): string {
  const k = STAT_KEYS[col];
  const j = `to_jsonb(${col})`;
  return `CASE
  WHEN ${j} IS NULL OR jsonb_typeof(${j}) = 'null' THEN 0
  WHEN jsonb_typeof(${j}) = 'number' THEN (${j} #>> '{}')::integer
  WHEN jsonb_typeof(${j}) = 'object' THEN COALESCE((${j}->>'value')::integer, (${j}->>'${k}')::integer, 0)
  WHEN jsonb_typeof(${j}) = 'string' AND (${j} #>> '{}') ~ '^-?[0-9]+$' THEN (${j} #>> '{}')::integer
  ELSE 0
END`;
}

async function main() {
  const { pool } = await import("../src/plugins/db");
  const client = await pool.connect();

  try {
    for (const col of STAT_COLUMNS) {
      await client.query("BEGIN");

      try {
        await client.query(`ALTER TABLE characters ALTER COLUMN ${col} DROP DEFAULT`);
      } catch {
        /* nessun default */
      }

      try {
        await client.query(
          `ALTER TABLE characters ALTER COLUMN ${col} TYPE integer USING (${usingExpr(col)})`
        );
      } catch (e: unknown) {
        await client.query("ROLLBACK");
        throw e;
      }

      await client.query(`ALTER TABLE characters ALTER COLUMN ${col} SET DEFAULT 0`);
      await client.query("COMMIT");
      console.log(`✅ ${col} → integer`);
    }
  } finally {
    client.release();
    await pool.end();
  }

  console.log("✅ Fix colonne statistiche completato. Ora esegui: bun run db:push");
  process.exit(0);
}

main().catch((e) => {
  console.error("Errore:", e);
  process.exit(1);
});
