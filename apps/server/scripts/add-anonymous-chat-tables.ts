/**
 * Crea le tabelle per la chat anonima (Paradise).
 * Esegui: bun run scripts/add-anonymous-chat-tables.ts
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(import.meta.dir, "../.env") });

import { pool } from "../src/plugins/db";

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS anonymous_room_state (
      room_id TEXT PRIMARY KEY,
      is_open BOOLEAN NOT NULL DEFAULT false,
      opened_by_id UUID REFERENCES characters(id) ON DELETE SET NULL,
      opened_at TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS anonymous_participants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      room_id TEXT NOT NULL,
      character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
      animal_name TEXT NOT NULL,
      color TEXT NOT NULL,
      joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(room_id, character_id)
    )
  `);
  // Aggiungi colonne a zone_messages per display anonimo (se non esistono)
  for (const col of ["anonymous_animal_name", "anonymous_color"]) {
    try {
      await pool.query(`ALTER TABLE zone_messages ADD COLUMN IF NOT EXISTS ${col} TEXT`);
    } catch (e) {
      console.warn(`Colonna ${col} potrebbe già esistere:`, (e as Error).message);
    }
  }
  console.log("✅ Tabelle chat anonima create/verificate.");
}

main().catch(console.error).finally(() => process.exit(0));
