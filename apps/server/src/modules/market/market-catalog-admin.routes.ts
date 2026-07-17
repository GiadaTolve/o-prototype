import { Elysia, t } from 'elysia'
import { authPlugin } from '../../plugins/auth.plugin'
import { userHasSviluppoAccess } from '../../lib/gestione-access'
import {
  createMarketCatalogItem,
  deleteOrDeactivateMarketCatalogItem,
  listMarketCatalogAdmin,
  updateMarketCatalogItem,
} from './catalog.service'

function hasStaffRole(role: string | undefined): boolean {
  const r = (role ?? '').toUpperCase()
  return r === 'ADMIN' || r === 'MASTER'
}

async function canAccessMarketCatalogAdmin(user: { id: string; role?: string } | null): Promise<boolean> {
  if (!user) return false
  if (hasStaffRole(user.role)) return true
  return userHasSviluppoAccess(user.id, user.role)
}

const catalogItemBody = t.Object({
  marketCategory: t.Union([
    t.Literal('armi'),
    t.Literal('armature'),
    t.Literal('veicoli'),
    t.Literal('tecnologia'),
    t.Literal('rimedi'),
    t.Literal('oggettistica'),
  ]),
  name: t.String(),
  nameRomaji: t.Optional(t.Nullable(t.String())),
  description: t.Optional(t.Nullable(t.String())),
  iconUrl: t.Optional(t.Nullable(t.String())),
  integrityMax: t.Optional(t.Nullable(t.Number())),
  effectText: t.Optional(t.Nullable(t.String())),
  priceRem: t.Number({ minimum: 0 }),
  isActiveInMarket: t.Optional(t.Boolean()),
  type: t.Optional(t.Union([t.Literal('GENERIC'), t.Literal('WEAPON'), t.Literal('ARMOR'), t.Literal('BAG')])),
  damage: t.Optional(t.Nullable(t.Number())),
  resistance: t.Optional(t.Nullable(t.Number())),
  bonus: t.Optional(t.Nullable(t.Number())),
  ammoKind: t.Optional(t.Nullable(t.String())),
})

export const marketCatalogAdminRoutes = new Elysia({ prefix: '/market-catalog-admin' })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      .get('/', async ({ user, set }) => {
        if (!(await canAccessMarketCatalogAdmin(user))) {
          set.status = 403
          return { error: 'Accesso riservato allo staff Sviluppo' }
        }
        try {
          return { items: await listMarketCatalogAdmin() }
        } catch (e: unknown) {
          set.status = 500
          return { error: e instanceof Error ? e.message : 'Errore recupero catalogo' }
        }
      })
      .post(
        '/',
        async ({ user, body, set }) => {
          if (!(await canAccessMarketCatalogAdmin(user))) {
            set.status = 403
            return { error: 'Accesso riservato allo staff Sviluppo' }
          }
          try {
            return await createMarketCatalogItem(body)
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore creazione oggetto' }
          }
        },
        { body: catalogItemBody },
      )
      .put(
        '/:id',
        async ({ user, params, body, set }) => {
          if (!(await canAccessMarketCatalogAdmin(user))) {
            set.status = 403
            return { error: 'Accesso riservato allo staff Sviluppo' }
          }
          try {
            return await updateMarketCatalogItem(params.id, body)
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore aggiornamento oggetto' }
          }
        },
        {
          params: t.Object({ id: t.String() }),
          body: t.Partial(catalogItemBody),
        },
      )
      .delete(
        '/:id',
        async ({ user, params, set }) => {
          if (!(await canAccessMarketCatalogAdmin(user))) {
            set.status = 403
            return { error: 'Accesso riservato allo staff Sviluppo' }
          }
          try {
            return await deleteOrDeactivateMarketCatalogItem(params.id)
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore eliminazione oggetto' }
          }
        },
        { params: t.Object({ id: t.String() }) },
      ),
  )
