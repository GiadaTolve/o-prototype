import { Elysia, t } from 'elysia'
import { authPlugin } from '../../plugins/auth.plugin'
import { userHasGestioneAccess } from '../../lib/gestione-access'
import { characterService } from '../characters/characters.service'
import { playerRequestsService } from './player-requests.service'
import { isSokaijuGateOpen } from '@domain/skiru/progression'
import { getActiveJigaMilestone, getJigaMilestoneLabel } from '@domain/skiru/exclusive-skiru'
import { PREMIO_REQUEST_OPTIONS } from '@domain/progression/player-requests'

export const playerRequestsRoutes = new Elysia({ prefix: '/player-requests' })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      .get('/me', async ({ user, set }) => {
        if (!user) {
          set.status = 401
          return { error: 'Unauthorized' }
        }
        try {
          const char = await characterService.getCharacterByUserId(user.id)
          if (!char) {
            set.status = 404
            return { error: 'Personaggio non trovato' }
          }
          const skiruSheet = (char.skiruSheet ?? {}) as Record<string, number>
          const requests = await playerRequestsService.listForCharacter(char.id)
          const activeExclusive = getActiveJigaMilestone(skiruSheet)
          return {
            requests,
            premioOptions: PREMIO_REQUEST_OPTIONS,
            assigned: {
              madoshoId: char.madoshoId ?? null,
              order: char.order ?? 'NONE',
              premioSpeciale:
                ((char.uiMetadata as { premioSpeciale?: string } | null)?.premioSpeciale as
                  | string
                  | undefined) ?? null,
              exclusiveSkiruId: activeExclusive,
              exclusiveSkiruLabel: activeExclusive
                ? getJigaMilestoneLabel(activeExclusive)
                : null,
              tenkanOpen: isSokaijuGateOpen(skiruSheet),
            },
          }
        } catch (e) {
          set.status = 500
          return { error: 'Internal Server Error' }
        }
      })
      .put('/me', async ({ user, body, set }) => {
        if (!user) {
          set.status = 401
          return { error: 'Unauthorized' }
        }
        try {
          const char = await characterService.getCharacterByUserId(user.id)
          if (!char) {
            set.status = 404
            return { error: 'Personaggio non trovato' }
          }
          const results = []
          for (const item of body.requests) {
            const row = await playerRequestsService.upsertRequest(
              char.id,
              item.kind,
              item.requestedValue,
            )
            results.push(row)
          }
          return { requests: results }
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore invio richiesta' }
        }
      }, {
        body: t.Object({
          requests: t.Array(
            t.Object({
              kind: t.Union([
                t.Literal('MADOSHO'),
                t.Literal('ORDER'),
                t.Literal('SKIRU_ESCLUSIVA'),
                t.Literal('PREMIO'),
                t.Literal('TENKAN'),
              ]),
              requestedValue: t.String({ minLength: 1 }),
            }),
            { minItems: 1 },
          ),
        }),
      })
      .get('/admin/pending-count', async ({ user, set }) => {
        if (!user) {
          set.status = 401
          return { error: 'Unauthorized' }
        }
        const allowed = await userHasGestioneAccess(user.id, user.role)
        if (!allowed) {
          set.status = 403
          return { error: 'Accesso riservato a staff Gestione' }
        }
        try {
          const count = await playerRequestsService.countPending()
          return { count }
        } catch {
          set.status = 500
          return { error: 'Internal Server Error' }
        }
      })
      .get('/admin', async ({ user, query, set }) => {
        if (!user) {
          set.status = 401
          return { error: 'Unauthorized' }
        }
        const allowed = await userHasGestioneAccess(user.id, user.role)
        if (!allowed) {
          set.status = 403
          return { error: 'Accesso riservato a staff Gestione' }
        }
        try {
          const status = query.status as 'PENDING' | 'APPROVED' | 'REJECTED' | undefined
          return await playerRequestsService.listForStaff(status)
        } catch {
          set.status = 500
          return { error: 'Internal Server Error' }
        }
      })
      .post('/admin/:id/approve', async ({ user, params, body, set }) => {
        if (!user) {
          set.status = 401
          return { error: 'Unauthorized' }
        }
        const allowed = await userHasGestioneAccess(user.id, user.role)
        if (!allowed) {
          set.status = 403
          return { error: 'Accesso riservato a staff Gestione' }
        }
        try {
          const row = await playerRequestsService.reviewRequest(
            params.id,
            user.id,
            'APPROVED',
            body.staffNote,
          )
          return row
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore approvazione' }
        }
      }, {
        params: t.Object({ id: t.String() }),
        body: t.Object({ staffNote: t.Optional(t.String()) }),
      })
      .post('/admin/:id/reject', async ({ user, params, body, set }) => {
        if (!user) {
          set.status = 401
          return { error: 'Unauthorized' }
        }
        const allowed = await userHasGestioneAccess(user.id, user.role)
        if (!allowed) {
          set.status = 403
          return { error: 'Accesso riservato a staff Gestione' }
        }
        try {
          const row = await playerRequestsService.reviewRequest(
            params.id,
            user.id,
            'REJECTED',
            body.staffNote,
          )
          return row
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore rifiuto' }
        }
      }, {
        params: t.Object({ id: t.String() }),
        body: t.Object({ staffNote: t.Optional(t.String()) }),
      })
      .post('/admin/:id/lock', async ({ user, params, body, set }) => {
        if (!user) {
          set.status = 401
          return { error: 'Unauthorized' }
        }
        const allowed = await userHasGestioneAccess(user.id, user.role)
        if (!allowed) {
          set.status = 403
          return { error: 'Accesso riservato ad Admin e Moderatore' }
        }
        try {
          const row = await playerRequestsService.setRequestLocked(params.id, body.locked)
          return row
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore aggiornamento lucchetto' }
        }
      }, {
        params: t.Object({ id: t.String() }),
        body: t.Object({ locked: t.Boolean() }),
      }),
  )
