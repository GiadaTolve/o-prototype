/**
 * Seed tabelle Grades e Levels da QUEST_AND_FETCH_SPEC §7.
 *
 * Esegui:  cd apps/server && bun run seed-grades-levels
 * (Dopo `bun run db:push`. Postgres avviato, DATABASE_URL in .env.)
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { LEVELS } from '@domain/progression'

config({ path: resolve(process.cwd(), '../../.env') })

const GRADES = [
  { name: 'Nemuribito', definition: "Sognatore. Ha appena aperto il terzo occhio e non ha idea di come si manipoli l'ego con successo. Ha ottenuto la vista onirica; deve ancora destreggiarsi fra ordini e potenzialità.", levelMin: 1, levelMax: 3 },
  { name: 'Hakyō', definition: "Lo specchio infranto. Cadetto: ha superato la soglia del sognatore, ha scelto l'ordine e si è iniziato allo studio accademico della manipolazione dell'Ego.", levelMin: 3, levelMax: 10 },
  { name: 'Bunsekikan', definition: 'Analista. Affermato, riconosciuto come abile nella manipolazione. Corrispettivo del soldato.', levelMin: 11, levelMax: 18 },
  { name: 'Sentatsu Bunsekikan', definition: 'Analista Superiore. Specializzato in almeno un ramo, spicca per talento o intelletto. In grado di grandi cose nel proprio settore.', levelMin: 18, levelMax: 28 },
  { name: 'Kanteikan', definition: 'Analista Esecutivo. Alle vette della carriera; conoscono quel che possono offrire (esperienza e maestria nell\'ego). Spesso a capo di settori o battaglioni.', levelMin: 28, levelMax: 38 },
  { name: "Shin'enkan", definition: "Guardiano dell'Abisso. Ufficiali per cui il mondo onirico non ha più segreti. Comandano legioni, capitanano guerre e manovre vincenti; molteplici assi nella manica oltre il potenziale d'ego.", levelMin: 38, levelMax: 48 },
  { name: 'Akumu Zankyō', definition: "L'eco dell'Incubo. Non più considerato Analista né persona; parte del cosmo onirico. Chi si salva dal delirio diventa one-man-army, arma senziente; il grado militare decade a favore di un titolo unico, riconoscibile con il nome di una psicopatologia.", levelMin: 48, levelMax: 999 },
] as const

async function main() {
  const { db } = await import('../src/plugins/db')
  const { grades, levels } = await import('../src/db/schema')

  const levelCount = await db.select().from(levels).limit(1)
  const gradeCount = await db.select().from(grades).limit(1)

  if (levelCount.length > 0 || gradeCount.length > 0) {
    console.log('⚠️  Tabelle levels/grades già popolate. Vuoi fare truncate e re-seed? (skip per ora)')
    process.exit(0)
  }

  await db.insert(grades).values(GRADES.map((g) => ({ name: g.name, definition: g.definition, levelMin: g.levelMin, levelMax: g.levelMax })))
  await db.insert(levels).values(
    LEVELS.map((l) => ({
      level: l.level,
      expDelta: l.expDelta,
      expTotal: l.expTotal,
      phase: l.phase,
    })),
  )

  console.log('✅ Seed completato: ' + GRADES.length + ' grades, ' + LEVELS.length + ' levels.')
  process.exit(0)
}

main().catch((e) => {
  console.error('Errore seed:', e)
  process.exit(1)
})
