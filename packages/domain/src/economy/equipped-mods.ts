/**
 * Bonus/malus da oggetti equipaggiati (solo CARRY + isEquipped).
 * - DMG flat → danno
 * - Mitigazione flat → % mitigazione
 * - Bonus/Malus Skiru → overlay sullo sheet (IR, CAC/CAD derivati, ecc.)
 */
import { getSkiruDef } from '../skiru/catalog'
import { getSkiruPoints } from '../skiru/progression'
import type { SkiruSheet } from '../skiru/types'
import { DERIVED_MITIGATION_CAP } from '../skiru/derived-stats'

export type SkiruFlatEntry = {
  readonly skiruId: string
  readonly value: number
}

/** Campi combat/mod da una riga catalogo items. */
export type ItemModFields = {
  readonly name?: string | null
  readonly damage?: number | null
  /** Flat % mitigazione (non confondere con resistance/scudo). */
  readonly mitigationFlat?: number | null
  /** Legacy generico — ignorato se ci sono skiruBonuses/maluses. */
  readonly bonus?: number | null
  readonly skiruBonuses?: readonly SkiruFlatEntry[] | Record<string, number> | null
  readonly skiruMaluses?: readonly SkiruFlatEntry[] | Record<string, number> | null
}

export type EquippedItemModInput = ItemModFields & {
  readonly isEquipped: boolean
  readonly location?: string | null
}

export type AggregatedEquipmentMods = {
  /** Somma DMG flat da oggetti equipaggiati. */
  readonly damageFlat: number
  /** Somma mitigazione flat % (poi capped con Itami). */
  readonly mitigationFlat: number
  /** Delta netti per Skiru id (bonus positivi, malus negativi). */
  readonly skiruDeltas: Readonly<Record<string, number>>
  /** Righe per riepilogo chat / UI. */
  readonly lines: readonly string[]
}

function normalizeEntries(
  raw: readonly SkiruFlatEntry[] | Record<string, number> | null | undefined,
): SkiruFlatEntry[] {
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw
      .map((e) => ({
        skiruId: String(e.skiruId ?? '').trim(),
        value: Math.trunc(Number(e.value) || 0),
      }))
      .filter((e) => e.skiruId && e.value !== 0)
  }
  return Object.entries(raw)
    .map(([skiruId, value]) => ({
      skiruId: skiruId.trim(),
      value: Math.trunc(Number(value) || 0),
    }))
    .filter((e) => e.skiruId && e.value !== 0)
}

function skiruLabel(skiruId: string): string {
  return getSkiruDef(skiruId)?.name ?? skiruId
}

/** Aggrega solo oggetti equipaggiati in CARRY (default location). */
export function aggregateEquippedItemMods(
  items: readonly EquippedItemModInput[],
): AggregatedEquipmentMods {
  const skiruDeltas: Record<string, number> = {}
  const lines: string[] = []
  let damageFlat = 0
  let mitigationFlat = 0

  for (const item of items) {
    if (!item.isEquipped) continue
    const loc = (item.location ?? 'CARRY').toUpperCase()
    if (loc !== 'CARRY') continue

    const name = item.name?.trim() || 'Oggetto'

    const dmg = item.damage != null && Number.isFinite(item.damage) ? Math.trunc(item.damage) : 0
    if (dmg !== 0) {
      damageFlat += dmg
      lines.push(`${name}: DMG ${dmg > 0 ? '+' : ''}${dmg}`)
    }

    const mit =
      item.mitigationFlat != null && Number.isFinite(item.mitigationFlat)
        ? Math.trunc(item.mitigationFlat)
        : 0
    if (mit !== 0) {
      mitigationFlat += mit
      lines.push(`${name}: Mitigazione ${mit > 0 ? '+' : ''}${mit}%`)
    }

    for (const b of normalizeEntries(item.skiruBonuses)) {
      const v = Math.abs(b.value)
      skiruDeltas[b.skiruId] = (skiruDeltas[b.skiruId] ?? 0) + v
      lines.push(`${name}: ${skiruLabel(b.skiruId)} +${v}`)
    }
    for (const m of normalizeEntries(item.skiruMaluses)) {
      const v = Math.abs(m.value)
      skiruDeltas[m.skiruId] = (skiruDeltas[m.skiruId] ?? 0) - v
      lines.push(`${name}: ${skiruLabel(m.skiruId)} −${v}`)
    }
  }

  return { damageFlat, mitigationFlat, skiruDeltas, lines }
}

/** Overlay sheet per calcoli (non persistire). Punti non scendono sotto 0. */
export function applyEquipmentModsToSheet(
  sheet: SkiruSheet,
  mods: AggregatedEquipmentMods | null | undefined,
): SkiruSheet {
  if (!mods || Object.keys(mods.skiruDeltas).length === 0) return sheet
  const next: SkiruSheet = { ...sheet }
  for (const [skiruId, delta] of Object.entries(mods.skiruDeltas)) {
    if (!delta) continue
    next[skiruId] = Math.max(0, getSkiruPoints(sheet, skiruId) + delta)
  }
  return next
}

/** Mitigazione % scheda + flat equip, capped. */
export function combineMitigationPercent(
  baseFromSkiru: number,
  equipmentMitigationFlat: number,
): number {
  return Math.min(
    DERIVED_MITIGATION_CAP,
    Math.max(0, baseFromSkiru + equipmentMitigationFlat),
  )
}

/** Parse jsonb da DB (array o record). */
export function parseSkiruFlatList(raw: unknown): SkiruFlatEntry[] {
  if (raw == null) return []
  if (Array.isArray(raw) || (typeof raw === 'object' && raw !== null && !Array.isArray(raw))) {
    return normalizeEntries(raw as SkiruFlatEntry[] | Record<string, number>)
  }
  return []
}
