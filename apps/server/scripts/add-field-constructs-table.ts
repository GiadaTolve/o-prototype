/**
 * Crea tabella field_constructs.
 * Esegui da apps/server: bun run scripts/add-field-constructs-table.ts
 */
import postgres from 'postgres'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(import.meta.dir, '../../../.env') })

const sql = postgres(process.env.DATABASE_URL!)

try {
  await sql`
    CREATE TABLE IF NOT EXISTS field_constructs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      creator_character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
      label text NOT NULL DEFAULT 'Costrutto',
      size text NOT NULL DEFAULT 'media',
      waza_tier integer NOT NULL DEFAULT 1,
      genkai integer NOT NULL DEFAULT 0,
      max_resistance integer NOT NULL,
      remaining_resistance integer NOT NULL,
      stationary boolean NOT NULL DEFAULT true,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `
  await sql`
    CREATE INDEX IF NOT EXISTS field_constructs_creator_idx
    ON field_constructs (creator_character_id)
  `
  console.log('✓ Tabella field_constructs pronta.')
} finally {
  await sql.end()
}
