/**
 * Crea economy_drop_pools e economy_drop_tables (liste loot Sviluppo / Cedi Drop).
 * Uso: cd apps/server && bun run add-economy-drop-tables
 */
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(import.meta.dir, '../../../.env') })

import { pool } from '../src/plugins/db'

async function main() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await client.query(`
      CREATE TABLE IF NOT EXISTS economy_drop_pools (
        id TEXT PRIMARY KEY,
        junk_catalog_keys JSONB NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS economy_drop_tables (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        entries JSONB NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)

    await client.query('COMMIT')
    console.log('Tabelle economy_drop_pools e economy_drop_tables pronte.')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
