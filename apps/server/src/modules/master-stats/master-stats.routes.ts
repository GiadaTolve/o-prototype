import { Elysia, t } from 'elysia'
import { authPlugin } from '../../plugins/auth.plugin'
import { eq } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { characters, users } from '../../db/schema'
import {
  getMasterStats,
  getUserShineRanking,
  getMasterDetail,
} from './master-stats.service'

export const masterStatsRoutes = new Elysia({ prefix: '/master-stats' })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      // Ottiene le statistiche dei master per il mese corrente (solo Admin/Mod)
      .get(
        '/masters',
        async ({ user, query, set }) => {
          try {
            // Verifica permessi (solo Admin/Mod)
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }

            const userData = await db.query.users.findFirst({
              where: eq(users.id, user.id),
            })

            if (!userData || (userData.role !== 'ADMIN' && userData.role !== 'MASTER')) {
              // Verifica anche se è moderatore tramite uiMetadata
              const isMod = char.uiMetadata?.roleIcon === 'moderatore' || char.uiMetadata?.roleIcon === 'admin'
              if (!isMod) {
                set.status = 403
                return { error: 'Accesso negato. Solo Admin/Mod possono vedere questa sezione.' }
              }
            }

            const month = query.month ? Number(query.month) : undefined
            const year = query.year ? Number(query.year) : undefined

            const stats = await getMasterStats(month, year)
            return stats
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante il recupero' }
          }
        },
        {
          query: t.Object({
            month: t.Optional(t.String()),
            year: t.Optional(t.String()),
          }),
        }
      )

      // Ottiene la classifica utenti per punti shine
      .get(
        '/user-shine-ranking',
        async ({ user, query, set }) => {
          try {
            // Verifica permessi (solo Admin/Mod)
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }

            const userData = await db.query.users.findFirst({
              where: eq(users.id, user.id),
            })

            if (!userData || (userData.role !== 'ADMIN' && userData.role !== 'MASTER')) {
              const isMod = char.uiMetadata?.roleIcon === 'moderatore' || char.uiMetadata?.roleIcon === 'admin'
              if (!isMod) {
                set.status = 403
                return { error: 'Accesso negato. Solo Admin/Mod possono vedere questa sezione.' }
              }
            }

            const month = query.month ? Number(query.month) : undefined
            const year = query.year ? Number(query.year) : undefined

            const ranking = await getUserShineRanking(month, year)
            return ranking
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante il recupero' }
          }
        },
        {
          query: t.Object({
            month: t.Optional(t.String()),
            year: t.Optional(t.String()),
          }),
        }
      )

      // Ottiene statistiche dettagliate per un singolo master
      .get(
        '/master/:masterId',
        async ({ params, user, query, set }) => {
          try {
            // Verifica permessi (solo Admin/Mod)
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }

            const userData = await db.query.users.findFirst({
              where: eq(users.id, user.id),
            })

            if (!userData || (userData.role !== 'ADMIN' && userData.role !== 'MASTER')) {
              const isMod = char.uiMetadata?.roleIcon === 'moderatore' || char.uiMetadata?.roleIcon === 'admin'
              if (!isMod) {
                set.status = 403
                return { error: 'Accesso negato. Solo Admin/Mod possono vedere questa sezione.' }
              }
            }

            const month = query.month ? Number(query.month) : undefined
            const year = query.year ? Number(query.year) : undefined

            const detail = await getMasterDetail(params.masterId, month, year)
            return detail
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante il recupero' }
          }
        },
        {
          params: t.Object({ masterId: t.String() }),
          query: t.Object({
            month: t.Optional(t.String()),
            year: t.Optional(t.String()),
          }),
        }
      )
  )
