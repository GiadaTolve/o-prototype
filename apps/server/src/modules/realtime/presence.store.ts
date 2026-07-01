/**
 * Store in-memory per presenza real-time per room (chat location).
 * Ogni ws è in al più una room; join sovrascrive la precedente.
 */

export type PresenceUser = {
  wsId: string;
  userId: string;
  characterId: string;
  name: string;
  /** SHADOW ban: visibile ma segnalato (colore/icona in UI) */
  isShadow?: boolean;
  /** Circus (partychat): colore animale per badge */
  anonymousColor?: string;
};

/** roomId -> wsId -> user */
const byRoom = new Map<string, Map<string, PresenceUser>>();
/** wsId -> roomId (per leave on close) */
const wsToRoom = new Map<string, string>();
/** characterId -> user (indipendente dalla room) */
const allOnlineByCharacter = new Map<string, PresenceUser>();
/** wsId -> characterId (per cleanup su close) */
const wsToCharacter = new Map<string, string>();

function getOrCreateRoom(roomId: string): Map<string, PresenceUser> {
  let m = byRoom.get(roomId);
  if (!m) {
    m = new Map();
    byRoom.set(roomId, m);
  }
  return m;
}

export function join(roomId: string, wsId: string, user: Omit<PresenceUser, "wsId">): void {
  const prev = wsToRoom.get(wsId);
  if (prev && prev !== roomId) {
    const prevMap = byRoom.get(prev);
    prevMap?.delete(wsId);
    if (prevMap?.size === 0) byRoom.delete(prev);
  }
  wsToRoom.set(wsId, roomId);
  getOrCreateRoom(roomId).set(wsId, { ...user, wsId });
}

export function leave(wsId: string): string | null {
  const roomId = wsToRoom.get(wsId);
  if (!roomId) return null;
  wsToRoom.delete(wsId);
  const m = byRoom.get(roomId);
  m?.delete(wsId);
  if (m?.size === 0) byRoom.delete(roomId);
  return roomId;
}

export function getPresence(roomId: string): PresenceUser[] {
  const m = byRoom.get(roomId);
  return m ? Array.from(m.values()) : [];
}

export function getRoom(wsId: string): string | null {
  return wsToRoom.get(wsId) ?? null;
}

/**
 * Registra un utente come "online" indipendentemente dalla room.
 * Chiamato quando si apre la connessione WS.
 */
export function markOnline(wsId: string, user: { userId: string; characterId: string; name: string; isShadow?: boolean }): void {
  const presenceUser: PresenceUser = { ...user, wsId };
  wsToCharacter.set(wsId, user.characterId);
  allOnlineByCharacter.set(user.characterId, presenceUser);
}

/**
 * Rimuove un utente dallo stato "online".
 * Chiamato quando la connessione WS viene chiusa.
 */
export function markOffline(wsId: string): void {
  const charId = wsToCharacter.get(wsId);
  if (charId) {
    wsToCharacter.delete(wsId);
    allOnlineByCharacter.delete(charId);
  }
}

/**
 * Ottiene tutti gli utenti online (in qualsiasi room).
 * Utile per la "Lista Presenti" globale.
 */
export function getAllOnlineUsers(): PresenceUser[] {
  // Ritorna tutti i personaggi che hanno almeno un WS aperto, anche se non in una room
  return Array.from(allOnlineByCharacter.values());
}
