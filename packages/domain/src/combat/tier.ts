/** Tier waza 1–5 (UltimateManual). */
export type WazaTier = 1 | 2 | 3 | 4 | 5

export interface TierRow {
  tier: WazaTier
  /** Danno inflitto / Resistenza Scudo o Costrutto. */
  value: number
  csCost: number
  minGrade: string
  /** Exp per apprendere una waza di questo tier (indicativa). */
  expToLearn: number
}

export const TIER_TABLE: readonly TierRow[] = [
  { tier: 1, value: 4, csCost: 1, minGrade: 'Nemuribito', expToLearn: 3 },
  { tier: 2, value: 8, csCost: 2, minGrade: 'Hakyō', expToLearn: 6 },
  { tier: 3, value: 12, csCost: 3, minGrade: 'Bunsekikan', expToLearn: 12 },
  { tier: 4, value: 17, csCost: 5, minGrade: 'Sentatsu Bunsekikan', expToLearn: 24 },
  { tier: 5, value: 23, csCost: 7, minGrade: "Kanteikan / Shin'enkan", expToLearn: 48 },
] as const

const byTier = new Map<WazaTier, TierRow>(TIER_TABLE.map((r) => [r.tier, r]))

export function isWazaTier(n: number): n is WazaTier {
  return n >= 1 && n <= 5 && Number.isInteger(n)
}

export function getTierRow(tier: WazaTier): TierRow {
  const row = byTier.get(tier)
  if (!row) throw new Error(`Tier non valido: ${tier}`)
  return row
}

/** Valore danno / Resistenza per tier (T1=4 … T5=23). */
export function getTierValue(tier: WazaTier): number {
  return getTierRow(tier).value
}

export function getTierCsCost(tier: WazaTier): number {
  return getTierRow(tier).csCost
}

export function getTierMinGrade(tier: WazaTier): string {
  return getTierRow(tier).minGrade
}
