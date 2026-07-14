/**
 * Accredita EXP a tutti i personaggi tranne Botan (database Neon team).
 * Usa applyCharacterExpGain (totale + spendibile + Key livello + banner).
 *
 * Richiede NEON_DATABASE_URL in .env (root repo).
 * Esegui: cd apps/server && bun run scripts/grant-exp-all-except-botan.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import { ilike, not } from "drizzle-orm";

config({ path: resolve(process.cwd(), "../../.env") });

const EXP_AMOUNT = 1_250;
const EXCLUDE_NAME = "Botan";

function sanitizeNeonUrl(raw: string): string {
  const url = new URL(raw.replace(/^postgres(ql)?:/, "http:"));
  // Il pooler Neon non accetta search_path in startup options.
  if (url.hostname.includes("-pooler")) {
    url.searchParams.delete("options");
  }
  return url.toString().replace(/^http:/, raw.startsWith("postgresql:") ? "postgresql:" : "postgres:");
}

function requireNeonDatabaseUrl(): string {
  const neonUrl = process.env.NEON_DATABASE_URL?.trim();
  if (!neonUrl) {
    console.error("\n❌ NEON_DATABASE_URL non impostato in .env (root repo).");
    console.error("   Usa la connection string Neon, non il Postgres locale.\n");
    process.exit(1);
  }
  if (neonUrl.includes("localhost") || neonUrl.includes("127.0.0.1")) {
    console.error("\n❌ NEON_DATABASE_URL punta a localhost — usa la connection string Neon.\n");
    process.exit(1);
  }
  const sanitized = sanitizeNeonUrl(neonUrl);
  process.env.DATABASE_URL = sanitized;
  return sanitized;
}

async function main() {
  const neonUrl = requireNeonDatabaseUrl();
  const host = (() => {
    try {
      return new URL(neonUrl.replace(/^postgres(ql)?:/, "http:")).host;
    } catch {
      return "(neon)";
    }
  })();
  console.log(`\nDatabase: Neon (${host})\n`);

  const { db } = await import("../src/plugins/db");
  const { characters } = await import("../src/db/schema");
  const { applyCharacterExpGain } = await import(
    "../src/modules/characters/level-up.service"
  );

  const rows = await db
    .select({
      id: characters.id,
      name: characters.name,
      experienceTotal: characters.experienceTotal,
      experienceSpendable: characters.experienceSpendable,
    })
    .from(characters)
    .where(not(ilike(characters.name, EXCLUDE_NAME)));

  if (rows.length === 0) {
    console.log("\n⚠️  Nessun personaggio da aggiornare.\n");
    process.exit(0);
  }

  console.log(`\nAccredito ${EXP_AMOUNT} EXP a ${rows.length} personaggi (escluso ${EXCLUDE_NAME})…\n`);

  let ok = 0;
  for (const row of rows) {
    const result = await applyCharacterExpGain(row.id, EXP_AMOUNT);
    if (!result) {
      console.log(`  ✗ ${row.name}: accredito fallito`);
      continue;
    }
    ok += 1;
    const levelNote = result.levelUp
      ? ` · level up → liv. ${result.levelUp.newLevel}`
      : "";
    console.log(
      `  ✓ ${row.name}: EXP tot. ${row.experienceTotal} → ${result.newExpTotal}${levelNote}`,
    );
  }

  console.log(`\n✅ Completato: ${ok}/${rows.length} personaggi aggiornati.\n`);
  process.exit(0);
}

main().catch((e) => {
  console.error("Errore:", e);
  process.exit(1);
});
