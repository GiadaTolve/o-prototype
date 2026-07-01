/**
 * Popola characters.skiru_sheet dai stats legacy F/C/D/M/E quando la colonna è vuota.
 * Esegui da apps/server: bun run scripts/migrate-legacy-stats-to-skiru-sheet.ts
 *
 * Idempotente: salta i PG che hanno già punti Skiru salvati.
 */
import postgres from 'postgres'
import { config } from 'dotenv'
import { resolve } from 'path'
import { isSkiruSheetEmpty, legacyStatsToSkiruSheet } from '@domain/skiru'

config({ path: resolve(import.meta.dir, '../../../.env') })

const sql = postgres(process.env.DATABASE_URL!)

type Row = {
  id: string
  name: string
  strength: number
  constitution: number
  dexterity: number
  mind: number
  empathy: number
  skiru_sheet: Record<string, number> | null
}

try {
  const rows = await sql<Row[]>`
    SELECT id, name, strength, constitution, dexterity, mind, empathy, skiru_sheet
    FROM characters
  `

  let migrated = 0
  let skipped = 0

  for (const row of rows) {
    const stored = row.skiru_sheet ?? {}
    if (!isSkiruSheetEmpty(stored)) {
      skipped++
      continue
    }

    const hasLegacyStats =
      row.strength > 0 ||
      row.constitution > 0 ||
      row.dexterity > 0 ||
      row.mind > 0 ||
      row.empathy > 0

    if (!hasLegacyStats) {
      skipped++
      continue
    }

    const sheet = legacyStatsToSkiruSheet({
      strength: row.strength,
      constitution: row.constitution,
      dexterity: row.dexterity,
      mind: row.mind,
      empathy: row.empathy,
    })

    await sql`
      UPDATE characters
      SET skiru_sheet = ${sql.json(sheet)}
      WHERE id = ${row.id}
    `

    migrated++
    console.log(`✓ ${row.name}: legacy → skiru_sheet (${Object.keys(sheet).length} nodi)`)
  }

  console.log(`\nFatto. Migrati: ${migrated}, saltati: ${skipped}, totale: ${rows.length}`)
} finally {
  await sql.end()
}
