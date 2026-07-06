import { Elysia, t } from 'elysia'
import { eq } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { characters } from '../../db/schema'
import { authPlugin } from '../../plugins/auth.plugin'
import {
  getMedicoCraftInventory,
  getMedicoHealTargets,
  getMedicoToolState,
  medicoCraftPreparation,
  medicoHealCharacter,
} from './medico.service'

export const medicoRoutes = new Elysia({ prefix: '/medico' })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      .get('/me/status', async ({ user, set }) => {
        if (!user) {
          set.status = 401
          return { error: 'Unauthorized' }
        }
        try {
          const char = await db.query.characters.findFirst({
            where: eq(characters.userId, user.id),
          })
          if (!char) {
            set.status = 404
            return { error: 'Personaggio non trovato' }
          }
          return await getMedicoToolState(char.id)
        } catch (e: unknown) {
          set.status = 403
          return { error: e instanceof Error ? e.message : 'Accesso negato' }
        }
      })
      .get('/me/heal-targets', async ({ user, set }) => {
        if (!user) {
          set.status = 401
          return { error: 'Unauthorized' }
        }
        try {
          const char = await db.query.characters.findFirst({
            where: eq(characters.userId, user.id),
          })
          if (!char) {
            set.status = 404
            return { error: 'Personaggio non trovato' }
          }
          return await getMedicoHealTargets(char.id)
        } catch (e: unknown) {
          set.status = 403
          return { error: e instanceof Error ? e.message : 'Accesso negato' }
        }
      })
      .get('/me/materials', async ({ user, set }) => {
        if (!user) {
          set.status = 401
          return { error: 'Unauthorized' }
        }
        try {
          const char = await db.query.characters.findFirst({
            where: eq(characters.userId, user.id),
          })
          if (!char) {
            set.status = 404
            return { error: 'Personaggio non trovato' }
          }
          return await getMedicoCraftInventory(char.id)
        } catch (e: unknown) {
          set.status = 403
          return { error: e instanceof Error ? e.message : 'Accesso negato' }
        }
      })
      .post(
        '/me/heal',
        async ({ body, user, set }) => {
          if (!user) {
            set.status = 401
            return { error: 'Unauthorized' }
          }
          try {
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }
            return await medicoHealCharacter(char.id, body)
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Cura fallita' }
          }
        },
        {
          body: t.Object({
            targetCharacterId: t.String(),
            amount: t.Number({ minimum: 1, maximum: 999 }),
            roomId: t.Optional(t.String()),
          }),
        },
      )
      .post(
        '/me/craft',
        async ({ body, user, set }) => {
          if (!user) {
            set.status = 401
            return { error: 'Unauthorized' }
          }
          try {
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }
            return await medicoCraftPreparation(char.id, body.blueprintId)
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Preparazione fallita' }
          }
        },
        {
          body: t.Object({
            blueprintId: t.String(),
          }),
        },
      ),
  )
