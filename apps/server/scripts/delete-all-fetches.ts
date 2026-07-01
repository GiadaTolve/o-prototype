/**
 * Elimina tutte le fetch esistenti (per ripartire da zero nei test).
 * Esegui: cd apps/server && bun run scripts/delete-all-fetches.ts
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(import.meta.dir, "../../.env") });

import { db } from "../src/plugins/db";
import { fetches } from "../src/db/schema";

async function main() {
  const result = await db.delete(fetches).returning({ id: fetches.id });
  console.log(`✅ Eliminate ${result.length} fetch.`);
}

main().catch(console.error).finally(() => process.exit(0));
