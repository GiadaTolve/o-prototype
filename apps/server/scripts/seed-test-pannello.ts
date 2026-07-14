/**
 * Crea il personaggio di test TEST_Pannello per collaudare il pannello di combattimento.
 * Solo DB LOCALE — non tocca Neon.
 *
 * Uso: cd apps/server && bun run scripts/seed-test-pannello.ts
 *
 * Credenziali: test_pannello@local.oyasumi / pannello123
 *
 * Waza assegnate (coprono tutti i casi-limite §4 della spec):
 *   Hadō:    Byō T1, Hōden T2, Rensa-Baku T2 (multi-quarto)
 *   Tōka:    Kakuchō T1 (masterOnlyCard), Fuin-no-Hi T2 (effetto rimandato+master)
 *   Itō:     Rensa T1 (multi-quarto+effetto rimandato)
 *   Generico: Shikigami T2 ([Costrutto] → EVOCA_COSTRUTTO block)
 *   Rin'gai: Yobimodoshi T2 (spesa counter Macchiato)
 *   Generico: Uzu T1 (multi-quarto+masterOnlyCard)
 */

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(import.meta.dir, '../../../.env') })

import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../src/db/schema'

const LOCAL_DB = 'postgres://localhost:5432/oyasumi_2'
const client = postgres(LOCAL_DB)
const db = drizzle(client, { schema })

const TEST_EMAIL = 'test_pannello@local.oyasumi'
const TEST_PASSWORD = 'pannello123'
const TEST_CHAR_NAME = 'TEST_Pannello'

// Skiru sheet generosa — tutte le skiru a 10 per massima flessibilità di test
const TEST_SKIRU_SHEET: Record<string, number> = {
  fudoshin: 10,
  chokaku: 10,
  hansha: 10,
  seimitsu: 10,
  itami: 10,
  konjou: 10,
  kairiki: 10,
  tenshin: 10,
  kakusei: 10,
  nintai: 10,
  byakugan: 10,
  reikiryoku: 10,
  heion: 10,
  kansha: 10,
  kizuato: 10,
}

// pool_id delle waza da assegnare (devono già esistere nella tabella skills)
const WAZA_POOL_IDS = [
  'byo-ancora-psionica',              // Hadō T1 → Kaden selector
  'hoden-scarica-impatto',            // Hadō T2 → altro Hadō
  'rensa-baku-detonazione-catena',    // Hadō T2, needsQuarto → multi-quarto
  'kakucho-espansione-della-luce',    // Tōka T1, masterOnlyCard
  'fuin-no-hi-sigillo-della-fiamma',  // Tōka T2, needsDelayedEffect + masterOnlyCard
  'rensa-catena-fili',                // Itō T1, needsQuarto + needsDelayedEffect
  'generiche-shikigami-forma-spirito',// Generico T2, [Costrutto] → EVOCA_COSTRUTTO
  'yobimodoshi',                      // Rin'gai, needsMacchiatoSpend
  'uzu',                              // Generico T1, needsQuarto + masterOnlyCard
  'someito-filo-tinto',               // Itō passiva, needsTrasformaTag (consistenza)
  'yugami-filo-deforme',              // Itō passiva, needsTrasformaTag (categoria)
]

async function main() {
  console.log('=== Seed TEST_Pannello (solo locale) ===')

  // 1. Crea o aggiorna utente
  let userId: string
  const existingUser = await db.query.users.findFirst({
    where: eq(schema.users.email, TEST_EMAIL),
  })

  if (existingUser) {
    userId = existingUser.id
    console.log(`Utente già esistente: ${userId}`)
  } else {
    const passwordHash = await Bun.password.hash(TEST_PASSWORD)
    const [inserted] = await db.insert(schema.users).values({
      email: TEST_EMAIL,
      passwordHash,
      role: 'PLAYER',
      banState: 'NONE',
    }).returning({ id: schema.users.id })
    userId = inserted.id
    console.log(`Utente creato: ${userId}`)
  }

  // 2. Crea o aggiorna personaggio
  let charId: string
  const existingChar = await db.query.characters.findFirst({
    where: eq(schema.characters.userId, userId),
  })

  if (existingChar) {
    charId = existingChar.id
    await db.update(schema.characters)
      .set({
        currentHp: 35,
        skiruSheet: TEST_SKIRU_SHEET,
        chronoStackState: { current: 18, accumulating: false, skipNextTurn: false, overheatTurns: 0 },
      })
      .where(eq(schema.characters.id, charId))
    console.log(`Personaggio aggiornato: ${charId}`)
  } else {
    const [inserted] = await db.insert(schema.characters).values({
      userId,
      name: TEST_CHAR_NAME,
      surname: 'DEV',
      grade: 'Akumu Zankyō',
      currentHp: 35,
      skiruSheet: TEST_SKIRU_SHEET,
      chronoStackState: { current: 18, accumulating: false, skipNextTurn: false, overheatTurns: 0 },
      baseSlots: 20,
      isRaw: false,
    }).returning({ id: schema.characters.id })
    charId = inserted.id
    console.log(`Personaggio creato: ${charId}`)
  }

  // 3. Assegna le waza
  let added = 0
  let skipped = 0
  for (const poolId of WAZA_POOL_IDS) {
    const skill = await db.query.skills.findFirst({
      where: eq(schema.skills.poolId, poolId),
    })
    if (!skill) {
      console.warn(`  ⚠ Skill non trovata in DB: ${poolId}`)
      continue
    }

    const existing = await db.query.characterSkills.findFirst({
      where: (cs, { and }) => and(
        eq(cs.characterId, charId),
        eq(cs.skillId, skill.id),
      ),
    })

    if (existing) {
      skipped++
    } else {
      await db.insert(schema.characterSkills).values({
        characterId: charId,
        skillId: skill.id,
        level: 1,
      })
      added++
      console.log(`  + ${skill.name} (${poolId})`)
    }
  }

  console.log(`\nWaza: ${added} aggiunte, ${skipped} già presenti`)
  console.log('\n=== Fatto ===')
  console.log(`Login: ${TEST_EMAIL} / ${TEST_PASSWORD}`)
  console.log(`Char ID: ${charId}`)
  await client.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
