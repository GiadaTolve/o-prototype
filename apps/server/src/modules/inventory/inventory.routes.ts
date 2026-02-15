import { Elysia, t } from 'elysia'
import { eq } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { characters } from '../../db/schema'
import { authPlugin } from '../../plugins/auth.plugin'
import {
  getCharacterInventory,
  addItemToInventory,
  removeItemFromInventory,
  toggleEquipItem,
  updateItemQuantity,
  calculateTotalSlots,
  moveItemLocation,
} from './inventory.service'

export const inventoryRoutes = new Elysia({ prefix: '/inventory' })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      // Ottiene l'inventario del personaggio corrente
      .get('/me', async ({ user, set }) => {
        if (!user) { set.status = 401; return { error: 'Unauthorized' } }
        try {
          const char = await db.query.characters.findFirst({
            where: eq(characters.userId, user.id),
          })
          if (!char) {
            set.status = 404
            return { error: 'Personaggio non trovato' }
          }

          const inv = await getCharacterInventory(char.id)
          return inv
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore durante il recupero' }
        }
      })

      // Ottiene l'inventario di un personaggio specifico (solo per mod/admin)
      .get('/character/:characterId', async ({ params, user, set }) => {
        if (!user) { set.status = 401; return { error: 'Unauthorized' } }
        try {
          const viewerRole = (user.role ?? '').toUpperCase()
          // Solo Admin e Master possono vedere l'inventario di altri
          if (viewerRole !== 'ADMIN' && viewerRole !== 'MASTER') {
            set.status = 403
            return { error: 'Accesso negato. Solo Moderatori e Admin possono vedere l\'inventario di altri.' }
          }

          const inv = await getCharacterInventory(params.characterId)
          return inv
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore durante il recupero' }
        }
      }, {
        params: t.Object({ characterId: t.String() }),
      })

      // Calcola gli slot totali
      .get('/me/slots', async ({ user, set }) => {
        if (!user) { set.status = 401; return { error: 'Unauthorized' } }
        try {
          const char = await db.query.characters.findFirst({
            where: eq(characters.userId, user.id),
          })
          if (!char) {
            set.status = 404
            return { error: 'Personaggio non trovato' }
          }

          const slots = await calculateTotalSlots(char.id)
          return slots
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore durante il calcolo' }
        }
      })

      // Aggiunge un oggetto all'inventario
      .post(
        '/me/add',
        async ({ body, user, set }) => {
          if (!user) { set.status = 401; return { error: 'Unauthorized' } }
          try {
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }

            const inv = await addItemToInventory(char.id, body.itemId, body.quantity || 1)
            return inv
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante l\'aggiunta' }
          }
        },
        {
          body: t.Object({
            itemId: t.String(),
            quantity: t.Optional(t.Number()),
          }),
        }
      )

      // Rimuove un oggetto dall'inventario
      .delete(
        '/me/:inventoryId',
        async ({ params, user, set }) => {
          if (!user) { set.status = 401; return { error: 'Unauthorized' } }
          try {
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }

            const result = await removeItemFromInventory(params.inventoryId, char.id)
            return result
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante la rimozione' }
          }
        },
        {
          params: t.Object({ inventoryId: t.String() }),
        }
      )

      // Equipaggia/rimuove equipaggiamento
      .post(
        '/me/:inventoryId/toggle-equip',
        async ({ params, user, set }) => {
          if (!user) { set.status = 401; return { error: 'Unauthorized' } }
          try {
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }

            const updated = await toggleEquipItem(params.inventoryId, char.id)
            return updated
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante l\'equipaggiamento' }
          }
        },
        {
          params: t.Object({ inventoryId: t.String() }),
        }
      )

      // Aggiorna la quantità di un oggetto
      .patch(
        '/me/:inventoryId/quantity',
        async ({ params, body, user, set }) => {
          if (!user) { set.status = 401; return { error: 'Unauthorized' } }
          try {
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }

            const updated = await updateItemQuantity(params.inventoryId, char.id, body.quantity)
            return updated
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante l\'aggiornamento' }
          }
        },
        {
          params: t.Object({ inventoryId: t.String() }),
          body: t.Object({
            quantity: t.Number(),
          }),
        }
      )

      // Sposta un oggetto nell'inventario casa
      .post(
        '/me/:inventoryId/move-to-housing',
        async ({ params, user, set }) => {
          if (!user) { set.status = 401; return { error: 'Unauthorized' } }
          try {
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }

            const updated = await moveItemLocation(params.inventoryId, char.id, 'HOUSING')
            return updated
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante lo spostamento in casa' }
          }
        },
        {
          params: t.Object({ inventoryId: t.String() }),
        }
      )

      // Riporta un oggetto dall'inventario casa all'inventario portato addosso
      .post(
        '/me/:inventoryId/move-to-carry',
        async ({ params, user, set }) => {
          if (!user) { set.status = 401; return { error: 'Unauthorized' } }
          try {
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }

            const updated = await moveItemLocation(params.inventoryId, char.id, 'CARRY')
            return updated
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante lo spostamento nello zaino' }
          }
        },
        {
          params: t.Object({ inventoryId: t.String() }),
        }
      )
  )
