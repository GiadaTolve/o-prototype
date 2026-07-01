/**
 * Aggiunge staff_alias e master_notes su characters se mancanti.
 * Esegui da apps/server: bun run scripts/add-character-staff-fields.ts
 */
import postgres from 'postgres'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(import.meta.dir, '../../../.env') })

const sql = postgres(process.env.DATABASE_URL!)

try {
  await sql`
    ALTER TABLE characters
    ADD COLUMN IF NOT EXISTS staff_alias text
  `
  await sql`
    ALTER TABLE characters
    ADD COLUMN IF NOT EXISTS master_notes text
  `
  console.log('✓ Colonne characters.staff_alias e master_notes pronte.')
} finally {
  await sql.end()
}
