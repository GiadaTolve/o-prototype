import { Elysia, t } from 'elysia'
import { eq } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { characters } from '../../db/schema'
import { authPlugin } from '../../plugins/auth.plugin'
import {
  createGameSession,
  getGameSession,
  getActiveSessionInRoom,
  freezeGameSession,
  resumeGameSession,
  closeGameSession,
  cancelGameSession,
  refreshSessionParticipants,
  getCharacterSessions,
} from './game-sessions.service'

export const gameSessionsRoutes = new Elysia({ prefix: '/game-sessions' })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      // Crea una nuova registrazione giocata
      .post(
        '/',
        async ({ body, user, set }) => {
          try {
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }

            const session = await createGameSession(
              char.id,
              body.roomId,
              body.fetchId || null,
              body.title || null
            )
            return session
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante la creazione' }
          }
        },
        {
          body: t.Object({
            roomId: t.String(),
            fetchId: t.Optional(t.String()),
            title: t.Optional(t.String()),
          }),
        }
      )

      // Ottiene la sessione attiva in una room
      .get(
        '/room/:roomId/active',
        async ({ params, set }) => {
          try {
            const session = await getActiveSessionInRoom(params.roomId)
            return session || null
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante il recupero' }
          }
        },
        {
          params: t.Object({ roomId: t.String() }),
        }
      )

      // Ottiene una sessione specifica
      .get(
        '/:id',
        async ({ params, set }) => {
          try {
            const session = await getGameSession(params.id)
            if (!session) {
              set.status = 404
              return { error: 'Sessione non trovata' }
            }
            return session
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante il recupero' }
          }
        },
        {
          params: t.Object({ id: t.String() }),
        }
      )

      // Aggiorna i partecipanti di una sessione
      .post(
        '/:id/refresh-participants',
        async ({ params, set }) => {
          try {
            const session = await getGameSession(params.id)
            if (!session) {
              set.status = 404
              return { error: 'Sessione non trovata' }
            }

            await refreshSessionParticipants(params.id, session.roomId)
            const updated = await getGameSession(params.id)
            return updated
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante l\'aggiornamento' }
          }
        },
        {
          params: t.Object({ id: t.String() }),
        }
      )

      // Congela una sessione
      .post(
        '/:id/freeze',
        async ({ params, set }) => {
          try {
            const session = await freezeGameSession(params.id)
            return session
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante il congelamento' }
          }
        },
        {
          params: t.Object({ id: t.String() }),
        }
      )

      // Riavvia una sessione congelata
      .post(
        '/:id/resume',
        async ({ params, set }) => {
          try {
            const session = await resumeGameSession(params.id)
            return session
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante il riavvio' }
          }
        },
        {
          params: t.Object({ id: t.String() }),
        }
      )

      // Chiude una sessione
      .post(
        '/:id/close',
        async ({ params, set }) => {
          try {
            const session = await closeGameSession(params.id)
            return session
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante la chiusura' }
          }
        },
        {
          params: t.Object({ id: t.String() }),
        }
      )

      // Annulla una sessione
      .post(
        '/:id/cancel',
        async ({ params, set }) => {
          try {
            const session = await cancelGameSession(params.id)
            return session
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante l\'annullamento' }
          }
        },
        {
          params: t.Object({ id: t.String() }),
        }
      )

      // Ottiene tutte le sessioni di un personaggio
      .get(
        '/character/:characterId',
        async ({ params, query, set }) => {
          try {
            const status = query.status as 'ACTIVE' | 'FROZEN' | 'CLOSED' | 'CANCELLED' | undefined
            const sessions = await getCharacterSessions(params.characterId, status)
            return sessions
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante il recupero' }
          }
        },
        {
          params: t.Object({ characterId: t.String() }),
          query: t.Object({
            status: t.Optional(t.String()),
          }),
        }
      )
  )
