/**
 * Sincronizza le waza Tōka-dō modificate in Lab (skills) → authoring + chat.
 * - Nomi display, CS da tier, descrizione/effetto, legacy_id
 * - Crea authoring mancante (es. Tomurai no Tō)
 *
 * Uso: cd apps/server && bun run scripts/sync-toka-lab-chat.ts
 */
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '../../.env') })

import { eq, sql } from 'drizzle-orm'
import { db } from '../src/plugins/db'
import { skills, waza, wazaVersioni } from '../src/db/schema'
import { resolveDefaultWazaCostCs } from '@domain/progression/waza-cost-exp'
import { stripWazaSystemMarkers } from '@domain/progression/waza-grade-req'
import { parseWazaTierFromRank } from '@domain/combat/waza-rank'

/** Tutte le waza Tōka-dō del canone (skills → authoring Lab / chat). */
const MODIFIED_TOKA_POOL_IDS = [
  'toro-lanterna-incisa',
  'michishirube-luce-guida',
  'shoka-fiamma-docile',
  'nokuribi-fuoco-residuo',
  'kintsugi-legame-dei-frammenti',
  'kakucho-espansione-della-luce',
  'kaeribi-fiamma-del-ritorno',
  'fuin-no-hi-sigillo-della-fiamma',
  'tomoshibi-no-ato-traccia-della-luce',
  'kyomei-risonanza-della-fiamma',
  'hoshutsu-rilascio-della-fiamma',
  'ukabu-toro-lanterna-fluttuante',
  'toro-nagashi-lanterna-alla-corrente',
  'hi-o-tsumugu-filatura-della-fiamma',
  'omocha-il-giocattolo',
  'gangushi-il-giocattolaio',
  'tomurai-no-to-rito-funebre',
] as const

const GENITORE = 'Tōka-dō'

function parseLabName(name: string): { nomeRomaji: string; nomeItaliano: string; kanji: string } {
  const m = name.trim().match(/^(.+?)\s·\s(.+?)(?:\s\(([^)]+)\))?$/)
  if (!m) return { nomeRomaji: name.trim(), nomeItaliano: name.trim(), kanji: '' }
  return { nomeRomaji: m[1].trim(), nomeItaliano: m[2].trim(), kanji: (m[3] ?? '').trim() }
}

function buildDescrizione(flavor: string | null, effect: string | null): string {
  const f = flavor?.trim() ? stripWazaSystemMarkers(flavor) : ''
  const e = effect?.trim() ?? ''
  if (f && e) return `${f}\n\n${e}`
  return f || e
}

function patchEffettiTesto(effetti: unknown, effectText: string): unknown {
  if (!Array.isArray(effetti) || effetti.length === 0) {
    return [
      {
        tipo: 'MANUALE',
        trigger: 'AL_LANCIO',
        testo: effectText,
        mostra_a: 'MASTER',
      },
    ]
  }
  let patched = false
  const next = effetti.map((raw) => {
    if (!raw || typeof raw !== 'object') return raw
    const e = raw as Record<string, unknown>
    if (e.tipo === 'MANUALE' && typeof e.testo === 'string') {
      patched = true
      return { ...e, testo: effectText }
    }
    return raw
  })
  if (!patched) {
    next.unshift({
      tipo: 'MANUALE',
      trigger: 'AL_LANCIO',
      testo: effectText,
      mostra_a: 'MASTER',
    })
  }
  return next
}

async function resolveSalvataDa(): Promise<string> {
  const row = await db.query.wazaVersioni.findFirst({ columns: { salvataDa: true } })
  if (!row?.salvataDa) throw new Error('salvata_da non trovato in waza_versioni')
  return row.salvataDa
}

async function main() {
  const salvataDa = await resolveSalvataDa()
  let updated = 0
  let created = 0

  for (const poolId of MODIFIED_TOKA_POOL_IDS) {
    const skill = await db.query.skills.findFirst({
      where: eq(skills.poolId, poolId),
      columns: {
        id: true,
        name: true,
        description: true,
        effect: true,
        rank: true,
        isPassive: true,
      },
    })
    if (!skill) {
      console.warn(`✗ skill mancante: ${poolId}`)
      continue
    }

    // Correzione nota: Kyōmei è T2 nel canone Lab
    if (poolId === 'kyomei-risonanza-della-fiamma' && skill.rank === 'T3') {
      await db.update(skills).set({ rank: 'T2' }).where(eq(skills.id, skill.id))
      skill.rank = 'T2'
      console.log('✓ kyomei rank T3 → T2')
    }

    const { nomeRomaji, nomeItaliano, kanji } = parseLabName(skill.name)
    const cs = resolveDefaultWazaCostCs({
      isPassive: skill.isPassive ?? false,
      rank: skill.rank,
    })
    const tier = skill.isPassive ? null : parseWazaTierFromRank(skill.rank)
    const descrizione = buildDescrizione(skill.description, skill.effect)
    const effectText = skill.effect?.trim() ?? ''
    const tipo = skill.isPassive ? 'passiva' : 'attiva'

    let authoring = await db.query.waza.findFirst({
      where: eq(waza.legacyId, skill.id),
      columns: { id: true, slug: true },
    })

    if (!authoring) {
      const [inserted] = await db
        .insert(waza)
        .values({
          slug: poolId,
          categoria: 'do',
          genitore: GENITORE,
          tipo,
          tier,
          legacyId: skill.id,
        })
        .returning({ id: waza.id })
      authoring = { id: inserted.id, slug: poolId }

      await db.insert(wazaVersioni).values({
        wazaId: inserted.id,
        numero: 1,
        stato: 'pubblicata',
        nomeRomaji,
        nomeItaliano,
        kanji: kanji || null,
        kanjiVerificato: true,
        descrizione,
        cs,
        tempoQuarti: skill.isPassive ? null : 1,
        tags: [],
        scelteAlLancio: [],
        effetti: patchEffettiTesto([], effectText) as never,
        skiruIr: [],
        atomiUsati: [],
        statoCodifica: effectText ? 'manuale' : 'da_codificare',
        salvataDa,
      })
      created += 1
      console.log(`+ authoring ${poolId} · ${skill.name}`)
      continue
    }

    if (authoring.slug !== poolId) {
      await db.update(waza).set({ slug: poolId, tier }).where(eq(waza.id, authoring.id))
    } else if (tier != null) {
      await db.update(waza).set({ tier }).where(eq(waza.id, authoring.id))
    }

    const versione = await db.query.wazaVersioni.findFirst({
      where: eq(wazaVersioni.wazaId, authoring.id),
      orderBy: (v, { desc }) => [desc(v.numero)],
      columns: { id: true, numero: true, effetti: true },
    })

    if (!versione) {
      console.warn(`✗ versione mancante per ${poolId}`)
      continue
    }

    const effetti = effectText
      ? patchEffettiTesto(versione.effetti, effectText)
      : versione.effetti

    await db
      .update(wazaVersioni)
      .set({
        nomeRomaji,
        nomeItaliano,
        kanji: kanji || null,
        kanjiVerificato: true,
        descrizione,
        cs,
        effetti: effetti as never,
        stato: 'pubblicata',
        salvataIl: sql`NOW()`,
      })
      .where(eq(wazaVersioni.id, versione.id))

    updated += 1
    console.log(`✓ ${poolId} · CS ${cs} · ${nomeRomaji} / ${nomeItaliano}`)
  }

  console.log(`\nAuthoring aggiornati: ${updated} · creati: ${created}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
