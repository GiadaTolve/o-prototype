import { Elysia, t } from 'elysia'
import { eq } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { characters, users } from '../../db/schema'
import { authPlugin } from '../../plugins/auth.plugin'
import {
  getAllPlots,
  getPlotById,
  createPlot,
  updatePlot,
  linkQuestToPlot,
  getAllPlotProposals,
  createPlotProposal,
  approvePlotProposal,
  rejectPlotProposal,
} from './lore.service'

/**
 * Verifica se l'utente può gestire le proposte (Admin/Mod/Capo).
 */
async function canManageProposals(userId: string): Promise<boolean> {
  const char = await db.query.characters.findFirst({
    where: eq(characters.userId, userId),
  })
  if (!char) return false

  const userData = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  // Admin o Master
  if (userData && (userData.role === 'ADMIN' || userData.role === 'MASTER')) {
    return true
  }

  // Moderatore o Capo Shinigami tramite uiMetadata
  const roleIcon = char.uiMetadata?.roleIcon
  return roleIcon === 'moderatore' || roleIcon === 'admin' || roleIcon === 'capo-shinigami'
}

export const loreRoutes = new Elysia({ prefix: '/lore' })
  .use(authPlugin)
  .guard({ isAuthenticated: true }, (app) =>
    app
      // Ottiene tutte le trame
      .get(
        '/plots',
        async ({ query, set }) => {
          try {
            const status = query.status as 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | undefined
            const plots = await getAllPlots(status)
            return plots
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante il recupero' }
          }
        },
        {
          query: t.Object({
            status: t.Optional(t.String()),
          }),
        }
      )

      // Ottiene una trama specifica
      .get(
        '/plots/:id',
        async ({ params, set }) => {
          try {
            const plot = await getPlotById(params.id)
            if (!plot) {
              set.status = 404
              return { error: 'Trama non trovata' }
            }
            return plot
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante il recupero' }
          }
        },
        {
          params: t.Object({ id: t.String() }),
        }
      )

      // Crea una nuova trama (Shinigami)
      .post(
        '/plots',
        async ({ body, user, set }) => {
          try {
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }

            const plot = await createPlot(
              body.title,
              body.description || null,
              char.id,
              body.estimatedDuration || null
            )
            return plot
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante la creazione' }
          }
        },
        {
          body: t.Object({
            title: t.String(),
            description: t.Optional(t.String()),
            estimatedDuration: t.Optional(t.Number()),
          }),
        }
      )

      // Aggiorna una trama
      .patch(
        '/plots/:id',
        async ({ params, body, user, set }) => {
          try {
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }

            const plot = await updatePlot(params.id, {
              title: body.title,
              description: body.description,
              status: body.status,
              estimatedDuration: body.estimatedDuration,
            })
            return plot
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante l\'aggiornamento' }
          }
        },
        {
          params: t.Object({ id: t.String() }),
          body: t.Object({
            title: t.Optional(t.String()),
            description: t.Optional(t.String()),
            status: t.Optional(t.String()),
            estimatedDuration: t.Optional(t.Number()),
          }),
        }
      )

      // Collega una quest a una trama
      .post(
        '/plots/:plotId/link-quest',
        async ({ params, body, user, set }) => {
          try {
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }

            const quest = await linkQuestToPlot(body.questId, params.plotId)
            return quest
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante il collegamento' }
          }
        },
        {
          params: t.Object({ plotId: t.String() }),
          body: t.Object({
            questId: t.String(),
          }),
        }
      )

      // Ottiene tutte le proposte
      .get(
        '/proposals',
        async ({ query, user, set }) => {
          try {
            const status = query.status as 'PENDING' | 'APPROVED' | 'REJECTED' | undefined
            const proposals = await getAllPlotProposals(status)
            return proposals
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante il recupero' }
          }
        },
        {
          query: t.Object({
            status: t.Optional(t.String()),
          }),
        }
      )

      // Crea una nuova proposta
      .post(
        '/proposals',
        async ({ body, user, set }) => {
          try {
            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }

            const proposal = await createPlotProposal(
              body.title,
              body.description || null,
              char.id
            )
            return proposal
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante la creazione' }
          }
        },
        {
          body: t.Object({
            title: t.String(),
            description: t.Optional(t.String()),
          }),
        }
      )

      // Approva una proposta (solo Admin/Mod/Capo)
      .post(
        '/proposals/:id/approve',
        async ({ params, body, user, set }) => {
          try {
            const canManage = await canManageProposals(user.id)
            if (!canManage) {
              set.status = 403
              return { error: 'Accesso negato. Solo Admin/Mod/Capo possono approvare proposte.' }
            }

            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }

            const result = await approvePlotProposal(
              params.id,
              char.id,
              body.reviewComment || null,
              body.estimatedDuration || null
            )
            return result
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante l\'approvazione' }
          }
        },
        {
          params: t.Object({ id: t.String() }),
          body: t.Object({
            reviewComment: t.Optional(t.String()),
            estimatedDuration: t.Optional(t.Number()),
          }),
        }
      )

      // Rifiuta una proposta (solo Admin/Mod/Capo)
      .post(
        '/proposals/:id/reject',
        async ({ params, body, user, set }) => {
          try {
            const canManage = await canManageProposals(user.id)
            if (!canManage) {
              set.status = 403
              return { error: 'Accesso negato. Solo Admin/Mod/Capo possono rifiutare proposte.' }
            }

            const char = await db.query.characters.findFirst({
              where: eq(characters.userId, user.id),
            })
            if (!char) {
              set.status = 404
              return { error: 'Personaggio non trovato' }
            }

            const proposal = await rejectPlotProposal(
              params.id,
              char.id,
              body.reviewComment || null
            )
            return proposal
          } catch (e: unknown) {
            set.status = 400
            return { error: e instanceof Error ? e.message : 'Errore durante il rifiuto' }
          }
        },
        {
          params: t.Object({ id: t.String() }),
          body: t.Object({
            reviewComment: t.Optional(t.String()),
          }),
        }
      )
  )
