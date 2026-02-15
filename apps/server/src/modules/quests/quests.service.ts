import { eq, and, desc, inArray, or, gte, lte } from "drizzle-orm";
import { db } from "../../plugins/db";
import { quests, questParticipants, questRewards, questVotes, characters, zoneMessages } from "../../db/schema";
import { sql } from "drizzle-orm";

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
    await db
      .update(characters)
      .set({
        experienceTotal: sql`${characters.experienceTotal} + ${value}`,
        experienceSpendable: sql`${characters.experienceSpendable} + ${value}`,
      })
      .where(eq(characters.id, characterId));
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
 * Vota per un personaggio in una quest ("Let this character shine!").
 * Un personaggio può votare solo una volta per quest.
 */
export async function voteForCharacter(questId: string, voterId: string, votedFor: string) {
  // Verifica che la quest esista
  const quest = await db.query.quests.findFirst({
    where: eq(quests.id, questId),
  });
  if (!quest) throw new Error("Quest non trovata");

  // Verifica che non abbia già votato
  const existing = await db.query.questVotes.findFirst({
    where: and(eq(questVotes.questId, questId), eq(questVotes.voterId, voterId)),
  });
  if (existing) throw new Error("Hai già votato per questa quest");

  // Verifica che votedFor sia un partecipante
  const isParticipant = await db.query.questParticipants.findFirst({
    where: and(eq(questParticipants.questId, questId), eq(questParticipants.characterId, votedFor)),
  });
  if (!isParticipant) throw new Error("Il personaggio votato non partecipa a questa quest");

  const [row] = await db
    .insert(questVotes)
    .values({ questId, voterId, votedFor })
    .returning();
  return row!;
}

/**
 * Ottiene i voti di una quest (conteggi aggregati).
 */
export async function getQuestVotes(questId: string): Promise<{ characterId: string; characterName: string; votes: number }[]> {
  const rows = await db
    .select({
      characterId: questVotes.votedFor,
      characterName: characters.name,
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
 * Restituisce tutti i messaggi dalla creazione della quest fino alla chiusura (o ora se ancora aperta).
 */
export async function getQuestMessages(questId: string) {
  const quest = await db.query.quests.findFirst({
    where: eq(quests.id, questId),
  });
  if (!quest) throw new Error("Quest non trovata");
  if (!quest.roomId) throw new Error("Questa quest non ha una chat associata");

  // Filtra i messaggi per roomId e periodo
  const conditions = [eq(zoneMessages.zone, quest.roomId), gte(zoneMessages.createdAt, quest.createdAt)];
  if (quest.closedAt) {
    conditions.push(lte(zoneMessages.createdAt, quest.closedAt));
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

  // Formatta i messaggi come ChatMessage
  return messages.map((m) => {
    const meta = (m.character?.uiMetadata as { roleIcon?: string; orderIcon?: string } | null) ?? {};
    const roleIcon = (meta.roleIcon ?? '').toLowerCase();
    const orderIcon = (meta.orderIcon ?? '').toLowerCase();
    
    // Costruisci pixelIcons
    const pixelIcons: { ruolo?: string[]; ordine?: string[] } = {};
    if (roleIcon && ['admin', 'moderatore', 'capo-shinigami', 'shinigami'].includes(roleIcon)) {
      pixelIcons.ruolo = [roleIcon];
    }
    if (orderIcon && ['mugen-tai', 'chisen-tai'].includes(orderIcon)) {
      pixelIcons.ordine = [orderIcon];
    } else if (m.character?.order && m.character.order !== 'NONE') {
      pixelIcons.ordine = [m.character.order.toLowerCase()];
    }

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
    };
  }).reverse(); // Inverti per avere i messaggi in ordine cronologico (dal più vecchio al più recente)
}
