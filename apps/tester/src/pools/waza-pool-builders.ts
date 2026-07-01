import type { WazaBranch, WazaDef } from '../wazaPool'

export function makePassive(
  branch: WazaBranch,
  id: string,
  name: string,
  description: string,
  effect: string,
  extra: Partial<WazaDef> = {},
): WazaDef {
  return {
    id,
    name,
    type: 'passive',
    branch,
    description,
    effect,
    costJigoTipo: extra.costJigoTipo ?? 'mantenimento',
    costJigo: extra.costJigo ?? (() => 2),
    costCs: 0,
    velBonus: 0,
    dbw: 0,
    hasVelocity: false,
    hasDamage: false,
    durata: extra.durata ?? 'mantenimento',
    ...extra,
  }
}

export function makeActive(
  branch: WazaBranch,
  id: string,
  name: string,
  description: string,
  effect: string,
  extra: Partial<WazaDef> = {},
): WazaDef {
  return {
    id,
    name,
    type: 'active',
    branch,
    description,
    effect,
    costJigoTipo: 'fisso',
    costJigo: extra.costJigo ?? (() => 5),
    costCs: extra.costCs ?? 2,
    velBonus: 0,
    dbw: extra.dbw ?? 0,
    hasVelocity: extra.hasVelocity ?? false,
    hasDamage: extra.hasDamage ?? false,
    durata: extra.durata ?? 'utilizzo',
    ...extra,
  }
}
