import { Pool } from "pg";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../../../.env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Locations
    await client.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        parent_id UUID REFERENCES locations(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('MAP', 'CHAT')),
        image_url TEXT,
        description TEXT,
        prefecture TEXT,
        pos_x INTEGER NOT NULL DEFAULT 50,
        pos_y INTEGER NOT NULL DEFAULT 50,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Banners
    await client.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        image_url TEXT NOT NULL,
        link_url TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        "order" INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Daily Events
    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_date DATE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Sanctions
    await client.query(`
      CREATE TABLE IF NOT EXISTS sanctions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK (type IN ('BAN', 'SHADOWBAN', 'WARNING', 'UNBAN')),
        reason TEXT,
        admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Indici
    await client.query(`CREATE INDEX IF NOT EXISTS idx_locations_parent_id ON locations(parent_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_banners_order ON banners("order")`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_daily_events_date ON daily_events(event_date)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sanctions_user_id ON sanctions(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sanctions_admin_id ON sanctions(admin_id)`);

    await client.query("COMMIT");
    console.log("✅ Tabelle admin create con successo!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Errore durante la creazione delle tabelle:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
