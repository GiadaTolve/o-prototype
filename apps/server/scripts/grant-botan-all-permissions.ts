/**
 * Assegna al personaggio "Botan" tutti i permessi esistenti:
 * - User role = MASTER (Shinigami + Gestione)
 * - Character grade = Akumu Zankyō (carica militare massima)
 * - Character uiMetadata.roleIcon = admin (pixel-icon proprietario, carica staff massima)
 * - EXP totale ≥ soglia liv. 49 (coerente col grado)
 *
 * Esegui:  cd apps/server && bun run grant-botan-all-permissions
 * Poi effettua di nuovo il login con Botan per aggiornare il JWT.
 */

import { config } from "dotenv";
import { resolve } from "path";
import { eq, ilike } from "drizzle-orm";

config({ path: resolve(process.cwd(), "../../.env") });

const CHARACTER_NAME = "Botan";
/** Soglia EXP livello 49 — grado Akumu Zankyō (@domain/progression/levels). */
const EXP_AKUMU_ZANKYO_MIN = 46_392;
const GRADE_MAX = "Akumu Zankyō";
const ROLE_ICON_MAX = "admin";

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
    .select({
      uiMetadata: characters.uiMetadata,
      experienceTotal: characters.experienceTotal,
      experienceSpendable: characters.experienceSpendable,
    })
    .from(characters)
    .where(eq(characters.id, char.id));
  const current = (row?.uiMetadata as Record<string, unknown> | null) ?? {};
  const merged = { ...current, roleIcon: ROLE_ICON_MAX as const };
  const expTotal = Math.max(row?.experienceTotal ?? 0, EXP_AKUMU_ZANKYO_MIN);
  const expSpendable = Math.max(row?.experienceSpendable ?? 0, EXP_AKUMU_ZANKYO_MIN);
  await db
    .update(characters)
    .set({
      grade: GRADE_MAX,
      experienceTotal: expTotal,
      experienceSpendable: expSpendable,
      uiMetadata: merged,
    })
    .where(eq(characters.id, char.id));

  console.log("\n✅ Permessi assegnati a", char.name);
  console.log("   • User role: MASTER (Shinigami + Gestione)");
  console.log(`   • Character grade: ${GRADE_MAX}`);
  console.log(`   • Character roleIcon: ${ROLE_ICON_MAX} (pixel proprietario)`);
  console.log(`   • EXP totale: ${expTotal} (≥ liv. 49)`);
  console.log("\n   Effettua di nuovo il login con Botan per aggiornare il JWT.\n");
  process.exit(0);
}

main().catch((e) => {
  console.error("Errore:", e);
  process.exit(1);
});
