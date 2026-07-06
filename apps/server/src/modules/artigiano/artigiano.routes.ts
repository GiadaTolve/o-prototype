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
import {
  craftArtigianoProject,
  getArtigianoRepairInventory,
  getArtigianoToolState,
  repairInventoryItem,
} from './artigiano-tool.service'

async function getCharacterIdForUser(userId: string, set: { status?: number | string }) {
  const char = await db.query.characters.findFirst({
    where: eq(characters.userId, userId),
  })
  if (!char) {
    set.status = 404
    return null
  }
  return char.id
}

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
      )
      .get('/me/tool/status', async ({ user, set }) => {
        if (!user) {
          set.status = 401
          return { error: 'Unauthorized' }
        }
        try {
          const characterId = await getCharacterIdForUser(user.id, set)
          if (!characterId) return { error: 'Personaggio non trovato' }
          return await getArtigianoToolState(characterId)
        } catch (e: unknown) {
          set.status = 403
          return { error: e instanceof Error ? e.message : 'Accesso negato' }
        }
      })
      .get('/me/repair/inventory', async ({ user, set }) => {
        if (!user) {
          set.status = 401
          return { error: 'Unauthorized' }
        }
        try {
          const characterId = await getCharacterIdForUser(user.id, set)
          if (!characterId) return { error: 'Personaggio non trovato' }
          return await getArtigianoRepairInventory(characterId)
        } catch (e: unknown) {
          set.status = 403
          return { error: e instanceof Error ? e.message : 'Accesso negato' }
        }
      })
      .post(
        '/me/repair',
        async ({ body, user, set }) => {
          if (!user) {
            set.status = 401
            return { error: 'Unauthorized' }
          }
          try {
            const characterId = await getCharacterIdForUser(user.id, set)
            if (!characterId) return { error: 'Personaggio non trovato' }
            return await repairInventoryItem(characterId, body)
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Riparazione fallita' }
          }
        },
        {
          body: t.Object({
            inventoryId: t.String(),
            amount: t.Optional(t.Number({ minimum: 1, maximum: 999 })),
            roomId: t.Optional(t.String()),
          }),
        },
      )
      .post(
        '/me/craft',
        async ({ body, user, set }) => {
          if (!user) {
            set.status = 401
            return { error: 'Unauthorized' }
          }
          try {
            const characterId = await getCharacterIdForUser(user.id, set)
            if (!characterId) return { error: 'Personaggio non trovato' }
            return await craftArtigianoProject(characterId, body)
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Costruzione fallita' }
          }
        },
        {
          body: t.Object({
            blueprintId: t.String(),
            inventoryId: t.Optional(t.String()),
            roomId: t.Optional(t.String()),
          }),
        },
      ),
  )
