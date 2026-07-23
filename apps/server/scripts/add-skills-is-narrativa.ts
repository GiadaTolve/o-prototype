/**
 * Aggiunge skills.is_narrativa (attive senza IR/danno in chat).
 * Uso: cd apps/server && bun run scripts/add-skills-is-narrativa.ts
 */
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '../../.env') })

import { sql } from 'drizzle-orm'
import { db } from '../src/plugins/db'

async function main() {
  await db.execute(sql`
    ALTER TABLE skills
    ADD COLUMN IF NOT EXISTS is_narrativa boolean NOT NULL DEFAULT false
  `)
  console.log('✓ skills.is_narrativa')
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
