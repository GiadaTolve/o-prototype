/**
 * Supervisione: registration_ip + user_known_ips.
 * Esegui: cd apps/server && bun run add-supervisione-ip-tables
 */
import postgres from 'postgres'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(import.meta.dir, '../../../.env') })

function normalizeUrl(raw: string, forceSsl: boolean): { url: string; ssl?: 'require' } {
  let url = raw.replace(/[?&]options=[^&]*/g, '').replace(/[?&]$/, '')
  if (forceSsl) url = url.replace('-pooler.c-', '.c-')
  return forceSsl ? { url, ssl: 'require' } : { url }
}

async function migrateOne(label: string, raw: string, forceSsl: boolean) {
  const { url, ssl } = normalizeUrl(raw, forceSsl)
  const host = url.includes('@') ? url.split('@')[1]?.split('/')[0] : url
  console.log(`\n→ ${label} (${host})`)
  const sql = postgres(url, { ssl, max: 1 })
  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_ip text`
    console.log('  ✓ users.registration_ip')
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS supervisione_note text`
    console.log('  ✓ users.supervisione_note')

    await sql`
      CREATE TABLE IF NOT EXISTS user_known_ips (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        ip text NOT NULL,
        user_agent text,
        character_id uuid REFERENCES characters(id) ON DELETE SET NULL,
        first_seen_at timestamptz NOT NULL DEFAULT now(),
        last_seen_at timestamptz NOT NULL DEFAULT now(),
        is_registration boolean NOT NULL DEFAULT false,
        CONSTRAINT user_known_ips_user_ip UNIQUE (user_id, ip)
      )
    `
    console.log('  ✓ user_known_ips')
    await sql`CREATE INDEX IF NOT EXISTS user_known_ips_ip_idx ON user_known_ips (ip)`
    await sql`CREATE INDEX IF NOT EXISTS user_known_ips_user_id_idx ON user_known_ips (user_id)`

    await sql`
      CREATE TABLE IF NOT EXISTS supervisione_ip_notes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        ip text NOT NULL UNIQUE,
        note text NOT NULL DEFAULT '',
        updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `
    console.log('  ✓ supervisione_ip_notes')

    await sql`
      CREATE TABLE IF NOT EXISTS user_known_devices (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        device_id text NOT NULL,
        signal_hash text,
        user_agent text,
        character_id uuid REFERENCES characters(id) ON DELETE SET NULL,
        first_seen_at timestamptz NOT NULL DEFAULT now(),
        last_seen_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT user_known_devices_user_device UNIQUE (user_id, device_id)
      )
    `
    console.log('  ✓ user_known_devices')
    await sql`CREATE INDEX IF NOT EXISTS user_known_devices_device_id_idx ON user_known_devices (device_id)`

    await sql`
      CREATE TABLE IF NOT EXISTS supervisione_device_notes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        device_id text NOT NULL UNIQUE,
        note text NOT NULL DEFAULT '',
        updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `
    console.log('  ✓ supervisione_device_notes')
  } finally {
    await sql.end({ timeout: 5 })
  }
}

const local = process.env.DATABASE_URL
const neon = process.env.NEON_DATABASE_URL

if (!local && !neon) {
  console.error('Serve DATABASE_URL e/o NEON_DATABASE_URL')
  process.exit(1)
}

if (local) await migrateOne('DATABASE_URL', local, false)
if (neon) await migrateOne('NEON_DATABASE_URL', neon, true)

console.log('\nFatto.')
