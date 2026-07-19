import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { bearer } from '@elysiajs/bearer'
import { JWT_SECRET } from '../config'
import { db } from '../plugins/db'
import { characters, users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { resolveRequestAccessToken } from '../lib/session-cookie'

export const authPlugin = (app: Elysia) =>
  app
    .use(bearer())
    .use(
      jwt({
        name: 'jwt',
        secret: JWT_SECRET,
      })
    )
    .derive(async ({ jwt, bearer, request }): Promise<{ user: { id: string; role?: string; characterId?: string } | null }> => {
      const token = resolveRequestAccessToken({
        authorization: bearer ? `Bearer ${bearer}` : request.headers.get('authorization') ?? undefined,
        cookie: request.headers.get('cookie'),
      })
      if (!token) return { user: null }

      const profile = await jwt.verify(token) as { id?: string; sub?: string; role?: string } | null
      
      if (!profile) return { user: null }

      const userId = (profile.id ?? profile.sub) as string
      
      let role = profile.role as string | undefined
      let characterId: string | undefined
      try {
        const [userRow, character] = await Promise.all([
          db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { role: true },
          }),
          db.query.characters.findFirst({
            where: eq(characters.userId, userId),
            columns: { id: true },
          }),
        ])
        if (userRow?.role) role = userRow.role
        characterId = character?.id
      } catch (e) {
        console.debug('[AuthPlugin] Errore recupero user/character:', e)
      }

      return { 
        user: { 
          id: userId,
          role,
          characterId,
        } 
      }
    })
    .macro(({ onBeforeHandle }: any) => ({
      isAuthenticated(enabled: boolean) {
        if (!enabled) return
        
        onBeforeHandle(({ user, error }: any) => {
          if (!user) return error(401, 'Unauthorized')
        })
      }
    }))
