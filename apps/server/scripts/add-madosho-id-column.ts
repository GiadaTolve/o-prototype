/**
 * Aggiunge characters.madosho_id se mancante.
 * Esegui da apps/server: bun run scripts/add-madosho-id-column.ts
 */
import postgres from 'postgres'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(import.meta.dir, '../../../.env') })

const sql = postgres(process.env.DATABASE_URL!)

try {
  await sql`
    ALTER TABLE characters
    ADD COLUMN IF NOT EXISTS madosho_id text
  `
  console.log('✓ Colonna characters.madosho_id pronta.')
} finally {
  await sql.end()
}
