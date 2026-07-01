/**
 * Aggiunge is_masterscreen a zone_messages per mantenere formattazione Shinigami dopo chiusura quest.
 * Esegui: cd apps/server && bun run scripts/add-is-masterscreen-to-zone-messages.ts
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(import.meta.dir, "../../.env") });

import { pool } from "../src/plugins/db";

async function main() {
  await pool.query(`
    ALTER TABLE zone_messages
    ADD COLUMN IF NOT EXISTS is_masterscreen BOOLEAN NOT NULL DEFAULT false
  `);
  console.log("✅ Colonna is_masterscreen aggiunta a zone_messages.");
}

main().catch(console.error).finally(() => process.exit(0));
