import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { eq, ilike, and, gt, isNull } from 'drizzle-orm'
import { randomBytes } from 'crypto'

import { db } from '../../plugins/db'
import { users, characters, passwordResetTokens } from '../../db/schema'
import { JWT_SECRET } from '../../config'
import { registerUser } from './auth.service'
import { sendPasswordResetEmail, sendRegistrationEmails } from '../../lib/email'

export const authRoutes = new Elysia({ prefix: '/auth' })
  .use(jwt({ name: 'jwt', secret: JWT_SECRET }))

  .get('/check-character-name', async ({ query }) => {
    const name = query.name?.trim() ?? ''
    if (name.length < 2 || name.length > 30) {
      return { available: false }
    }
    const existing = await db.query.characters.findFirst({
      where: ilike(characters.name, name),
    })
    return { available: !existing }
  }, {
    query: t.Object({
      name: t.String({ minLength: 1, maxLength: 30 }),
    }),
  })

  // ===================== REGISTER =====================
  .post('/register', async ({ body, set }) => {
    try {
      const result = await registerUser(
        body.email,
        body.password,
        body.characterName,
        body.playerPreferences,
      )

      const emailResult = await sendRegistrationEmails({
        email: body.email,
        password: body.password,
        characterName: body.characterName,
        userId: result.user.id,
        playerPreferences: body.playerPreferences?.trim(),
      })

      const emailsOk = emailResult.welcome.ok && emailResult.staff.ok
      if (!emailsOk) {
        console.warn('[auth] Utente creato ma email non inviate per intero:', {
          characterName: body.characterName,
          welcome: emailResult.welcome.error,
          staff: emailResult.staff.error,
        })
      }

      set.status = 201
      return {
        success: true,
        userId: result.user.id,
        characterId: result.character.id,
        message: 'Utente registrato con successo!',
        emailsSent: emailsOk,
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Errore durante la registrazione'
      console.error('[auth] Errore durante la registrazione:', e)
      if (msg === 'User already exists') {
        set.status = 409
        return { error: 'Questa email è già stata utilizzata.', code: 'EMAIL_TAKEN' }
      }
      if (msg === 'Character name taken') {
        set.status = 409
        return { error: 'Nome personaggio già in uso.', code: 'CHARACTER_NAME_TAKEN' }
      }
      set.status = 500
      return { error: 'Errore interno del server durante la registrazione.' }
    }
  }, {
    body: t.Object({
      email: t.String({ format: 'email' }),
      password: t.String({ minLength: 8 }),
      characterName: t.String({ minLength: 2, maxLength: 30 }),
      playerPreferences: t.Optional(t.String({ maxLength: 4000 })),
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

      const token = randomBytes(32).toString('hex')
      const tokenHash = await Bun.password.hash(token, { algorithm: 'bcrypt', cost: 10 })
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 ora

      await db.insert(passwordResetTokens).values({
        userId: u.id,
        tokenHash,
        expiresAt,
      })

      const { ok, error } = await sendPasswordResetEmail(u.email, token)
      if (!ok) {
        set.status = 500
        return { error: error || "Errore nell'invio email." }
      }

      set.status = 200
      return { success: true, message: "Se l'email è registrata, riceverai un link di reset." }
    } catch (e: unknown) {
      console.error('[auth] forgot-password error:', e)
      set.status = 500
      return { error: "Errore interno." }
    }
  }, {
    body: t.Object({ email: t.String({ format: 'email' }) }),
  })

  // ===================== RESET PASSWORD (con token) =====================
  .post('/reset-password', async ({ body, set }) => {
    try {
      const { token, newPassword } = body
      if (!token || newPassword.length < 8) {
        set.status = 400
        return { error: "Token mancante o password non valida (min 8 caratteri)." }
      }

      const rows = await db.query.passwordResetTokens.findMany({
        where: and(
          gt(passwordResetTokens.expiresAt, new Date()),
          isNull(passwordResetTokens.usedAt)
        ),
      })

      let matched = false
      for (const row of rows) {
        const ok = await Bun.password.verify(token, row.tokenHash)
        if (ok && row.userId) {
          matched = true
          const passwordHash = await Bun.password.hash(newPassword, { algorithm: 'bcrypt', cost: 10 })
          await db.update(users).set({ passwordHash }).where(eq(users.id, row.userId))
          await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, row.id))
          set.status = 200
          return { success: true, message: "Password aggiornata. Puoi effettuare il login." }
        }
      }

      set.status = 400
      return { error: "Token non valido o scaduto. Richiedi un nuovo link." }
    } catch (e: unknown) {
      console.error('[auth] reset-password error:', e)
      set.status = 500
      return { error: "Errore interno." }
    }
  }, {
    body: t.Object({
      token: t.String({ minLength: 1 }),
      newPassword: t.String({ minLength: 8 }),
    }),
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