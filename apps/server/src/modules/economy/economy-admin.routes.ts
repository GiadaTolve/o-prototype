import { Elysia, t } from 'elysia'
import { eq } from 'drizzle-orm'
import { authPlugin } from '../../plugins/auth.plugin'
import { userHasSviluppoAccess } from '../../lib/gestione-access'
import { db } from '../../plugins/db'
import { items, socialBlueprints } from '../../db/schema'
import {
  listDropTablesAdmin,
  upsertDropPool,
  upsertDropTable,
} from '../drop/drop-tables.service'
import {
  listMarketCatalogAdmin,
  updateMarketCatalogItem,
  type MarketCatalogInput,
} from '../market/catalog.service'

function hasStaffRole(role: string | undefined): boolean {
  const r = (role ?? '').toUpperCase()
  return r === 'ADMIN' || r === 'MASTER'
}

async function canAccessEconomyAdmin(user: { id: string; role?: string } | null): Promise<boolean> {
  if (!user) return false
  if (hasStaffRole(user.role)) return true
  return userHasSviluppoAccess(user.id, user.role)
}

const itemCategoryBody = t.Union([
  t.Literal('junk'),
  t.Literal('materiale'),
  t.Literal('consumabile'),
  t.Literal('equipaggiamento'),
  t.Literal('costrutto_materiale'),
  t.Literal('oggetto_trama'),
])

export const economyAdminRoutes = new Elysia({ prefix: '/economy-admin' })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      .get('/items', async ({ user, set }) => {
        if (!(await canAccessEconomyAdmin(user))) {
          set.status = 403
          return { error: 'Accesso riservato allo staff Sviluppo' }
        }
        return { items: await listMarketCatalogAdmin() }
      })
      .put(
        '/items/:id',
        async ({ user, params, body, set }) => {
          if (!(await canAccessEconomyAdmin(user))) {
            set.status = 403
            return { error: 'Accesso riservato allo staff Sviluppo' }
          }
          try {
            return await updateMarketCatalogItem(params.id, body as Partial<MarketCatalogInput>)
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore aggiornamento oggetto' }
          }
        },
        {
          params: t.Object({ id: t.String() }),
          body: t.Partial(
            t.Object({
              marketCategory: t.Union([
                t.Literal('armi'),
                t.Literal('armature'),
                t.Literal('veicoli'),
                t.Literal('tecnologia'),
                t.Literal('rimedi'),
                t.Literal('oggettistica'),
                t.Null(),
              ]),
              name: t.String(),
              nameRomaji: t.Optional(t.Nullable(t.String())),
              description: t.Optional(t.Nullable(t.String())),
              iconUrl: t.Optional(t.Nullable(t.String())),
              integrityMax: t.Optional(t.Nullable(t.Number())),
              effectText: t.Optional(t.Nullable(t.String())),
              priceRem: t.Optional(t.Number({ minimum: 0 })),
              isActiveInMarket: t.Optional(t.Boolean()),
              category: itemCategoryBody,
              type: t.Optional(t.Union([t.Literal('GENERIC'), t.Literal('WEAPON'), t.Literal('ARMOR'), t.Literal('BAG')])),
              damage: t.Optional(t.Nullable(t.Number())),
              resistance: t.Optional(t.Nullable(t.Number())),
              bonus: t.Optional(t.Nullable(t.Number())),
              mitigationFlat: t.Optional(t.Nullable(t.Number())),
              skiruBonuses: t.Optional(
                t.Nullable(
                  t.Array(t.Object({ skiruId: t.String(), value: t.Number() })),
                ),
              ),
              skiruMaluses: t.Optional(
                t.Nullable(
                  t.Array(t.Object({ skiruId: t.String(), value: t.Number() })),
                ),
              ),
              craftExclusiveClassId: t.Optional(t.Nullable(t.String())),
              ammoKind: t.Optional(t.Nullable(t.String())),
              dismantleYields: t.Optional(
                t.Nullable(
                  t.Object({
                    junkCatalogKey: t.Optional(t.Nullable(t.String())),
                    junkQuantity: t.Optional(t.Nullable(t.Number({ minimum: 1 }))),
                    materials: t.Optional(
                      t.Nullable(
                        t.Record(t.String(), t.Number({ minimum: 1 })),
                      ),
                    ),
                  }),
                ),
              ),
            }),
          ),
        },
      )
      .get('/drop-tables', async ({ user, set }) => {
        if (!(await canAccessEconomyAdmin(user))) {
          set.status = 403
          return { error: 'Accesso riservato allo staff Sviluppo' }
        }
        return await listDropTablesAdmin()
      })
      .put(
        '/drop-tables/:id',
        async ({ user, params, body, set }) => {
          if (!(await canAccessEconomyAdmin(user))) {
            set.status = 403
            return { error: 'Accesso riservato allo staff Sviluppo' }
          }
          try {
            return await upsertDropTable(params.id, body.label, body.entries)
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore salvataggio tabella' }
          }
        },
        {
          params: t.Object({ id: t.String() }),
          body: t.Object({
            label: t.String(),
            entries: t.Array(
              t.Object({
                pool: t.String(),
                weight: t.Number({ minimum: 1 }),
              }),
            ),
          }),
        },
      )
      .put(
        '/drop-pools/:id',
        async ({ user, params, body, set }) => {
          if (!(await canAccessEconomyAdmin(user))) {
            set.status = 403
            return { error: 'Accesso riservato allo staff Sviluppo' }
          }
          try {
            return await upsertDropPool(params.id, body.junkCatalogKeys)
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore salvataggio pool' }
          }
        },
        {
          params: t.Object({ id: t.String() }),
          body: t.Object({
            junkCatalogKeys: t.Array(t.String()),
          }),
        },
      )
      .get('/blueprints', async ({ user, set }) => {
        if (!(await canAccessEconomyAdmin(user))) {
          set.status = 403
          return { error: 'Accesso riservato allo staff Sviluppo' }
        }
        const rows = await db.query.socialBlueprints.findMany({
          orderBy: (t, { asc }) => [asc(t.classId), asc(t.name)],
        })
        return {
          blueprints: rows.map((r) => ({
            id: r.id,
            tag: r.tag,
            classId: r.classId,
            requiredSubclassId: r.requiredSubclassId,
            kind: r.kind,
            name: r.name,
            description: r.description,
            materials: r.materials ?? [],
            outputCatalogKey: r.outputCatalogKey,
            isActive: r.isActive,
          })),
        }
      })
      .put(
        '/blueprints/:id',
        async ({ user, params, body, set }) => {
          if (!(await canAccessEconomyAdmin(user))) {
            set.status = 403
            return { error: 'Accesso riservato allo staff Sviluppo' }
          }
          const existing = await db.query.socialBlueprints.findFirst({
            where: eq(socialBlueprints.id, params.id),
          })
          if (!existing) {
            set.status = 404
            return { error: 'Blueprint non trovato.' }
          }

          const name = body.name ?? existing.name
          const description = body.description ?? existing.description

          await db
            .update(socialBlueprints)
            .set({
              name,
              description,
              materials: body.materials ?? existing.materials,
              isActive: body.isActive ?? existing.isActive,
              updatedAt: new Date(),
            })
            .where(eq(socialBlueprints.id, params.id))

          if (existing.outputCatalogKey) {
            await db
              .update(items)
              .set({
                name,
                description,
                effectText: description,
              })
              .where(eq(items.catalogKey, existing.outputCatalogKey))
          }

          return { ok: true }
        },
        {
          params: t.Object({ id: t.String() }),
          body: t.Partial(
            t.Object({
              name: t.String(),
              description: t.String(),
              materials: t.Array(
                t.Object({
                  materialId: t.String(),
                  quantity: t.Number({ minimum: 1 }),
                }),
              ),
              isActive: t.Boolean(),
            }),
          ),
        },
      ),
  )
