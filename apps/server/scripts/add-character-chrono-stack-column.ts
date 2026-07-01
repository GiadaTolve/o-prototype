/**
 * Aggiunge characters.chrono_stack_state (JSON persistenza CS combattimento).
 * Eseguire: bun run apps/server/scripts/add-character-chrono-stack-column.ts
 */
import postgres from 'postgres'

const url = process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/oyasumi_2'

async function main() {
  const sql = postgres(url)
  await sql`
    ALTER TABLE characters
    ADD COLUMN IF NOT EXISTS chrono_stack_state jsonb
    NOT NULL DEFAULT '{"current":0,"accumulating":false,"overheatTurns":0,"skipNextTurn":false}'::jsonb
  `
  console.log('✓ Colonna characters.chrono_stack_state pronta.')
  await sql.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
