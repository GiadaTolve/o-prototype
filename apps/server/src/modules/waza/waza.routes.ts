import { Elysia, t } from 'elysia'
import { authPlugin } from '../../plugins/auth.plugin'
import { userHasSviluppoAccess } from '../../lib/gestione-access'
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

async function canAccessWazaAdmin(user: { id: string; role?: string } | null): Promise<boolean> {
  if (!user) return false
  if (hasStaffRole(user.role)) return true
  return userHasSviluppoAccess(user.id, user.role)
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
        if (!(await canAccessWazaAdmin(user))) {
          set.status = 403
          return { error: 'Accesso riservato allo staff Sviluppo' }
        }
        try {
          return await listAdminWaza()
        } catch (e) {
          console.error('[GET /waza/admin]', e)
          set.status = 500
          return { error: 'Internal Server Error' }
        }
      })
      .put(
        '/admin/:poolId',
        async ({ user, params, body, set }) => {
          if (!(await canAccessWazaAdmin(user))) {
            set.status = 403
            return { error: 'Accesso riservato allo staff Sviluppo' }
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
