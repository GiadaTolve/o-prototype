import { eq, and, desc, inArray, or, gt, gte, lte } from "drizzle-orm";
import { db } from "../../plugins/db";
import { quests, questParticipants, questRewards, questVotes, characters, zoneMessages } from "../../db/schema";
import { sql } from "drizzle-orm";
import { applyCharacterExpGain } from "../characters/level-up.service";

export type QuestStatus = "OPEN" | "IN_PROGRESS" | "PAUSED" | "CLOSED";
export type QuestType = "AMBIENT" | "TRAMA" | "BATTLE" | "ONE_SHOT" | "GLOBALE";

export type Quest = {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  description: string | null;
  type: QuestType;
  status: QuestStatus;
  roomId: string | null;
  createdAt: Date;
  closedAt: Date | null;
  participantCount: number;
};

export type QuestParticipant = {
  id: string;
  characterId: string;
  characterName: string;
  registeredAt: Date;
};

export type QuestReward = {
  id: string;
  characterId: string;
  characterName: string;
  type: "EXP" | "REM" | "ITEM" | "CUSTOM" | "DROP";
  value: number | null;
  description: string | null;
  createdAt: Date;
};

export type QuestVote = {
  id: string;
  voterId: string;
  votedFor: string;
  votedForName: string;
  createdAt: Date;
};

/**
 * Crea una nuova quest (solo Shinigami). Tipo: AMBIENT | TRAMA | BATTLE | ONE_SHOT.
 */
export async function createQuest(
  creatorId: string,
  title: string,
  opts?: { description?: string; roomId?: string; type?: QuestType; plotId?: string | null; participantIds?: string[]; isGlobal?: boolean }
) {
  const type = opts?.type ?? "AMBIENT";
  const [row] = await db
    .insert(quests)
    .values({
      creatorId,
      title: title.trim().slice(0, 200),
      description: opts?.description?.trim().slice(0, 2000) || null,
      type,
      status: "OPEN",
      roomId: opts?.isGlobal ? null : (opts?.roomId || null), // GLOBALE = roomId null
      plotId: opts?.plotId || null,
    })
    .returning();
  
  // Aggiungi partecipanti iniziali se specificati
  if (opts?.participantIds && opts.participantIds.length > 0) {
    await db.insert(questParticipants).values(
      opts.participantIds.map(charId => ({
        questId: row.id,
        characterId: charId,
      }))
    );
  }
  
  return row!;
}

/**
 * Quest attiva per room (spia viola in chat). OPEN o IN_PROGRESS, stessa room.
 */
export async function getActiveQuestForRoom(roomId: string): Promise<Quest | null> {
  const [row] = await db
    .select({
      id: quests.id,
      creatorId: quests.creatorId,
      creatorName: characters.name,
      title: quests.title,
      description: quests.description,
      type: quests.type,
      status: quests.status,
      roomId: quests.roomId,
      createdAt: quests.createdAt,
      closedAt: quests.closedAt,
    })
    .from(quests)
    .innerJoin(characters, eq(quests.creatorId, characters.id))
    .where(and(eq(quests.roomId, roomId), or(eq(quests.status, "OPEN"), eq(quests.status, "IN_PROGRESS"), eq(quests.status, "PAUSED"))))
    .orderBy(desc(quests.createdAt))
    .limit(1);

  if (!row) return null;

  const [countRow] = await db
    .select({ n: sql<number>`count(*)::int`.as("n") })
    .from(questParticipants)
    .where(eq(questParticipants.questId, row.id));

  return {
    id: row.id,
    creatorId: row.creatorId,
    creatorName: row.creatorName,
    title: row.title,
    description: row.description,
    type: row.type as QuestType,
    status: row.status as QuestStatus,
    roomId: row.roomId,
    createdAt: row.createdAt,
    closedAt: row.closedAt,
    participantCount: countRow?.n ?? 0,
  };
}

/**
 * Lista tutte le quest (aperte, in corso, chiuse).
 */
export async function listQuests(limit = 50): Promise<Quest[]> {
  const rows = await db
    .select({
      id: quests.id,
      creatorId: quests.creatorId,
      creatorName: characters.name,
      title: quests.title,
      description: quests.description,
      type: quests.type,
      status: quests.status,
      roomId: quests.roomId,
      createdAt: quests.createdAt,
      closedAt: quests.closedAt,
    })
    .from(quests)
    .innerJoin(characters, eq(quests.creatorId, characters.id))
    .orderBy(desc(quests.createdAt))
    .limit(limit);

  if (rows.length === 0) return [];

  const counts = await db
    .select({
      questId: questParticipants.questId,
      n: sql<number>`count(*)::int`.as("n"),
    })
    .from(questParticipants)
    .where(inArray(questParticipants.questId, rows.map((r) => r.id)))
    .groupBy(questParticipants.questId);

  const countMap = new Map(counts.map((c) => [c.questId, c.n]));

  return rows.map((r) => ({
    id: r.id,
    creatorId: r.creatorId,
    creatorName: r.creatorName,
    title: r.title,
    description: r.description,
    type: r.type as QuestType,
    status: r.status as QuestStatus,
    roomId: r.roomId,
    createdAt: r.createdAt,
    closedAt: r.closedAt,
    participantCount: countMap.get(r.id) ?? 0,
  }));
}

/**
 * Ottiene una quest specifica con partecipanti, premi e voti.
 */
export async function getQuest(questId: string): Promise<Quest | null> {
  const [row] = await db
    .select({
      id: quests.id,
      creatorId: quests.creatorId,
      creatorName: characters.name,
      title: quests.title,
      description: quests.description,
      type: quests.type,
      status: quests.status,
      roomId: quests.roomId,
      createdAt: quests.createdAt,
      closedAt: quests.closedAt,
    })
    .from(quests)
    .innerJoin(characters, eq(quests.creatorId, characters.id))
    .where(eq(quests.id, questId))
    .limit(1);

  if (!row) return null;

  const [countRow] = await db
    .select({ n: sql<number>`count(*)::int`.as("n") })
    .from(questParticipants)
    .where(eq(questParticipants.questId, questId));

  return {
    id: row.id,
    creatorId: row.creatorId,
    creatorName: row.creatorName,
    title: row.title,
    description: row.description,
    type: row.type as QuestType,
    status: row.status as QuestStatus,
    roomId: row.roomId,
    createdAt: row.createdAt,
    closedAt: row.closedAt,
    participantCount: countRow?.n ?? 0,
  };
}

/**
 * Registra un personaggio come partecipante a una quest (Registra Giocata).
 * fetchId: se fornito, la giocata è collegata a una Fetch assegnata al personaggio.
 */
export async function registerParticipant(questId: string, characterId: string, fetchId?: string) {
  const quest = await db.query.quests.findFirst({
    where: eq(quests.id, questId),
  });
  if (!quest) throw new Error("Quest non trovata");
  if (quest.status === "CLOSED") throw new Error("Quest già chiusa");

  const existing = await db.query.questParticipants.findFirst({
    where: and(eq(questParticipants.questId, questId), eq(questParticipants.characterId, characterId)),
  });
  if (existing) throw new Error("Già registrato a questa quest");

  const [row] = await db
    .insert(questParticipants)
    .values({ questId, characterId, fetchId: fetchId ?? null })
    .returning();
  return row!;
}

/**
 * Ottiene i partecipanti di una quest.
 */
export async function getQuestParticipants(questId: string): Promise<QuestParticipant[]> {
  const rows = await db
    .select({
      id: questParticipants.id,
      characterId: questParticipants.characterId,
      characterName: characters.name,
      registeredAt: questParticipants.registeredAt,
    })
    .from(questParticipants)
    .innerJoin(characters, eq(questParticipants.characterId, characters.id))
    .where(eq(questParticipants.questId, questId))
    .orderBy(desc(questParticipants.registeredAt));

  return rows.map((r) => ({
    id: r.id,
    characterId: r.characterId,
    characterName: r.characterName,
    registeredAt: r.registeredAt,
  }));
}

/**
 * Aggiunge un premio a un personaggio per una quest (Tabellario premi).
 */
export async function addReward(
  questId: string,
  characterId: string,
  type: "EXP" | "REM" | "ITEM" | "CUSTOM" | "DROP",
  value?: number,
  description?: string
) {
  // Verifica che la quest esista
  const quest = await db.query.quests.findFirst({
    where: eq(quests.id, questId),
  });
  if (!quest) throw new Error("Quest non trovata");

  const [row] = await db
    .insert(questRewards)
    .values({
      questId,
      characterId,
      type,
      value: value ?? null,
      description: description?.trim().slice(0, 500) || null,
    })
    .returning();

  // Se il premio è EXP o REM, aggiorna il personaggio
  if (type === "EXP" && value) {
    await applyCharacterExpGain(characterId, value);
  } else if (type === "REM" && value) {
    await db
      .update(characters)
      .set({
        rem: sql`${characters.rem} + ${value}`,
      })
      .where(eq(characters.id, characterId));
  }

  return row!;
}

/**
 * Ottiene i premi di una quest.
 */
export async function getQuestRewards(questId: string): Promise<QuestReward[]> {
  const rows = await db
    .select({
      id: questRewards.id,
      characterId: questRewards.characterId,
      characterName: characters.name,
      type: questRewards.type,
      value: questRewards.value,
      description: questRewards.description,
      createdAt: questRewards.createdAt,
    })
    .from(questRewards)
    .innerJoin(characters, eq(questRewards.characterId, characters.id))
    .where(eq(questRewards.questId, questId))
    .orderBy(desc(questRewards.createdAt));

  return rows.map((r) => ({
    id: r.id,
    characterId: r.characterId,
    characterName: r.characterName,
    type: r.type as QuestReward["type"],
    value: r.value,
    description: r.description,
    createdAt: r.createdAt,
  }));
}

/**
 * Assegna shine a un personaggio ("Let this character shine!").
 * Solo lo Shinigami (creatore della quest) può assegnare. Assegna 1 punto al partecipante scelto.
 * La motivazione è obbligatoria. Se ha già assegnato, può cambiare destinatario e motivazione.
 */
export async function voteForCharacter(questId: string, voterId: string, votedFor: string, motivation: string) {
  const quest = await db.query.quests.findFirst({
    where: eq(quests.id, questId),
  });
  if (!quest) throw new Error("Quest non trovata");

  // Solo il creatore della quest (Shinigami/Master) può assegnare shine
  if (quest.creatorId !== voterId) {
    throw new Error("Solo il Master della quest può assegnare shine");
  }

  // Verifica che votedFor sia un partecipante
  const isParticipant = await db.query.questParticipants.findFirst({
    where: and(eq(questParticipants.questId, questId), eq(questParticipants.characterId, votedFor)),
  });
  if (!isParticipant) throw new Error("Il personaggio deve essere partecipante della quest");

  const existing = await db.query.questVotes.findFirst({
    where: and(eq(questVotes.questId, questId), eq(questVotes.voterId, voterId)),
  });

  const motivationTrimmed = motivation?.trim() || "";
  if (!motivationTrimmed) throw new Error("La motivazione è obbligatoria per assegnare shine");

  if (existing) {
    // Master può cambiare l'assegnazione e la motivazione
    const [row] = await db
      .update(questVotes)
      .set({ votedFor, motivation: motivationTrimmed })
      .where(eq(questVotes.id, existing.id))
      .returning();
    return row!;
  }

  const [row] = await db
    .insert(questVotes)
    .values({ questId, voterId, votedFor, motivation: motivationTrimmed })
    .returning();
  return row!;
}

/**
 * Ottiene i voti di una quest (conteggi aggregati + motivazione).
 */
export async function getQuestVotes(questId: string): Promise<{ characterId: string; characterName: string; votes: number; motivation?: string }[]> {
  const rows = await db
    .select({
      characterId: questVotes.votedFor,
      characterName: characters.name,
      motivation: sql<string | null>`MAX(${questVotes.motivation})`.as('motivation'),
      votes: sql<number>`COUNT(*)::int`.as('votes'),
    })
    .from(questVotes)
    .innerJoin(characters, eq(questVotes.votedFor, characters.id))
    .where(eq(questVotes.questId, questId))
    .groupBy(questVotes.votedFor, characters.name)
    .orderBy(desc(sql`COUNT(*)`));

  return rows.map((r) => ({
    characterId: r.characterId,
    characterName: r.characterName,
    votes: r.votes,
    motivation: r.motivation ?? undefined,
  }));
}

/**
 * Chiude una quest (solo il creatore).
 */
export async function closeQuest(questId: string, creatorId: string) {
  const quest = await db.query.quests.findFirst({
    where: eq(quests.id, questId),
  });
  if (!quest) throw new Error("Quest non trovata");
  if (quest.creatorId !== creatorId) throw new Error("Solo il creatore può chiudere la quest");

  const [row] = await db
    .update(quests)
    .set({ status: "CLOSED", closedAt: new Date() })
    .where(eq(quests.id, questId))
    .returning();
  return row!;
}

/**
 * Ottiene tutte le quest in pausa (per il creatore).
 */
export async function getPausedQuests(creatorId: string): Promise<Quest[]> {
  const rows = await db
    .select({
      id: quests.id,
      creatorId: quests.creatorId,
      creatorName: characters.name,
      title: quests.title,
      description: quests.description,
      type: quests.type,
      status: quests.status,
      roomId: quests.roomId,
      createdAt: quests.createdAt,
      closedAt: quests.closedAt,
    })
    .from(quests)
    .innerJoin(characters, eq(quests.creatorId, characters.id))
    .where(and(eq(quests.creatorId, creatorId), eq(quests.status, "PAUSED")))
    .orderBy(desc(quests.createdAt));

  const questsWithCounts = await Promise.all(
    rows.map(async (r) => {
      const [countRow] = await db
        .select({ n: sql<number>`count(*)::int`.as("n") })
        .from(questParticipants)
        .where(eq(questParticipants.questId, r.id));
      return {
        ...r,
        participantCount: countRow?.n ?? 0,
      };
    })
  );

  return questsWithCounts;
}

/**
 * Aggiorna lo stato di una quest (solo il creatore).
 */
export async function updateQuestStatus(questId: string, creatorId: string, status: QuestStatus) {
  const quest = await db.query.quests.findFirst({
    where: eq(quests.id, questId),
  });
  if (!quest) throw new Error("Quest non trovata");
  if (quest.creatorId !== creatorId) throw new Error("Solo il creatore può modificare la quest");

  const [row] = await db
    .update(quests)
    .set({ status, ...(status === "CLOSED" ? { closedAt: new Date() } : {}) })
    .where(eq(quests.id, questId))
    .returning();
  return row!;
}

/**
 * Elimina una quest (solo il creatore, solo se PAUSED o OPEN).
 */
export async function deleteQuest(questId: string) {
  const quest = await db.query.quests.findFirst({
    where: eq(quests.id, questId),
  });
  if (!quest) throw new Error("Quest non trovata");
  if (quest.status !== "PAUSED" && quest.status !== "OPEN") {
    throw new Error("Solo quest in pausa o aperte possono essere eliminate");
  }
  
  await db.delete(quests).where(eq(quests.id, questId));
}

/**
 * Recupera i messaggi di una quest (dalla chat dove è stata registrata).
 * Solo messaggi DOPO la creazione della quest (dall'inizio registrazione), fino alla chiusura (o ora se ancora aperta).
 */
export async function getQuestMessages(questId: string) {
  const quest = await db.query.quests.findFirst({
    where: eq(quests.id, questId),
  });
  if (!quest) throw new Error("Quest non trovata");
  if (!quest.roomId) throw new Error("Questa quest globale non ha messaggi in una chat specifica");

  // Messaggi nel periodo quest. Buffer 2min prima dell'avvio per includere messaggi "in volo" al click Registra.
  const createdAt = quest.createdAt instanceof Date ? quest.createdAt : new Date(quest.createdAt as string);
  const startBuf = new Date(createdAt.getTime() - 120_000); // 2 min prima
  const conditions = [eq(zoneMessages.zone, quest.roomId), gte(zoneMessages.createdAt, startBuf)];
  if (quest.closedAt) {
    const closedAt = quest.closedAt instanceof Date ? quest.closedAt : new Date(quest.closedAt as string);
    const endBuf = new Date(closedAt.getTime() + 60_000);
    conditions.push(lte(zoneMessages.createdAt, endBuf));
  }

  const messages = await db
    .select({
      id: zoneMessages.id,
      zone: zoneMessages.zone,
      characterId: zoneMessages.characterId,
      content: zoneMessages.content,
      locationTag: zoneMessages.locationTag,
      createdAt: zoneMessages.createdAt,
      isGlobal: zoneMessages.isGlobal,
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

  // Diagnostica: se nessun messaggio, verifica se la zone ha messaggi (per debug)
  if (messages.length === 0) {
    const anyInZone = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(zoneMessages)
      .where(eq(zoneMessages.zone, quest.roomId));
    if (anyInZone[0]?.n > 0) {
      console.warn(`[quest-messages] Zone ${quest.roomId} ha ${anyInZone[0].n} messaggi totali, ma 0 nel periodo quest (${createdAt.toISOString()})`);
    }
  }

  // Formatta i messaggi come ChatMessage. isMasterscreen = messaggio Shinigami autore della quest (mantiene formattazione anche dopo chiusura).
  const questCreatorId = quest.creatorId;
  return messages.map((m) => {
    const meta = (m.character?.uiMetadata as { roleIcon?: string; orderIcon?: string } | null) ?? {};
    const roleIcon = (meta.roleIcon ?? '').toLowerCase();
    const orderIcon = (meta.orderIcon ?? '').toLowerCase();
    
    // Costruisci pixelIcons
    const pixelIcons: { ruolo?: string[]; ordine?: string[] } = {};
    if (roleIcon && ['admin', 'moderatore', 'fixer', 'capo-shinigami', 'shinigami'].includes(roleIcon)) {
      pixelIcons.ruolo = [roleIcon];
    }
    if (orderIcon && ['mugen-tai', 'chisen-tai'].includes(orderIcon)) {
      pixelIcons.ordine = [orderIcon];
    } else if (m.character?.order && m.character.order !== 'NONE') {
      pixelIcons.ordine = [m.character.order.toLowerCase()];
    }

    const isMasterscreen = questCreatorId && m.characterId === questCreatorId;

    return {
      id: m.id,
      zone: m.isGlobal ? "GLOBAL" : m.zone,
      characterId: m.characterId,
      name: m.character?.name ?? "Unknown",
      surname: m.character?.surname ?? null,
      miniAvatar: m.character?.miniAvatar ?? null,
      content: m.content,
      locationTag: m.locationTag,
      createdAt: m.createdAt.toISOString(),
      pixelIcons,
      isMasterscreen: !!isMasterscreen,
    };
  }).reverse(); // Inverti per avere i messaggi in ordine cronologico (dal più vecchio al più recente)
}
