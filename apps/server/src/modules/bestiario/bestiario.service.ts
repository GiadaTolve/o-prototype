import { asc, eq } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { creatures } from '../../db/schema'

export type BestiaryCategory = 'HOLIC' | 'PHOBIAS' | 'MUEN' | 'HUMAN' | 'CUSTOM'

export type CreatureStats = {
  hp?: number
  hpMax?: number
  cs?: number
  attack?: number
  defense?: number
  mitigation?: number
  ir?: number
  cac?: number
  cad?: number
  movement?: number
  notes?: string
  randomSeed?: number
  kind?: string
  [k: string]: unknown
}

export type BestiaryEntry = {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  category: BestiaryCategory
  stats: CreatureStats | null
  inAlbo: boolean
  createdByUserId: string | null
}

export const BESTIARY_CATEGORIES: BestiaryCategory[] = [
  'HOLIC',
  'PHOBIAS',
  'MUEN',
  'HUMAN',
  'CUSTOM',
]

export const BESTIARY_CATEGORY_LABELS: Record<BestiaryCategory, string> = {
  HOLIC: 'Holic',
  PHOBIAS: 'Phobias',
  MUEN: 'Muen',
  HUMAN: 'Umano',
  CUSTOM: 'Custom',
}

function mapRow(r: typeof creatures.$inferSelect): BestiaryEntry {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? null,
    imageUrl: r.imageUrl ?? null,
    category: r.category as BestiaryCategory,
    stats: (r.stats as CreatureStats | null) ?? null,
    inAlbo: Boolean(r.inAlbo),
    createdByUserId: r.createdByUserId ?? null,
  }
}

/** Catalogo PNG (tutte le categorie). */
export async function getBestiary(): Promise<BestiaryEntry[]> {
  const rows = await db.query.creatures.findMany({
    orderBy: (c, { asc: a }) => [a(c.name)],
  })
  return rows.map(mapRow)
}

export async function getBestiaryByCategory(): Promise<Record<BestiaryCategory, BestiaryEntry[]>> {
  const all = await getBestiary()
  const result = Object.fromEntries(BESTIARY_CATEGORIES.map((c) => [c, [] as BestiaryEntry[]])) as Record<
    BestiaryCategory,
    BestiaryEntry[]
  >
  for (const entry of all) {
    if (result[entry.category]) result[entry.category].push(entry)
  }
  return result
}

/** Solo entry salvate in Albo PNG. */
export async function getAlboPng(userId?: string): Promise<BestiaryEntry[]> {
  const rows = await db.query.creatures.findMany({
    where: eq(creatures.inAlbo, true),
    orderBy: [asc(creatures.name)],
  })
  const mapped = rows.map(mapRow)
  if (!userId) return mapped
  // Albo condiviso Shinigami: mostra tutti gli in_albo; opzionale filtro “i miei”
  return mapped
}

export async function getCreatureById(id: string): Promise<BestiaryEntry | null> {
  const row = await db.query.creatures.findFirst({ where: eq(creatures.id, id) })
  return row ? mapRow(row) : null
}

export async function createPng(input: {
  name: string
  description?: string | null
  imageUrl?: string | null
  category: BestiaryCategory
  stats?: CreatureStats | null
  inAlbo?: boolean
  createdByUserId?: string | null
}): Promise<BestiaryEntry> {
  const [row] = await db
    .insert(creatures)
    .values({
      name: input.name.trim(),
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      category: input.category,
      stats: input.stats ?? null,
      inAlbo: input.inAlbo ?? false,
      createdByUserId: input.createdByUserId ?? null,
    })
    .returning()
  return mapRow(row!)
}

export async function updatePng(
  id: string,
  input: {
    name?: string
    description?: string | null
    imageUrl?: string | null
    category?: BestiaryCategory
    stats?: CreatureStats | null
    inAlbo?: boolean
  },
): Promise<BestiaryEntry> {
  const patch: Partial<typeof creatures.$inferInsert> = {}
  if (input.name !== undefined) patch.name = input.name.trim()
  if (input.description !== undefined) patch.description = input.description
  if (input.imageUrl !== undefined) patch.imageUrl = input.imageUrl
  if (input.category !== undefined) patch.category = input.category
  if (input.stats !== undefined) patch.stats = input.stats
  if (input.inAlbo !== undefined) patch.inAlbo = input.inAlbo

  const [row] = await db.update(creatures).set(patch).where(eq(creatures.id, id)).returning()
  if (!row) throw new Error('PNG non trovato')
  return mapRow(row)
}

export async function deletePng(id: string) {
  await db.delete(creatures).where(eq(creatures.id, id))
  return { success: true }
}

/** Generatore parametri casuali (sessione / draft). */
export function rollRandomPngParams(category: BestiaryCategory = 'CUSTOM'): {
  name: string
  category: BestiaryCategory
  description: string
  stats: CreatureStats
} {
  const seed = Math.floor(Math.random() * 1_000_000)
  const rnd = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1))
  const prefixes =
    category === 'HUMAN'
      ? ['Kenji', 'Aya', 'Ryo', 'Mio', 'Haru', 'Sora']
      : category === 'HOLIC'
        ? ['Holic', 'Ombra', 'Fame']
        : category === 'PHOBIAS'
          ? ['Timore', 'Incubo', 'Phobia']
          : category === 'MUEN'
            ? ['Muen', 'Errante', 'Vuoto']
            : ['Entità', 'Presenza', 'Forma']
  const suffixes = ['α', 'β', 'γ', 'δ', 'Noctis', 'Aurea', 'Violet']
  const name = `${prefixes[rnd(0, prefixes.length - 1)]} ${suffixes[rnd(0, suffixes.length - 1)]}`
  const hpMax = rnd(20, 120)
  return {
    name,
    category,
    description: `PNG generato (seed ${seed}).`,
    stats: {
      hp: hpMax,
      hpMax,
      cs: rnd(0, 12),
      attack: rnd(2, 18),
      defense: rnd(0, 12),
      mitigation: rnd(0, 20),
      ir: rnd(4, 16),
      cac: rnd(0, 8),
      cad: rnd(0, 8),
      movement: rnd(3, 12),
      randomSeed: seed,
      kind: category === 'HUMAN' ? 'umano' : 'entità',
    },
  }
}

/** Alias legacy admin. */
export async function getAdminCreatures() {
  return db.query.creatures.findMany({
    orderBy: [asc(creatures.category), asc(creatures.name)],
  })
}
