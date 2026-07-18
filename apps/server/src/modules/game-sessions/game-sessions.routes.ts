import { Elysia, t } from 'elysia'
import { eq } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { characters } from '../../db/schema'
import { authPlugin } from '../../plugins/auth.plugin'
import { characterService } from '../characters/characters.service'
import { canManageGameSession } from '../../lib/gestione-access'
import { canAccessPrivateChatAsync } from '../housing/housing.service'
import {
  createGameSession,
  getGameSession,
  getActiveSessionInRoom,
  getOpenSessionInRoom,
  setSessionParticipants,
  freezeGameSession,
  resumeGameSession,
  closeGameSession,
  cancelGameSession,
  refreshSessionParticipants,
  getCharacterSessions,
  getGameSessionMessages,
} from './game-sessions.service'

export const gameSessionsRoutes = new Elysia({ prefix: '/game-sessions' })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      // Crea una nuova registrazione giocata
      .post(
        '/',
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
            const roomId = body.roomId
            if (roomId.startsWith('housing_')) {
              const hasAccess = await canAccessPrivateChatAsync(char.id, roomId, user, char)
              if (!hasAccess) {
                set.status = 403
                return { error: 'Accesso negato a questa chat privata' }
              }
            }

            const session = await createGameSession(
              char.id,
              roomId,
              body.fetchId || null,
              body.title || null,
              body.questId || null,
              body.participantIds ?? null,
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
            questId: t.Optional(t.String()),
            participantIds: t.Optional(t.Array(t.String())),
          }),
        }
      )

      // Sessione aperta in room (ACTIVE o FROZEN — per ripresa registrazione congelata)
      .get(
        '/room/:roomId/open',
        async ({ params, user, set }) => {
          try {
            const roomId = params.roomId
            if (roomId.startsWith('housing_')) {
              const char = await characterService.getCharacterByUserId(user!.id)
              if (!char || !(await canAccessPrivateChatAsync(char.id, roomId, user!, char))) {
                set.status = 403
                return { error: 'Accesso negato a questa chat privata' }
              }
            }
            const session = await getOpenSessionInRoom(roomId)
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

      // Ottiene la sessione attiva in una room
      .get(
        '/room/:roomId/active',
        async ({ params, user, set }) => {
          try {
            const roomId = params.roomId
            if (roomId.startsWith('housing_')) {
              const char = await characterService.getCharacterByUserId(user!.id)
              if (!char || !(await canAccessPrivateChatAsync(char.id, roomId, user!, char))) {
                set.status = 403
                return { error: 'Accesso negato a questa chat privata' }
              }
            }
            const session = await getActiveSessionInRoom(roomId)
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

      // Messaggi di una giocata (solo per partecipanti/creator – per Leggi da Scheda/Registrazioni)
      .get(
        '/:id/messages',
        async ({ params, user, set }) => {
          try {
            const char = await characterService.getCharacterByUserId(user!.id)
            if (!char) {
              set.status = 401
              return { error: 'Personaggio non trovato' }
            }
            const session = await getGameSession(params.id)
            if (!session) {
              set.status = 404
              return { error: 'Sessione non trovata' }
            }
            if (session.status !== 'CLOSED') {
              set.status = 400
              return { error: 'Solo sessioni chiuse hanno messaggi consultabili' }
            }
            const isCreator = session.creatorId === char.id
            const isParticipant = session.participants?.some((p: { characterId: string }) => p.characterId === char.id)
            const isFetchCreator = !!session.fetch?.creatorId && session.fetch.creatorId === char.id
            if (!isCreator && !isParticipant && !isFetchCreator) {
              set.status = 403
              return { error: 'Puoi leggere solo le tue giocate' }
            }
            const messages = await getGameSessionMessages(params.id)
            return { session: { id: session.id, title: session.title, roomId: session.roomId }, messages }
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore recupero messaggi' }
          }
        },
        { params: t.Object({ id: t.String() }) }
      )

      // Ottiene una sessione specifica
      .get(
        '/:id',
        async ({ params, user, set }) => {
          try {
            const session = await getGameSession(params.id)
            if (!session) {
              set.status = 404
              return { error: 'Sessione non trovata' }
            }
            const roomId = session.roomId
            if (roomId.startsWith('housing_')) {
              const char = await characterService.getCharacterByUserId(user!.id)
              if (!char || !(await canAccessPrivateChatAsync(char.id, roomId, user!, char))) {
                set.status = 403
                return { error: 'Accesso negato a questa chat privata' }
              }
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

      // Dichiara partecipanti alla registrazione (merge, senza rimuovere azioni da chat)
      .post(
        '/:id/participants',
        async ({ params, body, user, set }) => {
          try {
            const char = await characterService.getCharacterByUserId(user!.id)
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }
            const session = await getGameSession(params.id)
            if (!session) {
              set.status = 404
              return { error: 'Sessione non trovata' }
            }
            const meta = (char.uiMetadata as { roleIcon?: string } | null) ?? {}
            const roleIcon = (meta.roleIcon ?? '').toLowerCase()
            const canManage = canManageGameSession(
              user!.role,
              roleIcon,
              session.creatorId,
              char.id,
            )
            if (!canManage) {
              set.status = 403
              return { error: 'Solo il creatore o cariche superiori possono aggiornare i partecipanti' }
            }
            if (session.status !== 'ACTIVE' && session.status !== 'FROZEN') {
              set.status = 400
              return { error: 'Sessione non modificabile' }
            }
            const updated = await setSessionParticipants(params.id, body.participantIds)
            return updated
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante l\'aggiornamento' }
          }
        },
        {
          params: t.Object({ id: t.String() }),
          body: t.Object({
            participantIds: t.Array(t.String()),
          }),
        }
      )

      // Aggiorna i partecipanti di una sessione (solo creatore o cariche superiori)
      .post(
        '/:id/refresh-participants',
        async ({ params, user, set }) => {
          try {
            const char = await characterService.getCharacterByUserId(user!.id)
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }
            const session = await getGameSession(params.id)
            if (!session) {
              set.status = 404
              return { error: 'Sessione non trovata' }
            }
            const meta = (char.uiMetadata as { roleIcon?: string } | null) ?? {}
            const roleIcon = (meta.roleIcon ?? '').toLowerCase()
            const canManage = canManageGameSession(
              user!.role,
              roleIcon,
              session.creatorId,
              char.id,
            )
            if (!canManage) {
              set.status = 403
              return { error: 'Solo il creatore o cariche superiori possono aggiornare i partecipanti' }
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

      // Congela una sessione (solo creatore o cariche superiori)
      .post(
        '/:id/freeze',
        async ({ params, user, set }) => {
          try {
            const char = await characterService.getCharacterByUserId(user!.id)
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }
            const session = await getGameSession(params.id)
            if (!session) {
              set.status = 404
              return { error: 'Sessione non trovata' }
            }
            const meta = (char.uiMetadata as { roleIcon?: string } | null) ?? {}
            const roleIcon = (meta.roleIcon ?? '').toLowerCase()
            const canManage = canManageGameSession(
              user!.role,
              roleIcon,
              session.creatorId,
              char.id,
            )
            if (!canManage) {
              set.status = 403
              return { error: 'Solo il creatore o cariche superiori possono congelare la sessione' }
            }
            const updated = await freezeGameSession(params.id)
            return updated
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante il congelamento' }
          }
        },
        {
          params: t.Object({ id: t.String() }),
        }
      )

      // Riavvia una sessione congelata (solo creatore o cariche superiori)
      .post(
        '/:id/resume',
        async ({ params, user, set }) => {
          try {
            const char = await characterService.getCharacterByUserId(user!.id)
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }
            const session = await getGameSession(params.id)
            if (!session) {
              set.status = 404
              return { error: 'Sessione non trovata' }
            }
            const meta = (char.uiMetadata as { roleIcon?: string } | null) ?? {}
            const roleIcon = (meta.roleIcon ?? '').toLowerCase()
            const canManage = canManageGameSession(
              user!.role,
              roleIcon,
              session.creatorId,
              char.id,
            )
            if (!canManage) {
              set.status = 403
              return { error: 'Solo il creatore o cariche superiori possono riavviare la sessione' }
            }
            const updated = await resumeGameSession(params.id)
            return updated
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante il riavvio' }
          }
        },
        {
          params: t.Object({ id: t.String() }),
        }
      )

      // Chiude una sessione (solo creatore o cariche superiori)
      .post(
        '/:id/close',
        async ({ params, user, set }) => {
          try {
            const char = await characterService.getCharacterByUserId(user!.id)
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }
            const session = await getGameSession(params.id)
            if (!session) {
              set.status = 404
              return { error: 'Sessione non trovata' }
            }
            const meta = (char.uiMetadata as { roleIcon?: string } | null) ?? {}
            const roleIcon = (meta.roleIcon ?? '').toLowerCase()
            const canManage = canManageGameSession(
              user!.role,
              roleIcon,
              session.creatorId,
              char.id,
            )
            if (!canManage) {
              set.status = 403
              return { error: 'Solo il creatore o cariche superiori possono chiudere la sessione' }
            }
            const updated = await closeGameSession(params.id)
            return updated
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante la chiusura' }
          }
        },
        {
          params: t.Object({ id: t.String() }),
        }
      )

      // Annulla una sessione (solo creatore o cariche superiori)
      .post(
        '/:id/cancel',
        async ({ params, user, set }) => {
          try {
            const char = await characterService.getCharacterByUserId(user!.id)
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }
            const session = await getGameSession(params.id)
            if (!session) {
              set.status = 404
              return { error: 'Sessione non trovata' }
            }
            const meta = (char.uiMetadata as { roleIcon?: string } | null) ?? {}
            const roleIcon = (meta.roleIcon ?? '').toLowerCase()
            const canManage = canManageGameSession(
              user!.role,
              roleIcon,
              session.creatorId,
              char.id,
            )
            if (!canManage) {
              set.status = 403
              return { error: 'Solo il creatore o cariche superiori possono annullare la sessione' }
            }
            const updated = await cancelGameSession(params.id)
            return updated
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante l\'annullamento' }
          }
        },
        {
          params: t.Object({ id: t.String() }),
        }
      )

      // Ottiene tutte le sessioni del proprio personaggio (solo le proprie)
      .get(
        '/character/:characterId',
        async ({ params, query, user, set }) => {
          try {
            const char = await characterService.getCharacterByUserId(user!.id)
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }
            if (params.characterId !== char.id) {
              set.status = 403
              return { error: 'Puoi visualizzare solo le tue sessioni' }
            }
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
