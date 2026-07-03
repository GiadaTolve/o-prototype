import { SKIRU_CATALOG, getSkiruDef } from './catalog'
import { getSkiruPoints, validateSkiruSheet } from './progression'
import type { SkiruSheet } from './types'

/** Milestone Jiga no Shihaisha nel catalogo Skiru. */
export const JIGA_MILESTONE_IDS = SKIRU_CATALOG.filter((s) => s.kind === 'milestone').map(
  (s) => s.id,
)

/** Id richiesta PREMIO → id milestone Skiru. */
const PREMIO_TO_MILESTONE: Record<string, string> = {
  keishosha: 'keishosha',
  'kanpeki-keishosha': 'kanpeki-keishosha',
  inkyo: 'inkyo',
  'sentō-senshi': 'sento-senshi',
  'sento-senshi': 'sento-senshi',
  renkinjutsushi: 'renkinjutsushi',
  'daisei-renkin': 'daisei-no-renkin',
  'daisei-no-renkin': 'daisei-no-renkin',
}

export function resolvePremioToMilestoneId(premioRequestId: string): string | null {
  const key = premioRequestId.trim()
  return PREMIO_TO_MILESTONE[key] ?? null
}

export function isJigaMilestoneId(skiruId: string): boolean {
  return JIGA_MILESTONE_IDS.includes(skiruId)
}

/** Milestone attiva. */
export function getActiveJigaMilestone(sheet: SkiruSheet): string | null {
  for (const id of JIGA_MILESTONE_IDS) {
    if (getSkiruPoints(sheet, id) > 0) return id
  }
  return null
}

/**
 * Imposta la milestone attiva: azzera le altre Jiga e marca la scelta a 1 pt.
 * Non acquistabile con EXP — solo staff via richiesta Premio.
 */
export function applyJigaMilestone(sheet: SkiruSheet, milestoneId: string): SkiruSheet {
  const def = getSkiruDef(milestoneId)
  if (!def || def.kind !== 'milestone') {
    throw new Error(`«${milestoneId}» non è una milestone Jiga no Shihaisha.`)
  }

  const next: Record<string, number> = { ...sheet }
  for (const id of JIGA_MILESTONE_IDS) {
    delete next[id]
  }
  next[milestoneId] = 1

  const validation = validateSkiruSheet(next)
  if (!validation.ok) {
    throw new Error(validation.errors.join('; '))
  }
  return next
}

export function getJigaMilestoneLabel(milestoneId: string): string {
  return getSkiruDef(milestoneId)?.name ?? milestoneId
}
