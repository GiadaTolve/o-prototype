/**
 * Aggiunge skills.rank (tier T1–T5) se mancante.
 * Esegui da apps/server: bun run scripts/add-skill-rank-column.ts
 */
import postgres from 'postgres'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(import.meta.dir, '../../../.env') })

const sql = postgres(process.env.DATABASE_URL!)

try {
  await sql`
    ALTER TABLE skills
    ADD COLUMN IF NOT EXISTS rank text
  `
  console.log('✓ Colonna skills.rank pronta.')
} finally {
  await sql.end()
}
