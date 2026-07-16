import { eq, and, gt, gte, lte, desc, sql, inArray } from "drizzle-orm";
import { db } from '../../plugins/db'
import { gameSessions, gameSessionParticipants, zoneMessages, characters, fetches, quests, questRewards, ledgerEntries, questParticipants } from '../../db/schema'
import { isValidRoom } from '../chat/chat.service'
import { createRem } from '@domain/types/money'
import { earn } from '@domain/ledger/transaction'
import { characterService } from '../characters/characters.service'

const ACTION_THRESHOLD = 500 // 1 azione = messaggio con >500 caratteri totali

const CIRCUS_ROOM_ID = "edo__paradise";

/**
 * Crea una giocata "evento" chiusa (Circus): chiamato quando Admin/Mod chiude il toggle Circus.
 * La sessione viene registrata con sessionType='EVENTO' e appare come "Evento" nel registro.
 */
export async function createClosedCircusEvent(
  roomId: string,
  creatorId: string,
  startedAt: Date,
  title: string
) {
  const closedAt = new Date();
  const [session] = await db.insert(gameSessions).values({
    creatorId,
    roomId,
    title: title?.trim() || "Evento",
    sessionType: "EVENTO" as const,
    status: "CLOSED",
    startedAt,
    closedAt,
    lastActiveAt: closedAt,
  }).returning();
  if (session) {
    await refreshSessionParticipants(session.id, roomId);
    // Inserisci il creatore (admin che ha aperto) come partecipante con 0 azioni, così l'evento appare nel suo Journal
    const existingCreator = await db.query.gameSessionParticipants.findFirst({
      where: and(
        eq(gameSessionParticipants.sessionId, session.id),
        eq(gameSessionParticipants.characterId, creatorId)
      ),
    });
    if (!existingCreator) {
      await db.insert(gameSessionParticipants).values({
        sessionId: session.id,
        characterId: creatorId,
        actionCount: 0,
      });
    }
  }
  return session;
}

/**
 * Crea una nuova registrazione giocata.
 * questId: se fornito, la giocata è in contesto quest → messaggi del creator della quest = masterscreen.
 */
export async function createGameSession(
  creatorId: string,
  roomId: string,
  fetchId?: string | null,
  title?: string | null,
  questId?: string | null
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

  // Verifica quest se fornita
  if (questId) {
    const quest = await db.query.quests.findFirst({
      where: eq(quests.id, questId),
    })
    if (!quest) {
      throw new Error('Quest non trovata')
    }
  }

  const [session] = await db.insert(gameSessions).values({
    creatorId,
    roomId,
    title: title?.trim() || null,
    fetchId: fetchId || null,
    questId: questId || null,
    status: 'ACTIVE',
  }).returning()

  // Leggi automaticamente i partecipanti dalla chat (chi ha fatto azioni)
  await refreshSessionParticipants(session.id, roomId)

  // Aggiungi il creatore come partecipante (così appare nella Scheda → Registrazioni anche prima di avere azioni)
  const existingCreator = await db.query.gameSessionParticipants.findFirst({
    where: and(
      eq(gameSessionParticipants.sessionId, session.id),
      eq(gameSessionParticipants.characterId, creatorId)
    ),
  })
  if (!existingCreator) {
    await db.insert(gameSessionParticipants).values({
      sessionId: session.id,
      characterId: creatorId,
      actionCount: 0,
    })
  }

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

  // Trova tutti i messaggi nella room con >500 caratteri totali, creati DOPO l'inizio della sessione
  // (dall'azione successiva al click di inizio registrazione, non incluso il click)
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
        gt(zoneMessages.createdAt, session.startedAt)
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
      closedAt: sql`CURRENT_TIMESTAMP`,
      lastActiveAt: sql`CURRENT_TIMESTAMP`,
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

  // Fine sessione: reset stack meccaniche + status attivi per ogni partecipante (HP/CS/costrutti restano)
  await Promise.allSettled(
    updatedSession.participants.map((p) => characterService.resetCombatStateForSession(p.characterId))
  )

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
 * Trova la sessione CLOSED associata a una fetch (per responso Master).
 */
export async function getGameSessionByFetchId(fetchId: string) {
  return db.query.gameSessions.findFirst({
    where: and(eq(gameSessions.fetchId, fetchId), eq(gameSessions.status, 'CLOSED')),
    with: {
      creator: true,
      fetch: true,
      participants: {
        with: {
          character: true,
        },
      },
    },
  });
}

/** Formato messaggio per UI (allineato a getQuestMessages). */
export type GameSessionMessage = {
  id: string;
  zone: string;
  characterId: string;
  name: string;
  surname: string | null;
  miniAvatar: string | null;
  content: string;
  locationTag: string | null;
  createdAt: string;
  pixelIcons: { ruolo?: string[]; ordine?: string[] };
  /** Circus (evento): colore animale per display. */
  anonymousColor?: string;
  /** Messaggio del creatore della sessione (Master): mantiene formattazione masterscreen. */
  isMasterscreen?: boolean;
};

/**
 * Recupera i messaggi della giocata registrata (dalla chat, nel periodo della sessione).
 */
export async function getGameSessionMessages(sessionId: string): Promise<GameSessionMessage[]> {
  const session = await db.query.gameSessions.findFirst({
    where: eq(gameSessions.id, sessionId),
    with: { quest: { columns: { creatorId: true } } },
  });
  if (!session) throw new Error('Sessione non trovata');
  if (!session.closedAt) throw new Error('Sessione non ancora chiusa');

  // Messaggi nel periodo sessione. Buffer 2min prima dell'avvio per includere messaggi "in volo" al click Registra Giocata.
  const startedAt = session.startedAt instanceof Date ? session.startedAt : new Date(session.startedAt as string);
  const closedAt = session.closedAt instanceof Date ? session.closedAt : new Date(session.closedAt as string);
  const startBuf = new Date(startedAt.getTime() - 120_000); // 2 min prima
  const endBuf = new Date(closedAt.getTime() + 300_000);   // +5min su chiusura per clock skew
  const conditions = [
    eq(zoneMessages.zone, session.roomId),
    gte(zoneMessages.createdAt, startBuf),
    lte(zoneMessages.createdAt, endBuf),
  ];

  const isCircusEvent = session.sessionType === 'EVENTO' || session.roomId === CIRCUS_ROOM_ID;

  let messages = await db
    .select({
      id: zoneMessages.id,
      zone: zoneMessages.zone,
      characterId: zoneMessages.characterId,
      content: zoneMessages.content,
      locationTag: zoneMessages.locationTag,
      createdAt: zoneMessages.createdAt,
      isGlobal: zoneMessages.isGlobal,
      anonymousAnimalName: zoneMessages.anonymousAnimalName,
      anonymousColor: zoneMessages.anonymousColor,
      character: {
        id: characters.id,
        name: characters.name,
        surname: characters.surname,
        miniAvatar: characters.miniAvatar,
        uiMetadata: characters.uiMetadata,
        order: characters.order,
      },
    })
    .from(zoneMessages)
    .leftJoin(characters, eq(zoneMessages.characterId, characters.id))
    .where(and(...conditions))
    .orderBy(desc(zoneMessages.createdAt));

  // Fallback: se 0 messaggi nel periodo ma la zone ne ha, prova con buffer ampliato (sempre rispettando startedAt)
  if (messages.length === 0) {
    const anyInZone = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(zoneMessages)
      .where(eq(zoneMessages.zone, session.roomId));
    if (anyInZone[0]?.n > 0) {
      // Usa solo messaggi DOPO l'inizio registrazione (nessun messaggio prima di startedAt)
      const fallbackEnd = new Date(closedAt.getTime() + 300_000);
      messages = await db
        .select({
          id: zoneMessages.id,
          zone: zoneMessages.zone,
          characterId: zoneMessages.characterId,
          content: zoneMessages.content,
          locationTag: zoneMessages.locationTag,
          createdAt: zoneMessages.createdAt,
          isGlobal: zoneMessages.isGlobal,
          anonymousAnimalName: zoneMessages.anonymousAnimalName,
          anonymousColor: zoneMessages.anonymousColor,
          character: {
            id: characters.id,
            name: characters.name,
            surname: characters.surname,
            miniAvatar: characters.miniAvatar,
            uiMetadata: characters.uiMetadata,
            order: characters.order,
          },
        })
        .from(zoneMessages)
        .leftJoin(characters, eq(zoneMessages.characterId, characters.id))
        .where(and(
          eq(zoneMessages.zone, session.roomId),
          gte(zoneMessages.createdAt, startBuf),
          lte(zoneMessages.createdAt, fallbackEnd)
        ))
        .orderBy(desc(zoneMessages.createdAt));
      if (messages.length > 0) {
        console.warn(`[game-session-messages] Fallback buffer ampliato: ${messages.length} messaggi (periodo sessione vuoto)`);
      }
    }
  }

  // isMasterscreen = true SOLO se la giocata è in contesto quest E il messaggio è del creator della quest (Shinigami)
  const questCreatorId = session.questId && session.quest ? session.quest.creatorId : null;
  return messages.map((m) => {
    const meta = (m.character?.uiMetadata as { roleIcon?: string; orderIcon?: string } | null) ?? {};
    const roleIcon = (meta.roleIcon ?? '').toLowerCase();
    const orderIcon = (meta.orderIcon ?? '').toLowerCase();
    const pixelIcons: { ruolo?: string[]; ordine?: string[] } = {};
    if (!isCircusEvent && roleIcon && ['admin', 'moderatore', 'fixer', 'capo-shinigami', 'shinigami'].includes(roleIcon)) {
      pixelIcons.ruolo = [roleIcon];
    }
    if (!isCircusEvent && orderIcon && ['mugen-tai', 'chisen-tai'].includes(orderIcon)) {
      pixelIcons.ordine = [orderIcon];
    } else if (!isCircusEvent && m.character?.order && m.character.order !== 'NONE') {
      pixelIcons.ordine = [m.character.order.toLowerCase()];
    }
    const displayName = isCircusEvent && m.anonymousAnimalName ? m.anonymousAnimalName : (m.character?.name ?? 'Unknown');
    const displaySurname = isCircusEvent ? null : (m.character?.surname ?? null);
    const displayAvatar = isCircusEvent ? '/anonymous/mask.svg' : (m.character?.miniAvatar ?? null);
    // Masterscreen = messaggio del creator della quest (quando la giocata è stata registrata durante quella quest)
    const isMasterscreen = !isCircusEvent && !!questCreatorId && m.characterId === questCreatorId;
    return {
      id: m.id,
      zone: m.isGlobal ? 'GLOBAL' : m.zone,
      characterId: m.characterId,
      name: displayName,
      surname: displaySurname,
      miniAvatar: displayAvatar,
      anonymousColor: isCircusEvent ? m.anonymousColor ?? undefined : undefined,
      content: m.content,
      locationTag: m.locationTag,
      createdAt: m.createdAt.toISOString(),
      pixelIcons,
      isMasterscreen: !!isMasterscreen,
    };
  }).reverse();
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
 *
 * Incluse:
 * 1. Sessioni dove il PG è in gameSessionParticipants (partecipante diretto o creatore)
 * 2. Sessioni legate a una quest dove il PG è in questParticipants (fix: evita che
 *    messaggi brevi escludano dalla registrazione)
 */
export async function getCharacterSessions(characterId: string, status?: 'ACTIVE' | 'FROZEN' | 'CLOSED' | 'CANCELLED') {
  const byId = new Map<string, any>()

  // 1. Sessioni via gameSessionParticipants (comportamento originale)
  const directRows = await db.query.gameSessionParticipants.findMany({
    where: eq(gameSessionParticipants.characterId, characterId),
    with: {
      session: {
        with: {
          fetch: true,
          quest: true,
          participants: { with: { character: true } },
        },
      },
    },
    orderBy: (p, { desc }) => [desc(p.joinedAt)],
  })

  for (const r of directRows) {
    const s = r.session
    if (s && (!status || s.status === status) && !byId.has(s.id)) {
      byId.set(s.id, s)
    }
  }

  // 2. Sessioni via questParticipants → se il PG è registrato nella quest,
  //    la giocata associata deve apparire nel suo Journal anche senza azioni lunghe.
  const questRows = await db.query.questParticipants.findMany({
    where: eq(questParticipants.characterId, characterId),
    columns: { questId: true },
  })

  if (questRows.length > 0) {
    const questIds = questRows.map((r) => r.questId)
    const linkedSessions = await db.query.gameSessions.findMany({
      where: and(
        inArray(gameSessions.questId, questIds),
        status ? eq(gameSessions.status, status) : undefined,
      ),
      with: {
        fetch: true,
        quest: true,
        participants: { with: { character: true } },
      },
    })
    for (const s of linkedSessions) {
      if (!byId.has(s.id)) byId.set(s.id, s)
    }
  }

  // Ordina per data chiusura/avvio decrescente
  return Array.from(byId.values()).sort((a, b) => {
    const dateA = new Date(a.closedAt ?? a.lastActiveAt ?? a.startedAt).getTime()
    const dateB = new Date(b.closedAt ?? b.lastActiveAt ?? b.startedAt).getTime()
    return dateB - dateA
  })
}
