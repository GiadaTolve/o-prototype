/**
 * Crea la tabella system_notifications per messaggi di sistema (es. responso Fetch).
 * Esegui: cd apps/server && bun run scripts/add-system-notifications.ts
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(import.meta.dir, "../../.env") });

import { pool } from "../src/plugins/db";

async function main() {
  const check = await pool.query(`
    SELECT table_name FROM information_schema.tables WHERE table_name = 'system_notifications'
  `);
  if (check.rows.length > 0) {
    console.log("✅ Tabella system_notifications già presente.");
    return;
  }
  await pool.query(`
    CREATE TABLE system_notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT,
      content TEXT,
      read_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  console.log("✅ Tabella system_notifications creata.");
}

main().catch(console.error).finally(() => process.exit(0));
