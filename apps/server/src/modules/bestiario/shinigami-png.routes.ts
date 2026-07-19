import { Elysia, t } from 'elysia'
import { authPlugin } from '../../plugins/auth.plugin'
import { userHasShinigamiAccess } from '../../lib/gestione-access'
import * as bestiario from './bestiario.service'

const CategoryLiteral = t.Union([
  t.Literal('HOLIC'),
  t.Literal('PHOBIAS'),
  t.Literal('MUEN'),
  t.Literal('HUMAN'),
  t.Literal('CUSTOM'),
])

const StatsSchema = t.Object({
  hp: t.Optional(t.Number()),
  hpMax: t.Optional(t.Number()),
  cs: t.Optional(t.Number()),
  attack: t.Optional(t.Number()),
  defense: t.Optional(t.Number()),
  mitigation: t.Optional(t.Number()),
  ir: t.Optional(t.Number()),
  cac: t.Optional(t.Number()),
  cad: t.Optional(t.Number()),
  movement: t.Optional(t.Number()),
  notes: t.Optional(t.String()),
  randomSeed: t.Optional(t.Number()),
  kind: t.Optional(t.String()),
})

/** API Shinigami — Albo PNG / creazione sessione / bestiario. */
export const shinigamiPngRoutes = new Elysia({ prefix: '/shinigami/png' })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      .derive(async ({ user }) => ({
        isShinigami: user ? await userHasShinigamiAccess(user.id, user.role) : false,
      }))
      .get('/albo', async ({ isShinigami, set, user }) => {
        if (!isShinigami) {
          set.status = 403
          return { error: 'Solo Shinigami' }
        }
        return { items: await bestiario.getAlboPng(user?.id) }
      })
      .get('/bestiario', async ({ isShinigami, set }) => {
        if (!isShinigami) {
          set.status = 403
          return { error: 'Solo Shinigami' }
        }
        return await bestiario.getBestiaryByCategory()
      })
      .get('/:id', async ({ isShinigami, set, params }) => {
        if (!isShinigami) {
          set.status = 403
          return { error: 'Solo Shinigami' }
        }
        const entry = await bestiario.getCreatureById(params.id)
        if (!entry) {
          set.status = 404
          return { error: 'PNG non trovato' }
        }
        return entry
      })
      .post('/random', async ({ isShinigami, set, body }) => {
        if (!isShinigami) {
          set.status = 403
          return { error: 'Solo Shinigami' }
        }
        const category = (body?.category as bestiario.BestiaryCategory | undefined) ?? 'CUSTOM'
        return bestiario.rollRandomPngParams(category)
      }, {
        body: t.Optional(t.Object({ category: t.Optional(CategoryLiteral) })),
      })
      .post('/', async ({ isShinigami, set, body, user }) => {
        if (!isShinigami) {
          set.status = 403
          return { error: 'Solo Shinigami' }
        }
        try {
          const created = await bestiario.createPng({
            name: body.name,
            description: body.description,
            imageUrl: body.image_url,
            category: body.category,
            stats: body.stats ?? null,
            inAlbo: body.in_albo ?? false,
            createdByUserId: user?.id ?? null,
          })
          set.status = 201
          return created
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore creazione PNG' }
        }
      }, {
        body: t.Object({
          name: t.String({ minLength: 1 }),
          description: t.Optional(t.Nullable(t.String())),
          image_url: t.Optional(t.Nullable(t.String())),
          category: CategoryLiteral,
          stats: t.Optional(t.Nullable(StatsSchema)),
          in_albo: t.Optional(t.Boolean()),
        }),
      })
      .put('/:id', async ({ isShinigami, set, params, body }) => {
        if (!isShinigami) {
          set.status = 403
          return { error: 'Solo Shinigami' }
        }
        try {
          return await bestiario.updatePng(params.id, {
            name: body.name,
            description: body.description,
            imageUrl: body.image_url,
            category: body.category,
            stats: body.stats,
            inAlbo: body.in_albo,
          })
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore aggiornamento PNG' }
        }
      }, {
        body: t.Object({
          name: t.Optional(t.String()),
          description: t.Optional(t.Nullable(t.String())),
          image_url: t.Optional(t.Nullable(t.String())),
          category: t.Optional(CategoryLiteral),
          stats: t.Optional(t.Nullable(StatsSchema)),
          in_albo: t.Optional(t.Boolean()),
        }),
      })
      .delete('/:id', async ({ isShinigami, set, params }) => {
        if (!isShinigami) {
          set.status = 403
          return { error: 'Solo Shinigami' }
        }
        try {
          return await bestiario.deletePng(params.id)
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore eliminazione' }
        }
      }),
  )
