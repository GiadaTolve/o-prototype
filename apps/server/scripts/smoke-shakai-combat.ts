/**
 * Smoke test Shakai + combattimento (DB + domain services).
 * Uso: cd apps/server && bun run scripts/smoke-shakai-combat.ts
 */
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(import.meta.dir, '../../../.env') })

import { count, eq, isNotNull, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { processWazaChatAutomation } from '@domain/combat/waza-chat-automation'
import { buildWazaTagIndex } from '@domain/combat/waza-tag-preview'
import { createStatusContainer } from '@domain/combat/status/engine'
import {
  canAccessSocialBlueprint,
  isCraftableBlueprint,
  socialBlueprintOutputCatalogKey,
} from '@domain/shakai-kaikyu'
import { getSocialBlueprint, SOCIAL_BLUEPRINTS } from '@domain/shakai-kaikyu/blueprint-catalog'
import * as schema from '../src/db/schema'
import { craftFromBlueprint, listCharacterBlueprints } from '../src/modules/shakai/shakai.service'
import { getPoliticoToolState } from '../src/modules/politico/politico.service'
import { getSacerdoteToolState } from '../src/modules/sacerdote/sacerdote.service'

const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/oyasumi_2'
const client = postgres(connectionString)
const db = drizzle(client, { schema })

type Check = { name: string; ok: boolean; detail?: string }

const checks: Check[] = []

function pass(name: string, detail?: string) {
  checks.push({ name, ok: true, detail })
  console.log(`  ✅ ${name}${detail ? ` — ${detail}` : ''}`)
}

function fail(name: string, detail?: string) {
  checks.push({ name, ok: false, detail })
  console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ''}`)
}

async function main() {
  console.log('=== Smoke Shakai + Combattimento ===\n')

  // ── DB schema ──
  console.log('[DB]')
  try {
    const [bpCount] = await db.select({ n: count() }).from(schema.socialBlueprints)
    const n = Number(bpCount?.n ?? 0)
    if (n >= 60) pass('social_blueprints', `${n} righe`)
    else fail('social_blueprints', `solo ${n} righe — esegui seed-social-blueprints`)

    await db.execute(sql`SELECT 1 FROM social_pacts LIMIT 1`)
    pass('tabella social_pacts')

    await db.execute(sql`SELECT 1 FROM social_ofuda LIMIT 1`)
    pass('tabella social_ofuda')

    const craftableInDb = await db.query.socialBlueprints.findMany({
      where: isNotNull(schema.socialBlueprints.outputCatalogKey),
      columns: { id: true },
      limit: 5,
    })
    if (craftableInDb.length > 0) pass('blueprint craftabili in DB', `${craftableInDb.length}+ voci`)
    else fail('blueprint craftabili in DB', 'nessun outputCatalogKey')
  } catch (e) {
    fail('schema DB', e instanceof Error ? e.message : String(e))
  }

  // ── Domain blueprint sync ──
  console.log('\n[Domain blueprint]')
  const domainCraftable = SOCIAL_BLUEPRINTS.filter(isCraftableBlueprint).length
  pass('catalogo domain craftabile', `${domainCraftable} ricette`)
  const sample = getSocialBlueprint('medico-bendaggio-semplice')
  if (sample && socialBlueprintOutputCatalogKey(sample)?.startsWith('prep-')) {
    pass('output key medico', socialBlueprintOutputCatalogKey(sample)!)
  } else {
    fail('output key medico')
  }

  // ── Combattimento automation ──
  console.log('\n[Combattimento chat]')
  const wazaIndex = buildWazaTagIndex([
    {
      name: 'Kankatsu (管轄) — Giurisdizione',
      poolId: 'kankatsu-giurisdizione',
      rank: 'T3',
      styleId: 'ito',
      isPassive: false,
    },
    {
      name: 'Nagori (名残) — Principio di Instabilità',
      poolId: 'nagori-principio-instabilita',
      rank: 'T3',
      styleId: 'hensei',
      isPassive: false,
    },
    {
      name: 'Colpo Test',
      poolId: 'test-hit',
      rank: 'T2',
      styleId: 'generiche',
      isPassive: false,
      effect: 'Attiva · [Proiettile][Sonoro] · CS 2',
    },
  ])
  const empty = createStatusContainer()

  const giur = processWazaChatAutomation({
    content: '[waza:Kankatsu (管轄) — Giurisdizione] [giurisdizione:proiettile]',
    meta: {},
    statusContainer: empty,
    wazaIndex,
    chronoCsAvailable: 10,
    actorCharacterId: 'smoke',
  })
  if (giur.effects.some((e) => e.kind === 'giurisdizione_activated')) {
    pass('Giurisdizione attiva')
  } else fail('Giurisdizione attiva')

  const nagoriPrep = processWazaChatAutomation({
    content: '[waza:Nagori (名残) — Principio di Instabilità] [yuragi:solido→liquido]',
    meta: {},
    statusContainer: empty,
    wazaIndex,
    chronoCsAvailable: 10,
    actorCharacterId: 'smoke',
  })
  const nagoriHit = processWazaChatAutomation({
    content: '[waza:Colpo Test] [tier:2] [hit:1] [target:Yuki]',
    meta: nagoriPrep.meta,
    statusContainer: empty,
    wazaIndex,
    chronoCsAvailable: 10,
    actorCharacterId: 'smoke',
    roomParticipants: [{ characterId: 'v1', name: 'Yuki' }],
  })
  if (nagoriHit.effects.some((e) => e.kind === 'nagori_collateral_consumed')) {
    pass('Nagori collaterale consumato su hit')
  } else fail('Nagori collaterale consumato su hit')

  const claim2 = processWazaChatAutomation({
    content: '[giurisdizione:reclama]',
    meta: giur.meta,
    statusContainer: empty,
    wazaIndex,
    chronoCsAvailable: 10,
    actorCharacterId: 'smoke',
  })
  if (claim2.effects.some((e) => e.kind === 'giurisdizione_claim')) {
    pass('Giurisdizione reclamo')
    const reject = processWazaChatAutomation({
      content: '[giurisdizione:reclama]',
      meta: claim2.meta,
      statusContainer: empty,
      wazaIndex,
      chronoCsAvailable: 10,
      actorCharacterId: 'smoke',
    })
    if (reject.effects.some((e) => e.kind === 'giurisdizione_claim_rejected')) {
      pass('Giurisdizione secondo reclamo rifiutato')
    } else fail('Giurisdizione secondo reclamo rifiutato')
  } else fail('Giurisdizione reclamo')

  // ── PG Botan (se esiste) ──
  console.log('\n[PG Botan / API service]')
  const botan = await db.query.characters.findFirst({
    where: eq(schema.characters.name, 'Botan'),
    columns: {
      id: true,
      name: true,
      socialClass: true,
      socialSubclassSheet: true,
      userId: true,
    },
    with: { user: { columns: { email: true } } },
  })

  if (!botan?.userId) {
    console.log('  ⚠️  Botan non trovato — skip test service con PG')
  } else {
    pass('Botan trovato', `${botan.socialClass ?? 'no classe'} · ${botan.user?.email ?? ''}`)

    const sheet = (botan.socialSubclassSheet ?? {}) as Record<string, boolean>
    const accessible = SOCIAL_BLUEPRINTS.filter(
      (b) => botan.socialClass && canAccessSocialBlueprint(botan.socialClass as never, sheet, b.id),
    ).length
    pass('blueprint accessibili Botan', `${accessible}`)

    if (botan.socialClass === 'shokunin') {
      const bps = await listCharacterBlueprints(botan.userId)
      if (bps && bps.blueprints.length > 0) {
        pass('GET blueprints service', `${bps.blueprints.length} per shokunin`)
        const craftable = bps.blueprints.filter((b) => b.craftable)
        if (craftable[0]) {
          try {
            await craftFromBlueprint(botan.userId, { blueprintId: craftable[0].id })
            pass('craft generico', craftable[0].name)
          } catch (e) {
            fail('craft generico', e instanceof Error ? e.message : String(e))
          }
        } else {
          console.log('  ⚠️  Nessun blueprint craftabile in lista')
        }
      } else fail('GET blueprints service')
    }

    if (botan.socialClass === 'seijika') {
      try {
        const st = await getPoliticoToolState(botan.id)
        pass('Politico status', `${st.templates.length} template`)
      } catch (e) {
        fail('Politico status', e instanceof Error ? e.message : String(e))
      }
    }

    if (botan.socialClass === 'shisai') {
      try {
        const st = await getSacerdoteToolState(botan.id)
        pass('Sacerdote status', `${st.rites.length} riti`)
      } catch (e) {
        fail('Sacerdote status', e instanceof Error ? e.message : String(e))
      }
    }
  }

  await client.end()

  const failed = checks.filter((c) => !c.ok)
  console.log(`\n=== Risultato: ${checks.length - failed.length}/${checks.length} OK ===`)
  if (failed.length > 0) {
    console.log('\nFalliti:')
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail ?? ''}`)
    process.exit(1)
  }
  console.log('smoke-shakai-combat OK')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
