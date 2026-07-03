/**
 * Madōsho (clan) — rami e sottocategorie.
 * Modificabile dal tester: Idee → Tassonomia Madōsho → Salva su disco.
 * Allineato a @domain/progression/madosho.
 */

export const MADOSHO_RAMI_IDS = [
  'ringai-janjae',
  'gokaon',
  'komonoire',
  'nakigara',
  'ikiryo',
  'hataori',
] as const

export type MadoshoRamo = (typeof MADOSHO_RAMI_IDS)[number]

export const MADOSHO_RAMO_LABELS: Record<MadoshoRamo, string> = {
  'ringai-janjae': "Rin'gai / Janjae",
  gokaon: 'Gōkaon',
  komonoire: 'Komonoire',
  nakigara: 'Nakigara',
  ikiryo: 'Ikiryō',
  hataori: 'Hataori',
}

export interface MadoshoSubcategoryDef {
  id: string
  ramo: MadoshoRamo
  name: string
  description?: string
}

export const MADOSHO_SUBCATEGORIES: MadoshoSubcategoryDef[] = []
