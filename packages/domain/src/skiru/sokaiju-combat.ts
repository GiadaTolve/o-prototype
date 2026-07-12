import { GOJU_ELEMENTAL_SKIRU_IDS, getSkiruPoints } from './progression'
import {
  formatSokaijuFaceLiveLine,
  getSokaijuFacePoints,
} from './sokaiju-face-effects'
import { SOKAIJU_ANCHOR_WAZA_CATEGORIA } from './sokaiju-categoria-map'
import type { SkiruSheet } from './types'
import type { StatusId } from '../combat/status/types'

export const SOKAIJU_NODE_IDS = [
  'tenkan',
  'chiko',
  'goju',
  'jikai',
  'gojin',
  'kashin',
  'shodo',
  'eiga',
  'kongen',
  'hikan',
  'genkai',
] as const

export type SokaijuNodeId = (typeof SOKAIJU_NODE_IDS)[number]

const GOJU_ELEMENTAL_STATUS: Record<string, StatusId> = {
  'goju-fuoco': 'incendiato',
  'goju-fulmine': 'sovraccarico',
  'goju-acqua': 'torpore',
  'goju-gravita': 'appesantimento',
  'goju-aria': 'vertigini',
}

const GOJU_ELEMENTAL_DURATION_TURNS = 3
const GOJU_ELEMENTAL_STACKS = 1

export function getActiveGojuElementalSkiruId(sheet: SkiruSheet): string | null {
  const active = GOJU_ELEMENTAL_SKIRU_IDS.filter((id) => getSkiruPoints(sheet, id) > 0)
  return active.length === 1 ? active[0]! : null
}

/** Affinità Gojū attiva → status elementale (3 turni). */
export function resolveGojuElementalAutoApply(sheet: SkiruSheet): {
  statusId: StatusId
  durationTurns: number
  stacks: number
} | null {
  const elementalId = getActiveGojuElementalSkiruId(sheet)
  if (!elementalId) return null
  const statusId = GOJU_ELEMENTAL_STATUS[elementalId]
  if (!statusId) return null
  return {
    statusId,
    durationTurns: GOJU_ELEMENTAL_DURATION_TURNS,
    stacks: GOJU_ELEMENTAL_STACKS,
  }
}

export interface SokaijuFaceBonusSummary {
  anchorId: string
  categoria: string
  meijuPoints: number
  shijuPoints: number
}

export interface SokaijuCombatSummary {
  faceBonuses: SokaijuFaceBonusSummary[]
  gojuElemental: ReturnType<typeof resolveGojuElementalAutoApply>
}

export function computeSokaijuCombatSummary(sheet: SkiruSheet): SokaijuCombatSummary {
  const faceBonuses: SokaijuFaceBonusSummary[] = []
  for (const [anchorId, categoria] of Object.entries(SOKAIJU_ANCHOR_WAZA_CATEGORIA)) {
    const meijuPoints = getSokaijuFacePoints(sheet, anchorId, 'meiju')
    const shijuPoints = getSokaijuFacePoints(sheet, anchorId, 'shiju')
    if (meijuPoints > 0 || shijuPoints > 0) {
      faceBonuses.push({ anchorId, categoria, meijuPoints, shijuPoints })
    }
  }
  return {
    faceBonuses,
    gojuElemental: resolveGojuElementalAutoApply(sheet),
  }
}

/** Valore live per il riquadro formule UI, per ancoraggio. */
export function formatSokaijuAnchorLiveValue(
  anchorId: SokaijuNodeId,
  sheet: SkiruSheet,
  _summary?: SokaijuCombatSummary,
): string {
  return formatSokaijuFaceLiveLine(anchorId, sheet)
}
