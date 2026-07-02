import { Elysia, t } from 'elysia'
import { eq } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { characters } from '../../db/schema'
import { authPlugin } from '../../plugins/auth.plugin'
import {
  dismantleInventoryItems,
  getArtigianoDismantleInventory,
  getDismantleStatus,
} from './dismantle.service'

export const artigianoRoutes = new Elysia({ prefix: '/artigiano' })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      .get('/me/dismantle/status', async ({ user, set }) => {
        if (!user) {
          set.status = 401
          return { error: 'Unauthorized' }
        }
        try {
          const char = await db.query.characters.findFirst({
            where: eq(characters.userId, user.id),
          })
          if (!char) {
            set.status = 404
            return { error: 'Personaggio non trovato' }
          }
          return await getDismantleStatus(char.id)
        } catch (e: unknown) {
          set.status = 403
          return { error: e instanceof Error ? e.message : 'Accesso negato' }
        }
      })
      .get('/me/dismantle/inventory', async ({ user, set }) => {
        if (!user) {
          set.status = 401
          return { error: 'Unauthorized' }
        }
        try {
          const char = await db.query.characters.findFirst({
            where: eq(characters.userId, user.id),
          })
          if (!char) {
            set.status = 404
            return { error: 'Personaggio non trovato' }
          }
          return await getArtigianoDismantleInventory(char.id)
        } catch (e: unknown) {
          set.status = 403
          return { error: e instanceof Error ? e.message : 'Accesso negato' }
        }
      })
      .post(
        '/me/dismantle',
        async ({ body, user, set }) => {
          if (!user) {
            set.status = 401
            return { error: 'Unauthorized' }
          }
          try {
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }
            return await dismantleInventoryItems(char.id, body.inventoryIds)
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Smantellamento fallito' }
          }
        },
        {
          body: t.Object({
            inventoryIds: t.Array(t.String(), { minItems: 1, maxItems: 10 }),
          }),
        },
      ),
  )
