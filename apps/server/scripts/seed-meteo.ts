/**
 * Seed meteo prefetture con valori mock iniziali.
 *
 * Esegui:  cd apps/server && bun run seed-meteo
 * (Dopo `bun run db:push`. Postgres avviato, DATABASE_URL in .env.)
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "../../.env") });

const METEO_INITIAL = [
  { prefetturaId: "edo", temp: 18, condition: "Sereno", icon: "sun" as const },
  { prefetturaId: "kessen", temp: 12, condition: "Nuvoloso", icon: "cloud-sun" as const },
  { prefetturaId: "kotowari", temp: 15, condition: "Variabile", icon: "cloud" as const },
] as const;

async function main() {
  const { db } = await import("../src/plugins/db");
  const { meteoPrefetture } = await import("../src/db/schema");

  const existing = await db.select().from(meteoPrefetture).limit(1);
  if (existing.length > 0) {
    console.log("⚠️  Tabelle meteo_prefetture già popolata. Vuoi fare truncate e re-seed? (skip per ora)");
    process.exit(0);
  }

  await db.insert(meteoPrefetture).values(METEO_INITIAL.map((m) => ({ ...m, updatedById: null })));

  console.log("✅ Seed meteo completato: " + METEO_INITIAL.length + " prefetture.");
  process.exit(0);
}

main().catch((e) => {
  console.error("Errore seed:", e);
  process.exit(1);
});
