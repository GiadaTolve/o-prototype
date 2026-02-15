import { eq, and, desc, inArray, sql } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { plots, plotProposals, quests, fetches, characters } from '../../db/schema'

/**
 * Ottiene tutte le trame (attive, completate, archiviate).
 */
export async function getAllPlots(status?: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED') {
  const conditions = status ? [eq(plots.status, status)] : []
  
  const allPlots = await db.query.plots.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: {
      creator: true,
      quests: {
        with: {
          creator: true,
        },
        orderBy: (quests, { desc }) => [desc(quests.createdAt)],
      },
    },
    orderBy: (plots, { desc }) => [desc(plots.createdAt)],
  })

  // Per ogni trama, calcola statistiche
  const plotsWithStats = await Promise.all(
    allPlots.map(async (plot) => {
      // Conta fetch eseguite inerenti (fetch con plotIds che include questa trama)
      // Nota: per ora semplifichiamo, in futuro si può migliorare la query JSONB
      const allFetches = await db.query.fetches.findMany()
      const relatedFetches = allFetches.filter((f) => {
        const plotIds = f.requirements?.plotIds || []
        return Array.isArray(plotIds) && plotIds.includes(plot.id)
      })

      // Calcola durata (se non specificata, usa la differenza tra prima e ultima quest)
      let actualDuration: number | null = null
      if (plot.quests.length > 0) {
        const firstQuest = plot.quests[plot.quests.length - 1] // La più vecchia
        const lastQuest = plot.quests[0] // La più recente
        if (firstQuest.createdAt && lastQuest.closedAt) {
          const days = Math.ceil(
            (lastQuest.closedAt.getTime() - firstQuest.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          )
          actualDuration = days
        }
      }

      return {
        ...plot,
        questCount: plot.quests.length,
        relatedFetchesCount: relatedFetches.length,
        actualDuration,
      }
    })
  )

  return plotsWithStats
}

/**
 * Ottiene una trama specifica con dettagli.
 */
export async function getPlotById(plotId: string) {
  const plot = await db.query.plots.findFirst({
    where: eq(plots.id, plotId),
    with: {
      creator: true,
      quests: {
        with: {
          creator: true,
          participants: {
            with: {
              character: true,
            },
          },
        },
        orderBy: (quests, { desc }) => [desc(quests.createdAt)],
      },
    },
  })

  if (!plot) {
    return null
  }

  // Trova fetch inerenti
  const allFetches = await db.query.fetches.findMany()
  const relatedFetches = allFetches.filter((f) => {
    const plotIds = f.requirements?.plotIds || []
    return Array.isArray(plotIds) && plotIds.includes(plot.id)
  })

  return {
    ...plot,
    relatedFetches,
  }
}

/**
 * Crea una nuova trama.
 */
export async function createPlot(
  title: string,
  description: string | null,
  creatorId: string,
  estimatedDuration?: number | null
) {
  const [newPlot] = await db.insert(plots).values({
    title,
    description: description || null,
    creatorId,
    estimatedDuration: estimatedDuration || null,
    status: 'ACTIVE',
  }).returning()

  return newPlot
}

/**
 * Aggiorna una trama.
 */
export async function updatePlot(
  plotId: string,
  updates: {
    title?: string
    description?: string | null
    status?: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
    estimatedDuration?: number | null
  }
) {
  const updateData: Record<string, unknown> = {}
  if (updates.title !== undefined) updateData.title = updates.title
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.status !== undefined) {
    updateData.status = updates.status
    if (updates.status === 'COMPLETED') {
      updateData.completedAt = new Date()
    }
  }
  if (updates.estimatedDuration !== undefined) updateData.estimatedDuration = updates.estimatedDuration

  const [updated] = await db
    .update(plots)
    .set(updateData)
    .where(eq(plots.id, plotId))
    .returning()

  return updated
}

/**
 * Collega una quest a una trama.
 */
export async function linkQuestToPlot(questId: string, plotId: string) {
  const [updated] = await db
    .update(quests)
    .set({ plotId })
    .where(eq(quests.id, questId))
    .returning()

  // Se è la prima quest della trama, aggiorna startedAt
  const plot = await db.query.plots.findFirst({
    where: eq(plots.id, plotId),
    with: {
      quests: true,
    },
  })

  if (plot && !plot.startedAt && plot.quests.length === 1) {
    await db
      .update(plots)
      .set({ startedAt: new Date() })
      .where(eq(plots.id, plotId))
  }

  return updated
}

/**
 * Ottiene tutte le proposte di trama (pending, approved, rejected).
 */
export async function getAllPlotProposals(status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
  const conditions = status ? [eq(plotProposals.status, status)] : []

  const proposals = await db.query.plotProposals.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: {
      proposer: true,
      reviewedBy: true,
      plot: true,
    },
    orderBy: (proposals, { desc }) => [desc(proposals.createdAt)],
  })

  return proposals
}

/**
 * Crea una nuova proposta di trama.
 */
export async function createPlotProposal(
  title: string,
  description: string | null,
  proposerId: string
) {
  const [newProposal] = await db.insert(plotProposals).values({
    title,
    description: description || null,
    proposerId,
    status: 'PENDING',
  }).returning()

  return newProposal
}

/**
 * Approva una proposta (crea la trama).
 */
export async function approvePlotProposal(
  proposalId: string,
  reviewerId: string,
  reviewComment?: string | null,
  estimatedDuration?: number | null
) {
  const proposal = await db.query.plotProposals.findFirst({
    where: eq(plotProposals.id, proposalId),
  })

  if (!proposal) {
    throw new Error('Proposta non trovata')
  }

  if (proposal.status !== 'PENDING') {
    throw new Error('Proposta già revisionata')
  }

  // Crea la trama
  const [newPlot] = await db.insert(plots).values({
    title: proposal.title,
    description: proposal.description,
    creatorId: proposal.proposerId,
    estimatedDuration: estimatedDuration || null,
    status: 'ACTIVE',
  }).returning()

  // Aggiorna la proposta
  const [updated] = await db
    .update(plotProposals)
    .set({
      status: 'APPROVED',
      reviewedById: reviewerId,
      reviewComment: reviewComment || null,
      plotId: newPlot.id,
      reviewedAt: new Date(),
    })
    .where(eq(plotProposals.id, proposalId))
    .returning()

  return { plot: newPlot, proposal: updated }
}

/**
 * Rifiuta una proposta.
 */
export async function rejectPlotProposal(
  proposalId: string,
  reviewerId: string,
  reviewComment?: string | null
) {
  const proposal = await db.query.plotProposals.findFirst({
    where: eq(plotProposals.id, proposalId),
  })

  if (!proposal) {
    throw new Error('Proposta non trovata')
  }

  if (proposal.status !== 'PENDING') {
    throw new Error('Proposta già revisionata')
  }

  const [updated] = await db
    .update(plotProposals)
    .set({
      status: 'REJECTED',
      reviewedById: reviewerId,
      reviewComment: reviewComment || null,
      reviewedAt: new Date(),
    })
    .where(eq(plotProposals.id, proposalId))
    .returning()

  return updated
}
