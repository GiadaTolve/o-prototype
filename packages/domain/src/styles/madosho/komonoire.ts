/** Komonoire (小物入れ) — patto sbagliato · dado demoniaco · Madoshō §4.3 */

export type KomonoireWeaponState = {
  roll: number
  label: string
}

export type KomonoireMeta = {
  komonoireWeapon?: KomonoireWeaponState | null
}

/** Armi del dado demoniaco (1d6). */
export const KOMONOIRE_DEMON_WEAPONS: Record<number, string> = {
  1: 'Wakizashi maledetta',
  2: 'Kunai demoniaca',
  3: 'Shuriken arrugginita',
  4: 'Kusarigama del debito',
  5: 'Kanabō in miniatura',
  6: 'Kusari-fundo sussurrante',
}

export function komonoireWeaponLabel(roll: number): string | null {
  if (!Number.isInteger(roll) || roll < 1 || roll > 6) return null
  return KOMONOIRE_DEMON_WEAPONS[roll] ?? null
}

/** `[komonoire:tira:4]` o `[komonoire:dado:4]` — esito 1–6 del dado demoniaco. */
export function extractKomonoireRoll(text: string): number | null {
  const m = /\[komonoire:\s*(?:tira|dado)\s*:\s*(\d+)\s*\]/i.exec(text)
  if (!m) return null
  const n = Number(m[1])
  if (!Number.isInteger(n) || n < 1 || n > 6) return null
  return n
}

export function hasKomonoireRefuseTag(text: string): boolean {
  return /\[komonoire:\s*(?:rifiuta|opposizione)\s*\]/i.test(text)
}

export function hasKomonoireAcceptTag(text: string): boolean {
  return /\[komonoire:\s*accetta\s*\]/i.test(text)
}

export function setKomonoireWeapon(meta: KomonoireMeta, roll: number): KomonoireMeta {
  const label = komonoireWeaponLabel(roll)
  if (!label) return meta
  return { ...meta, komonoireWeapon: { roll, label } }
}

export function clearKomonoireWeapon(meta: KomonoireMeta): KomonoireMeta {
  return { ...meta, komonoireWeapon: null }
}

export function readKomonoireWeapon(meta: KomonoireMeta | null | undefined): KomonoireWeaponState | null {
  const w = meta?.komonoireWeapon
  if (!w?.label) return null
  return w
}

export function formatKomonoireSegment(meta: KomonoireMeta): string | null {
  const w = readKomonoireWeapon(meta)
  if (!w) return null
  return `Komonoire: ${w.label} (dado ${w.roll}) · rifiuta [komonoire:rifiuta]`
}

/** Arma del dado valida solo per il turno corrente. */
export function tickKomonoireEndOfTurn(meta: KomonoireMeta): KomonoireMeta {
  if (!readKomonoireWeapon(meta)) return meta
  return clearKomonoireWeapon(meta)
}
