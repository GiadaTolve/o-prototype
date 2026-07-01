/**
 * Aggiunge characters.skiru_sheet (jsonb) se mancante.
 * Esegui da apps/server: bun run scripts/add-skiru-sheet-column.ts
 */
import postgres from 'postgres'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(import.meta.dir, '../../../.env') })

const sql = postgres(process.env.DATABASE_URL!)

try {
  await sql`
    ALTER TABLE characters
    ADD COLUMN IF NOT EXISTS skiru_sheet jsonb NOT NULL DEFAULT '{}'::jsonb
  `
  console.log('✓ Colonna characters.skiru_sheet pronta.')
} finally {
  await sql.end()
}
