import { hydrateWazaFromPoolEntrySnippet } from './hydrateWazaForm'
import type { WazaDef } from './wazaPool'

export type WazaPoolRuntimePayload = {
  hasOverlay: boolean
  replacements: Array<{ id: string; entry: string }>
  removedIds: string[]
}

/** Unisce il pool Waza del bundle con overlay da GET /api/runtime/waza. */
export function mergeWazaPoolWithRuntime(
  base: WazaDef[],
  remote: WazaPoolRuntimePayload | null,
): WazaDef[] {
  if (
    !remote ||
    (!remote.replacements?.length &&
      !(remote.removedIds?.length && remote.removedIds.length > 0))
  ) {
    return [...base]
  }
  const removed = new Set((remote.removedIds ?? []).map((s) => s.trim()).filter(Boolean))
  const hydrated = new Map<string, WazaDef>()
  for (const { id, entry } of remote.replacements ?? []) {
    const idTrim = id?.trim()
    if (!idTrim) continue
    try {
      hydrated.set(idTrim, hydrateWazaFromPoolEntrySnippet(entry))
    } catch {
      /* skip broken overlay */
    }
  }
  const baseIds = new Set(base.map((w) => w.id))
  const out: WazaDef[] = []
  for (const w of base) {
    if (removed.has(w.id)) continue
    out.push(hydrated.has(w.id) ? hydrated.get(w.id)! : w)
  }
  const appended = new Set(out.map((w) => w.id))
  for (const { id } of remote.replacements ?? []) {
    const idTrim = id?.trim()
    if (!idTrim || baseIds.has(idTrim) || removed.has(idTrim)) continue
    const h = hydrated.get(idTrim)
    if (!h || appended.has(idTrim)) continue
    out.push(h)
    appended.add(idTrim)
  }
  return out
}
