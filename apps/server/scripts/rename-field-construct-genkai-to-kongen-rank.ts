/**
 * Rinomina field_constructs.genkai → kongen_rank (rank Kongen, non punti Genkai).
 * Eseguire da apps/server:
 *   bun run scripts/rename-field-construct-genkai-to-kongen-rank.ts
 */
import postgres from 'postgres'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(import.meta.dir, '../../../.env') })

const sql = postgres(process.env.DATABASE_URL!)

try {
  const cols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'field_constructs' AND column_name IN ('genkai', 'kongen_rank')
  `
  const names = new Set(cols.map((c) => c.column_name as string))
  if (names.has('genkai') && !names.has('kongen_rank')) {
    await sql`ALTER TABLE field_constructs RENAME COLUMN genkai TO kongen_rank`
    console.log('✓ Colonna rinominata: genkai → kongen_rank')
  } else if (names.has('kongen_rank')) {
    console.log('✓ Colonna field_constructs.kongen_rank già presente.')
  } else {
    await sql`ALTER TABLE field_constructs ADD COLUMN IF NOT EXISTS kongen_rank integer NOT NULL DEFAULT 0`
    console.log('✓ Colonna field_constructs.kongen_rank aggiunta.')
  }
} finally {
  await sql.end()
}
