/**
 * Colonne combat-mod + esclusività craft su items.
 * Esegui: cd apps/server && bun run add-items-combat-mods-columns
 *
 * Applica a DATABASE_URL (locale) e, se presente, a NEON_DATABASE_URL.
 */
import postgres from 'postgres'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(import.meta.dir, '../../../.env') })

function normalizeUrl(raw: string, forceSsl: boolean): { url: string; ssl?: 'require' } {
  let url = raw.replace(/[?&]options=[^&]*/g, '').replace(/[?&]$/, '')
  if (forceSsl) {
    url = url.replace('-pooler.c-', '.c-')
  }
  return forceSsl ? { url, ssl: 'require' } : { url }
}

async function migrateOne(label: string, raw: string, forceSsl: boolean) {
  const { url, ssl } = normalizeUrl(raw, forceSsl)
  const host = url.includes('@') ? url.split('@')[1]?.split('/')[0] : url
  console.log(`\n→ ${label} (${host})`)
  const sql = postgres(url, { ssl, max: 1 })
  try {
    await sql`ALTER TABLE items ADD COLUMN IF NOT EXISTS mitigation_flat integer`
    console.log('  ✓ items.mitigation_flat')
    await sql`ALTER TABLE items ADD COLUMN IF NOT EXISTS skiru_bonuses jsonb`
    console.log('  ✓ items.skiru_bonuses')
    await sql`ALTER TABLE items ADD COLUMN IF NOT EXISTS skiru_maluses jsonb`
    console.log('  ✓ items.skiru_maluses')
    await sql`ALTER TABLE items ADD COLUMN IF NOT EXISTS craft_exclusive_class_id text`
    console.log('  ✓ items.craft_exclusive_class_id')
  } finally {
    await sql.end()
  }
}

const targets: Array<{ label: string; raw: string; forceSsl: boolean }> = []
if (process.env.DATABASE_URL) {
  const isLocal = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL)
  targets.push({ label: 'DATABASE_URL', raw: process.env.DATABASE_URL, forceSsl: !isLocal })
}
if (process.env.NEON_DATABASE_URL && process.env.NEON_DATABASE_URL !== process.env.DATABASE_URL) {
  targets.push({ label: 'NEON_DATABASE_URL', raw: process.env.NEON_DATABASE_URL, forceSsl: true })
}

if (targets.length === 0) {
  throw new Error('NEON_DATABASE_URL o DATABASE_URL mancante')
}

for (const t of targets) {
  await migrateOne(t.label, t.raw, t.forceSsl)
}
console.log('\nFatto.')
