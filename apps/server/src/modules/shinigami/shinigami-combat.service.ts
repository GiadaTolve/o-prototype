import { and, asc, desc, eq } from 'drizzle-orm'
import {
  emptyPngDraft,
  rollPngByTier,
  type PngScheda,
  type PngTier,
  type PngTipo,
  type PngWazaEntry,
  type PngStatusEntry,
} from '@domain/shinigami'
import { db } from '../../plugins/db'
import { alboPng, bestiario, npcs, type ShinigamiPngTipo } from '../../db/schema'

function asTier(n: number): PngTier {
  const t = Math.min(5, Math.max(1, Math.round(n || 1)))
  return t as PngTier
}

function asTipo(raw: string | null | undefined): PngTipo {
  const t = (raw ?? 'mob').toLowerCase()
  if (t === 'umano' || t === 'kyofu' || t === 'kizu' || t === 'holic' || t === 'boss' || t === 'mob') {
    return t
  }
  return 'mob'
}

function mapNpc(row: typeof npcs.$inferSelect) {
  return {
    id: row.id,
    nome: row.name,
    tipo: asTipo(row.tipo),
    tier: asTier(row.tier),
    hp_max: row.hpMax,
    hp_correnti: row.hpCurrent,
    cs_max: row.csMax,
    cs_correnti: row.csCurrent,
    ir_attacco: row.irAttacco,
    ir_difesa: row.irDifesa,
    waza: (row.waza as PngWazaEntry[]) ?? [],
    status_attivi: (row.statusAttivi as PngStatusEntry[]) ?? [],
    note: row.note ?? '',
    room_id: row.roomId,
    creato_da: row.createdByUserId,
    bestiario_id: row.bestiarioId,
    albo_id: row.alboId,
  }
}

function mapAlbo(row: typeof alboPng.$inferSelect) {
  return {
    id: row.id,
    nome: row.name,
    tipo: asTipo(row.tipo),
    tier: asTier(row.tier),
    hp_max: row.hpMax,
    cs_max: row.csMax,
    ir_attacco: row.irAttacco,
    ir_difesa: row.irDifesa,
    waza: (row.waza as PngWazaEntry[]) ?? [],
    note: row.note ?? '',
    source_bestiario_id: row.sourceBestiarioId,
    salvato_in_albo: true,
  }
}

function mapBestiario(row: typeof bestiario.$inferSelect) {
  return {
    id: row.id,
    nome: row.name,
    name_jp: row.nameJp,
    name_kanji: row.nameKanji,
    tipo: asTipo(row.tipo),
    tier: asTier(row.tier),
    lore: row.lore,
    habitat: row.habitat,
    comportamento: row.comportamento,
    onimori: row.onimori,
    hp_max: row.hpMax,
    hp_correnti: row.hpMax,
    cs_max: row.csMax,
    cs_correnti: 0,
    ir_attacco: row.irAttacco,
    ir_difesa: row.irDifesa,
    waza: (row.waza as PngWazaEntry[]) ?? [],
    status_attivi: [] as PngStatusEntry[],
    note: '',
    drop_table: row.dropTable ?? [],
    tag_caccia: row.tagCaccia,
    immagine: row.imageUrl,
  }
}

export function randomizeDraft(input: { tier: number; tipo?: string }) {
  return rollPngByTier(asTier(input.tier), asTipo(input.tipo))
}

export function blankDraft(input?: { tier?: number; tipo?: string }) {
  return emptyPngDraft(asTier(input?.tier ?? 1), asTipo(input?.tipo))
}

/** Colonna B — PNG in campo per room. */
export async function listFieldNpcs(roomId: string) {
  const rows = await db.query.npcs.findMany({
    where: eq(npcs.roomId, roomId),
    orderBy: [desc(npcs.createdAt)],
  })
  return { items: rows.map(mapNpc) }
}

export async function spawnNpcOnField(
  roomId: string,
  userId: string,
  input: Partial<PngScheda> & { nome?: string; name?: string },
) {
  const nome = (input.nome ?? input.name ?? '').trim()
  if (!nome) throw new Error('Nome PNG obbligatorio')
  const tier = asTier(input.tier ?? 1)
  const tipo = asTipo(input.tipo) as ShinigamiPngTipo
  const hpMax = Math.max(1, Math.round(input.hp_max ?? 40))
  const csMax = Math.max(0, Math.round(input.cs_max ?? 10))
  const [row] = await db
    .insert(npcs)
    .values({
      name: nome,
      tipo,
      tier,
      hpMax,
      hpCurrent: Math.max(0, Math.round(input.hp_correnti ?? hpMax)),
      csMax,
      csCurrent: Math.max(0, Math.round(input.cs_correnti ?? 0)),
      irAttacco: Math.max(0, Math.round(input.ir_attacco ?? 5)),
      irDifesa: Math.max(0, Math.round(input.ir_difesa ?? 5)),
      waza: input.waza ?? [],
      statusAttivi: input.status_attivi ?? [],
      note: input.note ?? '',
      roomId,
      createdByUserId: userId,
      bestiarioId: (input as { bestiario_id?: string }).bestiario_id ?? null,
      alboId: (input as { albo_id?: string }).albo_id ?? null,
      updatedAt: new Date(),
    })
    .returning()
  return mapNpc(row!)
}

export async function updateFieldNpc(
  npcId: string,
  patch: Partial<{
    nome: string
    name: string
    tipo: string
    tier: number
    hp_max: number
    hp_correnti: number
    cs_max: number
    cs_correnti: number
    ir_attacco: number
    ir_difesa: number
    waza: PngWazaEntry[]
    status_attivi: PngStatusEntry[]
    note: string
  }>,
) {
  const existing = await db.query.npcs.findFirst({ where: eq(npcs.id, npcId) })
  if (!existing) throw new Error('PNG non trovato sul campo')

  const [row] = await db
    .update(npcs)
    .set({
      name: patch.nome ?? patch.name ?? existing.name,
      tipo: patch.tipo != null ? (asTipo(patch.tipo) as ShinigamiPngTipo) : existing.tipo,
      tier: patch.tier != null ? asTier(patch.tier) : existing.tier,
      hpMax: patch.hp_max ?? existing.hpMax,
      hpCurrent: patch.hp_correnti ?? existing.hpCurrent,
      csMax: patch.cs_max ?? existing.csMax,
      csCurrent: patch.cs_correnti ?? existing.csCurrent,
      irAttacco: patch.ir_attacco ?? existing.irAttacco,
      irDifesa: patch.ir_difesa ?? existing.irDifesa,
      waza: patch.waza ?? existing.waza,
      statusAttivi: patch.status_attivi ?? existing.statusAttivi,
      note: patch.note ?? existing.note,
      updatedAt: new Date(),
    })
    .where(eq(npcs.id, npcId))
    .returning()
  return mapNpc(row!)
}

export async function removeFieldNpc(npcId: string) {
  await db.delete(npcs).where(eq(npcs.id, npcId))
  return { success: true }
}

/** Fine sessione: rimuove PNG di campo dalla room (stack/status PG resetti altrove). */
export async function clearFieldForRoom(roomId: string) {
  if (!roomId?.trim()) return { removed: 0 }
  const deleted = await db.delete(npcs).where(eq(npcs.roomId, roomId)).returning({ id: npcs.id })
  return { removed: deleted.length }
}

/** Salva PNG di campo (o draft) nell'Albo del master. */
export async function saveToAlbo(
  userId: string,
  input: Partial<PngScheda> & { nome?: string; name?: string; source_bestiario_id?: string | null },
) {
  const nome = (input.nome ?? input.name ?? '').trim()
  if (!nome) throw new Error('Nome obbligatorio')
  const [row] = await db
    .insert(alboPng)
    .values({
      userId,
      name: nome,
      tipo: asTipo(input.tipo) as ShinigamiPngTipo,
      tier: asTier(input.tier ?? 1),
      hpMax: Math.max(1, Math.round(input.hp_max ?? 40)),
      csMax: Math.max(0, Math.round(input.cs_max ?? 10)),
      irAttacco: Math.max(0, Math.round(input.ir_attacco ?? 5)),
      irDifesa: Math.max(0, Math.round(input.ir_difesa ?? 5)),
      waza: input.waza ?? [],
      note: input.note ?? '',
      sourceBestiarioId: input.source_bestiario_id ?? null,
      updatedAt: new Date(),
    })
    .returning()
  return mapAlbo(row!)
}

export async function listAlbo(userId: string, q?: string, tipo?: string) {
  const rows = await db.query.alboPng.findMany({
    where: eq(alboPng.userId, userId),
    orderBy: [asc(alboPng.name)],
  })
  let items = rows.map(mapAlbo)
  if (tipo?.trim()) {
    const t = asTipo(tipo)
    items = items.filter((i) => i.tipo === t)
  }
  if (q?.trim()) {
    const needle = q.trim().toLowerCase()
    items = items.filter(
      (i) =>
        i.nome.toLowerCase().includes(needle) ||
        i.tipo.includes(needle) ||
        String(i.tier) === needle,
    )
  }
  return { items }
}

export async function updateAlboEntry(
  userId: string,
  id: string,
  patch: Partial<{
    nome: string
    tipo: string
    tier: number
    hp_max: number
    cs_max: number
    ir_attacco: number
    ir_difesa: number
    waza: PngWazaEntry[]
    note: string
  }>,
) {
  const existing = await db.query.alboPng.findFirst({
    where: and(eq(alboPng.id, id), eq(alboPng.userId, userId)),
  })
  if (!existing) throw new Error('Voce Albo non trovata')
  const [row] = await db
    .update(alboPng)
    .set({
      name: patch.nome ?? existing.name,
      tipo: patch.tipo != null ? (asTipo(patch.tipo) as ShinigamiPngTipo) : existing.tipo,
      tier: patch.tier != null ? asTier(patch.tier) : existing.tier,
      hpMax: patch.hp_max ?? existing.hpMax,
      csMax: patch.cs_max ?? existing.csMax,
      irAttacco: patch.ir_attacco ?? existing.irAttacco,
      irDifesa: patch.ir_difesa ?? existing.irDifesa,
      waza: patch.waza ?? existing.waza,
      note: patch.note ?? existing.note,
      updatedAt: new Date(),
    })
    .where(eq(alboPng.id, id))
    .returning()
  return mapAlbo(row!)
}

export async function deleteAlboEntry(userId: string, id: string) {
  const existing = await db.query.alboPng.findFirst({
    where: and(eq(alboPng.id, id), eq(alboPng.userId, userId)),
  })
  if (!existing) throw new Error('Voce Albo non trovata')
  await db.delete(alboPng).where(eq(alboPng.id, id))
  return { success: true }
}

export async function instantiateAlboOnField(roomId: string, userId: string, alboId: string) {
  const entry = await db.query.alboPng.findFirst({
    where: and(eq(alboPng.id, alboId), eq(alboPng.userId, userId)),
  })
  if (!entry) throw new Error('Voce Albo non trovata')
  return spawnNpcOnField(roomId, userId, {
    nome: entry.name,
    tipo: asTipo(entry.tipo),
    tier: asTier(entry.tier),
    hp_max: entry.hpMax,
    hp_correnti: entry.hpMax,
    cs_max: entry.csMax,
    cs_correnti: 0,
    ir_attacco: entry.irAttacco,
    ir_difesa: entry.irDifesa,
    waza: (entry.waza as PngWazaEntry[]) ?? [],
    status_attivi: [],
    note: entry.note ?? '',
    albo_id: entry.id,
  } as PngScheda & { albo_id: string })
}

export async function listBestiarioCatalog(q?: string, opts?: { tagCaccia?: boolean }) {
  const rows = await db.query.bestiario.findMany({
    orderBy: [asc(bestiario.tier), asc(bestiario.name)],
  })
  let items = rows.map(mapBestiario)
  if (opts?.tagCaccia === true) {
    items = items.filter((i) => i.tag_caccia)
  }
  if (q?.trim()) {
    const needle = q.trim().toLowerCase()
    items = items.filter(
      (i) =>
        i.nome.toLowerCase().includes(needle) ||
        (i.name_jp ?? '').toLowerCase().includes(needle) ||
        (i.onimori ?? '').toLowerCase().includes(needle) ||
        i.tipo.includes(needle),
    )
  }
  return { items }
}

export async function instantiateBestiarioOnField(
  roomId: string,
  userId: string,
  bestiarioId: string,
) {
  const entry = await db.query.bestiario.findFirst({ where: eq(bestiario.id, bestiarioId) })
  if (!entry) throw new Error('Voce Bestiario non trovata')
  return spawnNpcOnField(roomId, userId, {
    nome: entry.name,
    tipo: asTipo(entry.tipo),
    tier: asTier(entry.tier),
    hp_max: entry.hpMax,
    hp_correnti: entry.hpMax,
    cs_max: entry.csMax,
    cs_correnti: 0,
    ir_attacco: entry.irAttacco,
    ir_difesa: entry.irDifesa,
    waza: (entry.waza as PngWazaEntry[]) ?? [],
    status_attivi: [],
    note: entry.lore ?? '',
    bestiario_id: entry.id,
  } as PngScheda & { bestiario_id: string })
}

export async function saveBestiarioToAlbo(userId: string, bestiarioId: string) {
  const entry = await db.query.bestiario.findFirst({ where: eq(bestiario.id, bestiarioId) })
  if (!entry) throw new Error('Voce Bestiario non trovata')
  return saveToAlbo(userId, {
    nome: entry.name,
    tipo: asTipo(entry.tipo),
    tier: asTier(entry.tier),
    hp_max: entry.hpMax,
    cs_max: entry.csMax,
    ir_attacco: entry.irAttacco,
    ir_difesa: entry.irDifesa,
    waza: (entry.waza as PngWazaEntry[]) ?? [],
    note: entry.lore ?? '',
    source_bestiario_id: entry.id,
  })
}

/** Seed minimo se catalogo vuoto (dev). */
export async function ensureBestiarioSeed() {
  const existing = await db.query.bestiario.findFirst({ columns: { id: true } })
  if (existing) return { seeded: false }
  await db.insert(bestiario).values([
    {
      name: 'Kizu Errante',
      nameJp: 'Kizu',
      tipo: 'kizu',
      tier: 1,
      lore: 'Ferita vagante delle wasteland.',
      onimori: 'Junk Town outskirts',
      habitat: 'Distese di rottami',
      comportamento: 'Aggressivo se avvicinato',
      hpMax: 45,
      csMax: 8,
      irAttacco: 4,
      irDifesa: 3,
      waza: [{ nome: 'Squarcio', descrizione: 'Taglio rustico', danno: 6, tier: 1 }],
      dropTable: [{ item_id: 'junk-lattine', item_nome: 'Lattine', quantita_min: 1, quantita_max: 3, probabilita: 60 }],
      tagCaccia: true,
    },
    {
      name: 'Kyōfu della Nebbia',
      nameJp: 'Kyōfu',
      tipo: 'kyofu',
      tier: 2,
      lore: 'Paura condensata in forma.',
      onimori: 'Mist Rails',
      habitat: 'Binari avvolti dalla bruma',
      comportamento: 'Cerca isolare la preda',
      hpMax: 80,
      csMax: 12,
      irAttacco: 6,
      irDifesa: 5,
      waza: [{ nome: 'Urlo', descrizione: 'IR malus narrativo', danno: 4, tier: 2 }],
      dropTable: [],
      tagCaccia: true,
    },
  ])
  return { seeded: true }
}

export type BestiarioWriteInput = {
  nome?: string
  name?: string
  name_jp?: string | null
  name_kanji?: string | null
  tipo?: string
  tier?: number
  lore?: string | null
  habitat?: string | null
  comportamento?: string | null
  onimori?: string | null
  hp_max?: number
  cs_max?: number
  ir_attacco?: number
  ir_difesa?: number
  waza?: PngWazaEntry[]
  drop_table?: Array<{
    item_id: string
    item_nome?: string
    quantita?: number
    quantita_min?: number
    quantita_max?: number
    probabilita: number
  }>
  tag_caccia?: boolean
  immagine?: string | null
  image_url?: string | null
}

export function normalizeDropTable(
  rows: BestiarioWriteInput['drop_table'],
): Array<{
  item_id: string
  item_nome?: string
  quantita?: number
  quantita_min?: number
  quantita_max?: number
  probabilita: number
}> {
  if (!Array.isArray(rows)) return []
  return rows
    .filter((r) => r && typeof r.item_id === 'string' && r.item_id.trim())
    .map((r) => ({
      item_id: r.item_id.trim(),
      item_nome: r.item_nome?.trim() || undefined,
      quantita: r.quantita,
      quantita_min: r.quantita_min,
      quantita_max: r.quantita_max,
      probabilita: Math.max(0, Math.min(100, Math.round(Number(r.probabilita) || 0))),
    }))
}

export function normalizeWaza(rows: BestiarioWriteInput['waza']): PngWazaEntry[] {
  if (!Array.isArray(rows)) return []
  return rows
    .filter((r) => r && typeof r.nome === 'string' && r.nome.trim())
    .map((r) => ({
      nome: r.nome.trim(),
      descrizione: r.descrizione?.trim() || undefined,
      danno: r.danno != null ? Number(r.danno) : undefined,
      tier: r.tier != null ? asTier(Number(r.tier)) : undefined,
    }))
}

export { asTipo as asTipoForTest, asTier as asTierForTest }

export async function getBestiarioEntry(id: string) {
  const entry = await db.query.bestiario.findFirst({ where: eq(bestiario.id, id) })
  if (!entry) throw new Error('Voce Bestiario non trovata')
  return mapBestiario(entry)
}

export async function createBestiarioEntry(input: BestiarioWriteInput) {
  const nome = (input.nome ?? input.name ?? '').trim()
  if (!nome) throw new Error('Nome obbligatorio')
  const [row] = await db
    .insert(bestiario)
    .values({
      name: nome,
      nameJp: input.name_jp?.trim() || null,
      nameKanji: input.name_kanji?.trim() || null,
      tipo: asTipo(input.tipo) as ShinigamiPngTipo,
      tier: asTier(input.tier ?? 1),
      lore: input.lore?.trim() || null,
      habitat: input.habitat?.trim() || null,
      comportamento: input.comportamento?.trim() || null,
      onimori: input.onimori?.trim() || null,
      hpMax: Math.max(1, Math.round(input.hp_max ?? 40)),
      csMax: Math.max(0, Math.round(input.cs_max ?? 10)),
      irAttacco: Math.max(0, Math.round(input.ir_attacco ?? 5)),
      irDifesa: Math.max(0, Math.round(input.ir_difesa ?? 5)),
      waza: normalizeWaza(input.waza),
      dropTable: normalizeDropTable(input.drop_table),
      tagCaccia: Boolean(input.tag_caccia),
      imageUrl: (input.immagine ?? input.image_url)?.trim() || null,
    })
    .returning()
  return mapBestiario(row!)
}

export async function updateBestiarioEntry(id: string, input: BestiarioWriteInput) {
  const existing = await db.query.bestiario.findFirst({ where: eq(bestiario.id, id) })
  if (!existing) throw new Error('Voce Bestiario non trovata')
  const nome = (input.nome ?? input.name)?.trim()
  const [row] = await db
    .update(bestiario)
    .set({
      ...(nome ? { name: nome } : {}),
      ...(input.name_jp !== undefined ? { nameJp: input.name_jp?.trim() || null } : {}),
      ...(input.name_kanji !== undefined ? { nameKanji: input.name_kanji?.trim() || null } : {}),
      ...(input.tipo !== undefined ? { tipo: asTipo(input.tipo) as ShinigamiPngTipo } : {}),
      ...(input.tier !== undefined ? { tier: asTier(input.tier) } : {}),
      ...(input.lore !== undefined ? { lore: input.lore?.trim() || null } : {}),
      ...(input.habitat !== undefined ? { habitat: input.habitat?.trim() || null } : {}),
      ...(input.comportamento !== undefined
        ? { comportamento: input.comportamento?.trim() || null }
        : {}),
      ...(input.onimori !== undefined ? { onimori: input.onimori?.trim() || null } : {}),
      ...(input.hp_max !== undefined ? { hpMax: Math.max(1, Math.round(input.hp_max)) } : {}),
      ...(input.cs_max !== undefined ? { csMax: Math.max(0, Math.round(input.cs_max)) } : {}),
      ...(input.ir_attacco !== undefined
        ? { irAttacco: Math.max(0, Math.round(input.ir_attacco)) }
        : {}),
      ...(input.ir_difesa !== undefined
        ? { irDifesa: Math.max(0, Math.round(input.ir_difesa)) }
        : {}),
      ...(input.waza !== undefined ? { waza: normalizeWaza(input.waza) } : {}),
      ...(input.drop_table !== undefined
        ? { dropTable: normalizeDropTable(input.drop_table) }
        : {}),
      ...(input.tag_caccia !== undefined ? { tagCaccia: Boolean(input.tag_caccia) } : {}),
      ...((input.immagine !== undefined || input.image_url !== undefined)
        ? { imageUrl: (input.immagine ?? input.image_url)?.trim() || null }
        : {}),
    })
    .where(eq(bestiario.id, id))
    .returning()
  return mapBestiario(row!)
}

export async function deleteBestiarioEntry(id: string) {
  const existing = await db.query.bestiario.findFirst({
    where: eq(bestiario.id, id),
    columns: { id: true },
  })
  if (!existing) throw new Error('Voce Bestiario non trovata')
  await db.delete(bestiario).where(eq(bestiario.id, id))
  return { success: true }
}
