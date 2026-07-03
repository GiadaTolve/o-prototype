import { SKIRU_CATALOG, getSkiruDef } from './catalog'
import {
  expCostForNextSkiruPoint,
  getSkiruPoints,
  validateSkiruSheet,
} from './progression'
import type { SkiruSheet } from './types'

/** Percorsi mutuamente esclusivi sotto Jiga no Shihaisha. */
export const JIGA_EXCLUSIVE_PATHS = {
  madosho: ['keishosha', 'kanpeki-keishosha'],
  consistenza: ['renkinjutsushi', 'daisei-no-renkin'],
  /** Placeholder finché i Premi narrativi non sono definiti — Eremita resta percorso esclusivo. */
  premio: ['inkyo'],
  ordine: ['sento-senshi'],
} as const

export type JigaExclusivePathId = keyof typeof JIGA_EXCLUSIVE_PATHS

export const JIGA_EXCLUSIVE_SKIRU_IDS = Object.values(JIGA_EXCLUSIVE_PATHS).flat()

const PATH_BY_SKIRU = new Map<string, JigaExclusivePathId>(
  Object.entries(JIGA_EXCLUSIVE_PATHS).flatMap(([pathId, skiruIds]) =>
    skiruIds.map((skiruId) => [skiruId, pathId as JigaExclusivePathId]),
  ),
)

export function isJigaExclusiveSkiruId(skiruId: string): boolean {
  return PATH_BY_SKIRU.has(skiruId)
}

export function getExclusiveSkiruPath(skiruId: string): JigaExclusivePathId | null {
  return PATH_BY_SKIRU.get(skiruId) ?? null
}

/** Skiru esclusive Jiga nel catalogo (`kind: milestone` su ramo jiga-no-shihaisha). */
export const JIGA_MILESTONE_IDS = SKIRU_CATALOG.filter(
  (s) => s.kind === 'milestone' && s.branchId === 'jiga-no-shihaisha',
).map((s) => s.id)

export function isJigaMilestoneId(skiruId: string): boolean {
  return isJigaExclusiveSkiruId(skiruId)
}

export function getActiveExclusiveSkiruPath(sheet: SkiruSheet): JigaExclusivePathId | null {
  for (const [pathId, skiruIds] of Object.entries(JIGA_EXCLUSIVE_PATHS) as [
    JigaExclusivePathId,
    readonly string[],
  ][]) {
    if (skiruIds.some((id) => getSkiruPoints(sheet, id) > 0)) {
      return pathId
    }
  }
  return null
}

/** Milestone Jiga attiva (un solo nodo per percorso). */
export function getActiveJigaMilestone(sheet: SkiruSheet): string | null {
  const path = getActiveExclusiveSkiruPath(sheet)
  if (!path) return null
  const ids = JIGA_EXCLUSIVE_PATHS[path]
  for (let i = ids.length - 1; i >= 0; i--) {
    const id = ids[i]!
    if (getSkiruPoints(sheet, id) > 0) return id
  }
  return null
}

export function getJigaMilestoneLabel(milestoneId: string): string {
  return getSkiruDef(milestoneId)?.name ?? milestoneId
}

export function exclusiveSkiruApprovalExpCost(_skiruId: string, _sheet: SkiruSheet): number {
  return expCostForNextSkiruPoint(0) ?? 3
}

export function canGrantExclusiveSkiru(
  sheet: SkiruSheet,
  skiruId: string,
): { ok: boolean; reason?: string } {
  const def = getSkiruDef(skiruId)
  if (!def || def.kind !== 'milestone' || !isJigaExclusiveSkiruId(skiruId)) {
    return { ok: false, reason: 'Skiru esclusiva non valida.' }
  }

  if (getSkiruPoints(sheet, skiruId) > 0) {
    return { ok: false, reason: 'Hai già questa Skiru esclusiva in scheda.' }
  }

  const path = getExclusiveSkiruPath(skiruId)
  if (!path) return { ok: false, reason: 'Percorso Jiga non mappato.' }

  if (def.parentSkiruId) {
    const minParent = def.minParentPoints ?? 1
    if (getSkiruPoints(sheet, def.parentSkiruId) < minParent) {
      const parent = getSkiruDef(def.parentSkiruId)
      return {
        ok: false,
        reason: `Richiede prima «${parent?.name ?? def.parentSkiruId}» in scheda.`,
      }
    }
  }

  const activePath = getActiveExclusiveSkiruPath(sheet)
  if (activePath && activePath !== path) {
    const activeSkiru = getActiveJigaMilestone(sheet)
    const activeName = activeSkiru ? getJigaMilestoneLabel(activeSkiru) : activePath
    return {
      ok: false,
      reason: `Percorso già scelto (${activeName}): le vie Jiga sono mutuamente esclusive.`,
    }
  }

  return { ok: true }
}

/**
 * Concede una Skiru esclusiva Jiga: un solo percorso attivo; upgrade nello stesso percorso
 * sostituisce il grado inferiore (es. Erede → Erede Perfetto).
 */
export function applyExclusiveSkiru(sheet: SkiruSheet, skiruId: string): SkiruSheet {
  const check = canGrantExclusiveSkiru(sheet, skiruId)
  if (!check.ok) {
    throw new Error(check.reason ?? 'Skiru esclusiva non concedibile.')
  }

  const path = getExclusiveSkiruPath(skiruId)!
  const next: Record<string, number> = { ...sheet }

  for (const [otherPath, skiruIds] of Object.entries(JIGA_EXCLUSIVE_PATHS) as [
    JigaExclusivePathId,
    readonly string[],
  ][]) {
    if (otherPath === path) continue
    for (const id of skiruIds) {
      delete next[id]
    }
  }

  const def = getSkiruDef(skiruId)!
  if (def.parentSkiruId) {
    delete next[def.parentSkiruId]
  }

  next[skiruId] = 1

  const validation = validateSkiruSheet(next)
  if (!validation.ok) {
    throw new Error(validation.errors.join('; '))
  }
  return next
}

/** @deprecated Usare applyExclusiveSkiru */
export function applyJigaMilestone(sheet: SkiruSheet, milestoneId: string): SkiruSheet {
  return applyExclusiveSkiru(sheet, milestoneId)
}

/** @deprecated Usare id Skiru diretti in richieste SKIRU_ESCLUSIVA */
export function resolvePremioToMilestoneId(requestId: string): string | null {
  const key = requestId.trim()
  return isJigaExclusiveSkiruId(key) ? key : null
}
