/**
 * Crea economy_drop_pools e economy_drop_tables (liste loot Sviluppo / Cedi Drop).
 * Migra LOCAL + Neon.
 * Uso: cd apps/server && bun run add-economy-drop-tables
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
    await sql`
      CREATE TABLE IF NOT EXISTS economy_drop_pools (
        id text PRIMARY KEY,
        junk_catalog_keys jsonb NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `
    console.log('  ✓ economy_drop_pools')

    await sql`
      CREATE TABLE IF NOT EXISTS economy_drop_tables (
        id text PRIMARY KEY,
        label text NOT NULL,
        entries jsonb NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `
    console.log('  ✓ economy_drop_tables')
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
