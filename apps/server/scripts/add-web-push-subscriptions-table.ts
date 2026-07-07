/**
 * Tabella web_push_subscriptions per PWA Web Push.
 * Esegui: bun run scripts/add-web-push-subscriptions-table.ts
 */
import postgres from 'postgres'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(import.meta.dir, '../../../.env') })

const sql = postgres(process.env.DATABASE_URL!)

try {
  await sql`
    CREATE TABLE IF NOT EXISTS web_push_subscriptions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
      endpoint text NOT NULL,
      p256dh text NOT NULL,
      auth text NOT NULL,
      user_agent text,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now(),
      UNIQUE (character_id, endpoint)
    )
  `
  await sql`
    CREATE INDEX IF NOT EXISTS web_push_subscriptions_character_idx
    ON web_push_subscriptions (character_id, updated_at DESC)
  `
  console.log('✓ Tabella web_push_subscriptions pronta.')
} finally {
  await sql.end()
}
