// apps/server/scripts/seed-item-catalog.ts
// Seed catalogo oggetti Fase 1: junk (18) + materiali (15).
// Uso: cd apps/server && bun run scripts/seed-item-catalog.ts

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(import.meta.dir, '../../../.env') })

import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { ECONOMY_MATERIAL_LABELS, JUNK_ITEMS } from '@domain/economy/junklist'
import * as schema from '../src/db/schema'

const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/oyasumi_2'
const client = postgres(connectionString)
const db = drizzle(client, { schema })

async function upsertCatalogItem(values: typeof schema.items.$inferInsert) {
  if (!values.catalogKey) throw new Error('catalogKey required')
  const existing = await db.query.items.findFirst({
    where: eq(schema.items.catalogKey, values.catalogKey),
  })
  if (existing) {
    await db
      .update(schema.items)
      .set({
        name: values.name,
        description: values.description,
        category: values.category,
        junkTemplateId: values.junkTemplateId,
        materialId: values.materialId,
        inventorySlotCost: values.inventorySlotCost ?? 1,
        isStackable: values.isStackable ?? true,
        type: values.type ?? 'GENERIC',
      })
      .where(eq(schema.items.id, existing.id))
    return existing.id
  }
  const [row] = await db.insert(schema.items).values(values).returning({ id: schema.items.id })
  return row.id
}

async function main() {
  console.log('Seed catalogo oggetti (junk + materiali)...')

  for (const junk of JUNK_ITEMS) {
    await upsertCatalogItem({
      catalogKey: junk.id,
      name: junk.name,
      description: 'Junk — smantellabile solo dall\'Artigiano.',
      category: 'junk',
      junkTemplateId: junk.id,
      inventorySlotCost: 1,
      isStackable: true,
      type: 'GENERIC',
    })
  }

  for (const [materialId, label] of Object.entries(ECONOMY_MATERIAL_LABELS)) {
    await upsertCatalogItem({
      catalogKey: `mat-${materialId}`,
      name: label,
      description: 'Materiale da crafting.',
      category: 'materiale',
      materialId,
      inventorySlotCost: 1,
      isStackable: true,
      type: 'GENERIC',
    })
  }

  console.log(`OK — ${JUNK_ITEMS.length} junk + ${Object.keys(ECONOMY_MATERIAL_LABELS).length} materiali`)
  await client.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
