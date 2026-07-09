/** Tipologie waza (tag bracket) papabili per IR — forme esatte dal manuale. */
export const WAZA_CATEGORIA_PAPABILI = [
  'Raggio',
  'Proiettile',
  'Propagazione Conica',
  'Propagazione',
  'Emanazione',
  'Emanazione a Distanza',
  'Contatto',
  'Potenziamento',
  'Costrutti',
  'Scudo',
] as const

export type WazaCategoriaPapabile = (typeof WAZA_CATEGORIA_PAPABILI)[number]

export function isWazaCategoriaPapabile(value: string): value is WazaCategoriaPapabile {
  return (WAZA_CATEGORIA_PAPABILI as readonly string[]).includes(value)
}
