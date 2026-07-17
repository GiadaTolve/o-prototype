/**
 * Aggiunge la colonna bonus a items.
 * Esegui da apps/server: bun run scripts/add-items-bonus-column.ts
 */
import postgres from 'postgres'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(import.meta.dir, '../../../.env') })

const sql = postgres(process.env.DATABASE_URL!)

try {
  await sql`
    ALTER TABLE items
    ADD COLUMN IF NOT EXISTS bonus integer
  `
  console.log('✓ Colonna items.bonus pronta.')
} finally {
  await sql.end()
}
