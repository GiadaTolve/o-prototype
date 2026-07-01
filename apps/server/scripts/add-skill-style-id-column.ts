/**
 * Aggiunge skills.style_id (Esagono §2.13) se mancante.
 * Esegui da apps/server: bun run scripts/add-skill-style-id-column.ts
 */
import postgres from 'postgres'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(import.meta.dir, '../../../.env') })

const sql = postgres(process.env.DATABASE_URL!)

try {
  await sql`
    ALTER TABLE skills
    ADD COLUMN IF NOT EXISTS style_id text
  `
  console.log('✓ Colonna skills.style_id pronta.')
} finally {
  await sql.end()
}
