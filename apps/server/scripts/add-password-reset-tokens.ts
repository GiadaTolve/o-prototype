/**
 * Aggiunge la tabella password_reset_tokens.
 * Esegui: cd apps/server && bun run scripts/add-password-reset-tokens.ts
 */
import { db } from "../src/plugins/db";
import { sql } from "drizzle-orm";

async function main() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log("✅ Tabella password_reset_tokens creata.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
