import { Elysia, t } from 'elysia'
import { authPlugin } from '../../plugins/auth.plugin'
import { userHasShinigamiAccess } from '../../lib/gestione-access'
import * as svc from './shinigami-combat.service'

const TipoLiteral = t.Union([
  t.Literal('umano'),
  t.Literal('kyofu'),
  t.Literal('kizu'),
  t.Literal('holic'),
  t.Literal('boss'),
  t.Literal('mob'),
])

const WazaSchema = t.Array(
  t.Object({
    nome: t.String(),
    descrizione: t.Optional(t.String()),
    danno: t.Optional(t.Number()),
    tier: t.Optional(t.Number()),
  }),
)

const StatusSchema = t.Array(
  t.Object({
    slug: t.String(),
    stack: t.Number(),
  }),
)

const PngBody = t.Object({
  nome: t.Optional(t.String()),
  name: t.Optional(t.String()),
  tipo: t.Optional(TipoLiteral),
  tier: t.Optional(t.Number()),
  hp_max: t.Optional(t.Number()),
  hp_correnti: t.Optional(t.Number()),
  cs_max: t.Optional(t.Number()),
  cs_correnti: t.Optional(t.Number()),
  ir_attacco: t.Optional(t.Number()),
  ir_difesa: t.Optional(t.Number()),
  waza: t.Optional(WazaSchema),
  status_attivi: t.Optional(StatusSchema),
  note: t.Optional(t.String()),
})

/** API pannello Shinigami (combat Master) — Spec Tulpa. */
export const shinigamiCombatRoutes = new Elysia({ prefix: '/shinigami/combat' })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      .derive(async ({ user }) => ({
        isShinigami: user ? await userHasShinigamiAccess(user.id, user.role) : false,
      }))
      .onBeforeHandle(({ isShinigami, set }) => {
        if (!isShinigami) {
          set.status = 403
          return { error: 'Solo Shinigami' }
        }
      })

      .post('/random', ({ body }) =>
        svc.randomizeDraft({ tier: body?.tier ?? 1, tipo: body?.tipo }),
      {
        body: t.Optional(
          t.Object({
            tier: t.Optional(t.Number()),
            tipo: t.Optional(TipoLiteral),
          }),
        ),
      })

      .get('/draft', ({ query }) =>
        svc.blankDraft({
          tier: query.tier ? Number(query.tier) : 1,
          tipo: query.tipo,
        }),
      {
        query: t.Object({
          tier: t.Optional(t.String()),
          tipo: t.Optional(t.String()),
        }),
      })

      .get('/field/:roomId', async ({ params }) => svc.listFieldNpcs(params.roomId))

      .post('/field/:roomId', async ({ params, body, user, set }) => {
        try {
          const created = await svc.spawnNpcOnField(params.roomId, user!.id, body)
          set.status = 201
          return created
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore spawn PNG' }
        }
      }, { body: PngBody })

      .patch('/field/npc/:id', async ({ params, body, set }) => {
        try {
          return await svc.updateFieldNpc(params.id, body)
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore update PNG' }
        }
      }, { body: PngBody })

      .delete('/field/npc/:id', async ({ params, set }) => {
        try {
          return await svc.removeFieldNpc(params.id)
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore rimozione' }
        }
      })

      .get('/albo', async ({ user, query }) => svc.listAlbo(user!.id, query.q, query.tipo), {
        query: t.Object({
          q: t.Optional(t.String()),
          tipo: t.Optional(t.String()),
        }),
      })

      .delete('/field/:roomId', async ({ params }) => svc.clearFieldForRoom(params.roomId))
      .post('/albo', async ({ user, body, set }) => {
        try {
          const created = await svc.saveToAlbo(user!.id, body)
          set.status = 201
          return created
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore Albo' }
        }
      }, { body: PngBody })
      .put('/albo/:id', async ({ user, params, body, set }) => {
        try {
          return await svc.updateAlboEntry(user!.id, params.id, body)
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore update Albo' }
        }
      }, { body: PngBody })
      .delete('/albo/:id', async ({ user, params, set }) => {
        try {
          return await svc.deleteAlboEntry(user!.id, params.id)
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore delete Albo' }
        }
      })
      .post('/albo/:id/spawn/:roomId', async ({ user, params, set }) => {
        try {
          const created = await svc.instantiateAlboOnField(params.roomId, user!.id, params.id)
          set.status = 201
          return created
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore istanzia Albo' }
        }
      })

      .get('/bestiario', async ({ query }) => {
        await svc.ensureBestiarioSeed()
        return svc.listBestiarioCatalog(query.q)
      })
      .post('/bestiario/:id/spawn/:roomId', async ({ user, params, set }) => {
        try {
          const created = await svc.instantiateBestiarioOnField(
            params.roomId,
            user!.id,
            params.id,
          )
          set.status = 201
          return created
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore istanzia Bestiario' }
        }
      })
      .post('/bestiario/:id/albo', async ({ user, params, set }) => {
        try {
          const created = await svc.saveBestiarioToAlbo(user!.id, params.id)
          set.status = 201
          return created
        } catch (e: unknown) {
          set.status = 400
          return { error: e instanceof Error ? e.message : 'Errore salva Albo' }
        }
      }),
  )
