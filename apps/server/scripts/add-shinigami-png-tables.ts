/**
 * Tabelle Shinigami: npcs, albo_png, bestiario.
 * Esegui: cd apps/server && bun run add-shinigami-png-tables
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
      CREATE TABLE IF NOT EXISTS npcs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        tipo text NOT NULL DEFAULT 'mob',
        tier integer NOT NULL DEFAULT 1,
        hp_max integer NOT NULL DEFAULT 40,
        hp_current integer NOT NULL DEFAULT 40,
        cs_max integer NOT NULL DEFAULT 10,
        cs_current integer NOT NULL DEFAULT 0,
        ir_attacco integer NOT NULL DEFAULT 5,
        ir_difesa integer NOT NULL DEFAULT 5,
        waza jsonb DEFAULT '[]'::jsonb,
        status_attivi jsonb DEFAULT '[]'::jsonb,
        note text DEFAULT '',
        room_id text NOT NULL,
        created_by_user_id uuid,
        bestiario_id uuid,
        albo_id uuid,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      )
    `
    console.log('  ✓ npcs')
    await sql`CREATE INDEX IF NOT EXISTS npcs_room_id_idx ON npcs (room_id)`

    await sql`
      CREATE TABLE IF NOT EXISTS albo_png (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL,
        name text NOT NULL,
        tipo text NOT NULL DEFAULT 'mob',
        tier integer NOT NULL DEFAULT 1,
        hp_max integer NOT NULL DEFAULT 40,
        cs_max integer NOT NULL DEFAULT 10,
        ir_attacco integer NOT NULL DEFAULT 5,
        ir_difesa integer NOT NULL DEFAULT 5,
        waza jsonb DEFAULT '[]'::jsonb,
        note text DEFAULT '',
        source_bestiario_id uuid,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      )
    `
    console.log('  ✓ albo_png')
    await sql`CREATE INDEX IF NOT EXISTS albo_png_user_id_idx ON albo_png (user_id)`

    await sql`
      CREATE TABLE IF NOT EXISTS bestiario (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        name_jp text,
        name_kanji text,
        tipo text NOT NULL DEFAULT 'mob',
        tier integer NOT NULL DEFAULT 1,
        lore text,
        habitat text,
        comportamento text,
        onimori text,
        hp_max integer NOT NULL DEFAULT 40,
        cs_max integer NOT NULL DEFAULT 10,
        ir_attacco integer NOT NULL DEFAULT 5,
        ir_difesa integer NOT NULL DEFAULT 5,
        waza jsonb DEFAULT '[]'::jsonb,
        drop_table jsonb DEFAULT '[]'::jsonb,
        tag_caccia boolean NOT NULL DEFAULT false,
        image_url text,
        created_at timestamptz DEFAULT now()
      )
    `
    console.log('  ✓ bestiario')
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
if (targets.length === 0) throw new Error('DATABASE_URL o NEON_DATABASE_URL mancante')

for (const t of targets) await migrateOne(t.label, t.raw, t.forceSsl)
console.log('\nFatto.')
