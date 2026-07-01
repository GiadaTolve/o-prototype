/**
 * Seed bestiario: PNG nelle categorie Holic, Phobias, Muen.
 * Esegui con: bun run scripts/seed-bestiario.ts
 */
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '../../.env') });

import { db } from '../src/plugins/db';
import { creatures } from '../src/db/schema';

const SAMPLE_PNG: Array<{ name: string; description: string; category: 'HOLIC' | 'PHOBIAS' | 'MUEN' }> = [
  { name: 'Kitsune', description: 'Spirito volpino del folklore giapponese.', category: 'HOLIC' },
  { name: 'Tengu', description: 'Divinità minore dalla lunga narice, maestro delle arti marziali.', category: 'HOLIC' },
  { name: 'Oni', description: 'Demone dalla pelle rossa o blu, abitante delle montagne.', category: 'PHOBIAS' },
  { name: 'Yūrei', description: 'Spirito inquieto senza pace.', category: 'PHOBIAS' },
  { name: 'Kage', description: 'Presenza nell\'ombra, osservatore silenzioso.', category: 'MUEN' },
];

async function seed() {
  console.log('[Bestiario] Reset e inserimento PNG (Holic, Phobias, Muen)...');
  await db.delete(creatures);

  console.log('[Bestiario] Inserimento PNG di esempio...');
  for (const p of SAMPLE_PNG) {
    await db.insert(creatures).values({
      name: p.name,
      description: p.description,
      category: p.category,
    });
  }
  console.log(`[Bestiario] Inseriti ${SAMPLE_PNG.length} PNG.`);
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('[Bestiario] Errore:', e);
    process.exit(1);
  });
