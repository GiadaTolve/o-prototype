import { Elysia, t } from 'elysia'
import { authPlugin } from '../../plugins/auth.plugin'
import { userCanEditWiki } from '../../lib/wiki-access'
import {
  createWikiSection,
  deleteWikiSection,
  getWikiTree,
  updateWikiSection,
  type WikiKind,
} from './wiki.service'

const kindParam = t.Union([t.Literal('guida'), t.Literal('ambientazione')])

export const wikiRoutes = new Elysia({ prefix: '/wiki' })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      .get(
        '/:kind',
        async ({ params, set }) => {
          try {
            const tree = await getWikiTree(params.kind as WikiKind)
            return { sections: tree }
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante il recupero' }
          }
        },
        { params: t.Object({ kind: kindParam }) },
      )

      .get(
        '/:kind/can-edit',
        async ({ params, user, set }) => {
          if (!user) {
            set.status = 401
            return { error: 'Non autenticato' }
          }
          const canEdit = await userCanEditWiki(user.id, user.role)
          return { canEdit, kind: params.kind }
        },
        { params: t.Object({ kind: kindParam }) },
      )

      .post(
        '/:kind/sections',
        async ({ params, body, user, set }) => {
          if (!user) {
            set.status = 401
            return { error: 'Non autenticato' }
          }
          const canEdit = await userCanEditWiki(user.id, user.role)
          if (!canEdit) {
            set.status = 403
            return { error: 'Accesso negato. Solo Admin e Moderatori possono modificare.' }
          }
          try {
            const section = await createWikiSection({
              kind: params.kind as WikiKind,
              parentId: body.parentId ?? null,
              level: body.level as 1 | 2,
              title: body.title,
              content: body.content,
              imageUrl: body.imageUrl,
              order: body.order,
            })
            return section
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante la creazione' }
          }
        },
        {
          params: t.Object({ kind: kindParam }),
          body: t.Object({
            parentId: t.Optional(t.Nullable(t.String())),
            level: t.Union([t.Literal(1), t.Literal(2)]),
            title: t.String({ minLength: 1 }),
            content: t.Optional(t.String()),
            imageUrl: t.Optional(t.Nullable(t.String())),
            order: t.Optional(t.Number()),
          }),
        },
      )

      .patch(
        '/:kind/sections/:id',
        async ({ params, body, user, set }) => {
          if (!user) {
            set.status = 401
            return { error: 'Non autenticato' }
          }
          const canEdit = await userCanEditWiki(user.id, user.role)
          if (!canEdit) {
            set.status = 403
            return { error: 'Accesso negato. Solo Admin e Moderatori possono modificare.' }
          }
          try {
            const section = await updateWikiSection(params.id, body)
            return section
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante l\'aggiornamento' }
          }
        },
        {
          params: t.Object({ kind: kindParam, id: t.String() }),
          body: t.Object({
            title: t.Optional(t.String({ minLength: 1 })),
            content: t.Optional(t.String()),
            imageUrl: t.Optional(t.Nullable(t.String())),
            order: t.Optional(t.Number()),
          }),
        },
      )

      .delete(
        '/:kind/sections/:id',
        async ({ params, user, set }) => {
          if (!user) {
            set.status = 401
            return { error: 'Non autenticato' }
          }
          const canEdit = await userCanEditWiki(user.id, user.role)
          if (!canEdit) {
            set.status = 403
            return { error: 'Accesso negato. Solo Admin e Moderatori possono modificare.' }
          }
          try {
            await deleteWikiSection(params.id)
            return { ok: true }
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante l\'eliminazione' }
          }
        },
        { params: t.Object({ kind: kindParam, id: t.String() }) },
      ),
  )
