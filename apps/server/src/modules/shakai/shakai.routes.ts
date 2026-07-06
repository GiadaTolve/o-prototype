import { Elysia, t } from 'elysia'
import { authPlugin } from '../../plugins/auth.plugin'
import { craftFromBlueprint, listCharacterBlueprints } from './shakai.service'

export const shakaiRoutes = new Elysia({ prefix: '/shakai' })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      .get('/me/blueprints', async ({ user, set }) => {
        if (!user) {
          set.status = 401
          return { error: 'Unauthorized' }
        }
        try {
          const data = await listCharacterBlueprints(user.id)
          if (!data) {
            set.status = 404
            return { error: 'Personaggio non trovato' }
          }
          return data
        } catch (e: unknown) {
          set.status = 500
          return { error: e instanceof Error ? e.message : 'Errore blueprint' }
        }
      })
      .post(
        '/me/craft',
        async ({ body, user, set }) => {
          if (!user) {
            set.status = 401
            return { error: 'Unauthorized' }
          }
          try {
            return await craftFromBlueprint(user.id, body)
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Craft fallito' }
          }
        },
        {
          body: t.Object({
            blueprintId: t.String(),
            consecratedPlace: t.Optional(t.Boolean()),
            roomId: t.Optional(t.String()),
          }),
        },
      ),
  )
