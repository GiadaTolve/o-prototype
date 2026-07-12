import type { WazaCategoriaPapabile } from './waza-categoria-papabile'

/** Gate accademico — non rank (duplicato qui per evitare cicli di import con sokaiju-index). */
export const SOKAIJU_GATE_SKIRU_ID = 'tenkan'

/** Mappa ancoraggio Sōkaiju → categoria waza papabile (manuale Oyasumi). */
export const SOKAIJU_ANCHOR_WAZA_CATEGORIA: Readonly<
  Record<string, WazaCategoriaPapabile>
> = {
  chiko: 'Raggio',
  goju: 'Proiettile',
  jikai: 'Potenziamento',
  gojin: 'Contatto',
  kashin: 'Emanazione a Distanza',
  shodo: 'Emanazione',
  eiga: 'Propagazione',
  kongen: 'Costrutto',
  hikan: 'Propagazione Conica',
  genkai: 'Scudo',
}

export type SokaijuFace = 'meiju' | 'shiju'

export const SOKAIJU_INVESTABLE_ANCHOR_IDS = Object.keys(
  SOKAIJU_ANCHOR_WAZA_CATEGORIA,
) as (keyof typeof SOKAIJU_ANCHOR_WAZA_CATEGORIA)[]

export function sokaijuFaceSheetKey(anchorId: string, face: SokaijuFace): string {
  return `${anchorId}:${face}`
}

export function parseSokaijuFaceSheetKey(
  key: string,
): { anchorId: string; face: SokaijuFace } | null {
  const match = key.match(/^([a-z]+):(meiju|shiju)$/)
  if (!match) return null
  const anchorId = match[1]!
  const face = match[2] as SokaijuFace
  if (!(anchorId in SOKAIJU_ANCHOR_WAZA_CATEGORIA)) return null
  return { anchorId, face }
}

export function isSokaijuFaceSheetKey(key: string): boolean {
  return parseSokaijuFaceSheetKey(key) != null
}
