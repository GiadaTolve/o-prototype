import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { bearer } from '@elysiajs/bearer'
import { JWT_SECRET } from '../config'
import { db } from '../plugins/db'
import { characters, users } from '../db/schema'
import { eq } from 'drizzle-orm'

export const authPlugin = (app: Elysia) =>
  app
    .use(bearer())
    .use(
      jwt({
        name: 'jwt',
        secret: JWT_SECRET,
      })
    )
    // 1. Diciamo esplicitamente cosa ritorna il derive (id + role + characterId per accesso UI)
    .derive(async ({ jwt, bearer }): Promise<{ user: { id: string; role?: string; characterId?: string } | null }> => {
      if (!bearer) return { user: null }

      const profile = await jwt.verify(bearer) as { id?: string; sub?: string; role?: string } | null
      
      if (!profile) return { user: null }

      const userId = (profile.id ?? profile.sub) as string
      
      // Ruolo sempre dal DB (così cambi staff si applicano senza nuovo login)
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
    // 2. Usiamo 'as any' temporaneamente sui parametri della macro se TS fa i capricci.
    // Questo forza TS a stare zitto e accettare la logica.
    .macro(({ onBeforeHandle }: any) => ({
      isAuthenticated(enabled: boolean) {
        if (!enabled) return
        
        // Qui 'user' viene iniettato dal derive sopra
        onBeforeHandle(({ user, error }: any) => {
          if (!user) return error(401, 'Unauthorized')
        })
      }
    }))