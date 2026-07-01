import { Elysia, t } from 'elysia'
import { eq } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { characters } from '../../db/schema'
import { authPlugin } from '../../plugins/auth.plugin'
import {
  processDailyTickForAllCharacters,
  processDailyTickForCharacter,
  getCharacterLedger,
} from './daily-tick.service'

export const dailyTickRoutes = new Elysia({ prefix: '/daily-tick' })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      // Esegue il daily tick per tutti i personaggi (solo Admin/Mod)
      .post(
        '/process-all',
        async ({ user, set }) => {
          if (!user) {
            set.status = 401;
            return { error: "Non autenticato" };
          }
          try {
            // Verifica permessi (solo Admin/Mod)
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }

            // Verifica se è Admin/Mod (da implementare meglio)
            // Per ora permetto a tutti, ma in produzione dovrebbe essere ristretto
            const result = await processDailyTickForAllCharacters()
            return result
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante il daily tick' }
          }
        }
      )

      // Esegue il daily tick per il personaggio corrente
      .post(
        '/process-me',
        async ({ user, set }) => {
          if (!user) {
            set.status = 401;
            return { error: "Non autenticato" };
          }
          try {
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }

            const result = await processDailyTickForCharacter(char.id)
            return result
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante il daily tick' }
          }
        }
      )

      // Ottiene lo storico del ledger per il personaggio corrente
      .get(
        '/ledger/me',
        async ({ user, query, set }) => {
          if (!user) {
            set.status = 401;
            return { error: "Non autenticato" };
          }
          try {
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }

            const limit = Math.min(Number(query.limit) || 50, 100)
            const entries = await getCharacterLedger(char.id, limit)
            return entries
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante il recupero' }
          }
        },
        {
          query: t.Object({
            limit: t.Optional(t.String()),
          }),
        }
      )
  )
