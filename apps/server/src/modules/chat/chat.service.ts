import { desc, eq, and, lt, gt, gte, lte, sql } from "drizzle-orm";
import { db } from "../../plugins/db";
import { zoneMessages, characters } from "../../db/schema";
import { parseNarrativeMessage, calculateExpFromNetChars } from "./narrative-parser";
import { canSendMessage } from "./rate-limiter";

/** Room IDs (location chat). Allineato a map-config client. */
const VALID_ROOMS = new Set([
  "kessen__cosmicon__junk_town",
  "kessen__cosmicon__arcade_palace",
  "kessen__cosmicon__milky_way",
  "edo__paradise",
  "edo__ginza_o_clock",
  "kotowari__astrolabio",
  "kotowari__osservatorio",
  "hamanachi__casa_da_te",
  "hamanachi__ospedale",
]);

export function isValidRoom(roomId: string): boolean {
  // Accetta anche room ID di housing (formato: housing_*)
  if (roomId.startsWith("housing_")) {
    return true;
  }
  return VALID_ROOMS.has(roomId);
}

export async function insertMessage(
  roomId: string,
  characterId: string,
  content: string,
  locationTag?: string | null,
  isGlobal: boolean = false
) {
  // Anti-spam: verifica rate limit (solo per messaggi normali, non globali)
  if (!isGlobal && !canSendMessage(characterId)) {
    throw new Error("Troppi messaggi inviati. Attendi qualche secondo.");
  }

  // Parsing narrativo: estrae parlati, tag narrativi, calcola caratteri netti e EXP
  // I messaggi globali non danno EXP
  const parsed = isGlobal ? { netChars: 0 } : parseNarrativeMessage(content);
  const expGained = isGlobal ? 0 : calculateExpFromNetChars(parsed.netChars);

  const tag = locationTag != null ? String(locationTag).trim().slice(0, 120) || null : null;
  const totalChars = content.length;
  const [row] = await db
    .insert(zoneMessages)
    .values({
      zone: roomId,
      characterId,
      content,
      locationTag: tag,
      netChars: parsed.netChars,
      expGained,
      totalChars,
      isGlobal,
    })
    .returning();

  // Aggiorna EXP del personaggio (experienceTotal e experienceSpendable) solo per messaggi normali
  if (!isGlobal && expGained > 0) {
    await db
      .update(characters)
      .set({
        experienceTotal: sql`${characters.experienceTotal} + ${expGained}`,
        experienceSpendable: sql`${characters.experienceSpendable} + ${expGained}`,
      })
      .where(eq(characters.id, characterId));
  }

  return row;
}

export async function getMessages(roomId: string, limit = 50, before?: string) {
  // Carica messaggi della room specifica
  const roomCondition = before
    ? and(eq(zoneMessages.zone, roomId), eq(zoneMessages.isGlobal, false), lt(zoneMessages.createdAt, new Date(before)))
    : and(eq(zoneMessages.zone, roomId), eq(zoneMessages.isGlobal, false));
  
  const roomQ = db
    .select({
      id: zoneMessages.id,
      zone: zoneMessages.zone,
      characterId: zoneMessages.characterId,
      name: characters.name,
      surname: characters.surname,
      miniAvatar: characters.miniAvatar,
      uiMetadata: characters.uiMetadata,
      order: characters.order,
      content: zoneMessages.content,
      locationTag: zoneMessages.locationTag,
      isGlobal: zoneMessages.isGlobal,
      createdAt: zoneMessages.createdAt,
    })
    .from(zoneMessages)
    .innerJoin(characters, eq(zoneMessages.characterId, characters.id))
    .where(roomCondition)
    .orderBy(desc(zoneMessages.createdAt))
    .limit(limit);

  const roomRows = await roomQ;

  // Carica anche i messaggi globali recenti (ultime 24 ore o ultimi 20 messaggi globali)
  const globalCutoff = new Date();
  globalCutoff.setHours(globalCutoff.getHours() - 24);
  
  const globalQ = db
    .select({
      id: zoneMessages.id,
      zone: zoneMessages.zone,
      characterId: zoneMessages.characterId,
      name: characters.name,
      surname: characters.surname,
      miniAvatar: characters.miniAvatar,
      uiMetadata: characters.uiMetadata,
      order: characters.order,
      content: zoneMessages.content,
      locationTag: zoneMessages.locationTag,
      isGlobal: zoneMessages.isGlobal,
      createdAt: zoneMessages.createdAt,
    })
    .from(zoneMessages)
    .innerJoin(characters, eq(zoneMessages.characterId, characters.id))
    .where(
      before
        ? and(eq(zoneMessages.isGlobal, true), gte(zoneMessages.createdAt, globalCutoff), lt(zoneMessages.createdAt, new Date(before)))
        : and(eq(zoneMessages.isGlobal, true), gte(zoneMessages.createdAt, globalCutoff))
    )
    .orderBy(desc(zoneMessages.createdAt))
    .limit(20);

  const globalRows = await globalQ;

  // Combina e ordina per data
  const allRows = [...roomRows, ...globalRows];
  allRows.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  
  return allRows;
}

/** 1 azione = 1 messaggio con >500 caratteri totali (QUEST_AND_FETCH_SPEC §2). */
const ACTION_CHAR_THRESHOLD = 500;

/**
 * Conta le azioni per personaggio nella room nel periodo [from, to].
 * Usato per: partecipanti selezionabili in chiusura quest (>2 azioni), premio Fetch (>4 azioni).
 */
export async function getActionsPerCharacter(
  roomId: string,
  from: Date,
  to?: Date
): Promise<Map<string, number>> {
  const conds = [
    eq(zoneMessages.zone, roomId),
    gte(zoneMessages.createdAt, from),
    gt(zoneMessages.totalChars, ACTION_CHAR_THRESHOLD),
  ];
  if (to) conds.push(lte(zoneMessages.createdAt, to));

  const rows = await db
    .select({
      characterId: zoneMessages.characterId,
      n: sql<number>`count(*)::int`.as("n"),
    })
    .from(zoneMessages)
    .where(and(...conds))
    .groupBy(zoneMessages.characterId);

  return new Map(rows.map((r) => [r.characterId, r.n]));
}
