/**
 * Partychat (Circus): chat anonima con regole a sé, gestita da admin.
 * Solo admin può aprire/chiudere. Partecipanti ricevono nome animale + colore.
 */
import { eq, and } from "drizzle-orm";
import { db, pool } from "../../plugins/db";
import { anonymousRoomState, anonymousParticipants } from "../../db/schema";

const ANIMAL_NAMES = [
  "Lupo", "Volpe", "Gatto", "Corvo", "Serpente", "Rana", "Orso", "Aquila",
  "Cervo", "Lumaca", "Falco", "Gufo", "Lince", "Lontra", "Pipistrello", "Riccio",
  "Tasso", "Scoiattolo", "Martora", "Cinghiale",
];

const ANONYMOUS_COLORS = [
  "#a78bfa", "#f472b6", "#34d399", "#fbbf24", "#60a5fa", "#f97316",
  "#22d3ee", "#c084fc", "#4ade80", "#fb923c", "#818cf8", "#2dd4bf",
];

export async function getRoomState(roomId: string): Promise<{
  isOpen: boolean;
  openedAt?: string;
  openedById?: string;
  sessionTitle?: string;
}> {
  const row = await db
    .select()
    .from(anonymousRoomState)
    .where(eq(anonymousRoomState.roomId, roomId))
    .limit(1);
  if (!row[0]) {
    return { isOpen: false };
  }
  return {
    isOpen: row[0].isOpen,
    openedAt: row[0].openedAt?.toISOString(),
    openedById: row[0].openedById ?? undefined,
    sessionTitle: row[0].sessionTitle ?? undefined,
  };
}

export async function setRoomOpen(
  roomId: string,
  isOpen: boolean,
  adminCharacterId: string,
  sessionTitle?: string | null
): Promise<void> {
  if (isOpen) {
    const now = new Date();
    const title = sessionTitle?.trim() || null;
    await pool.query(
      `INSERT INTO anonymous_room_state (room_id, is_open, opened_by_id, opened_at, session_title)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (room_id) DO UPDATE SET
         is_open = $6, opened_by_id = $7, opened_at = $8, session_title = $9`,
      [roomId, true, adminCharacterId, now, title, true, adminCharacterId, now, title]
    );
  } else {
    // Prima crea la giocata "evento" (se c'è una sessione da registrare)
    const { createClosedCircusEvent } = await import("../game-sessions/game-sessions.service");
    const [row] = await db
      .select({ openedAt: anonymousRoomState.openedAt, openedById: anonymousRoomState.openedById, sessionTitle: anonymousRoomState.sessionTitle })
      .from(anonymousRoomState)
      .where(eq(anonymousRoomState.roomId, roomId))
      .limit(1);
    if (row?.openedAt && row?.openedById) {
      await createClosedCircusEvent(roomId, row.openedById, row.openedAt, row.sessionTitle ?? "Evento");
    }
    await db
      .update(anonymousRoomState)
      .set({ isOpen: false, openedById: null, openedAt: null, sessionTitle: null })
      .where(eq(anonymousRoomState.roomId, roomId));
    await db.delete(anonymousParticipants).where(eq(anonymousParticipants.roomId, roomId));
  }
}

export async function joinSession(roomId: string, characterId: string): Promise<{ animalName: string; color: string } | null> {
  const state = await getRoomState(roomId);
  if (!state.isOpen) return null;

  const existing = await db
    .select()
    .from(anonymousParticipants)
    .where(and(eq(anonymousParticipants.roomId, roomId), eq(anonymousParticipants.characterId, characterId)))
    .limit(1);
  if (existing[0]) {
    return { animalName: existing[0].animalName, color: existing[0].color };
  }

  const used = await db
    .select({ animalName: anonymousParticipants.animalName })
    .from(anonymousParticipants)
    .where(eq(anonymousParticipants.roomId, roomId));
  const usedAnimals = new Set(used.map((r) => r.animalName));
  const availableAnimals = ANIMAL_NAMES.filter((a) => !usedAnimals.has(a));
  const animalName = availableAnimals[Math.floor(Math.random() * availableAnimals.length)] ?? ANIMAL_NAMES[used.length % ANIMAL_NAMES.length];
  const color = ANONYMOUS_COLORS[used.length % ANONYMOUS_COLORS.length];

  await db.insert(anonymousParticipants).values({
    roomId,
    characterId,
    animalName,
    color,
  }).onConflictDoNothing();

  return { animalName, color };
}

export async function leaveSession(roomId: string, characterId: string): Promise<void> {
  await db
    .delete(anonymousParticipants)
    .where(and(eq(anonymousParticipants.roomId, roomId), eq(anonymousParticipants.characterId, characterId)));
}

export async function getParticipant(roomId: string, characterId: string): Promise<{ animalName: string; color: string } | null> {
  const row = await db
    .select()
    .from(anonymousParticipants)
    .where(and(eq(anonymousParticipants.roomId, roomId), eq(anonymousParticipants.characterId, characterId)))
    .limit(1);
  return row[0] ? { animalName: row[0].animalName, color: row[0].color } : null;
}
