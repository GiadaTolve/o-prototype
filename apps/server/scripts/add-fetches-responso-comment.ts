/**
 * Aggiunge la colonna responso_comment alla tabella fetches per il commento Shinigami.
 * Esegui: cd apps/server && bun run scripts/add-fetches-responso-comment.ts
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(import.meta.dir, "../../.env") });

import { pool } from "../src/plugins/db";

async function main() {
  const check = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'fetches' AND column_name = 'responso_comment'
  `);
  if (check.rows.length > 0) {
    console.log("✅ Colonna responso_comment già presente.");
    return;
  }
  await pool.query(`
    ALTER TABLE fetches ADD COLUMN responso_comment TEXT
  `);
  console.log("✅ Colonna responso_comment aggiunta.");
}

main().catch(console.error).finally(() => process.exit(0));
