import { eq, and, gte, lte, sql, gt, desc, inArray } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { quests, questParticipants, questVotes, characters, zoneMessages } from '../../db/schema'

/**
 * Calcola le statistiche dei master per il mese corrente.
 */
export async function getMasterStats(month?: number, year?: number) {
  const now = new Date()
  const targetMonth = month ?? now.getMonth() + 1 // 1-12
  const targetYear = year ?? now.getFullYear()

  // Calcola inizio e fine mese
  const monthStart = new Date(targetYear, targetMonth - 1, 1)
  monthStart.setHours(0, 0, 0, 0)
  const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999)

  // Trova tutte le quest chiuse nel mese
  const closedQuests = await db.query.quests.findMany({
    where: and(
      eq(quests.status, 'CLOSED'),
      gte(quests.closedAt, monthStart),
      lte(quests.closedAt, monthEnd)
    ),
    with: {
      creator: true,
      participants: {
        with: {
          character: true,
        },
      },
      votes: {
        with: {
          votedFor: true,
        },
      },
    },
  })

  // Raggruppa per master (creator)
  const masterMap = new Map<string, {
    masterId: string
    masterName: string
    quests: typeof closedQuests
    totalQuests: number
    totalActions: number
    uniqueParticipants: Set<string>
    participantNames: Map<string, string>
    shinePoints: number
  }>()

  for (const quest of closedQuests) {
    const masterId = quest.creatorId
    const masterName = quest.creator?.name || 'Unknown'

    if (!masterMap.has(masterId)) {
      masterMap.set(masterId, {
        masterId,
        masterName,
        quests: [],
        totalQuests: 0,
        totalActions: 0,
        uniqueParticipants: new Set(),
        participantNames: new Map(),
        shinePoints: 0,
      })
    }

    const stats = masterMap.get(masterId)!
    stats.quests.push(quest)
    stats.totalQuests++

    // Conta partecipanti unici
    for (const participant of quest.participants) {
      stats.uniqueParticipants.add(participant.characterId)
      if (participant.character?.name) {
        stats.participantNames.set(participant.characterId, participant.character.name)
      }
    }

    // Conta azioni (messaggi con >500 caratteri nella room della quest)
    if (quest.roomId && quest.closedAt) {
      // Trova il momento di inizio (createdAt della quest) e fine (closedAt)
      const questStart = quest.createdAt
      const questEnd = quest.closedAt

      const actionCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(zoneMessages)
        .where(
          and(
            eq(zoneMessages.zone, quest.roomId),
            gte(zoneMessages.createdAt, questStart),
            lte(zoneMessages.createdAt, questEnd),
            gt(zoneMessages.totalChars, 500)
          )
        )

      stats.totalActions += actionCount[0]?.count ?? 0
    }

    // Conta punti shine (voti ricevuti dai personaggi nelle quest del master)
    stats.shinePoints += quest.votes.length
  }

  // Converti in array e calcola il miglior master
  const masterStats = Array.from(masterMap.values()).map((stats) => ({
    masterId: stats.masterId,
    masterName: stats.masterName,
    totalQuests: stats.totalQuests,
    totalActions: stats.totalActions,
    uniqueParticipantsCount: stats.uniqueParticipants.size,
    participantNames: Array.from(stats.participantNames.values()),
    shinePoints: stats.shinePoints,
    // Score per determinare il miglior master (pesato: quest * 10 + azioni + shine * 5)
    score: stats.totalQuests * 10 + stats.totalActions + stats.shinePoints * 5,
  }))

  // Ordina per score (miglior master primo)
  masterStats.sort((a, b) => b.score - a.score)

  // Trova il miglior master del mese
  const bestMaster = masterStats.length > 0 ? masterStats[0] : null

  return {
    month: targetMonth,
    year: targetYear,
    masters: masterStats,
    bestMaster,
  }
}

/**
 * Calcola la classifica utenti per punti shine (tutti i tempi o per mese).
 */
export async function getUserShineRanking(month?: number, year?: number) {
  let votesQuery = db
    .select({
      characterId: questVotes.votedFor,
      shinePoints: sql<number>`count(*)::int`.as('shine_points'),
    })
    .from(questVotes)
    .groupBy(questVotes.votedFor)

  // Se specificato mese/anno, filtra per le quest chiuse in quel periodo
  if (month && year) {
    const monthStart = new Date(year, month - 1, 1)
    monthStart.setHours(0, 0, 0, 0)
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999)

    votesQuery = db
      .select({
        characterId: questVotes.votedFor,
        shinePoints: sql<number>`count(*)::int`.as('shine_points'),
      })
      .from(questVotes)
      .innerJoin(quests, eq(questVotes.questId, quests.id))
      .where(
        and(
          eq(quests.status, 'CLOSED'),
          gte(quests.closedAt, monthStart),
          lte(quests.closedAt, monthEnd)
        )
      )
      .groupBy(questVotes.votedFor)
  }

  const votes = await votesQuery

  // Ottieni i nomi dei personaggi
  const characterIds = votes.map((v) => v.characterId)
  if (characterIds.length === 0) {
    return []
  }
  const charactersData = await db.query.characters.findMany({
    where: inArray(characters.id, characterIds),
  })

  const charMap = new Map(charactersData.map((c) => [c.id, c.name]))

  // Combina e ordina
  const ranking = votes
    .map((v) => ({
      characterId: v.characterId,
      characterName: charMap.get(v.characterId) || 'Unknown',
      shinePoints: v.shinePoints,
    }))
    .sort((a, b) => b.shinePoints - a.shinePoints)

  return ranking
}

/**
 * Ottiene statistiche dettagliate per un singolo master.
 */
export async function getMasterDetail(masterId: string, month?: number, year?: number) {
  const now = new Date()
  const targetMonth = month ?? now.getMonth() + 1
  const targetYear = year ?? now.getFullYear()

  const monthStart = new Date(targetYear, targetMonth - 1, 1)
  monthStart.setHours(0, 0, 0, 0)
  const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999)

  const masterQuests = await db.query.quests.findMany({
    where: and(
      eq(quests.creatorId, masterId),
      eq(quests.status, 'CLOSED'),
      gte(quests.closedAt, monthStart),
      lte(quests.closedAt, monthEnd)
    ),
    with: {
      participants: {
        with: {
          character: true,
        },
      },
      votes: {
        with: {
          votedFor: true,
        },
      },
    },
    orderBy: (quests, { desc }) => [desc(quests.closedAt)],
  })

  // Calcola statistiche aggregate
  let totalActions = 0
  const uniqueParticipants = new Set<string>()
  const participantFrequency = new Map<string, number>()
  let totalShinePoints = 0

  for (const quest of masterQuests) {
    // Azioni
    if (quest.roomId && quest.closedAt) {
      const actionCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(zoneMessages)
        .where(
          and(
            eq(zoneMessages.zone, quest.roomId),
            gte(zoneMessages.createdAt, quest.createdAt),
            lte(zoneMessages.createdAt, quest.closedAt),
            gt(zoneMessages.totalChars, 500)
          )
        )

      totalActions += actionCount[0]?.count ?? 0
    }

    // Partecipanti
    for (const participant of quest.participants) {
      uniqueParticipants.add(participant.characterId)
      participantFrequency.set(
        participant.characterId,
        (participantFrequency.get(participant.characterId) || 0) + 1
      )
    }

    // Shine points
    totalShinePoints += quest.votes.length
  }

  // Ottieni nomi partecipanti
  const participantIds = Array.from(uniqueParticipants)
  if (participantIds.length === 0) {
    return {
      masterId,
      month: targetMonth,
      year: targetYear,
      totalQuests: masterQuests.length,
      totalActions,
      uniqueParticipantsCount: 0,
      participants: [],
      totalShinePoints,
      quests: masterQuests.map((q) => ({
        id: q.id,
        title: q.title,
        type: q.type,
        closedAt: q.closedAt,
        participantCount: q.participants.length,
        shinePoints: q.votes.length,
      })),
    }
  }
  const participantsData = await db.query.characters.findMany({
    where: inArray(characters.id, participantIds),
  })
  const participantNames = new Map(participantsData.map((c) => [c.id, c.name]))

  return {
    masterId,
    month: targetMonth,
    year: targetYear,
    totalQuests: masterQuests.length,
    totalActions,
    uniqueParticipantsCount: uniqueParticipants.size,
    participants: Array.from(uniqueParticipants).map((id) => ({
      characterId: id,
      characterName: participantNames.get(id) || 'Unknown',
      frequency: participantFrequency.get(id) || 0,
    })),
    totalShinePoints,
    quests: masterQuests.map((q) => ({
      id: q.id,
      title: q.title,
      type: q.type,
      closedAt: q.closedAt,
      participantCount: q.participants.length,
      shinePoints: q.votes.length,
    })),
  }
}
