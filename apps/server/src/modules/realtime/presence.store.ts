/**
 * Store in-memory per presenza real-time per room (chat location).
 * Ogni ws è in al più una room; join sovrascrive la precedente.
 *
 * La lista "Presenti" resta fino a logout esplicito o ~4h senza heartbeat
 * (non si rimuove alla chiusura WS: proxy/load balancer possono chiudere idle ~10 min).
 */

/** Inattività massima prima di uscire dalla lista Presenti (4 ore). */
export const PRESENCE_INACTIVITY_MS = 4 * 60 * 60 * 1000;

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

type OnlineSession = PresenceUser & { lastSeenAt: number };

/** roomId -> wsId -> user */
const byRoom = new Map<string, Map<string, PresenceUser>>();
/** wsId -> roomId (per leave on close) */
const wsToRoom = new Map<string, string>();
/** characterId -> sessione online (indipendente dalla room) */
const allOnlineByCharacter = new Map<string, OnlineSession>();
/** wsId -> characterId (per cleanup su close) */
const wsToCharacter = new Map<string, string>();
/** characterId -> wsId attivi (più tab / riconnessioni) */
const wsIdsByCharacter = new Map<string, Set<string>>();

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

/** Room corrente del personaggio (qualsiasi WS attivo). */
export function getRoomForCharacter(characterId: string): string | null {
  const set = wsIdsByCharacter.get(characterId);
  if (!set) return null;
  for (const wsId of set) {
    const room = wsToRoom.get(wsId);
    if (room) return room;
  }
  return null;
}

export function hasActiveConnection(characterId: string): boolean {
  return (wsIdsByCharacter.get(characterId)?.size ?? 0) > 0;
}

/**
 * Registra un utente come "online" indipendentemente dalla room.
 * Chiamato quando si apre la connessione WS.
 */
export function markOnline(wsId: string, user: { userId: string; characterId: string; name: string; isShadow?: boolean }): void {
  const now = Date.now();
  const presenceUser: PresenceUser = { ...user, wsId };
  wsToCharacter.set(wsId, user.characterId);
  let set = wsIdsByCharacter.get(user.characterId);
  if (!set) {
    set = new Set();
    wsIdsByCharacter.set(user.characterId, set);
  }
  set.add(wsId);
  const prev = allOnlineByCharacter.get(user.characterId);
  allOnlineByCharacter.set(user.characterId, {
    ...presenceUser,
    lastSeenAt: now,
    isShadow: user.isShadow ?? prev?.isShadow,
  });
}

/** Aggiorna lastSeenAt (heartbeat WS/HTTP). */
export function touchOnline(characterId: string): void {
  const entry = allOnlineByCharacter.get(characterId);
  if (entry) {
    entry.lastSeenAt = Date.now();
    return;
  }
}

/**
 * Rimuove il tracking WS; la sessione resta in lista finché non scade lastSeenAt o logout.
 * Chiamato quando la connessione WS viene chiusa.
 */
export function markOffline(wsId: string): void {
  const charId = wsToCharacter.get(wsId);
  if (!charId) return;
  wsToCharacter.delete(wsId);
  const set = wsIdsByCharacter.get(charId);
  set?.delete(wsId);
  if (!set || set.size === 0) {
    wsIdsByCharacter.delete(charId);
    return;
  }
  const current = allOnlineByCharacter.get(charId);
  if (current?.wsId === wsId) {
    const nextWsId = set.values().next().value as string;
    allOnlineByCharacter.set(charId, { ...current, wsId: nextWsId, lastSeenAt: Date.now() });
  }
}

/** Logout esplicito: rimuove subito dalla lista Presenti. */
export function forceOffline(characterId: string): void {
  allOnlineByCharacter.delete(characterId);
  const set = wsIdsByCharacter.get(characterId);
  if (set) {
    for (const wsId of set) {
      wsToCharacter.delete(wsId);
    }
    wsIdsByCharacter.delete(characterId);
  }
}

function pruneExpiredSessions(): void {
  const cutoff = Date.now() - PRESENCE_INACTIVITY_MS;
  for (const [charId, entry] of allOnlineByCharacter) {
    if (entry.lastSeenAt < cutoff) {
      allOnlineByCharacter.delete(charId);
    }
  }
}

/** Pulizia periodica sessioni scadute (>4h senza heartbeat). */
let cleanupStarted = false;
export function startPresenceCleanup(): void {
  if (cleanupStarted) return;
  cleanupStarted = true;
  setInterval(pruneExpiredSessions, 5 * 60 * 1000);
}

/**
 * Ottiene tutti gli utenti online (in qualsiasi room).
 * Utile per la "Lista Presenti" globale.
 */
export function getAllOnlineUsers(): PresenceUser[] {
  pruneExpiredSessions();
  return Array.from(allOnlineByCharacter.values()).map(({ lastSeenAt: _lastSeenAt, ...user }) => user);
}
