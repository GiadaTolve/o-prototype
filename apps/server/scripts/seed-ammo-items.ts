/**
 * Inserisce munizioni nel catalogo (solo drop/craft/inventario — NON in vetrina Market).
 * Uso: cd apps/server && bun run seed-ammo-items
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import { and, eq, ilike } from 'drizzle-orm'

config({ path: resolve(import.meta.dir, '../../../.env') })

import { MARKET_EQUIPMENT_CATALOG } from '@domain/economy/market-equipment-catalog'

const AMMO_DEFS = MARKET_EQUIPMENT_CATALOG.filter((e) => e.id.startsWith('ammo-'))

async function main() {
  const { db } = await import('../src/plugins/db')
  const { items } = await import('../src/db/schema')

  console.log('Seed munizioni (fuori Market)…\n')

  for (const ammo of AMMO_DEFS) {
    const existing = await db.query.items.findFirst({
      where: eq(items.catalogKey, ammo.id),
    })
    const values = {
      catalogKey: ammo.id,
      name: ammo.nameItalian,
      nameRomaji: ammo.nameRomaji,
      description: ammo.description,
      category: 'consumabile' as const,
      type: 'GENERIC' as const,
      effectText: ammo.effectText,
      inventorySlotCost: ammo.inventorySlotCost,
      isStackable: true,
      ammoKind: ammo.ammoKind ?? null,
      marketCategory: null,
      price: null,
      isActiveInMarket: false,
    }

    if (existing) {
      await db.update(items).set(values).where(eq(items.id, existing.id))
      console.log(`  ↻ ${ammo.id} · ${ammo.nameItalian} (${ammo.ammoKind})`)
    } else {
      await db.insert(items).values(values)
      console.log(`  + ${ammo.id} · ${ammo.nameItalian} (${ammo.ammoKind})`)
    }
  }

  console.log('\n✓ Munizioni pronte — visibili in inventario/drop, non nel Mercato.')
  console.log('  Per Botan: bun run grant-botan-test-ammo\n')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
