import type { EconomyMaterialId } from './types'

export const ECONOMY_MATERIAL_LABELS: Readonly<Record<EconomyMaterialId, string>> = {
  rottame_metallico: 'Rottame metallico',
  componente_meccanico: 'Componente meccanico',
  componente_fine: 'Componente fine',
  stoffa: 'Stoffa',
  cuoio: 'Cuoio',
  legno: 'Legno',
  carta: 'Carta',
  reagente: 'Reagente',
  erba_comune: 'Erba comune',
  erba_rara: 'Erba rara',
  carne: 'Carne',
  carne_pregiata: 'Carne pregiata',
  frammento_onirico: 'Frammento onirico',
  trofeo: 'Trofeo',
  trofeo_maggiore: 'Trofeo maggiore',
  carburante: 'Carburante',
}

export interface JunkItemDef {
  readonly id: string
  readonly name: string
  readonly yields: Readonly<Partial<Record<EconomyMaterialId, number>>>
}

/** Junklist condivisa — vedi `ECONOMY_ITEMS_SPEC.md`. */
export const JUNK_ITEMS: readonly JunkItemDef[] = [
  { id: 'junk-lattine', name: 'Lattine e scatolame arrugginito', yields: { rottame_metallico: 1 } },
  { id: 'junk-utensili-spezzati', name: 'Utensili spezzati', yields: { rottame_metallico: 1 } },
  {
    id: 'junk-elettrodomestico',
    name: 'Elettrodomestico sventrato',
    yields: { rottame_metallico: 2, componente_meccanico: 1 },
  },
  { id: 'junk-orologio', name: 'Orologio fermo', yields: { componente_fine: 1 } },
  { id: 'junk-serratura', name: 'Serratura divelta', yields: { componente_meccanico: 1 } },
  { id: 'junk-abiti', name: 'Abiti del vecchio mondo', yields: { stoffa: 2 } },
  { id: 'junk-scarpe', name: 'Scarpe spaiate', yields: { cuoio: 1 } },
  { id: 'junk-mobili', name: 'Mobili sfasciati', yields: { legno: 2 } },
  {
    id: 'junk-ombrello',
    name: 'Ombrello rotto',
    yields: { stoffa: 1, rottame_metallico: 1 },
  },
  { id: 'junk-flaconi', name: 'Flaconi scaduti', yields: { reagente: 1 } },
  {
    id: 'junk-kit-soccorso',
    name: 'Kit di pronto soccorso saccheggiato',
    yields: { stoffa: 1, reagente: 1 },
  },
  { id: 'junk-batterie', name: 'Batterie corrose', yields: { reagente: 1 } },
  {
    id: 'junk-carcassa',
    name: 'Carcassa fresca',
    yields: { carne: 1, cuoio: 1 },
  },
  { id: 'junk-nido', name: 'Nido abbandonato', yields: { erba_comune: 1 } },
  { id: 'junk-ossa', name: 'Ossa sbiancate', yields: { componente_fine: 1 } },
  { id: 'junk-libri', name: 'Libri gonfi d\'umidità', yields: { carta: 2 } },
  { id: 'junk-foto', name: 'Fotografie sbiadite', yields: { carta: 1 } },
  {
    id: 'junk-butsudan',
    name: 'Piccolo altare domestico abbandonato (butsudan)',
    yields: { carta: 2, legno: 1 },
  },
  {
    id: 'junk-amuleto',
    name: 'Amuleto esaurito',
    yields: { carta: 1, frammento_onirico: 1 },
  },
  {
    id: 'junk-tanica-sigillata',
    name: 'Tanica sigillata',
    yields: { carburante: 1 },
  },
] as const

const junkById = new Map(JUNK_ITEMS.map((j) => [j.id, j]))

export function getJunkItemDef(id: string): JunkItemDef | undefined {
  return junkById.get(id)
}
