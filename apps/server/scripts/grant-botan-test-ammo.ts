/**
 * Aggiunge munizioni di test nello zaino di Botan Miyazaki.
 * Uso: cd apps/server && bun run scripts/grant-botan-test-ammo.ts
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import { and, eq, ilike } from 'drizzle-orm'

config({ path: resolve(import.meta.dir, '../../../.env') })

const AMMO_GRANTS: { catalogKey: string; quantity: number }[] = [
  { catalogKey: 'ammo-pistola', quantity: 30 },
  { catalogKey: 'ammo-fucile', quantity: 20 },
  { catalogKey: 'ammo-balestra', quantity: 15 },
]

async function main() {
  const { db } = await import('../src/plugins/db')
  const { characters, inventory } = await import('../src/db/schema')
  const { addItemByCatalogKey } = await import('../src/modules/inventory/inventory.service')

  const char = await db.query.characters.findFirst({
    where: and(ilike(characters.name, 'Botan'), ilike(characters.surname, 'Miyazaki')),
    columns: { id: true, name: true, surname: true },
  })

  if (!char) {
    const fallback = await db.query.characters.findFirst({
      where: ilike(characters.name, 'Botan'),
      columns: { id: true, name: true, surname: true },
    })
    if (!fallback) {
      console.error('❌ Personaggio Botan non trovato.')
      process.exit(1)
    }
    console.warn(`⚠️  Botan Miyazaki non trovato — uso ${fallback.name}${fallback.surname ? ` ${fallback.surname}` : ''}`)
    Object.assign(char ?? {}, fallback)
  }

  const target = char!
  const label = `${target.name}${target.surname ? ` ${target.surname}` : ''}`

  for (const grant of AMMO_GRANTS) {
    const row = await addItemByCatalogKey(target.id, grant.catalogKey, grant.quantity, {
      origin: 'comprato',
      location: 'CARRY',
    })
    await db.update(inventory).set({ isEquipped: true }).where(eq(inventory.id, row.id))
    console.log(`✅ ${grant.catalogKey} ×${row.quantity ?? grant.quantity} → addosso (${label})`)
  }

  console.log('\n   Munizioni equipaggiate — pronte per Colpisci con armi da fuoco.\n')
  process.exit(0)
}

main().catch((e) => {
  console.error('Errore:', e)
  process.exit(1)
})
