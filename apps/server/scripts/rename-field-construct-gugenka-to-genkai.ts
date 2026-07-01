/**
 * Rinomina field_constructs.gugenka → genkai (Genkai sostituisce Concretizzazione).
 * Eseguire: bun run apps/server/scripts/rename-field-construct-gugenka-to-genkai.ts
 */
import postgres from 'postgres'

const url = process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/oyasumi_2'

async function main() {
  const sql = postgres(url)
  await sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'field_constructs' AND column_name = 'gugenka'
      ) THEN
        ALTER TABLE field_constructs RENAME COLUMN gugenka TO genkai;
      END IF;
    END $$;
  `
  console.log('✓ Colonna field_constructs.genkai pronta.')
  await sql.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
