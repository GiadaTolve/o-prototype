/**
 * Attiva tutti i PG (is_raw = false) — PG creato alla registrazione.
 * Esegui: bun run scripts/activate-all-characters.ts
 */
import postgres from 'postgres'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(import.meta.dir, '../../../.env') })

const sql = postgres(process.env.DATABASE_URL!)

try {
  const updated = await sql`
    UPDATE characters SET is_raw = false RETURNING id
  `
  console.log(`✓ ${updated.length} personaggi attivi (is_raw = false).`)
} finally {
  await sql.end()
}
