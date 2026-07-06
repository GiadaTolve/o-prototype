import { Elysia, t } from 'elysia'
import { eq } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { characters } from '../../db/schema'
import { authPlugin } from '../../plugins/auth.plugin'
import { executeCacciatoreGather, getCacciatoreToolState } from './cacciatore.service'

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

export const cacciatoreRoutes = new Elysia({ prefix: '/cacciatore' })
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
          return await getCacciatoreToolState(characterId)
        } catch (e: unknown) {
          set.status = 403
          return { error: e instanceof Error ? e.message : 'Accesso negato' }
        }
      })
      .post(
        '/me/gather',
        async ({ body, user, set }) => {
          if (!user) {
            set.status = 401
            return { error: 'Unauthorized' }
          }
          try {
            const characterId = await getCharacterIdForUser(user.id, set)
            if (!characterId) return { error: 'Personaggio non trovato' }
            return await executeCacciatoreGather(characterId, body)
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Battuta fallita' }
          }
        },
        {
          body: t.Object({
            blueprintId: t.String(),
            roomId: t.Optional(t.String()),
          }),
        },
      ),
  )
