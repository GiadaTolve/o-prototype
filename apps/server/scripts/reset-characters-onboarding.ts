/**
 * Reset profilo PG (dev) — mantiene account e nome PG.
 * Profilo, Skiru e richieste vanno reimpostati in Scheda.
 * Esegui: bun run scripts/reset-characters-onboarding.ts
 */
import postgres from 'postgres'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(import.meta.dir, '../../../.env') })

const sql = postgres(process.env.DATABASE_URL!)

try {
  await sql`DELETE FROM character_skills`
  await sql`DELETE FROM character_player_requests`

  const updated = await sql`
    UPDATE characters
    SET
      is_raw = false,
      madosho_id = NULL,
      surname = NULL,
      bio = NULL,
      avatar = NULL,
      mini_avatar = NULL,
      "order" = 'NONE',
      skiru_sheet = '{}'::jsonb,
      strength = 0,
      constitution = 0,
      dexterity = 0,
      mind = 0,
      empathy = 0,
      experience_total = 0,
      experience_spendable = 0,
      keys = 0,
      gems = 0
    RETURNING id, name
  `

  console.log(`✓ Reset profilo: ${updated.length} personaggi (nome PG conservato)`)
  console.log('  → Profilo in Scheda → Modifica · Richieste in Scheda → fuoco')
} finally {
  await sql.end()
}
