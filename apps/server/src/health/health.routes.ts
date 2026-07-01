import { Elysia, t } from 'elysia'
import { pool } from '../plugins/db'
import { authPlugin } from '../plugins/auth.plugin'
import { setRoomOpen, getRoomState } from '../modules/anonymous-chat/anonymous-chat.service'
import { characterService } from '../modules/characters/characters.service'

const PARADISE_ROOM_ID = 'edo__paradise'

export const healthRoutes = new Elysia()
  .get('/health', () => ({
    status: 'ok',
    service: 'oyasumi-2.0'
  }))
  .get('/health/db', async () => {
    try {
      await pool.query('SELECT 1')
      return { db: 'ok' }
    } catch (err) {
      return {
        db: 'error',
        error: (err as Error).message
      }
    }
  })
  .use(authPlugin)
  .post(
    '/paradise-toggle',
    async ({ body, user, set }) => {
      if (!user) {
        set.status = 401
        return { error: 'Non autenticato' }
      }
      const role = (user?.role ?? '').toUpperCase()
      if (role !== 'ADMIN' && role !== 'MASTER' && role !== 'MODERATORE' && role !== 'MODERATOR') {
        set.status = 403
        return { error: 'Accesso riservato ad admin/moderatore/master' }
      }
      const char = await characterService.getCharacterByUserId(user.id)
      if (body.isOpen && !char) {
        set.status = 400
        return { error: 'Serve un personaggio attivo per aprire la stanza' }
      }
      if (body.isOpen && !(typeof body.sessionTitle === 'string' && body.sessionTitle.trim())) {
        set.status = 400
        return { error: 'Inserisci il nome della sessione per aprire il Circus' }
      }
      const roomId = body.roomId ?? PARADISE_ROOM_ID
      try {
        await setRoomOpen(roomId, body.isOpen, char?.id ?? '', body.sessionTitle ?? null)
        return await getRoomState(roomId)
      } catch (e) {
        const err = e as Error
        console.error('[paradise-toggle] DB error:', err.message, err.cause)
        set.status = 500
        return { error: 'Errore durante il salvataggio. Verifica che le tabelle anonymous_room_state e anonymous_participants esistano (bun run scripts/add-anonymous-chat-tables.ts).' }
      }
    },
    {
      body: t.Object({
        isOpen: t.Boolean(),
        roomId: t.Optional(t.String()),
        /** Nome sessione (obbligatorio al toggle ON). Usato come titolo della giocata "evento" al toggle OFF. */
        sessionTitle: t.Optional(t.String()),
      }),
    }
  )
