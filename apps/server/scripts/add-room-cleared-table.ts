/**
 * Aggiunge la tabella room_cleared per la funzionalità "Pulisci chat".
 * Esegui: bun run scripts/add-room-cleared-table.ts
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(import.meta.dir, "../../.env") });

import { pool } from "../src/plugins/db";

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS room_cleared (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      room_id TEXT NOT NULL UNIQUE,
      cleared_at TIMESTAMP NOT NULL DEFAULT NOW(),
      cleared_by_id UUID REFERENCES characters(id) ON DELETE SET NULL
    )
  `);
  console.log("✅ Tabella room_cleared creata/verificata.");
}

main().catch(console.error).finally(() => process.exit(0));
