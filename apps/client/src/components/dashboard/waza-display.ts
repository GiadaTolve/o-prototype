import { getTierRow, isWazaTier, type WazaTier } from "@domain/combat/tier";
export { getTierRow, isWazaTier, type WazaTier };
export { parseWazaTierFromRank } from "@domain/combat/waza-rank";

/** Tier + CS + danno base da tabella manuale. */
export function wazaTierMeta(tier: WazaTier) {
  const row = getTierRow(tier);
  return {
    tier,
    csCost: row.csCost,
    damage: row.value,
    minGrade: row.minGrade,
  };
}
