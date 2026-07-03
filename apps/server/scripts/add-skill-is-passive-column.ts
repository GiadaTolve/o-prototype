/**
 * Aggiunge skills.is_passive se mancante.
 * Esegui da apps/server: bun run scripts/add-skill-is-passive-column.ts
 */
import postgres from 'postgres'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(import.meta.dir, '../../../.env') })

const sql = postgres(process.env.DATABASE_URL!)

try {
  await sql`
    ALTER TABLE skills
    ADD COLUMN IF NOT EXISTS is_passive boolean NOT NULL DEFAULT false
  `
  console.log('✓ Colonna skills.is_passive pronta.')
} finally {
  await sql.end()
}
