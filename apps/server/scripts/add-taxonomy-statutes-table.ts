/**
 * Crea taxonomy_statutes (statuti Dō / Madoshō / Ordine / Premio).
 * Migra LOCAL + Neon.
 * Uso: cd apps/server && bun run add-taxonomy-statutes-table
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
      CREATE TABLE IF NOT EXISTS taxonomy_statutes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        kind text NOT NULL,
        entry_id text NOT NULL,
        statute text NOT NULL DEFAULT '',
        atto text NOT NULL DEFAULT '',
        sottotitolo text NOT NULL DEFAULT '',
        descrizione_meccanica text NOT NULL DEFAULT '',
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (kind, entry_id)
      )
    `
    await sql`
      ALTER TABLE taxonomy_statutes
      ADD COLUMN IF NOT EXISTS atto text NOT NULL DEFAULT ''
    `
    console.log('  ✓ taxonomy_statutes')
  } finally {
    await sql.end({ timeout: 5 })
  }
}

const local =
  process.env.LOCAL_DATABASE_URL ||
  (process.env.DATABASE_URL?.includes('localhost') ? process.env.DATABASE_URL : undefined)
const neon = process.env.NEON_DATABASE_URL
const primary = process.env.DATABASE_URL

const targets: Array<{ label: string; raw: string; ssl: boolean }> = []
if (local) targets.push({ label: 'LOCAL', raw: local, ssl: false })
if (neon) targets.push({ label: 'NEON', raw: neon, ssl: true })
if (primary && !targets.some((t) => t.raw === primary)) {
  targets.push({
    label: 'DATABASE_URL',
    raw: primary,
    ssl: primary.includes('neon.tech'),
  })
}

if (targets.length === 0) {
  console.error('Nessuna DATABASE_URL / NEON_DATABASE_URL / LOCAL_DATABASE_URL trovata.')
  process.exit(1)
}

for (const t of targets) {
  try {
    await migrateOne(t.label, t.raw, t.ssl)
  } catch (e) {
    console.error(`  ✗ ${t.label}:`, e instanceof Error ? e.message : e)
    process.exitCode = 1
  }
}

console.log('\nFatto.')
