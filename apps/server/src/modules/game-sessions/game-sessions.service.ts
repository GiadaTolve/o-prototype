import { eq, and, gte, gt, sql } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { gameSessions, gameSessionParticipants, zoneMessages, characters, fetches, questRewards, ledgerEntries } from '../../db/schema'
import { isValidRoom } from '../chat/chat.service'
import { createRem } from '@domain/types/money'
import { earn } from '@domain/ledger/transaction'

const ACTION_THRESHOLD = 500 // 1 azione = messaggio con >500 caratteri totali

/**
 * Crea una nuova registrazione giocata.
 */
export async function createGameSession(
  creatorId: string,
  roomId: string,
  fetchId?: string | null,
  title?: string | null
) {
  if (!isValidRoom(roomId)) {
    throw new Error('Invalid room ID')
  }

  // Verifica che non ci sia già una sessione attiva nella stessa room
  const existing = await db.query.gameSessions.findFirst({
    where: and(
      eq(gameSessions.roomId, roomId),
      eq(gameSessions.status, 'ACTIVE')
    ),
  })

  if (existing) {
    throw new Error('Esiste già una registrazione attiva in questa chat')
  }

  // Verifica fetch se fornita
  if (fetchId) {
    const fetch = await db.query.fetches.findFirst({
      where: eq(fetches.id, fetchId),
    })
    if (!fetch) {
      throw new Error('Fetch non trovata')
    }
  }

  const [session] = await db.insert(gameSessions).values({
    creatorId,
    roomId,
    title: title?.trim() || null,
    fetchId: fetchId || null,
    status: 'ACTIVE',
  }).returning()

  // Leggi automaticamente i partecipanti dalla chat (chi ha fatto azioni)
  await refreshSessionParticipants(session.id, roomId)

  return session
}

/**
 * Aggiorna i partecipanti di una sessione leggendo i messaggi dalla chat.
 * Conta solo i messaggi con >500 caratteri totali (azioni).
 */
export async function refreshSessionParticipants(sessionId: string, roomId: string) {
  const session = await db.query.gameSessions.findFirst({
    where: eq(gameSessions.id, sessionId),
  })

  if (!session) {
    throw new Error('Sessione non trovata')
  }

  // Trova tutti i messaggi nella room con >500 caratteri totali, creati dopo l'inizio della sessione
  const messages = await db
    .select({
      characterId: zoneMessages.characterId,
      actionCount: sql<number>`COUNT(*)::int`.as('action_count'),
    })
    .from(zoneMessages)
    .where(
      and(
        eq(zoneMessages.zone, roomId),
        gt(zoneMessages.totalChars, ACTION_THRESHOLD),
        gte(zoneMessages.createdAt, session.startedAt)
      )
    )
    .groupBy(zoneMessages.characterId)

  // Aggiorna o inserisci i partecipanti
  for (const msg of messages) {
    const existing = await db.query.gameSessionParticipants.findFirst({
      where: and(
        eq(gameSessionParticipants.sessionId, sessionId),
        eq(gameSessionParticipants.characterId, msg.characterId)
      ),
    })

    if (existing) {
      // Aggiorna il conteggio azioni
      await db
        .update(gameSessionParticipants)
        .set({ actionCount: msg.actionCount })
        .where(eq(gameSessionParticipants.id, existing.id))
    } else {
      // Inserisci nuovo partecipante
      await db.insert(gameSessionParticipants).values({
        sessionId,
        characterId: msg.characterId,
        actionCount: msg.actionCount,
      })
    }
  }
}

/**
 * Ottiene una sessione con i suoi partecipanti.
 */
export async function getGameSession(sessionId: string) {
  const session = await db.query.gameSessions.findFirst({
    where: eq(gameSessions.id, sessionId),
    with: {
      creator: true,
      fetch: true,
      participants: {
        with: {
          character: true,
        },
      },
    },
  })

  return session
}

/**
 * Ottiene la sessione attiva in una room (se esiste).
 */
export async function getActiveSessionInRoom(roomId: string) {
  const session = await db.query.gameSessions.findFirst({
    where: and(
      eq(gameSessions.roomId, roomId),
      eq(gameSessions.status, 'ACTIVE')
    ),
    with: {
      creator: true,
      fetch: true,
      participants: {
        with: {
          character: true,
        },
      },
    },
  })

  return session
}

/**
 * Congela una sessione (può essere riavviata in futuro).
 */
export async function freezeGameSession(sessionId: string) {
  const session = await db.query.gameSessions.findFirst({
    where: eq(gameSessions.id, sessionId),
  })

  if (!session) {
    throw new Error('Sessione non trovata')
  }

  if (session.status !== 'ACTIVE') {
    throw new Error('Solo le sessioni attive possono essere congelate')
  }

  const [updated] = await db
    .update(gameSessions)
    .set({
      status: 'FROZEN',
      lastActiveAt: new Date(),
    })
    .where(eq(gameSessions.id, sessionId))
    .returning()

  return updated
}

/**
 * Riavvia una sessione congelata.
 */
export async function resumeGameSession(sessionId: string) {
  const session = await db.query.gameSessions.findFirst({
    where: eq(gameSessions.id, sessionId),
  })

  if (!session) {
    throw new Error('Sessione non trovata')
  }

  if (session.status !== 'FROZEN') {
    throw new Error('Solo le sessioni congelate possono essere riavviate')
  }

  // Aggiorna i partecipanti prima di riavviare
  await refreshSessionParticipants(sessionId, session.roomId)

  const [updated] = await db
    .update(gameSessions)
    .set({
      status: 'ACTIVE',
      lastActiveAt: new Date(),
    })
    .where(eq(gameSessions.id, sessionId))
    .returning()

  return updated
}

/**
 * Chiude definitivamente una sessione (viene conservata nella scheda del personaggio).
 * Se la sessione ha una fetch associata, premia automaticamente i giocatori con >4 azioni.
 */
export async function closeGameSession(sessionId: string) {
  const session = await db.query.gameSessions.findFirst({
    where: eq(gameSessions.id, sessionId),
    with: {
      participants: {
        with: {
          character: true,
        },
      },
      fetch: true,
    },
  })

  if (!session) {
    throw new Error('Sessione non trovata')
  }

  if (session.status === 'CLOSED' || session.status === 'CANCELLED') {
    throw new Error('Sessione già chiusa o annullata')
  }

  // Aggiorna i partecipanti prima di chiudere
  await refreshSessionParticipants(sessionId, session.roomId)

  // Ricarica i partecipanti aggiornati
  const updatedSession = await db.query.gameSessions.findFirst({
    where: eq(gameSessions.id, sessionId),
    with: {
      participants: {
        with: {
          character: {
            columns: {
              id: true,
              rem: true,
              experienceSpendable: true,
            },
          },
        },
      },
      fetch: true,
    },
  })

  if (!updatedSession) {
    throw new Error('Sessione non trovata dopo aggiornamento')
  }

  const [updated] = await db
    .update(gameSessions)
    .set({
      status: 'CLOSED',
      closedAt: new Date(),
      lastActiveAt: new Date(),
    })
    .where(eq(gameSessions.id, sessionId))
    .returning()

  // Se la sessione ha una fetch associata e la giocata è pubblicata (chiusa),
  // premia automaticamente i giocatori con >4 azioni
  if (updatedSession.fetchId && updatedSession.fetch) {
    await rewardFetchParticipants(updatedSession.fetchId, updatedSession.participants)
    
    // Aggiorna lo stato della fetch a "AWAITING_REWARD" se non è già completata
    if (!updatedSession.fetch.completionStatus) {
      await db
        .update(fetches)
        .set({
          completionStatus: 'AWAITING_REWARD',
          completedAt: new Date(),
        })
        .where(eq(fetches.id, updatedSession.fetchId))
    }
  }

  return updated
}

/**
 * Premia automaticamente i giocatori con >= minActions azioni in una giocata pubblicata associata a una fetch.
 * Usa la configurazione premi della fetch se disponibile, altrimenti valori di default.
 */
async function rewardFetchParticipants(
  fetchId: string,
  participants: Array<{
    characterId: string
    actionCount: number
    character: {
      id: string
      rem: number
      experienceSpendable: number
    }
  }>
) {
  // Carica la fetch per ottenere la configurazione premi
  const fetch = await db.query.fetches.findFirst({
    where: eq(fetches.id, fetchId),
  })

  if (!fetch) {
    return // Fetch non trovata, non premiamo
  }

  // Configurazione premi (default se non specificata)
  const rewardConfig = (fetch.rewardConfig as {
    minActions?: number
    remReward?: number
    expReward?: number
  } | null) || {}

  const minActions = rewardConfig.minActions ?? 4
  const remReward = rewardConfig.remReward ?? 50
  const expReward = rewardConfig.expReward ?? 0

  for (const participant of participants) {
    if (participant.actionCount >= minActions) {
      const currentBalance = createRem(participant.character.rem)
      const newRemValue = remReward > 0
        ? (earn(currentBalance, createRem(remReward)).newBalance as number)
        : participant.character.rem

      const newExpValue = expReward > 0
        ? participant.character.experienceSpendable + expReward
        : participant.character.experienceSpendable

      await db.transaction(async (tx) => {
        // Aggiorna il saldo REM del personaggio (se c'è un premio REM)
        if (remReward > 0) {
          await tx
            .update(characters)
            .set({ rem: newRemValue })
            .where(eq(characters.id, participant.characterId))
        }

        // Aggiorna EXP spendibile (se c'è un premio EXP)
        if (expReward > 0) {
          await tx
            .update(characters)
            .set({ experienceSpendable: newExpValue })
            .where(eq(characters.id, participant.characterId))
        }

        // Registra nel ledger (solo se c'è un premio REM)
        if (remReward > 0) {
          await tx.insert(ledgerEntries).values({
            characterId: participant.characterId,
            type: 'REWARD',
            amount: remReward,
            balanceAfter: newRemValue,
            description: `Premio Fetch: ${participant.actionCount} azioni`,
            metadata: {
              fetchId,
              actionCount: participant.actionCount,
              expReward: expReward > 0 ? expReward : undefined,
            },
          })
        }
      })
    }
  }
}

/**
 * Annulla una sessione (non viene conservata).
 */
export async function cancelGameSession(sessionId: string) {
  const session = await db.query.gameSessions.findFirst({
    where: eq(gameSessions.id, sessionId),
  })

  if (!session) {
    throw new Error('Sessione non trovata')
  }

  if (session.status === 'CLOSED' || session.status === 'CANCELLED') {
    throw new Error('Sessione già chiusa o annullata')
  }

  const [updated] = await db
    .update(gameSessions)
    .set({
      status: 'CANCELLED',
      cancelledAt: new Date(),
      lastActiveAt: new Date(),
    })
    .where(eq(gameSessions.id, sessionId))
    .returning()

  return updated
}

/**
 * Ottiene tutte le sessioni di un personaggio (per la scheda).
 */
export async function getCharacterSessions(characterId: string, status?: 'ACTIVE' | 'FROZEN' | 'CLOSED' | 'CANCELLED') {
  // Journal: tutte le registrazioni in cui il PG è coinvolto (come creatore o partecipante)
  const conds = [eq(gameSessionParticipants.characterId, characterId)]

  const rows = await db.query.gameSessionParticipants.findMany({
    where: and(...conds),
    with: {
      session: {
        with: {
          fetch: true,
          participants: {
            with: {
              character: true,
            },
          },
        },
      },
    },
    orderBy: (p, { desc }) => [desc(p.joinedAt)],
  })

  const sessions = rows
    .map((r) => r.session)
    .filter((s) => !!s && (!status || s.status === status))

  // Rimuovi eventuali duplicati per sicurezza (per id)
  const byId = new Map<string, (typeof sessions)[number]>()
  for (const s of sessions) {
    if (s && !byId.has(s.id)) {
      byId.set(s.id, s)
    }
  }

  return Array.from(byId.values())
}
