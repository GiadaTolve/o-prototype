/** Estrae id voce da snippet pool (stesso pattern di poolFilePatches). */
export function extractIdFromPoolEntry(entry: string): string | null {
  const m = entry.match(/id:\s*['"]([^'"]+)['"]/)
  return m ? m[1] ?? null : null
}

function extractNameFromPoolEntry(entry: string): string | null {
  const m = entry.match(/name:\s*['"]([^'"]*)['"]/)
  return m ? m[1] ?? null : null
}

export type ContributionRow = Record<string, unknown>

export function summarizeContribution(r: ContributionRow): {
  id: unknown
  createdAt: unknown
  type: unknown
  pool: unknown
  subkind: unknown
  author: unknown
  entityId: string | null
  title: string | null
} {
  const type = r.type
  const payload =
    r.payload !== undefined && typeof r.payload === 'object' && r.payload !== null
      ? (r.payload as Record<string, unknown>)
      : null

  let entityId: string | null = null
  let title: string | null = null

  if (type === 'pool_entry' || type === 'pool_entry_replace') {
    const entry = typeof payload?.entry === 'string' ? payload.entry : ''
    entityId = extractIdFromPoolEntry(entry)
    title = extractNameFromPoolEntry(entry)
  } else if (type === 'pool_entry_delete') {
    entityId = typeof payload?.removeId === 'string' ? payload.removeId.trim() : null
    title = 'Remove pool entry'
  } else if (type === 'waza_accessorio') {
    entityId = typeof payload?.id === 'string' ? payload.id : null
    title = typeof payload?.label === 'string' ? payload.label : null
  } else if (type === 'waza_accessorio_delete') {
    entityId = typeof payload?.id === 'string' ? payload.id : null
    title = 'Remove accessorio'
  } else if (type === 'skiru_pool_snapshot') {
    const entries = payload?.entries
    if (Array.isArray(entries)) {
      title = `${entries.length} voci Skiru`
      const first = entries[0] as Record<string, unknown> | undefined
      entityId = typeof first?.id === 'string' ? first.id : 'pool'
    }
  } else if (type === 'skiru_categories_snapshot') {
    title = 'Categorie Skiru'
    entityId = 'taxonomy'
  } else if (type === 'file_snapshot') {
    const p = typeof payload?.path === 'string' ? payload.path : ''
    entityId = p || null
    title = p ? p.split('/').pop() ?? p : null
  }

  return {
    id: r.id,
    createdAt: r.createdAt,
    type,
    pool: r.pool,
    subkind: r.subkind,
    author: r.author,
    entityId,
    title,
  }
}
