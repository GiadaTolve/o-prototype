/**
 * Colonne authoring waza su skills (damage_skiru_ids + damage_index_kind).
 * Esegui da apps/server: bun run scripts/add-skill-waza-damage-columns.ts
 */
import postgres from 'postgres'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(import.meta.dir, '../../../.env') })

const sql = postgres(process.env.DATABASE_URL!)

try {
  await sql`
    ALTER TABLE skills
    ADD COLUMN IF NOT EXISTS damage_skiru_ids jsonb
  `
  await sql`
    ALTER TABLE skills
    ADD COLUMN IF NOT EXISTS damage_index_kind text
  `
  console.log('✓ Colonne skills.damage_skiru_ids e skills.damage_index_kind pronte.')
} finally {
  await sql.end()
}
