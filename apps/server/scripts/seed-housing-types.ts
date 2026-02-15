// apps/server/scripts/seed-housing-types.ts

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(import.meta.dir, '../../../.env') })

import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../src/db/schema'

const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/oyasumi_2'
const client = postgres(connectionString)
const db = drizzle(client, { schema })

const HOUSING_TYPES = [
  {
    code: 'order_room',
    name: 'Stanza dell\'Ordine',
    squareMeters: 10,
    dailyRent: 5, // -5 REM al giorno dallo stipendio
    monthlyRent: null,
    hpBonus: 0,
    inventorySlotsBonus: 5,
    requirements: {},
  },
  {
    code: 'container',
    name: 'Container nel Cosmicon Complex',
    squareMeters: 25,
    dailyRent: null,
    monthlyRent: 100,
    hpBonus: 5,
    inventorySlotsBonus: 10,
    requirements: {},
  },
  {
    code: 'monolocale',
    name: 'Monolocale a Wall Town',
    squareMeters: 35,
    dailyRent: null,
    monthlyRent: 120,
    hpBonus: 5,
    inventorySlotsBonus: 13,
    requirements: {},
  },
  {
    code: 'bilocale',
    name: 'Bilocale',
    squareMeters: 45,
    dailyRent: null,
    monthlyRent: 150,
    hpBonus: 5,
    inventorySlotsBonus: 15,
    requirements: {},
  },
  {
    code: 'cottage',
    name: 'Cottage',
    squareMeters: 55,
    dailyRent: null,
    monthlyRent: 250,
    hpBonus: 10,
    inventorySlotsBonus: 15,
    requirements: {},
  },
  {
    code: 'appartamento_borghese',
    name: 'Appartamento Borghese',
    squareMeters: 70,
    dailyRent: null,
    monthlyRent: 280,
    hpBonus: 10,
    inventorySlotsBonus: 18,
    requirements: {},
  },
  {
    code: 'villa',
    name: 'Villa',
    squareMeters: 85,
    dailyRent: null,
    monthlyRent: 300,
    hpBonus: 10,
    inventorySlotsBonus: 20,
    requirements: {},
  },
  {
    code: 'proprieta_paradise',
    name: 'Proprietà nel Paradise',
    squareMeters: 100, // Non specificato, uso 100
    dailyRent: null,
    monthlyRent: 400,
    hpBonus: 15,
    inventorySlotsBonus: 25,
    requirements: {
      paradisePass: true, // Richiede pass paradise
    },
  },
]

async function main() {
  try {
    console.log('🌱 Seeding housing types...')

    for (const ht of HOUSING_TYPES) {
      const existing = await db.query.housingTypes.findFirst({
        where: eq(schema.housingTypes.code, ht.code),
      })

      if (existing) {
        console.log(`⏭️  ${ht.code} già esistente, skip`)
        continue
      }

      await db.insert(schema.housingTypes).values(ht)
      console.log(`✅ ${ht.name} (${ht.code})`)
    }

    console.log('✅ Seed completato!')
  } catch (e) {
    console.error('❌ Errore:', e)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
