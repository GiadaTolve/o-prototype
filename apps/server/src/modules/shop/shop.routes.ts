import { Elysia, t } from 'elysia'
import { eq } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { characters } from '../../db/schema'
import { authPlugin } from '../../plugins/auth.plugin'
import {
  getShopItems,
  buyItem,
  sellItem,
} from './shop.service'

export const shopRoutes = new Elysia({ prefix: '/shop' })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      // Ottiene tutti gli oggetti disponibili nello shop
      .get('/items', async () => {
        const items = await getShopItems()
        return items
      })

      // Compra un oggetto
      .post(
        '/buy',
        async ({ body, user, set }) => {
          if (!user) {
            set.status = 401
            return { error: "Non autenticato" }
          }
          try {
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }

            const inv = await buyItem(char.id, body.itemId, body.quantity || 1)
            return inv
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante l\'acquisto' }
          }
        },
        {
          body: t.Object({
            itemId: t.String(),
            quantity: t.Optional(t.Number()),
          }),
        }
      )

      // Vende un oggetto
      .post(
        '/sell',
        async ({ body, user, set }) => {
          if (!user) {
            set.status = 401
            return { error: "Non autenticato" }
          }
          try {
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }

            const result = await sellItem(char.id, body.inventoryId, body.price)
            return result
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante la vendita' }
          }
        },
        {
          body: t.Object({
            inventoryId: t.String(),
            price: t.Number(),
          }),
        }
      )
  )
