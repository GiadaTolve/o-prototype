/**
 * Smoke test Fase 2 economia oggetti (domain + DB opzionale).
 * Uso: cd apps/server && bun run smoke-economy-phase2
 */
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(import.meta.dir, '../../../.env') })

import { readFileSync } from 'fs'
import { count, eq, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import {
  encodeDropPanelRequest,
  encodePrendiPanelRequest,
  parseDropPanelRequest,
  parsePrendiPanelRequest,
} from '@domain/economy/drop-panel-message'
import {
  encodeItemUseRequest,
  isItemUsePanelMessage,
  parseItemUseRequest,
} from '@domain/economy/item-use-chat'
import { parseDropCommand, parsePrendiCommand } from '@domain/economy/drop-commands'
import {
  canDismantleInventoryItem,
  resolveDismantleYields,
} from '@domain/economy/dismantle'
import * as schema from '../src/db/schema'

const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/oyasumi_2'

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

function section(title: string) {
  console.log(`\n[${title}]`)
}

async function main() {
  console.log('=== Smoke Economia Fase 2 (drop/loot/chat) ===\n')

  section('Protocollo pannelli')
  const dropRaw = encodeDropPanelRequest({
    kind: 'direct',
    target: 'ground',
    catalogKey: 'junk-abiti',
    quantity: 2,
  })
  const dropParsed = parseDropPanelRequest(dropRaw)
  if (dropParsed?.kind === 'direct' && dropParsed.catalogKey === 'junk-abiti') {
    pass('encode/parse [DROP] ground')
  } else fail('encode/parse [DROP] ground')

  const tableRaw = encodeDropPanelRequest({
    kind: 'table',
    target: 'group',
    tableId: 'rovine_urbane',
  })
  if (parseDropPanelRequest(tableRaw)?.kind === 'table') pass('encode/parse [DROP] table')
  else fail('encode/parse [DROP] table')

  const prendiRaw = encodePrendiPanelRequest('junk-flaconi')
  if (parsePrendiPanelRequest(prendiRaw)?.catalogKey === 'junk-flaconi') {
    pass('encode/parse [PRENDI]')
  } else fail('encode/parse [PRENDI]')

  const itemUseRaw = encodeItemUseRequest('inv-test-123')
  if (parseItemUseRequest(itemUseRaw)?.inventoryId === 'inv-test-123' && isItemUsePanelMessage(itemUseRaw)) {
    pass('encode/parse [OGGETTO]')
  } else fail('encode/parse [OGGETTO]')

  section('Comandi testuali (parser domain — blocco WS separato)')
  if (parseDropCommand('/drop @aterra junk-abiti x1')?.kind === 'direct') {
    pass('parseDropCommand ancora disponibile in domain')
  } else fail('parseDropCommand')
  if (parsePrendiCommand('/prendi flaconi')?.query) pass('parsePrendiCommand ancora disponibile in domain')
  else fail('parsePrendiCommand')

  section('Blocco WS comandi testuali')
  try {
    const wsSource = readFileSync(resolve(import.meta.dir, '../src/modules/realtime/ws.routes.ts'), 'utf8')
    if (
      wsSource.includes('lowerCmd.startsWith("/drop ")') &&
      wsSource.includes('lowerCmd.startsWith("/prendi ")') &&
      wsSource.includes('pannelli A terra')
    ) {
      pass('ws.routes blocca /drop e /prendi')
    } else fail('ws.routes blocca /drop e /prendi')
    if (wsSource.includes('isDropPanelMessage') && wsSource.includes('executeDropPanelAction')) {
      pass('ws.routes gestisce [DROP] pannello')
    } else fail('ws.routes gestisce [DROP] pannello')
    if (wsSource.includes('isItemUsePanelMessage')) pass('ws.routes gestisce [OGGETTO] pannello')
    else fail('ws.routes gestisce [OGGETTO] pannello')
  } catch (e) {
    fail('lettura ws.routes', e instanceof Error ? e.message : String(e))
  }

  section('Fase 3 smantellamento (domain preview)')
  if (canDismantleInventoryItem({ category: 'consumabile' }).ok) {
    pass('consumabili smantellabili')
  } else fail('consumabili smantellabili')
  const consumableYield = resolveDismantleYields({ category: 'consumabile' })
  if (consumableYield.junk.length > 0 && consumableYield.materials.length > 0) {
    pass('consumabile → junk + materiali', `${consumableYield.junk[0]?.catalogKey}`)
  } else fail('consumabile → junk + materiali')
  const brokenYield = resolveDismantleYields({
    category: 'equipaggiamento',
    integrityCurrent: 0,
    integrityMax: 5,
    itemType: 'WEAPON',
  })
  if (brokenYield.junk.length > 0 && brokenYield.materials.length > 0) {
    pass('equip rotto → junk + materiali')
  } else fail('equip rotto → junk + materiali')

  section('DB (opzionale)')
  let client: ReturnType<typeof postgres> | null = null
  try {
    client = postgres(connectionString, { max: 1, connect_timeout: 5 })
    const db = drizzle(client, { schema })

    const [itemCount] = await db.select({ n: count() }).from(schema.items)
    const nItems = Number(itemCount?.n ?? 0)
    if (nItems >= 20) pass('catalogo items', `${nItems} voci`)
    else fail('catalogo items', `solo ${nItems}`)

    await db.execute(sql`SELECT 1 FROM economy_drop_tables LIMIT 1`)
    pass('tabella economy_drop_tables')

    await db.execute(sql`SELECT 1 FROM economy_drop_pools LIMIT 1`)
    pass('tabella economy_drop_pools')

    await db.execute(sql`SELECT 1 FROM scene_ground_loot LIMIT 1`)
    pass('tabella scene_ground_loot')

    const tables = await db.query.economyDropTables.findMany({ columns: { id: true }, limit: 3 })
    if (tables.length > 0) pass('drop tables seed', `${tables.length}+ righe`)
    else fail('drop tables seed', 'vuoto — esegui seed-drop-tables')

    const botan = await db.query.characters.findFirst({
      where: eq(schema.characters.name, 'Botan'),
      columns: { id: true, name: true },
    })
    if (botan) pass('PG test Botan trovato', botan.id.slice(0, 8))
    else pass('PG test Botan', 'non in DB locale — skip test manuali in chat')
  } catch (e) {
    fail('connessione DB', e instanceof Error ? e.message : String(e))
  } finally {
    await client?.end({ timeout: 2 })
  }

  const failed = checks.filter((c) => !c.ok)
  console.log('\n=== Riepilogo ===')
  console.log(`Pass: ${checks.length - failed.length}/${checks.length}`)
  if (failed.length > 0) {
    console.log('\nFalliti:')
    for (const c of failed) console.log(`  - ${c.name}${c.detail ? `: ${c.detail}` : ''}`)
    process.exit(1)
  }

  console.log('\nChecklist manuali Fase 2 (chat Arcade Palace):')
  console.log('  1. Master → Cedi Drop → a terra / PG / tabella → card 📦')
  console.log('  2. PG → pannello A terra → Prendi → inventario aggiornato')
  console.log('  3. Combattimento → Usa oggetto / Colpisci → card senza comandi')
  console.log('  4. Digitare /drop /prendi → errore pannelli')
  console.log('  5. Viewport 380px su drop/loot/combat')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
