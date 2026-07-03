import { getSkiruDef, listSkiruByDomain } from '../skiru/catalog'
import { calculateKongenDamageFloor, calculateGojinCounterBonus } from '../skiru/sokaiju-combat'
import { getSkiruPoints } from '../skiru/progression'
import type { SkiruSheet } from '../skiru/types'
import { getTierValue, type WazaTier } from './tier'

export type SkiruRiderKind =
  | 'damage_plus'
  | 'evasion_penalty'
  | 'contact_damage'
  | 'duration_plus'
  | 'ignore_feints'

export type SkiruRider = {
  kind: SkiruRiderKind
  value: number
  label: string
}

/** Skiru con rider tabellare. */
const SKIRU_RIDER_TABLE: Record<string, SkiruRider> = {
  bakuryoku: { kind: 'damage_plus', value: 2, label: '+2 danno' },
  goatsu: { kind: 'damage_plus', value: 2, label: '+2 danno' },
  seimitsu: { kind: 'evasion_penalty', value: 0, label: 'riduce evasione bersaglio' },
  'shintai-kokan': { kind: 'contact_damage', value: 2, label: '+2 danno se [Contatto]' },
  fudoshin: { kind: 'duration_plus', value: 1, label: '+1 turno durata controllo/status' },
  chokaku: { kind: 'ignore_feints', value: 0, label: 'ignora finte/esche' },
  kansatsu: { kind: 'ignore_feints', value: 0, label: 'ignora finte/esche' },
}

export function getSkiruRider(skiruId: string): SkiruRider | null {
  return SKIRU_RIDER_TABLE[skiruId] ?? null
}

function bestSkiruInDomain(sheet: SkiruSheet, domain: 'chi' | 'jin'): string | null {
  let bestId: string | null = null
  let bestPts = -1
  for (const def of listSkiruByDomain(domain)) {
    if (def.kind !== 'standard' || def.branchId === 'sokaiju') continue
    const pts = getSkiruPoints(sheet, def.id)
    if (pts > bestPts) {
      bestPts = pts
      bestId = def.id
    }
  }
  return bestId
}

/** IR al lancio con Skiru dichiarata: (dichiarata + incanalamento complementare) / 2. */
export function computeDeclaredActionIr(sheet: SkiruSheet, declaredSkiruId: string): number {
  const declaredPts = getSkiruPoints(sheet, declaredSkiruId)
  const def = getSkiruDef(declaredSkiruId)
  let channelPts = declaredPts
  if (def?.domain === 'chi') {
    const jin = bestSkiruInDomain(sheet, 'jin')
    if (jin) channelPts = getSkiruPoints(sheet, jin)
  } else if (def?.domain === 'jin') {
    const chi = bestSkiruInDomain(sheet, 'chi')
    if (chi) channelPts = getSkiruPoints(sheet, chi)
  } else {
    const jin = bestSkiruInDomain(sheet, 'jin')
    if (jin) channelPts = getSkiruPoints(sheet, jin)
  }
  return Math.round((declaredPts + channelPts) / 2)
}

/** Costruisce ActionIndexInput da Skiru dichiarata al lancio. */
export function buildActionIndexFromDeclaredSkiru(
  sheet: SkiruSheet,
  declaredSkiruId: string,
): import('./resolution').ActionIndexInput {
  const def = getSkiruDef(declaredSkiruId)
  let physicalSkiruId = declaredSkiruId
  let channelingSkiruId = declaredSkiruId
  if (def?.domain === 'chi') {
    const jin = bestSkiruInDomain(sheet, 'jin')
    if (jin) channelingSkiruId = jin
  } else if (def?.domain === 'jin') {
    const chi = bestSkiruInDomain(sheet, 'chi')
    if (chi) physicalSkiruId = chi
  } else {
    const jin = bestSkiruInDomain(sheet, 'jin')
    if (jin) channelingSkiruId = jin
  }
  return { physicalSkiruId, channelingSkiruId, quartersSpent: 1 }
}

/** +1 turno durata se Fudoshin dichiarata su effetti a tempo. */
export function applyFudoshinDurationRider(
  baseTurns: number | undefined,
  declaredSkiruId: string | null | undefined,
): number | undefined {
  if (baseTurns == null) return baseTurns
  if (declaredSkiruId === 'fudoshin') return baseTurns + 1
  return baseTurns
}

/** Estrae tag meccanici `[…]` dalla descrizione/effetto waza. */
export function extractMechanicTagsFromEffect(effect?: string | null): string[] {
  if (!effect) return []
  const tags = new Set<string>()
  const re = /\[([^\]]+)\]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(effect)) !== null) {
    const raw = m[1]?.trim()
    if (!raw) continue
    for (const part of raw.split(/[·,]/)) {
      const t = part.trim()
      if (t) tags.add(t)
    }
  }
  return [...tags]
}

export function wazaEffectDeclaresContact(effect?: string | null): boolean {
  return extractMechanicTagsFromEffect(effect).some((t) => /contatto/i.test(t))
}

/** Penalità IR al difensore quando l'attaccante dichiara Seimitsu (−2 evasione). */
export function computeSkiruRiderDefenderIrPenalty(
  declaredSkiruId: string | null | undefined,
): number {
  if (declaredSkiruId === 'seimitsu') return -2
  return 0
}

/** Bonus flat danno da rider Skiru dichiarata. */
export function computeSkiruRiderFlatBonus(
  declaredSkiruId: string | null | undefined,
  wazaEffectText?: string | null,
): number {
  if (!declaredSkiruId) return 0
  const rider = getSkiruRider(declaredSkiruId)
  if (!rider) return 0
  if (rider.kind === 'damage_plus') return rider.value
  if (rider.kind === 'contact_damage' && wazaEffectDeclaresContact(wazaEffectText)) return rider.value
  return 0
}

export type LaunchDamagePreview = {
  tierValue: number
  kongenFloor: number
  gojinBonus: number
  riderBonus: number
  totalBeforeMitigation: number
  summary: string
}

/** Anteprima danno al lancio (prima di mitigazione Itami). */
export function computeLaunchDamagePreview(input: {
  tier: number | null
  attackerSheet?: SkiruSheet | null
  declaredSkiruId?: string | null
  wazaEffectText?: string | null
  isReactiveCounter?: boolean
}): LaunchDamagePreview | null {
  if (input.tier == null || input.tier < 1 || input.tier > 5) return null
  const tierValue = getTierValue(input.tier as WazaTier)
  const kongenFloor = input.attackerSheet ? calculateKongenDamageFloor(input.attackerSheet) : 0
  const gojinBonus =
    input.isReactiveCounter && input.attackerSheet
      ? calculateGojinCounterBonus(input.attackerSheet)
      : 0
  const riderBonus = computeSkiruRiderFlatBonus(input.declaredSkiruId, input.wazaEffectText)
  const totalBeforeMitigation = tierValue + kongenFloor + gojinBonus + riderBonus
  const parts = [`tier ${tierValue}`]
  if (kongenFloor > 0) parts.push(`Kongen +${kongenFloor}`)
  if (gojinBonus > 0) parts.push(`Gōjin +${gojinBonus}`)
  if (riderBonus > 0) parts.push(`rider +${riderBonus}`)
  return {
    tierValue,
    kongenFloor,
    gojinBonus,
    riderBonus,
    totalBeforeMitigation,
    summary: parts.join(' · '),
  }
}
