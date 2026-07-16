import { Elysia, t } from 'elysia'
import { authPlugin } from '../../plugins/auth.plugin'
import { taxonomyStatutesService } from './taxonomy-statutes.service'
import { userHasSviluppoAccess } from '../../lib/gestione-access'

export const taxonomyStatutesRoutes = new Elysia({ prefix: '/taxonomy' })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      /**
       * GET /taxonomy/statutes
       * Restituisce tutti gli statuti salvati (pubblico per chi è loggato).
       */
      .get('/statutes', async () => {
        return taxonomyStatutesService.getAll()
      })

      /**
       * PUT /taxonomy/statutes/:kind/:entryId
       * Aggiorna (o crea) statute e/o descrizione_meccanica per una voce.
       * Riservato allo staff con accesso Sviluppo (proprietario/moderatore/fixer/admin).
       */
      .put(
        '/statutes/:kind/:entryId',
        async ({ params, body, user, error }) => {
          if (!user) return error(401, 'Non autenticato')
          const canEdit = await userHasSviluppoAccess(user.id, user.role)
          if (!canEdit) return error(403, 'Accesso riservato allo staff Sviluppo.')
          await taxonomyStatutesService.upsert(params.kind, params.entryId, body)
          return { ok: true }
        },
        {
          body: t.Object({
            statute: t.Optional(t.String()),
            sottotitolo: t.Optional(t.String()),
            descrizione_meccanica: t.Optional(t.String()),
          }),
        }
      )
  )
