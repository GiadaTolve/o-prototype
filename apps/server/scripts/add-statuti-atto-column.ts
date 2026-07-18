/**
 * Aggiunge taxonomy_statutes.atto (testo Atto Madoshō).
 * Esegui: cd apps/server && bun run add-statuti-atto-column
 */
import postgres from 'postgres'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(import.meta.dir, '../../../.env') })

const sql = postgres(process.env.DATABASE_URL!)

try {
  await sql`
    ALTER TABLE taxonomy_statutes
    ADD COLUMN IF NOT EXISTS atto text NOT NULL DEFAULT ''
  `
  console.log('✓ Colonna taxonomy_statutes.atto pronta.')
} finally {
  await sql.end()
}
