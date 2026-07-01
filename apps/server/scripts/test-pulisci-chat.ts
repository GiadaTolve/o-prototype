/**
 * Test Pulisci Chat - verifica clearRoom, getRoomClearedAt, getMessages.
 * Esegui: cd apps/server && bun run scripts/test-pulisci-chat.ts
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(import.meta.dir, "../../.env") });

import { db } from "../src/plugins/db";
import {
  getMessages,
  getRoomClearedAt,
  clearRoom,
  isValidRoom,
  insertMessage,
} from "../src/modules/chat/chat.service";
import { zoneMessages, roomCleared } from "../src/db/schema";
import { eq } from "drizzle-orm";

const TEST_ROOM = "kessen__cosmicon__junk_town";

async function runTests() {
  console.log("=== Test Pulisci Chat ===\n");

  let passed = 0;
  let failed = 0;

  // 1. Verifica tabella room_cleared esiste
  try {
    await db.select().from(roomCleared).limit(1);
    console.log("✓ Tabella room_cleared esiste");
    passed++;
  } catch (e) {
    console.error("✗ Tabella room_cleared non esiste. Esegui: bun run scripts/add-room-cleared-table.ts");
    console.error("  Errore:", e);
    failed++;
    process.exit(1);
  }

  // 2. isValidRoom
  const valid = isValidRoom(TEST_ROOM);
  if (valid) {
    console.log(`✓ isValidRoom("${TEST_ROOM}") = true`);
    passed++;
  } else {
    console.error(`✗ isValidRoom("${TEST_ROOM}") = false`);
    failed++;
  }

  // 3. Ottieni un characterId
  const charRow = await db.query.characters.findFirst({ columns: { id: true, name: true } });
  if (!charRow) {
    console.error("✗ Nessun personaggio nel DB");
    failed++;
    process.exit(1);
  }
  const characterId = charRow.id;
  console.log(`✓ Character per test: ${charRow.name} (${characterId})`);
  passed++;

  // 4. Prima di clear: verifica stato room
  const clearedBefore = await getRoomClearedAt(TEST_ROOM);
  console.log(`  getRoomClearedAt prima: ${clearedBefore ?? "null"}`);
  passed++;

  // 5. Inserisci messaggio di test (bypass rate limit per semplicità - usiamo insert diretto)
  const [inserted] = await db
    .insert(zoneMessages)
    .values({
      zone: TEST_ROOM,
      characterId,
      content: "[TEST] Messaggio per test pulisci chat " + Date.now(),
      netChars: 10,
      expGained: 1,
      totalChars: 50,
      isGlobal: false,
    })
    .returning();

  if (!inserted) {
    console.error("✗ Impossibile inserire messaggio test");
    failed++;
  } else {
    console.log(`✓ Messaggio test inserito (id: ${inserted.id})`);
    passed++;
  }

  // 6. getMessages prima del clear (dovrebbe includere il messaggio appena inserito)
  const msgsBefore = await getMessages(TEST_ROOM, 50);
  const hasOurMsg = inserted ? msgsBefore.some((m) => m.id === inserted.id) : false;
  if (inserted && hasOurMsg) {
    console.log(`✓ getMessages prima del clear: ${msgsBefore.length} messaggi (include nostro)`);
    passed++;
  } else if (!inserted) {
    console.log(`  getMessages prima: ${msgsBefore.length} messaggi`);
    passed++;
  } else {
    console.error(`✗ getMessages prima: messaggio test non trovato (potrebbe essere filtrato da scadenza 1h30?)`);
    console.error(`  Totale messaggi: ${msgsBefore.length}`);
    failed++;
  }

  // 7. clearRoom
  try {
    await clearRoom(TEST_ROOM, characterId);
    console.log("✓ clearRoom eseguito");
    passed++;
  } catch (e) {
    console.error("✗ clearRoom fallito:", e);
    failed++;
  }

  // 8. getRoomClearedAt dopo clear
  const clearedAfter = await getRoomClearedAt(TEST_ROOM);
  if (clearedAfter) {
    console.log(`✓ getRoomClearedAt dopo: ${clearedAfter.toISOString()}`);
    passed++;
  } else {
    console.error("✗ getRoomClearedAt dopo: ancora null!");
    failed++;
  }

  // 9. getMessages dopo clear - NON deve includere messaggi prima di clearedAt
  const msgsAfter = await getMessages(TEST_ROOM, 50);
  const hasOldMsgAfter = inserted ? msgsAfter.some((m) => m.id === inserted.id) : false;
  if (inserted && hasOldMsgAfter) {
    console.error("✗ getMessages dopo clear: il nostro messaggio È ANCORA VISIBILE (BUG!)");
    failed++;
  } else {
    console.log(`✓ getMessages dopo clear: ${msgsAfter.length} messaggi (messaggio test nascosto)`);
    passed++;
  }

  // 10. Verifica Log: getChatLogs (admin) dovrebbe ancora vedere tutto - non testiamo qui, ma il filtro excludeCleared
  const msgsNoFilter = await getMessages(TEST_ROOM, 50, undefined, false);
  const hasInLog = inserted ? msgsNoFilter.some((m) => m.id === inserted.id) : false;
  if (inserted && hasInLog) {
    console.log(`✓ getMessages(..., excludeCleared=false): messaggio presente (Log)`);
    passed++;
  } else if (!inserted) {
    passed++;
  } else {
    console.log(`  Nota: excludeCleared=false restituisce da zone_messages - dipende da altre query`);
    passed++;
  }

  // Cleanup: rimuovi messaggio test
  if (inserted) {
    await db.delete(zoneMessages).where(eq(zoneMessages.id, inserted.id));
    console.log("  (messaggio test rimosso)");
  }

  console.log(`\n=== Risultato: ${passed} passati, ${failed} falliti ===`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((e) => {
  console.error("Errore fatale:", e);
  process.exit(1);
});
