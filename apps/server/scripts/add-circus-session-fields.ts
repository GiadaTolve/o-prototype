/**
 * Aggiunge session_title a anonymous_room_state e session_type a game_sessions.
 * Esegui: bun run scripts/add-circus-session-fields.ts
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(import.meta.dir, "../.env") });

import { pool } from "../src/plugins/db";

async function main() {
  await pool.query(`
    ALTER TABLE anonymous_room_state
    ADD COLUMN IF NOT EXISTS session_title TEXT
  `);
  await pool.query(`
    ALTER TABLE game_sessions
    ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'STANDARD'
  `);
  console.log("✅ Colonne Circus session create/verificate.");
}

main().catch(console.error).finally(() => process.exit(0));
