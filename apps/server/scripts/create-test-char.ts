/**
 * Crea un personaggio di test per provare login e SMS.
 *
 * Esegui:  cd apps/server && bun run create-test-char
 * (Postgres deve essere avviato e DATABASE_URL in .env corretto.)
 *
 * Credenziali generate:
 *   Nome PG:  TestSms
 *   Password: Test1234!
 *   Email:    test-sms@oyasumi.local
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "../../.env") });

const EMAIL = "test-sms@oyasumi.local";
const PASSWORD = "Test1234!";
const CHARACTER_NAME = "TestSms";

async function main() {
  try {
    const { registerUser } = await import("../src/modules/auth/auth.service");
    const { user, character } = await registerUser(EMAIL, PASSWORD, CHARACTER_NAME);
    console.log("\n✅ Personaggio di test creato.\n");
    console.log("  Nome PG:  ", CHARACTER_NAME);
    console.log("  Password: ", PASSWORD);
    console.log("  Email:    ", EMAIL);
    console.log("  User ID:  ", user.id);
    console.log("  Char ID:  ", character.id);
    console.log("\nUsa Nome PG + Password nella pagina di login per testare gli SMS.\n");
  } catch (e) {
    if (e instanceof Error && e.message === "User already exists") {
      console.log("\n⚠️  Un account con questa email esiste già.");
      console.log("  Usa: Nome PG =", CHARACTER_NAME, ", Password =", PASSWORD);
      console.log("  Se non ricordi la password, modifica EMAIL in questo script e riesegui.\n");
    } else {
      console.error("Errore:", e);
      console.error("\nVerifica che Postgres sia avviato e DATABASE_URL in .env sia corretto.\n");
      process.exit(1);
    }
  } finally {
    process.exit(0);
  }
}

main();
