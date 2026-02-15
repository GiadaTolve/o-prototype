/**
 * Rate limiter per anti-spam nei messaggi chat.
 * Limita il numero di messaggi per characterId in un intervallo di tempo.
 */

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

/** characterId -> entry (in-memory, si resetta al riavvio) */
const rateLimitStore = new Map<string, RateLimitEntry>();

/** Limite: 10 messaggi per 60 secondi */
const MAX_MESSAGES = 10;
const WINDOW_MS = 60 * 1000; // 60 secondi

/**
 * Verifica se un character può inviare un messaggio (anti-spam).
 * 
 * @param characterId ID del personaggio
 * @returns true se può inviare, false se è in rate limit
 */
export function canSendMessage(characterId: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(characterId);

  if (!entry) {
    // Prima volta: crea entry
    rateLimitStore.set(characterId, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  // Se la finestra è scaduta, resetta
  if (now >= entry.resetAt) {
    rateLimitStore.set(characterId, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  // Se ha raggiunto il limite, blocca
  if (entry.count >= MAX_MESSAGES) {
    return false;
  }

  // Incrementa contatore
  entry.count += 1;
  return true;
}

/**
 * Ottiene il tempo rimanente prima che il rate limit si resetti (in secondi).
 * 
 * @param characterId ID del personaggio
 * @returns secondi rimanenti, o 0 se non è in rate limit
 */
export function getRateLimitRemaining(characterId: string): number {
  const entry = rateLimitStore.get(characterId);
  if (!entry) return 0;
  const now = Date.now();
  if (now >= entry.resetAt) return 0;
  return Math.ceil((entry.resetAt - now) / 1000);
}
