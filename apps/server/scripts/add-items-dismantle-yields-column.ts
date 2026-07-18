/**
 * Aggiunge items.dismantle_yields (JSON resa smantellamento custom).
 * Esegui: cd apps/server && bun run add-items-dismantle-yields-column
 */
import postgres from 'postgres'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(import.meta.dir, '../../../.env') })

const sql = postgres(process.env.DATABASE_URL!)

const SAMPLE_YIELDS: Record<string, { junkCatalogKey?: string; junkQuantity?: number; materials?: Record<string, number> }> = {
  'prep-medico-decotto': {
    junkCatalogKey: 'junk-flaconi',
    materials: { reagente: 2, erba_comune: 1 },
  },
  'equip-sabimaru': {
    junkCatalogKey: 'junk-utensili-spezzati',
    materials: { rottame_metallico: 2 },
  },
  'junk-abiti': {
    materials: { stoffa: 3, cuoio: 1 },
  },
}

try {
  await sql`
    ALTER TABLE items
    ADD COLUMN IF NOT EXISTS dismantle_yields jsonb
  `
  console.log('✓ Colonna items.dismantle_yields pronta.')

  for (const [catalogKey, yields] of Object.entries(SAMPLE_YIELDS)) {
    const updated = await sql`
      UPDATE items
      SET dismantle_yields = ${sql.json(yields)}
      WHERE catalog_key = ${catalogKey}
      RETURNING catalog_key
    `
    if (updated.length > 0) {
      console.log(`  • resa custom: ${catalogKey}`)
    }
  }
} finally {
  await sql.end()
}
