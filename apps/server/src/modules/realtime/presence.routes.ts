import { Elysia } from 'elysia'
import { authPlugin } from '../../plugins/auth.plugin'
import * as presence from './presence.store'

export const presenceRoutes = new Elysia({ prefix: '/presence' })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      // Endpoint HTTP per ottenere tutti gli utenti online
      .get('/all', async ({ set }) => {
        try {
          const allUsers = presence.getAllOnlineUsers()
          // Assicuriamoci di restituire sempre un array
          if (!Array.isArray(allUsers)) {
            return []
          }
          return allUsers.map((u) => ({
            id: u.characterId,
            name: u.name,
            room: presence.getRoom(u.wsId) ?? null,
          }))
        } catch (error) {
          console.error('[Presence] Errore recupero utenti online:', error)
          set.status = 500
          // Restituiamo un array vuoto invece di un errore per evitare problemi nel frontend
          return []
        }
      })
  )
