/**
 * Aggiunge skills.pool_id (slug stabile da wazaPool / catalogo manuale).
 * Esegui da apps/server: bun run scripts/add-pool-id-column.ts
 */
import postgres from 'postgres'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(import.meta.dir, '../../../.env') })

const sql = postgres(process.env.DATABASE_URL!)

try {
  await sql`
    ALTER TABLE skills
    ADD COLUMN IF NOT EXISTS pool_id text
  `
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS skills_pool_id_unique
    ON skills (pool_id)
    WHERE pool_id IS NOT NULL
  `
  console.log('✓ Colonna skills.pool_id pronta.')
} finally {
  await sql.end()
}
