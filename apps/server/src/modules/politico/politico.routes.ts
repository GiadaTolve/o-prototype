import { Elysia, t } from 'elysia'
import { eq } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { characters } from '../../db/schema'
import { authPlugin } from '../../plugins/auth.plugin'
import {
  createPoliticoPact,
  getPoliticoToolState,
  invokePoliticoPact,
} from './politico.service'

const leverageSchema = t.Union([
  t.Literal('formale'),
  t.Literal('popolare'),
  t.Literal('sotterranea'),
  t.Literal('neutro'),
])

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

export const politicoRoutes = new Elysia({ prefix: '/politico' })
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
          return await getPoliticoToolState(characterId)
        } catch (e: unknown) {
          set.status = 403
          return { error: e instanceof Error ? e.message : 'Accesso negato' }
        }
      })
      .post(
        '/me/pacts',
        async ({ body, user, set }) => {
          if (!user) {
            set.status = 401
            return { error: 'Unauthorized' }
          }
          try {
            const characterId = await getCharacterIdForUser(user.id, set)
            if (!characterId) return { error: 'Personaggio non trovato' }
            return await createPoliticoPact(characterId, body)
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Creazione Patto fallita' }
          }
        },
        {
          body: t.Object({
            templateId: t.String(),
            counterpartyName: t.String({ minLength: 1, maxLength: 120 }),
            counterpartyCharacterId: t.Optional(t.String()),
            leverage: t.Optional(leverageSchema),
            notes: t.Optional(t.String({ maxLength: 500 })),
            roomId: t.Optional(t.String()),
          }),
        },
      )
      .post(
        '/me/pacts/:pactId/invoke',
        async ({ params, body, user, set }) => {
          if (!user) {
            set.status = 401
            return { error: 'Unauthorized' }
          }
          try {
            const characterId = await getCharacterIdForUser(user.id, set)
            if (!characterId) return { error: 'Personaggio non trovato' }
            return await invokePoliticoPact(characterId, {
              pactId: params.pactId,
              roomId: body.roomId,
              invocationNote: body.invocationNote,
            })
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Richiamo Patto fallito' }
          }
        },
        {
          body: t.Object({
            roomId: t.Optional(t.String()),
            invocationNote: t.Optional(t.String({ maxLength: 500 })),
          }),
        },
      ),
  )
