import { Elysia, t } from 'elysia'
import { authPlugin } from '../../plugins/auth.plugin'
import { taxonomyStatutesService } from './taxonomy-statutes.service'
import { userCanUpsertStatuti } from '../../lib/gestione-access'

const upsertBody = t.Object({
  statute: t.Optional(t.String()),
  atto: t.Optional(t.String()),
  sottotitolo: t.Optional(t.String()),
  descrizione_meccanica: t.Optional(t.String()),
})

function registerStatutiHandlers(app: Elysia) {
  return app
    .get('/', async () => taxonomyStatutesService.getAll())
    .put(
      '/:kind/:entryId',
      async ({ params, body, user, error }) => {
        if (!user) return error(401, 'Non autenticato')
        const canEdit = await userCanUpsertStatuti(user.id, user.role, params.kind)
        if (!canEdit) return error(403, 'Accesso riservato allo staff Sviluppo.')
        await taxonomyStatutesService.upsert(params.kind, params.entryId, body)
        return { ok: true }
      },
      { body: upsertBody },
    )
}

/** API canonica — GET /statuti · PUT /statuti/:kind/:entryId */
export const statutiRoutes = new Elysia({ prefix: '/statuti' })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) => registerStatutiHandlers(app))

/** @deprecated alias — GET /taxonomy/statutes */
export const taxonomyStatutesRoutes = new Elysia({ prefix: '/taxonomy' })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      .get('/statutes', async () => taxonomyStatutesService.getAll())
      .put(
        '/statutes/:kind/:entryId',
        async ({ params, body, user, error }) => {
          if (!user) return error(401, 'Non autenticato')
          const canEdit = await userCanUpsertStatuti(user.id, user.role, params.kind)
          if (!canEdit) return error(403, 'Accesso riservato allo staff Sviluppo.')
          await taxonomyStatutesService.upsert(params.kind, params.entryId, body)
          return { ok: true }
        },
        { body: upsertBody },
      ),
  )
