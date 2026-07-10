import { Elysia } from 'elysia'
import { inArray } from 'drizzle-orm'
import { getLevelFromExp, getParagonFromExp } from '@domain/progression'
import { authPlugin } from '../../plugins/auth.plugin'
import { db } from '../../plugins/db'
import { characters } from '../../db/schema'
import * as presence from './presence.store'

export const presenceRoutes = new Elysia({ prefix: '/presence' })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      // Endpoint HTTP per ottenere tutti gli utenti online
      .get('/all', async ({ user, set }) => {
        try {
          if (user?.characterId) {
            presence.touchOnline(user.characterId);
          }
          const allUsers = presence.getAllOnlineUsers()
          // Assicuriamoci di restituire sempre un array
          if (!Array.isArray(allUsers)) {
            return []
          }
          const characterIds = allUsers.map((u) => u.characterId)
          const expByCharacter = new Map<string, number>()
          if (characterIds.length > 0) {
            const rows = await db
              .select({ id: characters.id, experienceTotal: characters.experienceTotal })
              .from(characters)
              .where(inArray(characters.id, characterIds))
            for (const row of rows) {
              expByCharacter.set(row.id, row.experienceTotal ?? 0)
            }
          }
          const PARADISE_ROOM = 'edo__paradise'
          return allUsers
            .map((u) => {
              const expTotal = expByCharacter.get(u.characterId) ?? 0
              const level = getLevelFromExp(expTotal)
              const paragon = getParagonFromExp(expTotal)
              return {
                id: u.characterId,
                name: u.name,
                room: presence.getRoomForCharacter(u.characterId) ?? null,
                isShadow: u.isShadow ?? false,
                level,
                paragon,
              }
            })
            .filter((u) => u.room !== PARADISE_ROOM) // Partecipanti Paradise non compaiono in mappa
        } catch (error) {
          console.error('[Presence] Errore recupero utenti online:', error)
          set.status = 500
          // Restituiamo un array vuoto invece di un errore per evitare problemi nel frontend
          return []
        }
      })
      // Logout esplicito: rimuove subito dalla lista Presenti
      .post('/logout', ({ user, set }) => {
        if (!user?.characterId) {
          set.status = 400
          return { ok: false }
        }
        presence.forceOffline(user.characterId)
        return { ok: true }
      })
  )
