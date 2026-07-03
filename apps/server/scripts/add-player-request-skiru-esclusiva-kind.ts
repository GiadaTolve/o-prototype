/**
 * Aggiunge SKIRU_ESCLUSIVA al CHECK su character_player_requests.kind
 * e migra richieste PREMIO legacy → SKIRU_ESCLUSIVA.
 * Esegui: bun run scripts/add-player-request-skiru-esclusiva-kind.ts
 */
import postgres from 'postgres'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(import.meta.dir, '../../../.env') })

const sql = postgres(process.env.DATABASE_URL!)

try {
  await sql`
    UPDATE character_player_requests
    SET kind = 'SKIRU_ESCLUSIVA'
    WHERE kind = 'PREMIO'
  `
  const migrated = await sql`
    SELECT COUNT(*)::int AS n FROM character_player_requests WHERE kind = 'SKIRU_ESCLUSIVA'
  `
  console.log(`✓ Richieste SKIRU_ESCLUSIVA in tabella: ${migrated[0]?.n ?? 0}`)

  await sql`
    ALTER TABLE character_player_requests
    DROP CONSTRAINT IF EXISTS character_player_requests_kind_check
  `
  await sql`
    ALTER TABLE character_player_requests
    ADD CONSTRAINT character_player_requests_kind_check
    CHECK (kind IN ('MADOSHO', 'ORDER', 'SKIRU_ESCLUSIVA', 'PREMIO', 'TENKAN'))
  `
  console.log('✓ CHECK kind aggiornato (MADOSHO, ORDER, SKIRU_ESCLUSIVA, PREMIO, TENKAN).')
} finally {
  await sql.end()
}
