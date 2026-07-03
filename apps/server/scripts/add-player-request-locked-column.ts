/**
 * Colonna locked su character_player_requests (blocco dopo approvazione).
 * Esegui: bun run scripts/add-player-request-locked-column.ts
 */
import postgres from 'postgres'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(import.meta.dir, '../../../.env') })

const sql = postgres(process.env.DATABASE_URL!)

try {
  await sql`
    ALTER TABLE character_player_requests
    ADD COLUMN IF NOT EXISTS locked boolean NOT NULL DEFAULT false
  `
  await sql`
    UPDATE character_player_requests
    SET locked = true
    WHERE status = 'APPROVED' AND locked = false
  `
  console.log('✓ Colonna locked aggiunta; richieste APPROVED marcate come bloccate.')
} finally {
  await sql.end()
}
