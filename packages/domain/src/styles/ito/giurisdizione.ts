/** Kankatsu (管轄) — Giurisdizione · Itō-dō. */

export const GIURISDICTION_DURATION_TURNS = 3
export const GIURISDICTION_CS_COST = 4
export const GIURISDICTION_CLAIM_CS_COST = 2

export type GiurisdizioneCategory = 'proiettile' | 'raggio'

export type ItoGiurisdizioneState = {
  category: GiurisdizioneCategory
  turnsLeft: number
}

export type ItoGiurisdizioneMeta = {
  itoGiurisdizione?: ItoGiurisdizioneState | null
}

const CATEGORY_ALIASES: Record<string, GiurisdizioneCategory> = {
  proiettile: 'proiettile',
  raggio: 'raggio',
}

export function readGiurisdizioneState(
  meta: ItoGiurisdizioneMeta | null | undefined,
): ItoGiurisdizioneState | null {
  const g = meta?.itoGiurisdizione
  if (!g || g.turnsLeft <= 0) return null
  return g
}

export function extractGiurisdizioneCategory(text: string): GiurisdizioneCategory | null {
  const m = /\[giurisdizione:\s*([a-z]+)\s*\]/i.exec(text)
  if (!m) return null
  return CATEGORY_ALIASES[m[1].toLowerCase()] ?? null
}

export function hasGiurisdizioneClaimTag(text: string): boolean {
  return /\[giurisdizione:\s*reclama\s*\]/i.test(text)
}

export function activateGiurisdizione(
  meta: ItoGiurisdizioneMeta,
  category: GiurisdizioneCategory,
): ItoGiurisdizioneMeta {
  return {
    ...meta,
    itoGiurisdizione: { category, turnsLeft: GIURISDICTION_DURATION_TURNS },
  }
}

export function tickGiurisdizioneEndOfTurn(meta: ItoGiurisdizioneMeta): ItoGiurisdizioneMeta {
  const g = readGiurisdizioneState(meta)
  if (!g) return { ...meta, itoGiurisdizione: null }
  const turnsLeft = g.turnsLeft - 1
  if (turnsLeft <= 0) return { ...meta, itoGiurisdizione: null }
  return { ...meta, itoGiurisdizione: { ...g, turnsLeft } }
}

export function formatGiurisdizioneSegment(meta: ItoGiurisdizioneMeta): string | null {
  const g = readGiurisdizioneState(meta)
  if (!g) return null
  const label = g.category === 'proiettile' ? 'Proiettile' : 'Raggio'
  return `Giurisdizione: ${label} (${g.turnsLeft} turni)`
}
