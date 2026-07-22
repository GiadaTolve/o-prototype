import { getTierRow, type WazaTier } from './tier'

/** Allinea defaultRank di sync-waza-manual / authoring tester ai CS di base T1–T5. */
export function inferWazaTierFromCs(costCs: number): WazaTier | null {
  if (costCs <= 0) return null
  if (costCs <= 2) return 1
  if (costCs <= 4) return 2
  if (costCs <= 6) return 3
  if (costCs <= 8) return 4
  return 5
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
