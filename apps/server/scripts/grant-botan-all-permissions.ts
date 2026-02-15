/**
 * Assegna al personaggio "Botan" tutti i permessi esistenti:
 * - User role = MASTER (Shinigami + Gestione)
 * - Character uiMetadata.roleIcon = capo-shinigami
 *
 * Esegui:  cd apps/server && bun run grant-botan-all-permissions
 * Poi effettua di nuovo il login con Botan per aggiornare il JWT.
 */

import { config } from "dotenv";
import { resolve } from "path";
import { eq, ilike } from "drizzle-orm";

config({ path: resolve(process.cwd(), "../../.env") });

const CHARACTER_NAME = "Botan";

async function main() {
  const { db } = await import("../src/plugins/db");
  const { characters, users } = await import("../src/db/schema");

  const [char] = await db
    .select({ id: characters.id, userId: characters.userId, name: characters.name })
    .from(characters)
    .where(ilike(characters.name, CHARACTER_NAME))
    .limit(1);

  if (!char) {
    console.error("\n❌ Nessun personaggio trovato con nome \"Botan\".");
    console.error("   Verifica che il nome sia esatto (case-insensitive).\n");
    process.exit(1);
  }

  await db
    .update(users)
    .set({ role: "MASTER" })
    .where(eq(users.id, char.userId));

  const [row] = await db
    .select({ uiMetadata: characters.uiMetadata })
    .from(characters)
    .where(eq(characters.id, char.id));
  const current = (row?.uiMetadata as Record<string, unknown> | null) ?? {};
  const merged = { ...current, roleIcon: "capo-shinigami" as const };
  await db
    .update(characters)
    .set({ uiMetadata: merged })
    .where(eq(characters.id, char.id));

  console.log("\n✅ Permessi assegnati a", char.name);
  console.log("   • User role: MASTER (Shinigami + Gestione)");
  console.log("   • Character roleIcon: capo-shinigami");
  console.log("\n   Effettua di nuovo il login con Botan per aggiornare il JWT.\n");
  process.exit(0);
}

main().catch((e) => {
  console.error("Errore:", e);
  process.exit(1);
});
