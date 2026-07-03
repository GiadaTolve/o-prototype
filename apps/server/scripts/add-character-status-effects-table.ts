/**
 * Crea tabella character_status_effects.
 * Esegui da apps/server: bun run scripts/add-character-status-effects-table.ts
 */
import postgres from 'postgres'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(import.meta.dir, '../../../.env') })

const sql = postgres(process.env.DATABASE_URL!)

try {
  await sql`
    CREATE TABLE IF NOT EXISTS character_status_effects (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
      status_id text NOT NULL,
      stacks integer NOT NULL DEFAULT 1,
      target_kind text NOT NULL DEFAULT 'character',
      construct_ref text,
      updated_at timestamp NOT NULL DEFAULT now(),
      UNIQUE (character_id, status_id)
    )
  `
  await sql`
    CREATE INDEX IF NOT EXISTS character_status_effects_character_id_idx
    ON character_status_effects (character_id)
  `
  console.log('✓ Tabella character_status_effects pronta.')
} finally {
  await sql.end()
}
