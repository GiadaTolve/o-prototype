import { desc, eq, and, lt, gt, gte, lte, ne, sql } from "drizzle-orm";
import { db } from "../../plugins/db";
import { zoneMessages, characters, users, roomCleared, sceneGroundLoot } from "../../db/schema";
import { parseNarrativeMessage, calculateExpFromTotalChars } from "./narrative-parser";
import { containsResolvedDice, isDiceRollMessage, stripDiceTags } from "@domain/chat/dice-display";
import { canSendMessage } from "./rate-limiter";
import { getParticipant } from "../anonymous-chat/anonymous-chat.service";
import { applyCharacterExpGain } from "../characters/level-up.service";
import { characterService } from "../characters/characters.service";
import type { PendingLevelUpBanner } from "@domain/progression/level-up";

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

const PARADISE_ROOM = "edo__paradise";

export async function insertMessage(
  roomId: string,
  characterId: string,
  content: string,
  locationTag?: string | null,
  isGlobal: boolean = false,
  anonymousAnimalName?: string | null,
  anonymousColor?: string | null,
  isMasterscreen: boolean = false,
  skipExpGain: boolean = false,
) {
  // Anti-spam: verifica rate limit (solo per messaggi normali, non globali)
  if (!isGlobal && !canSendMessage(characterId)) {
    throw new Error("Troppi messaggi inviati. Attendi qualche secondo.");
  }

  // Chat anonima Paradise: recupera animalName/color se non forniti
  let anonName = anonymousAnimalName ?? null;
  let anonColor = anonymousColor ?? null;
  if (roomId === PARADISE_ROOM && !anonName) {
    const p = await getParticipant(roomId, characterId);
    if (p) {
      anonName = p.animalName;
      anonColor = p.color;
    }
  }

  // Parsing narrativo: estrae parlati, tag narrativi, calcola caratteri netti e EXP
  // I messaggi globali non danno EXP
  let finalContent = content;
  if (!isGlobal && !isMasterscreen && !isDiceRollMessage(content)) {
    try {
      const stateTag = await characterService.buildActionStateSummaryTag(characterId);
      if (stateTag) finalContent = `${content.trimEnd()}${stateTag}`;
    } catch (e) {
      console.error('[chat] action state summary:', e);
    }
  }

  const totalChars = finalContent.length;
  const parsed = isGlobal ? { netChars: 0 } : parseNarrativeMessage(finalContent);
  let expGained = 0;
  if (!isGlobal && !skipExpGain) {
    if (containsResolvedDice(content) && isDiceRollMessage(content)) {
      expGained = 0;
    } else if (containsResolvedDice(content)) {
      expGained = calculateExpFromTotalChars(stripDiceTags(finalContent).length);
    } else {
      expGained = calculateExpFromTotalChars(totalChars);
    }
  }

  const tag = locationTag != null ? String(locationTag).trim().slice(0, 120) || null : null;
  const [row] = await db
    .insert(zoneMessages)
    .values({
      zone: roomId,
      characterId,
      content: finalContent,
      locationTag: tag,
      netChars: parsed.netChars,
      expGained,
      totalChars,
      isGlobal,
      anonymousAnimalName: anonName,
      anonymousColor: anonColor,
      isMasterscreen,
    })
    .returning();

  let levelUp: PendingLevelUpBanner | null = null;
  if (!isGlobal && expGained > 0) {
    const gain = await applyCharacterExpGain(characterId, expGained);
    levelUp = gain?.levelUp ?? null;
  }

  return { row, levelUp };
}

/** Restituisce clearedAt per la room (se presente). I messaggi con createdAt < clearedAt non sono mostrati in chat. */
export async function getRoomClearedAt(roomId: string): Promise<Date | null> {
  const row = await db
    .select({ clearedAt: roomCleared.clearedAt })
    .from(roomCleared)
    .where(eq(roomCleared.roomId, roomId))
    .limit(1);
  return row[0]?.clearedAt ?? null;
}

/** Imposta la chat come "pulita" da ora in poi. I messaggi precedenti restano nel DB ma non sono mostrati (sempre visibili nel Log). */
export async function clearRoom(roomId: string, clearedByCharacterId: string): Promise<void> {
  await db
    .insert(roomCleared)
    .values({ roomId, clearedById: clearedByCharacterId })
    .onConflictDoUpdate({
      target: roomCleared.roomId,
      set: { clearedAt: sql`CURRENT_TIMESTAMP`, clearedById: clearedByCharacterId },
    });
  await db.delete(sceneGroundLoot).where(eq(sceneGroundLoot.roomId, roomId));
}

/** Azioni durano 1h30 in chat. Dopo scadono dalla vista (restano nel Log). */
const ACTION_EXPIRY_MS = 90 * 60 * 1000;

export async function getMessages(roomId: string, limit = 50, before?: string, excludeCleared = true) {
  // Se excludeCleared, filtra: 1) messaggi prima di cleared_at (pulisci manuale), 2) messaggi più vecchi di 1h30 (scadenza automatica)
  let minVisibleAt: Date | null = null;
  if (excludeCleared) {
    const clearedAt = await getRoomClearedAt(roomId);
    const expiryCutoff = new Date(Date.now() - ACTION_EXPIRY_MS);
    minVisibleAt = clearedAt && clearedAt > expiryCutoff ? clearedAt : expiryCutoff;
  }

  // Carica messaggi della room specifica (escludi utenti shadowbannati)
  const roomBaseConditions = [
    eq(zoneMessages.zone, roomId),
    eq(zoneMessages.isGlobal, false),
  ];
  if (minVisibleAt) roomBaseConditions.push(gte(zoneMessages.createdAt, minVisibleAt));
  if (before) roomBaseConditions.push(lt(zoneMessages.createdAt, new Date(before)));
  const roomCondition = and(...roomBaseConditions);
  const excludeShadow = ne(users.banState, "SHADOW");
  
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
      anonymousAnimalName: zoneMessages.anonymousAnimalName,
      anonymousColor: zoneMessages.anonymousColor,
      isMasterscreen: zoneMessages.isMasterscreen,
    })
    .from(zoneMessages)
    .innerJoin(characters, eq(zoneMessages.characterId, characters.id))
    .innerJoin(users, eq(characters.userId, users.id))
    .where(and(roomCondition, excludeShadow))
    .orderBy(desc(zoneMessages.createdAt))
    .limit(limit);

  const roomRows = await roomQ;

  // Carica anche i messaggi globali recenti (escludi shadowbannati). Anche i globali scadono dopo 1h30.
  const globalCutoff = minVisibleAt ?? new Date(Date.now() - ACTION_EXPIRY_MS);
  const globalCondition = before
    ? and(eq(zoneMessages.isGlobal, true), gte(zoneMessages.createdAt, globalCutoff), lt(zoneMessages.createdAt, new Date(before)))
    : and(eq(zoneMessages.isGlobal, true), gte(zoneMessages.createdAt, globalCutoff));
  
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
      anonymousAnimalName: zoneMessages.anonymousAnimalName,
      anonymousColor: zoneMessages.anonymousColor,
      isMasterscreen: zoneMessages.isMasterscreen,
    })
    .from(zoneMessages)
    .innerJoin(characters, eq(zoneMessages.characterId, characters.id))
    .innerJoin(users, eq(characters.userId, users.id))
    .where(and(globalCondition, excludeShadow))
    .orderBy(desc(zoneMessages.createdAt))
    .limit(20);

  const globalRows = await globalQ;

  // Combina e ordina per data
  const allRows = [...roomRows, ...globalRows];
  allRows.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  
  return allRows;
}

/** 1 azione = 1 messaggio con >500 caratteri totali (QUEST_AND_FETCH_SPEC). */
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
