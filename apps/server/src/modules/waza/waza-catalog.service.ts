import { eq } from 'drizzle-orm'
import { WAZA_TAG_CATALOG } from '@domain/combat/waza-tag-catalog.generated'
import {
  mergeWazaTagCatalog,
  type WazaDbAuthoringRow,
} from '@domain/combat/waza-catalog-merge'
import {
  buildWazaTagIndex,
  type WazaTagCatalogEntry,
} from '@domain/combat/waza-tag-preview'
import { WAZA_LAUNCH_PROFILE_DATA } from '@domain/combat/waza-launch-profile-data'
import { resolveDefaultWazaCostExp } from '@domain/progression/waza-cost-exp'
import { db } from '../../plugins/db'
import { skills } from '../../db/schema'

let cachedEntries: WazaTagCatalogEntry[] | null = null
let cachedIndex = buildWazaTagIndex(WAZA_TAG_CATALOG)

function withLaunchProfiles(entries: WazaTagCatalogEntry[]): WazaTagCatalogEntry[] {
  return entries.map((entry) => {
    const fromProfile = entry.poolId ? WAZA_LAUNCH_PROFILE_DATA[entry.poolId] : undefined
    if (!fromProfile) return entry
    return {
      ...entry,
      launchFlags: { ...fromProfile, ...entry.launchFlags },
    }
  })
}

function sanitizeWazaDescription(input: string | null | undefined): string | null {
  if (!input) return null
  const lines = input
    .replace(/\r/g, '')
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const cleaned = lines.filter((line, index) => {
    if (index <= 2) {
      if (/^(passiva|attiva)\b/i.test(line)) return false
      if (/^\[.*\]$/.test(line)) return false
    }
    return true
  })
  if (cleaned.length === 0) return null
  return cleaned.join('\n\n')
}

export function getWazaTagIndexSync() {
  return cachedIndex
}

export function getWazaCatalogEntriesSync(): readonly WazaTagCatalogEntry[] {
  return cachedEntries ?? WAZA_TAG_CATALOG
}

export async function reloadWazaCatalog(): Promise<{
  entries: WazaTagCatalogEntry[]
  index: ReadonlyMap<string, WazaTagCatalogEntry>
}> {
  const rows = await db.query.skills.findMany({
    where: eq(skills.type, 'WAZA'),
    columns: {
      poolId: true,
      name: true,
      description: true,
      effect: true,
      rank: true,
      isPassive: true,
      isNarrativa: true,
      styleId: true,
      launchSkiruIds: true,
    },
  })

  const dbRows: WazaDbAuthoringRow[] = rows
    .filter((r) => r.poolId?.trim())
    .map((r) => ({
      poolId: r.poolId!.trim(),
      name: r.name,
      description: r.description,
      effect: r.effect,
      rank: r.rank,
      isPassive: r.isPassive,
      isNarrativa: r.isNarrativa,
      styleId: r.styleId,
      launchSkiruIds: Array.isArray(r.launchSkiruIds) ? r.launchSkiruIds : null,
    }))

  const merged = withLaunchProfiles(mergeWazaTagCatalog(WAZA_TAG_CATALOG, dbRows))
  cachedEntries = merged
  cachedIndex = buildWazaTagIndex(merged)
  return { entries: merged, index: cachedIndex }
}

export type AdminWazaListItem = {
  skillId: string | null
  poolId: string
  name: string
  description: string | null
  effect: string | null
  rank: string | null
  isPassive: boolean
  isNarrativa: boolean
  styleId: string | null
  launchSkiruIds: string[]
  damageSkiruIds: string[]
  damageIndexKind: 'CAC' | 'CAD' | null
  costExp: number
  hasDbRow: boolean
}

export async function listAdminWaza(): Promise<AdminWazaListItem[]> {
  const [{ entries }, dbSkills] = await Promise.all([
    reloadWazaCatalog(),
    db.query.skills.findMany({
      where: eq(skills.type, 'WAZA'),
      columns: {
        id: true,
        poolId: true,
        name: true,
        description: true,
        effect: true,
        rank: true,
        isPassive: true,
        isNarrativa: true,
        styleId: true,
        launchSkiruIds: true,
        damageSkiruIds: true,
        damageIndexKind: true,
        costExp: true,
      },
      orderBy: (s, { asc }) => [asc(s.name)],
    }),
  ])

  const skillByPool = new Map(
    dbSkills.filter((s) => s.poolId?.trim()).map((s) => [s.poolId!.trim(), s]),
  )

  return entries.map((entry) => {
    const pid = entry.poolId?.trim() ?? ''
    const skill = pid ? skillByPool.get(pid) : undefined
    return {
      skillId: skill?.id ?? null,
      poolId: pid || entry.name,
      name: entry.name,
      description: entry.description ?? skill?.description ?? null,
      effect: entry.effect ?? skill?.effect ?? null,
      rank: entry.isPassive ? null : (entry.rank ?? skill?.rank ?? null),
      isPassive: entry.isPassive,
      isNarrativa: Boolean(skill?.isNarrativa) || Boolean(entry.launchFlags?.isNarrativa || entry.launchFlags?.masterOnlyCard),
      styleId: entry.styleId ?? skill?.styleId ?? null,
      launchSkiruIds: entry.launchSkiruIds ?? [],
      damageSkiruIds: Array.isArray(skill?.damageSkiruIds) ? skill!.damageSkiruIds : [],
      damageIndexKind:
        skill?.damageIndexKind === 'CAC' || skill?.damageIndexKind === 'CAD'
          ? skill.damageIndexKind
          : null,
      costExp: skill?.costExp ?? 0,
      hasDbRow: Boolean(skill),
    }
  })
}

export type AdminWazaUpdateInput = {
  name: string
  description?: string | null
  effect?: string | null
  rank?: string | null
  isPassive?: boolean
  isNarrativa?: boolean
  styleId?: string | null
  launchSkiruIds?: string[]
  damageSkiruIds?: string[]
  damageIndexKind?: 'CAC' | 'CAD' | null
  costExp?: number
}

export async function upsertAdminWazaByPoolId(
  poolId: string,
  input: AdminWazaUpdateInput,
): Promise<AdminWazaListItem> {
  const pid = poolId.trim()
  if (!pid) throw new Error('poolId obbligatorio')

  const launchSkiruIds = [...new Set((input.launchSkiruIds ?? []).map((id) => id.trim().toLowerCase()).filter(Boolean))]
  const damageSkiruIds = [...new Set((input.damageSkiruIds ?? []).map((id) => id.trim().toLowerCase()).filter(Boolean))]
  const damageIndexKind =
    input.damageIndexKind === 'CAC' || input.damageIndexKind === 'CAD'
      ? input.damageIndexKind
      : null

  const existing = await db.query.skills.findFirst({
    where: eq(skills.poolId, pid),
    columns: { id: true },
  })

  const isPassive = input.isPassive ?? false
  const isNarrativa = !isPassive && Boolean(input.isNarrativa)
  const rank = isPassive ? null : (input.rank?.trim() || null)

  const values = {
    name: input.name.trim(),
    description: sanitizeWazaDescription(input.description),
    effect: input.effect?.trim() || null,
    rank,
    isPassive,
    isNarrativa,
    styleId: input.styleId?.trim() || null,
    launchSkiruIds: launchSkiruIds.length > 0 ? launchSkiruIds : null,
    damageSkiruIds: damageSkiruIds.length > 0 ? damageSkiruIds : null,
    damageIndexKind: isPassive ? null : damageIndexKind,
    costExp:
      input.costExp ??
      resolveDefaultWazaCostExp({
        isPassive,
        rank,
      }),
    costJigoka: 0,
    type: 'WAZA' as const,
    poolId: pid,
  }

  if (existing) {
    await db.update(skills).set(values).where(eq(skills.id, existing.id))
  } else {
    await db.insert(skills).values(values)
  }

  await reloadWazaCatalog()
  const list = await listAdminWaza()
  const hit = list.find((w) => w.poolId === pid)
  if (!hit) throw new Error('Waza non trovata dopo salvataggio')
  return hit
}
