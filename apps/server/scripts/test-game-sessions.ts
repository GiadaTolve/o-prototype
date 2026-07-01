/**
 * Test Registrazione Giocata - verifica createGameSession, refreshParticipants, getGameSessionMessages.
 * Esegui: cd apps/server && bun run scripts/test-game-sessions.ts
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(import.meta.dir, "../../.env") });

import { db } from "../src/plugins/db";
import { zoneMessages, gameSessionParticipants } from "../src/db/schema";
import {
  createGameSession,
  getGameSession,
  refreshSessionParticipants,
  closeGameSession,
  getGameSessionMessages,
  cancelGameSession,
} from "../src/modules/game-sessions/game-sessions.service";

const TEST_ROOM = "kessen__cosmicon__junk_town";

async function runTests() {
  console.log("=== Test Registrazione Giocata ===\n");

  // 1. Ottieni un personaggio valido
  const char = await db.query.characters.findFirst({ columns: { id: true, name: true } });
  if (!char) {
    console.error("✗ Nessun personaggio nel DB");
    process.exit(1);
  }
  console.log(`  Character: ${char.name} (${char.id})`);
  console.log(`  Room: ${TEST_ROOM}\n`);

  const beforeStart = new Date(Date.now() - 10 * 60 * 1000); // 10 min fa

  let sessionId: string | null = null;

  try {
    // 2. Crea registrazione giocata
    const session = await createGameSession(char.id, TEST_ROOM, null, "Test Giocata");
    sessionId = session.id;
    const startedAt = session.startedAt instanceof Date ? session.startedAt : new Date(session.startedAt as string);
    console.log(`✓ createGameSession: sessione creata con startedAt=${startedAt.toISOString()}`);

    // 3. Inserisci messaggi: uno PRIMA di startedAt (non deve comparire)
    await db.insert(zoneMessages).values({
      zone: TEST_ROOM,
      characterId: char.id,
      content: "[TEST-PRIMA] Messaggio inviato PRIMA dell'avvio registrazione - non deve apparire",
      totalChars: 80,
      netChars: 70,
      expGained: 1,
      isGlobal: false,
      createdAt: beforeStart,
    });

    // Messaggio DOPO: usa createdAt default (now) — inserito dopo startedAt, chiusura dopo → nel range
    const longContent = "x".repeat(600);
    await db.insert(zoneMessages).values({
      zone: TEST_ROOM,
      characterId: char.id,
      content: "[TEST-DOPO] Messaggio azione inviato DOPO avvio " + longContent.slice(0, 50),
      totalChars: 650,
      netChars: 600,
      expGained: 10,
      isGlobal: false,
    });

    console.log("✓ Inseriti 2 messaggi: 1 prima di startedAt, 1 azione (>500 char) dopo");

    // 4. Refresh partecipanti
    await refreshSessionParticipants(session.id, TEST_ROOM);
    const updated = await getGameSession(session.id);
    const partCount = updated?.participants?.length ?? 0;
    console.log(`✓ refreshSessionParticipants: ${partCount} partecipanti`);

    if (partCount === 0) {
      console.warn("  (Il messaggio 'dopo' potrebbe avere createdAt futuro rispetto a startedAt - verifica orologi)");
    }

    // 5. Chiudi sessione
    await closeGameSession(session.id);
    console.log("✓ closeGameSession: sessione chiusa");

    // 6. Recupera messaggi (solo DOPO startedAt)
    const closedSession = await getGameSession(session.id);
    const messages = await getGameSessionMessages(session.id);
    const hasPrima = messages.some((m) => m.content.includes("TEST-PRIMA"));
    const hasDopo = messages.some((m) => m.content.includes("TEST-DOPO"));

    if (hasPrima) {
      console.error("✗ getGameSessionMessages: include messaggio PRIMA di startedAt (non dovrebbe)");
    } else if (hasDopo) {
      console.log("✓ getGameSessionMessages: solo messaggi DOPO startedAt (nessun messaggio prima)");
    } else {
      console.warn("⚠ getGameSessionMessages: 0 messaggi");
    }

    console.log(`  Messaggi restituiti: ${messages.length}`);

    // 7. Verifica isMasterscreen per creatore
    const creatorMsg = messages.find((m) => m.characterId === char.id);
    if (creatorMsg && creatorMsg.isMasterscreen) {
      console.log("✓ isMasterscreen: true per messaggi del creatore (Master)");
    } else if (creatorMsg) {
      console.log("  isMasterscreen: false (normale se creatore = unico partecipante con msg)");
    }

    console.log("\n--- Riepilogo ---");
    console.log("Flusso: Avvia → messaggi in chat (solo >startedAt salvati) → Chiudi → Leggi da Journal");
  } catch (e) {
    console.error("✗ Errore:", e);
    if (sessionId) {
      try {
        const s = await getGameSession(sessionId);
        if (s?.status !== "CLOSED" && s?.status !== "CANCELLED") {
          await cancelGameSession(sessionId);
          console.log("  Sessione di test annullata");
        }
      } catch (_) {}
    }
    process.exit(1);
  }

  // Pulizia: rimuovi messaggi di test (solo quelli con tag [TEST-)
  const { like } = await import("drizzle-orm");
  await db.delete(zoneMessages).where(like(zoneMessages.content, "%[TEST-%"));
  console.log("\n✓ Test completato. Messaggi di test rimossi.");
}

runTests();
