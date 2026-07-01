/**
 * Aggiunge characters.current_hp (HP combattimento correnti).
 * Esegui da apps/server: bun run scripts/add-character-current-hp-column.ts
 */
import postgres from 'postgres'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(import.meta.dir, '../../../.env') })

const sql = postgres(process.env.DATABASE_URL!)

try {
  await sql`
    ALTER TABLE characters
    ADD COLUMN IF NOT EXISTS current_hp integer
  `
  console.log('✓ Colonna characters.current_hp pronta.')
} finally {
  await sql.end()
}
