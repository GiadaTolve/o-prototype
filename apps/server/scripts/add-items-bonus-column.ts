/**
 * Aggiunge la colonna bonus a items.
 * Esegui da apps/server: bun run scripts/add-items-bonus-column.ts
 * Usa NEON_DATABASE_URL se presente, altrimenti DATABASE_URL.
 */
import postgres from 'postgres'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(import.meta.dir, '../../../.env') })

function resolveDbUrl(): string {
  const raw = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL
  if (!raw) throw new Error('NEON_DATABASE_URL o DATABASE_URL mancante')
  return raw.replace('-pooler.c-', '.c-').replace(/[?&]options=[^&]*/g, '').replace(/[?&]$/, '')
}

const sql = postgres(resolveDbUrl(), { ssl: 'require', max: 1 })

try {
  await sql`
    ALTER TABLE items
    ADD COLUMN IF NOT EXISTS bonus integer
  `
  console.log('✓ Colonna items.bonus pronta.')
} finally {
  await sql.end()
}
