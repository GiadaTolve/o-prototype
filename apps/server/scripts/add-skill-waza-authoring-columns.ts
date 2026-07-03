/**
 * Colonne authoring waza su skills (effect + launch_skiru_ids).
 * Esegui da apps/server: bun run scripts/add-skill-waza-authoring-columns.ts
 */
import postgres from 'postgres'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(import.meta.dir, '../../../.env') })

const sql = postgres(process.env.DATABASE_URL!)

try {
  await sql`
    ALTER TABLE skills
    ADD COLUMN IF NOT EXISTS effect text
  `
  await sql`
    ALTER TABLE skills
    ADD COLUMN IF NOT EXISTS launch_skiru_ids jsonb
  `
  console.log('✓ Colonne skills.effect e skills.launch_skiru_ids pronte.')
} finally {
  await sql.end()
}
