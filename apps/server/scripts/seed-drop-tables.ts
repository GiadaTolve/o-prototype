// apps/server/scripts/seed-drop-tables.ts
// Sync DROP_TABLES + DROP_POOL_JUNK_IDS → economy_drop_* tables.
// Uso: cd apps/server && bun run seed-drop-tables

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(import.meta.dir, '../../../.env') })

const { seedDropTablesFromDomain } = await import('../src/modules/drop/drop-tables.service')

async function main() {
  await seedDropTablesFromDomain()
  console.log('Drop tables e pool sincronizzati da domain.')
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
