import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { JWT_SECRET } from '../config' // 👈 Usa lo stesso file!

export const isAuthenticated = (app: Elysia) =>
  app
    .use(
      jwt({
        name: 'jwt',
        secret: JWT_SECRET,
      })
    )
    .derive(async ({ jwt, headers, set }) => {
      const authHeader = headers['authorization']

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // Nessun token, ritorniamo null (sarà bloccato dopo)
        return { user: null }
      }

      const token = authHeader.slice(7)
      
      // Verifica con il segreto condiviso
      const payload = await jwt.verify(token)

      if (!payload) {
        console.error("❌ ERRORE VERIFICA JWT: Firma non valida o token scaduto")
        return { user: null }
      }

      // ✅ LOG DI DEBUG (Vedrai questo nel terminale del Server se funziona)
      console.log("✅ JWT Verificato. Payload:", payload)

      return {
        user: {
          // Importante: Elysia/JWT spesso mette l'ID in 'sub' (subject)
          id: (payload.sub as string) || (payload.id as string),
          email: payload.email as string,
          role: payload.role as string
        }
      }
    })
    .onBeforeHandle(({ user, set }) => {
      if (!user) {
        set.status = 401
        throw new Error('Unauthorized: Token non valido o scaduto')
      }
    })