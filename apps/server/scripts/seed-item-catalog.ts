// apps/server/scripts/seed-item-catalog.ts
// Seed catalogo oggetti: junk (19) + materiali (16) + equip mercato (35).
// Uso: cd apps/server && bun run scripts/seed-item-catalog.ts

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(import.meta.dir, '../../../.env') })

import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { ECONOMY_MATERIAL_LABELS, JUNK_ITEMS } from '@domain/economy/junklist'
import { MARKET_EQUIPMENT_CATALOG, marketEquipmentCategory } from '@domain/economy/market-equipment-catalog'
import * as schema from '../src/db/schema'

const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/oyasumi_2'
const client = postgres(connectionString)
const db = drizzle(client, { schema })

async function upsertCatalogItem(values: typeof schema.items.$inferInsert) {
  if (!values.catalogKey) throw new Error('catalogKey required')
  const existing = await db.query.items.findFirst({
    where: eq(schema.items.catalogKey, values.catalogKey),
  })
  const fields = {
    name: values.name,
    nameRomaji: values.nameRomaji,
    description: values.description,
    category: values.category,
    junkTemplateId: values.junkTemplateId,
    materialId: values.materialId,
    inventorySlotCost: values.inventorySlotCost ?? 1,
    isStackable: values.isStackable ?? true,
    type: values.type ?? 'GENERIC',
    integrityMax: values.integrityMax,
    effectText: values.effectText,
    blueprintId: values.blueprintId,
    marketCategory: values.marketCategory,
    price: values.price,
    isActiveInMarket: values.isActiveInMarket ?? true,
  }
  if (existing) {
    await db.update(schema.items).set(fields).where(eq(schema.items.id, existing.id))
    return existing.id
  }
  const [row] = await db.insert(schema.items).values(values).returning({ id: schema.items.id })
  return row.id
}

async function main() {
  console.log('Seed catalogo oggetti (junk + materiali + equip mercato)...')

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

  for (const equip of MARKET_EQUIPMENT_CATALOG) {
    await upsertCatalogItem({
      catalogKey: equip.id,
      name: equip.nameItalian,
      nameRomaji: equip.nameRomaji,
      description: equip.description,
      category: equip.category,
      integrityMax: equip.integrityMax,
      effectText: equip.effectText,
      inventorySlotCost: equip.inventorySlotCost,
      isStackable: equip.isStackable,
      type: equip.type,
      blueprintId: equip.blueprintId,
      marketCategory: marketEquipmentCategory(equip.kind),
      price: equip.priceRem,
      isActiveInMarket: true,
    })
  }

  const total =
    JUNK_ITEMS.length +
    Object.keys(ECONOMY_MATERIAL_LABELS).length +
    MARKET_EQUIPMENT_CATALOG.length
  console.log(
    `OK — ${JUNK_ITEMS.length} junk + ${Object.keys(ECONOMY_MATERIAL_LABELS).length} materiali + ${MARKET_EQUIPMENT_CATALOG.length} equip = ${total} voci`,
  )
  await client.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
