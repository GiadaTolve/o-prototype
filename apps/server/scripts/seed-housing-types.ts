// apps/server/scripts/seed-housing-types.ts
// Seed catalogo abitazioni da @domain/economy/housing-catalog
// Uso: cd apps/server && bun run scripts/seed-housing-types.ts

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(import.meta.dir, '../../../.env') })

import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import {
  buildHousingEffectText,
  HOUSING_CATALOG,
} from '@domain/economy/housing-catalog'
import * as schema from '../src/db/schema'

const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/oyasumi_2'
const client = postgres(connectionString)
const db = drizzle(client, { schema })

async function upsertHousingType(def: (typeof HOUSING_CATALOG)[number]) {
  const dailyRent = def.rentKind === 'daily_deduction' ? (def.dailyRent ?? null) : null
  const monthlyRent = def.rentKind === 'monthly' ? (def.monthlyRent ?? null) : null

  const values = {
    code: def.id,
    name: def.nameItalian,
    nameRomaji: def.nameRomaji,
    description: def.description,
    effectText: buildHousingEffectText(def),
    squareMeters: def.squareMeters,
    dailyRent,
    monthlyRent,
    hpBonus: def.hpBonus,
    inventorySlotsBonus: def.inventorySlotsBonus,
    requirements: def.requirements ?? {},
    isActiveInCatalog: true,
  }

  const existing = await db.query.housingTypes.findFirst({
    where: eq(schema.housingTypes.code, def.id),
  })

  if (existing) {
    await db.update(schema.housingTypes).set(values).where(eq(schema.housingTypes.id, existing.id))
    return 'updated'
  }

  await db.insert(schema.housingTypes).values(values)
  return 'created'
}

async function main() {
  console.log('Seed catalogo abitazioni (Immobiliare)...')
  let created = 0
  let updated = 0

  for (const def of HOUSING_CATALOG) {
    const result = await upsertHousingType(def)
    if (result === 'created') {
      created += 1
      console.log(`✅ ${def.nameItalian} (${def.id})`)
    } else {
      updated += 1
      console.log(`↻ ${def.nameItalian} (${def.id})`)
    }
  }

  console.log(`OK — ${HOUSING_CATALOG.length} tipologie (${created} nuove, ${updated} aggiornate)`)
}

main()
  .catch((e) => {
    console.error('❌ Errore:', e)
    process.exit(1)
  })
  .finally(() => client.end())
