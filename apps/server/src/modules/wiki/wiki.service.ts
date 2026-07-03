import { and, asc, eq, isNull } from 'drizzle-orm'
import { db } from '../../plugins/db'
import { wikiSections } from '../../db/schema'

export type WikiKind = 'guida' | 'ambientazione'

export type WikiSectionRow = {
  id: string
  kind: WikiKind
  parentId: string | null
  level: 1 | 2
  title: string
  content: string
  imageUrl: string | null
  order: number
  createdAt: Date
  updatedAt: Date
}

export type WikiSectionNode = WikiSectionRow & {
  children: WikiSectionRow[]
}

export async function getWikiTree(kind: WikiKind): Promise<WikiSectionNode[]> {
  const rows = await db.query.wikiSections.findMany({
    where: eq(wikiSections.kind, kind),
    orderBy: [asc(wikiSections.order), asc(wikiSections.createdAt)],
  })

  const h1 = rows.filter((r) => r.level === 1)
  const h2 = rows.filter((r) => r.level === 2)

  return h1.map((section) => ({
    ...section,
    level: section.level as 1 | 2,
    children: h2
      .filter((c) => c.parentId === section.id)
      .map((c) => ({ ...c, level: c.level as 1 | 2 })),
  }))
}

export async function getWikiSectionById(id: string): Promise<WikiSectionRow | null> {
  const row = await db.query.wikiSections.findFirst({
    where: eq(wikiSections.id, id),
  })
  if (!row) return null
  return { ...row, level: row.level as 1 | 2 }
}

export async function createWikiSection(input: {
  kind: WikiKind
  parentId?: string | null
  level: 1 | 2
  title: string
  content?: string
  imageUrl?: string | null
  order?: number
}): Promise<WikiSectionRow> {
  if (input.level === 2 && !input.parentId) {
    throw new Error('Le sottosezioni richiedono una sezione padre')
  }
  if (input.level === 1 && input.parentId) {
    throw new Error('Le sezioni principali non possono avere un padre')
  }

  if (input.parentId) {
    const parent = await getWikiSectionById(input.parentId)
    if (!parent || parent.kind !== input.kind || parent.level !== 1) {
      throw new Error('Sezione padre non valida')
    }
  }

  let order = input.order
  if (order == null) {
    const siblings = await db.query.wikiSections.findMany({
      where: and(
        eq(wikiSections.kind, input.kind),
        input.level === 1
          ? isNull(wikiSections.parentId)
          : eq(wikiSections.parentId, input.parentId!),
      ),
    })
    order = siblings.length > 0 ? Math.max(...siblings.map((s) => s.order)) + 1 : 0
  }

  const [row] = await db
    .insert(wikiSections)
    .values({
      kind: input.kind,
      parentId: input.level === 1 ? null : input.parentId!,
      level: input.level,
      title: input.title.trim(),
      content: input.content?.trim() ?? '',
      imageUrl: input.imageUrl?.trim() || null,
      order,
    })
    .returning()

  return { ...row, level: row.level as 1 | 2 }
}

export async function updateWikiSection(
  id: string,
  input: {
    title?: string
    content?: string
    imageUrl?: string | null
    order?: number
  },
): Promise<WikiSectionRow> {
  const existing = await getWikiSectionById(id)
  if (!existing) throw new Error('Sezione non trovata')

  const [row] = await db
    .update(wikiSections)
    .set({
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.content !== undefined ? { content: input.content.trim() } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl?.trim() || null } : {}),
      ...(input.order !== undefined ? { order: input.order } : {}),
      updatedAt: new Date(),
    })
    .where(eq(wikiSections.id, id))
    .returning()

  return { ...row, level: row.level as 1 | 2 }
}

export async function deleteWikiSection(id: string): Promise<void> {
  const existing = await getWikiSectionById(id)
  if (!existing) throw new Error('Sezione non trovata')
  await db.delete(wikiSections).where(eq(wikiSections.id, id))
}
