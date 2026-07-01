/**
 * Tabella character_player_requests (Madoshō / Ordine / Premi).
 * Esegui: bun run scripts/add-character-player-requests-table.ts
 */
import postgres from 'postgres'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(import.meta.dir, '../../../.env') })

const sql = postgres(process.env.DATABASE_URL!)

try {
  await sql`
    CREATE TABLE IF NOT EXISTS character_player_requests (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
      kind text NOT NULL CHECK (kind IN ('MADOSHO', 'ORDER', 'PREMIO')),
      requested_value text NOT NULL,
      status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
      staff_note text,
      reviewed_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
      reviewed_at timestamp,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now(),
      UNIQUE (character_id, kind)
    )
  `
  await sql`
    CREATE INDEX IF NOT EXISTS character_player_requests_status_idx
    ON character_player_requests (status, updated_at DESC)
  `
  console.log('✓ Tabella character_player_requests pronta.')
} finally {
  await sql.end()
}
