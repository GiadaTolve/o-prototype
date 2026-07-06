import { Elysia, t } from 'elysia'
import { eq } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { characters } from '../../db/schema'
import { authPlugin } from '../../plugins/auth.plugin'
import {
  activateSacerdoteOfuda,
  consumeSacerdoteOfuda,
  craftSacerdoteOfuda,
  getSacerdoteToolState,
} from './sacerdote.service'

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

export const sacerdoteRoutes = new Elysia({ prefix: '/sacerdote' })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      .get('/me/status', async ({ user, set }) => {
        if (!user) {
          set.status = 401
          return { error: 'Unauthorized' }
        }
        try {
          const characterId = await getCharacterIdForUser(user.id, set)
          if (!characterId) return { error: 'Personaggio non trovato' }
          return await getSacerdoteToolState(characterId)
        } catch (e: unknown) {
          set.status = 403
          return { error: e instanceof Error ? e.message : 'Accesso negato' }
        }
      })
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
            return await craftSacerdoteOfuda(characterId, body)
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Fabbricazione fallita' }
          }
        },
        {
          body: t.Object({
            blueprintId: t.String(),
            consecratedPlace: t.Optional(t.Boolean()),
            roomId: t.Optional(t.String()),
          }),
        },
      )
      .post(
        '/me/activate',
        async ({ body, user, set }) => {
          if (!user) {
            set.status = 401
            return { error: 'Unauthorized' }
          }
          try {
            const characterId = await getCharacterIdForUser(user.id, set)
            if (!characterId) return { error: 'Personaggio non trovato' }
            return await activateSacerdoteOfuda(characterId, body)
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Attivazione fallita' }
          }
        },
        {
          body: t.Object({
            blueprintId: t.String(),
            bearerCharacterId: t.Optional(t.String()),
            notes: t.Optional(t.String({ maxLength: 500 })),
            roomId: t.Optional(t.String()),
          }),
        },
      )
      .post(
        '/me/ofuda/:ofudaId/consume',
        async ({ params, body, user, set }) => {
          if (!user) {
            set.status = 401
            return { error: 'Unauthorized' }
          }
          try {
            const characterId = await getCharacterIdForUser(user.id, set)
            if (!characterId) return { error: 'Personaggio non trovato' }
            return await consumeSacerdoteOfuda(characterId, {
              ofudaId: params.ofudaId,
              roomId: body.roomId,
              note: body.note,
            })
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Consumo Ofuda fallito' }
          }
        },
        {
          body: t.Object({
            roomId: t.Optional(t.String()),
            note: t.Optional(t.String({ maxLength: 500 })),
          }),
        },
      ),
  )
