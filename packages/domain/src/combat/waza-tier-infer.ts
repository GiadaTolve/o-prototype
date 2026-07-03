import { getTierRow, type WazaTier } from './tier'

/** Allinea defaultRank di sync-waza-manual / authoring tester. */
export function inferWazaTierFromCs(costCs: number): WazaTier | null {
  if (costCs <= 0) return null
  if (costCs <= 1) return 1
  if (costCs <= 3) return 2
  if (costCs <= 5) return 3
  return 4
}

export function inferWazaRankLabelFromCs(costCs: number): string | null {
  const tier = inferWazaTierFromCs(costCs)
  return tier != null ? `T${tier}` : null
}

export type WazaManualTierSummary = {
  tier: WazaTier | null
  rankLabel: string | null
  csCost: number | null
  damage: number | null
  minGrade: string | null
  note: string | null
}

/** Riepilogo tier manuale derivato dal costo CS del form authoring. */
export function getWazaManualTierSummary(
  costCs: number,
  isPassive: boolean,
): WazaManualTierSummary {
  if (isPassive) {
    return {
      tier: null,
      rankLabel: null,
      csCost: null,
      damage: null,
      minGrade: null,
      note: 'Dō passiva — nessun tier di attacco',
    }
  }
  const tier = inferWazaTierFromCs(costCs)
  if (tier == null) {
    return {
      tier: null,
      rankLabel: null,
      csCost: null,
      damage: null,
      minGrade: null,
      note: 'CS 0 — waza senza costo CS o tier da definire a mano',
    }
  }
  const row = getTierRow(tier)
  return {
    tier,
    rankLabel: `T${tier}`,
    csCost: row.csCost,
    damage: row.value,
    minGrade: row.minGrade,
    note: null,
  }
}
