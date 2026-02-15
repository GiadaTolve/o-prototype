import { Elysia, t } from 'elysia'
import { eq } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { characters } from '../../db/schema'
import { authPlugin } from '../../plugins/auth.plugin'
import {
  getAllJobs,
  getCharacterJob,
  changeCharacterJob,
  withdrawDailySalary,
  getCharacterLedger,
  canWithdrawSalary,
  transferRem,
  leaveJob,
} from './banca.service'

export const bancaRoutes = new Elysia({ prefix: '/banca' })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      // Ottiene tutti i job disponibili
      .get('/jobs', async () => {
        try {
          const jobs = await getAllJobs()
          return jobs
        } catch (e: unknown) {
          return { error: e instanceof Error ? e.message : 'Errore durante il recupero' }
        }
      })

      // Ottiene il job corrente del personaggio
      .get('/me/job', async ({ user, set }) => {
        try {
          const char = await db.query.characters.findFirst({
            where: eq(characters.userId, user.id),
          })
          if (!char) {
            set.status = 404
            return { error: 'Personaggio non trovato' }
          }

          const job = await getCharacterJob(char.id)
          return job
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore durante il recupero' }
        }
      })

      // Cambia il job del personaggio
      .post(
        '/me/job',
        async ({ user, body, set }) => {
          try {
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }

            const updated = await changeCharacterJob(char.id, body.jobId)
            return updated
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante il cambio job' }
          }
        },
        {
          body: t.Object({
            jobId: t.String(),
          }),
        }
      )

      // Ritira lo stipendio giornaliero
      .post('/me/withdraw-salary', async ({ user, set }) => {
        try {
          const char = await db.query.characters.findFirst({
            where: eq(characters.userId, user.id),
          })
          if (!char) {
            set.status = 404
            return { error: 'Personaggio non trovato' }
          }

          const result = await withdrawDailySalary(char.id)
          return result
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore durante il ritiro stipendio' }
        }
      })

      // Verifica se può ritirare lo stipendio
      .get('/me/can-withdraw', async ({ user, set }) => {
        try {
          const char = await db.query.characters.findFirst({
            where: eq(characters.userId, user.id),
          })
          if (!char) {
            set.status = 404
            return { error: 'Personaggio non trovato' }
          }

          const result = await canWithdrawSalary(char.id)
          return result
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore durante la verifica' }
        }
      })

      // Ottiene lo storico del ledger
      .get(
        '/me/ledger',
        async ({ user, query, set }) => {
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

      // Bonifico a un altro personaggio (per nome PG)
      .post(
        '/me/transfer',
        async ({ user, body, set }) => {
          try {
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }

            const result = await transferRem(
              char.id,
              body.receiverCharacterName,
              body.amount,
              body.reason || 'Bonifico'
            )
            return result
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante il bonifico' }
          }
        },
        {
          body: t.Object({
            receiverCharacterName: t.String(),
            amount: t.Number(),
            reason: t.Optional(t.String()),
          }),
        }
      )

      // Lascia il lavoro corrente
      .post('/me/leave-job', async ({ user, set }) => {
        try {
          const char = await db.query.characters.findFirst({
            where: eq(characters.userId, user.id),
          })
          if (!char) {
            set.status = 404
            return { error: 'Personaggio non trovato' }
          }

          const result = await leaveJob(char.id)
          return result
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore durante l\'operazione' }
        }
      })
  )
