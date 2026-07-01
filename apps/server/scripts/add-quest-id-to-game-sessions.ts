/**
 * Aggiunge quest_id a game_sessions per associare giocate alle quest (isMasterscreen corretto).
 * Esegui: cd apps/server && bun run scripts/add-quest-id-to-game-sessions.ts
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(import.meta.dir, "../../.env") });

import { pool } from "../src/plugins/db";

async function main() {
  await pool.query(`
    ALTER TABLE game_sessions
    ADD COLUMN IF NOT EXISTS quest_id UUID REFERENCES quests(id) ON DELETE SET NULL
  `);
  console.log("✅ Colonna quest_id aggiunta a game_sessions.");
}

main().catch(console.error).finally(() => process.exit(0));
