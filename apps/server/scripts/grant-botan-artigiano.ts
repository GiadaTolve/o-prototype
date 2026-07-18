/**
 * Imposta Botan Miyazaki come Artigiano (Shokunin) e aggiunge oggetti di test
 * per l'officina smantellamento (junk, consumabile, equip rotto).
 *
 * Uso: cd apps/server && bun run grant-botan-artigiano
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import { and, eq, ilike } from 'drizzle-orm'

config({ path: resolve(import.meta.dir, '../../../.env') })

const TEST_LOOT: Array<{
  catalogKey: string
  quantity: number
  integrityCurrent?: number
}> = [
  { catalogKey: 'junk-abiti', quantity: 1 },
  { catalogKey: 'prep-medico-decotto', quantity: 1 },
  { catalogKey: 'equip-sabimaru', quantity: 1, integrityCurrent: 0 },
]

async function main() {
  const { db } = await import('../src/plugins/db')
  const { characters } = await import('../src/db/schema')
  const { addItemByCatalogKey } = await import('../src/modules/inventory/inventory.service')

  let char = await db.query.characters.findFirst({
    where: and(ilike(characters.name, 'Botan'), ilike(characters.surname, 'Miyazaki')),
    columns: { id: true, name: true, surname: true, socialClass: true },
  })

  if (!char) {
    char = await db.query.characters.findFirst({
      where: ilike(characters.name, 'Botan'),
      columns: { id: true, name: true, surname: true, socialClass: true },
    })
    if (!char) {
      console.error('❌ Personaggio Botan non trovato.')
      process.exit(1)
    }
    console.warn(`⚠️  Botan Miyazaki non trovato — uso ${char.name}${char.surname ? ` ${char.surname}` : ''}`)
  }

  const label = `${char.name}${char.surname ? ` ${char.surname}` : ''}`
  const prevClass = char.socialClass ?? 'null'

  await db
    .update(characters)
    .set({
      socialClass: 'shokunin',
      socialClassChosenAt: new Date(),
      socialSubclassSheet: { 'shokunin-minarai': true },
      baseSlots: 10,
    })
    .where(eq(characters.id, char.id))

  console.log(`\n✅ ${label} → Artigiano (Shokunin)`)
  console.log(`   • social_class: ${prevClass} → shokunin`)
  console.log(`   • sottoclasse: shokunin-minarai (keystone smantellamento)`)
  console.log(`   • baseSlots: 10 (spazio zaino per test)`)

  console.log('\n📦 Oggetti di test in zaino:')
  for (const row of TEST_LOOT) {
    await addItemByCatalogKey(char.id, row.catalogKey, row.quantity, {
      origin: 'droppato',
      integrityCurrent: row.integrityCurrent,
    })
    const note =
      row.integrityCurrent === 0 ? ' (INT 0, rotto)' : ''
    console.log(`   • ${row.catalogKey} ×${row.quantity}${note}`)
  }

  console.log('\n   Apri Mercato → Officina Artigiano → Smantellamento.')
  console.log('   Ricarica la pagina se la scheda era già aperta.\n')
}

main().catch((e) => {
  console.error('Errore:', e)
  process.exit(1)
})
