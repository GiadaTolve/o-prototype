import { Elysia, t } from 'elysia'
import { authPlugin } from '../../plugins/auth.plugin'
import {
  getWazaCatalogEntriesSync,
  listAdminWaza,
  reloadWazaCatalog,
  upsertAdminWazaByPoolId,
} from './waza-catalog.service'

function hasStaffRole(role: string | undefined): boolean {
  const r = (role ?? '').toUpperCase()
  return r === 'ADMIN' || r === 'MASTER'
}

export const wazaRoutes = new Elysia({ prefix: '/waza' })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      .get('/catalog', async () => {
        await reloadWazaCatalog()
        return { entries: getWazaCatalogEntriesSync() }
      })
      .get('/admin', async ({ user, set }) => {
        if (!hasStaffRole(user?.role)) {
          set.status = 403
          return { error: 'Accesso riservato ad admin/master' }
        }
        return listAdminWaza()
      })
      .put(
        '/admin/:poolId',
        async ({ user, params, body, set }) => {
          if (!hasStaffRole(user?.role)) {
            set.status = 403
            return { error: 'Accesso riservato ad admin/master' }
          }
          try {
            const saved = await upsertAdminWazaByPoolId(params.poolId, body)
            return saved
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore salvataggio waza' }
          }
        },
        {
          params: t.Object({ poolId: t.String() }),
          body: t.Object({
            name: t.String(),
            description: t.Optional(t.Nullable(t.String())),
            effect: t.Optional(t.Nullable(t.String())),
            rank: t.Optional(t.Nullable(t.String())),
            isPassive: t.Optional(t.Boolean()),
            styleId: t.Optional(t.Nullable(t.String())),
            launchSkiruIds: t.Optional(t.Array(t.String())),
            damageSkiruIds: t.Optional(t.Array(t.String())),
            damageIndexKind: t.Optional(t.Nullable(t.Union([t.Literal('CAC'), t.Literal('CAD')]))),
            costExp: t.Optional(t.Number()),
          }),
        },
      ),
  )
