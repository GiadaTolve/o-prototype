/**
 * Crea l'account di sistema e il personaggio NPC «Locatario» per solleciti affitto via SMS.
 * Uso: cd apps/server && bun run scripts/seed-locatario.ts
 */
import { eq } from 'drizzle-orm'
import { db } from '../src/plugins/db'
import { users, characters } from '../src/db/schema'

const LOCATARIO_EMAIL = 'locatario@oyasumi.system'
const LOCATARIO_NAME = 'Locatario'
const LOCATARIO_SURNAME = 'Immobiliare'

async function main() {
  let user = await db.query.users.findFirst({
    where: eq(users.email, LOCATARIO_EMAIL),
  })

  if (!user) {
    const [created] = await db
      .insert(users)
      .values({
        email: LOCATARIO_EMAIL,
        passwordHash: '!',
        role: 'ADMIN',
        banState: 'NONE',
      })
      .returning()
    user = created
    console.log(`Utente sistema creato: ${user.id}`)
  } else {
    console.log(`Utente sistema già presente: ${user.id}`)
  }

  let char = await db.query.characters.findFirst({
    where: eq(characters.userId, user.id),
  })

  if (!char) {
    const [created] = await db
      .insert(characters)
      .values({
        userId: user.id,
        name: LOCATARIO_NAME,
        surname: LOCATARIO_SURNAME,
        bio: 'Ufficio Locazioni Oyasumi — gestione contratti e solleciti affitto.',
        isRaw: false,
        rem: 0,
        uiMetadata: { roleIcon: 'admin' },
      })
      .returning()
    char = created
    console.log(`Personaggio Locatario creato: ${char.id}`)
  } else {
    console.log(`Personaggio Locatario già presente: ${char.id}`)
  }

  console.log(`\nImposta opzionale su Render: LOCATARIO_CHARACTER_ID=${char.id}`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
