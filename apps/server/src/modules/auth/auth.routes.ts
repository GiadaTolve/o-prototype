import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { eq, ilike } from 'drizzle-orm'

import { db } from '../../plugins/db'
import { users, characters } from '../../db/schema'
import { JWT_SECRET } from '../../config'
import { registerUser } from './auth.service'

export const authRoutes = new Elysia({ prefix: '/auth' })
  .use(jwt({ name: 'jwt', secret: JWT_SECRET }))

  // ===================== REGISTER =====================
  .post('/register', async ({ body, set }) => {
    try {
      const result = await registerUser(body.email, body.password, body.characterName)
      set.status = 201
      return {
        success: true,
        userId: result.user.id,
        characterId: result.character.id,
        message: "Account e Personaggio creati con successo!",
      }
    } catch (e: unknown) {
      set.status = 400
      return { error: e instanceof Error ? e.message : "Errore durante la registrazione" }
    }
  }, {
    body: t.Object({
      email: t.String({ format: 'email' }),
      password: t.String({ minLength: 8 }),
      characterName: t.String({ minLength: 2, maxLength: 30 }),
    }),
  })

  // ===================== LOGIN (Nome PG + Password) =====================
  .post('/login', async ({ body, set, jwt }) => {
    try {
      const char = await db.query.characters.findFirst({
        where: ilike(characters.name, body.nomePg),
        with: { user: true },
      })
      if (!char?.user) {
        set.status = 401
        return { error: "Nome PG o password non validi" }
      }
      const user = char.user as { id: string; passwordHash: string; email: string; role: string; banState: string }
      const ok = await Bun.password.verify(body.password, user.passwordHash)
      if (!ok) {
        set.status = 401
        return { error: "Nome PG o password non validi" }
      }
      const token = await jwt.sign({
        id: user.id,
        sub: user.id,
        email: user.email,
        role: user.role,
        banState: user.banState,
      })
      set.status = 200
      return { success: true, token, user: { id: user.id, email: user.email } }
    } catch (e: unknown) {
      set.status = 500
      return { error: "Errore interno durante il login" }
    }
  }, {
    body: t.Object({
      nomePg: t.String({ minLength: 1 }),
      password: t.String(),
    }),
  })

  // ===================== RECUPERO PASSWORD (tramite email) =====================
  .post('/forgot-password', async ({ body, set }) => {
    try {
      const u = await db.query.users.findFirst({
        where: eq(users.email, body.email),
      })
      if (!u) {
        set.status = 200
        return { success: true, message: "Se l'email è registrata, riceverai un link di reset." }
      }
      // TODO: generare token, salvare in DB, inviare email. Per ora risposta generica.
      set.status = 200
      return { success: true, message: "Se l'email è registrata, riceverai un link di reset." }
    } catch {
      set.status = 500
      return { error: "Errore interno." }
    }
  }, {
    body: t.Object({ email: t.String({ format: 'email' }) }),
  })

  // =====================
  // ME (Check Token)
  // =====================
  .get('/me', async ({ jwt, headers, set }) => {
    const authHeader = headers['authorization']

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      set.status = 401
      return { error: 'Token mancante' }
    }

    const token = authHeader.slice(7)
    // Verifica usando lo stesso segreto del login
    const payload = await jwt.verify(token)

    if (!payload) {
      set.status = 401
      return { error: 'Token non valido o scaduto' }
    }
    
    return {
      message: "Sei autenticato!",
      user: payload
    }
  })