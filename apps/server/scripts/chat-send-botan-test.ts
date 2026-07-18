/**
 * Invia in chat come Botan (test combattimento / munizioni).
 * Uso: cd apps/server && bun run scripts/chat-send-botan-test.ts
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import { and, eq, ilike } from 'drizzle-orm'
import { encodeAttackMessage } from '@domain/combat/attack-message'

config({ path: resolve(import.meta.dir, '../../../.env') })

const API = process.env.API_URL ?? 'http://localhost:4000'
const WS = API.replace(/^http/, 'ws')
const ROOM = process.env.CHAT_ROOM ?? 'kessen__cosmicon__arcade_palace'
const NOME_PG = 'Botan Miyazaki'
const PASSWORD = process.env.BOTAN_PASSWORD ?? 'BotanLocal2026'

async function login(): Promise<string> {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nomePg: NOME_PG, password: PASSWORD }),
  })
  const data = (await res.json()) as { token?: string; error?: string }
  if (!res.ok || !data.token) throw new Error(data.error ?? 'Login fallito')
  return data.token
}

function waitForOpen(ws: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    ws.onopen = () => resolve()
    ws.onerror = () => reject(new Error('WebSocket error'))
    setTimeout(() => reject(new Error('WebSocket timeout')), 8000)
  })
}

function collectWsMessages(ws: WebSocket, ms: number): Promise<unknown[]> {
  const out: unknown[] = []
  return new Promise((resolve) => {
    ws.onmessage = (ev) => {
      try {
        out.push(JSON.parse(String(ev.data)))
      } catch {
        out.push(ev.data)
      }
    }
    setTimeout(() => resolve(out), ms)
  })
}

async function main() {
  const { db } = await import('../src/plugins/db')
  const { characters, inventory } = await import('../src/db/schema')

  const char = await db.query.characters.findFirst({
    where: and(ilike(characters.name, 'Botan'), ilike(characters.surname, 'Miyazaki')),
    columns: { id: true, name: true, surname: true },
  })
  if (!char) throw new Error('Botan Miyazaki non trovato')

  const weapon = await db.query.inventory.findFirst({
    where: and(eq(inventory.characterId, char.id), eq(inventory.location, 'CARRY')),
    with: { item: true },
  })
  const hachi = await db.query.inventory.findMany({
    where: and(eq(inventory.characterId, char.id), eq(inventory.location, 'CARRY')),
    with: { item: true },
  })
  const nido = hachi.find((r) => r.item.catalogKey === 'equip-hachi-su' || r.item.name.includes('Vespe'))
  if (!nido) throw new Error('Il Nido di Vespe non trovato nello zaino')

  const intBefore = nido.integrityCurrent ?? nido.item.integrityMax ?? '?'
  console.log(`\n🎯 Botan → ${ROOM}`)
  console.log(`   Arma: ${nido.item.name} · INT ${intBefore}/${nido.item.integrityMax ?? '?'}`)

  const token = await login()
  const ws = new WebSocket(`${WS}/ws?token=${encodeURIComponent(token)}`)
  await waitForOpen(ws)

  const messages = collectWsMessages(ws, 4000)

  ws.send(JSON.stringify({ type: 'join', zone: ROOM }))

  await new Promise((r) => setTimeout(r, 500))

  const intro = '⚙️ Test agente — verifica munizioni e integrità insieme.'
  ws.send(JSON.stringify({ type: 'chat', zone: ROOM, text: intro }))

  await new Promise((r) => setTimeout(r, 400))

  const attack = encodeAttackMessage({
    weapon: nido.item.name,
    formula: 'CAD (4) + 6',
    total: 10,
    kind: 'ranged',
    ammoNote: '−1 pistola',
    inventoryId: nido.id,
  })
  ws.send(JSON.stringify({ type: 'chat', zone: ROOM, text: attack }))

  await new Promise((r) => setTimeout(r, 1200))

  const received = await messages
  const errors = received.filter(
    (m) => typeof m === 'object' && m != null && (m as { type?: string }).type === 'error',
  )
  const chatMsgs = received.filter(
    (m) => typeof m === 'object' && m != null && (m as { type?: string }).type === 'chat_message',
  )

  if (errors.length) {
    console.error('❌ Errori WS:', errors)
  }

  console.log(`✅ Messaggi inviati (${chatMsgs.length} eco in WS)`)
  for (const m of chatMsgs.slice(-3)) {
    const c = m as { content?: string; name?: string }
    const preview = (c.content ?? '').slice(0, 80)
    console.log(`   · ${c.name ?? '?'}: ${preview}${(c.content?.length ?? 0) > 80 ? '…' : ''}`)
  }

  const after = await db.query.inventory.findFirst({
    where: eq(inventory.id, nido.id),
    with: { item: true },
  })
  const intAfter = after?.integrityCurrent ?? after?.item.integrityMax
  console.log(`   INT dopo colpo: ${intBefore} → ${intAfter}`)

  ws.close()
  console.log('\n   Controlla la chat in Arcade Palace.\n')
  process.exit(errors.length ? 1 : 0)
}

main().catch((e) => {
  console.error('Errore:', e)
  process.exit(1)
})
