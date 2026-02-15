import { Elysia, t } from 'elysia'
import { eq } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { characters } from '../../db/schema'
import { authPlugin } from '../../plugins/auth.plugin'
import {
  getAllHousingTypes,
  getCharacterHousing,
  assignHousing,
  payMonthlyRent,
  removeHousing,
} from './housing.service'

export const housingRoutes = new Elysia({ prefix: '/housing' })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      // Ottiene tutte le tipologie di abitazione
      .get('/types', async () => {
        const types = await getAllHousingTypes()
        return types
      })

      // Ottiene l'abitazione del personaggio corrente
      .get('/me', async ({ user, set }) => {
        try {
          const char = await db.query.characters.findFirst({
            where: eq(characters.userId, user.id),
          })
          if (!char) {
            set.status = 404
            return { error: 'Personaggio non trovato' }
          }

          const housing = await getCharacterHousing(char.id)
          return housing || null
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore durante il recupero' }
        }
      })

      // Assegna un'abitazione al personaggio corrente
      .post(
        '/assign',
        async ({ body, user, set }) => {
          try {
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }

            const housing = await assignHousing(char.id, body.housingTypeId)
            return housing
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante l\'assegnazione' }
          }
        },
        {
          body: t.Object({
            housingTypeId: t.String(),
          }),
        }
      )

      // Paga manualmente l'affitto mensile
      .post('/pay-rent', async ({ user, set }) => {
        try {
          const char = await db.query.characters.findFirst({
            where: eq(characters.userId, user.id),
          })
          if (!char) {
            set.status = 404
            return { error: 'Personaggio non trovato' }
          }

          const result = await payMonthlyRent(char.id)
          return result
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore durante il pagamento' }
        }
      })

      // Rimuove l'abitazione (diventa senzatetto)
      .post('/remove', async ({ user, set }) => {
        try {
          const char = await db.query.characters.findFirst({
            where: eq(characters.userId, user.id),
          })
          if (!char) {
            set.status = 404
            return { error: 'Personaggio non trovato' }
          }

          const result = await removeHousing(char.id)
          return result
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore durante la rimozione' }
        }
      })
  )
