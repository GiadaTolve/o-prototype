/** Categoria vetrina del Market unico — dimensione ortogonale a `ItemCategory` (che descrive la meccanica). */
export type MarketCategory = 'armi' | 'armature' | 'veicoli' | 'tecnologia' | 'rimedi' | 'oggettistica'

export const MARKET_CATEGORIES: readonly MarketCategory[] = [
  'armi',
  'armature',
  'veicoli',
  'tecnologia',
  'rimedi',
  'oggettistica',
]

export const MARKET_CATEGORY_LABELS: Record<MarketCategory, string> = {
  armi: 'Armi',
  armature: 'Armature',
  veicoli: 'Veicoli',
  tecnologia: 'Tecnologia',
  rimedi: 'Rimedi',
  oggettistica: 'Oggettistica',
}

export function isMarketCategory(value: string): value is MarketCategory {
  return (MARKET_CATEGORIES as readonly string[]).includes(value)
}
