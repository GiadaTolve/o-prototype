/**
 * Rinomina la colonna cost_kotodama → cost_jigoka (Kotodama → Jigoka).
 * Esegui prima di db:push se hai già dati: cd apps/server && bun run scripts/rename-cost-kotodama-to-jigoka.ts
 */
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '../../.env') });

import { db } from '../src/plugins/db';
import { sql } from 'drizzle-orm';

async function main() {
  // Verifica se la colonna cost_kotodama esiste (DB già migrato avrà cost_jigoka)
  const check = await db.execute(sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'skills' AND column_name = 'cost_kotodama'
  `);
  if (check.rows.length === 0) {
    console.log('✅ Colonna cost_kotodama non trovata (già cost_jigoka o tabella skills assente). Skip.');
    return;
  }
  await db.execute(sql`ALTER TABLE skills RENAME COLUMN cost_kotodama TO cost_jigoka`);
  console.log('✅ Colonna skills.cost_kotodama rinominata in cost_jigoka.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
