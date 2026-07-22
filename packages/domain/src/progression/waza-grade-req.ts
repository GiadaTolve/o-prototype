/**
 * Requisito di grado minimo per acquistare una waza.
 * Codice breve [SB]/[K]/[S] nel testo canonico → nome grado in scheda.
 */

export const ANALYST_GRADE_ORDER = [
  'Nemuribito',
  'Hakyō',
  'Bunsekikan',
  'Sentatsu Bunsekikan',
  'Kanteikan',
  "Shin'enkan",
  'Akumu Zankyō',
] as const

export type AnalystGradeName = (typeof ANALYST_GRADE_ORDER)[number]

/** Alias canonici usati nelle schede waza. */
export const WAZA_GRADE_ALIASES: Record<string, AnalystGradeName> = {
  SB: 'Sentatsu Bunsekikan',
  K: 'Kanteikan',
  S: "Shin'enkan",
  'SENTATSU BUNSEKIKAN': 'Sentatsu Bunsekikan',
  KANTEIKAN: 'Kanteikan',
  "SHIN'ENKAN": "Shin'enkan",
  SHINENKAN: "Shin'enkan",
}

export const WAZA_GRADE_SHORT: Partial<Record<AnalystGradeName, string>> = {
  'Sentatsu Bunsekikan': 'SB',
  Kanteikan: 'K',
  "Shin'enkan": 'S',
}

/** Requisito fisso per poolId noti (Tōka-dō avanzate e simili). */
export const WAZA_REQUIRED_GRADE_BY_POOL_ID: Record<string, AnalystGradeName> = {
  'omocha-il-giocattolo': 'Sentatsu Bunsekikan',
  'gangushi-il-giocattolaio': 'Kanteikan',
  'tomurai-no-to-rito-funebre': "Shin'enkan",
}

const REQ_GRADE_MARKER_RE = /\[req_grade:([^\]]+)\]/i

export function normalizeAnalystGradeName(raw: string | null | undefined): AnalystGradeName | null {
  if (!raw?.trim()) return null
  const trimmed = raw.trim()
  const alias = WAZA_GRADE_ALIASES[trimmed.toUpperCase()]
  if (alias) return alias
  const hit = ANALYST_GRADE_ORDER.find((g) => g.toLowerCase() === trimmed.toLowerCase())
  return hit ?? null
}

export function gradeRankIndex(grade: string | null | undefined): number {
  const normalized = normalizeAnalystGradeName(grade)
  if (!normalized) return -1
  return ANALYST_GRADE_ORDER.indexOf(normalized)
}

export function parseRequiredGradeMarker(text: string | null | undefined): AnalystGradeName | null {
  if (!text) return null
  const m = REQ_GRADE_MARKER_RE.exec(text)
  if (!m?.[1]) return null
  return normalizeAnalystGradeName(m[1].trim())
}

export function resolveWazaRequiredGrade(input: {
  poolId?: string | null
  description?: string | null
  effect?: string | null
}): AnalystGradeName | null {
  if (input.poolId && WAZA_REQUIRED_GRADE_BY_POOL_ID[input.poolId]) {
    return WAZA_REQUIRED_GRADE_BY_POOL_ID[input.poolId]
  }
  return (
    parseRequiredGradeMarker(input.description) ??
    parseRequiredGradeMarker(input.effect) ??
    null
  )
}

export function characterMeetsGradeRequirement(
  characterGrade: string | null | undefined,
  required: AnalystGradeName | null | undefined,
): boolean {
  if (!required) return true
  const have = gradeRankIndex(characterGrade)
  const need = gradeRankIndex(required)
  if (need < 0) return true
  return have >= need
}

export function formatWazaGradeRequirementLabel(grade: AnalystGradeName): string {
  const short = WAZA_GRADE_SHORT[grade]
  return short ? `Requisito: ${grade} [${short}]` : `Requisito: ${grade}`
}

/** Rimuove marker macchina e header ramo dalla prosa mostrata al giocatore. */
export function stripWazaSystemMarkers(text: string): string {
  return text
    .replace(/^\[[^\]]+\]\s*\n*/u, '')
    .replace(/\[req_grade:[^\]]+\]\s*/gi, '')
    .trim()
}

export function appendReqGradeMarker(description: string, grade: AnalystGradeName): string {
  const base = stripWazaSystemMarkers(description).replace(/\s*\[req_grade:[^\]]+\]\s*/gi, '').trim()
  return `${base}\n\n[req_grade:${grade}]`
}
