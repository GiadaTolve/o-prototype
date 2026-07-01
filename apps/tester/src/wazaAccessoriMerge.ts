import {
  WAZA_COUNTER_APPLICABILI,
  WAZA_COUNTER_APPLICABILI_LABELS,
  WAZA_STATUS_APPLICABILI,
  WAZA_STATUS_APPLICABILI_LABELS,
  WAZA_WEAPON_CONDITION_TAGS,
  WAZA_WEAPON_CONDITION_TAG_LABELS,
} from './wazaPool'

export type WazaAccessoriEntry = { id: string; label: string }

export type WazaAccessoriPayload = {
  condizioni: WazaAccessoriEntry[]
  status: WazaAccessoriEntry[]
  counter: WazaAccessoriEntry[]
  /** ID rimossi via contributo (sopprimono anche voci presenti solo nel bundle TS). */
  deletedCondizioneIds?: string[]
  deletedStatusIds?: string[]
  deletedCounterIds?: string[]
}

/** Merge static weapon tags + condizioni dinamiche (stesso elenco tendine authoring). */
export function mergeWeaponConditionOptions(remote: WazaAccessoriPayload | null): {
  tagIds: string[]
  labelById: Record<string, string>
} {
  const del = new Set(
    (remote?.deletedCondizioneIds ?? []).map((s) => s.trim()).filter(Boolean),
  )
  const labelById: Record<string, string> = {
    ...(WAZA_WEAPON_CONDITION_TAG_LABELS as Record<string, string>),
  }
  const tagIds: string[] = WAZA_WEAPON_CONDITION_TAGS.filter((id) => !del.has(id))
  for (const { id, label } of remote?.condizioni ?? []) {
    const s = id?.trim()
    if (!s) continue
    labelById[s] = label?.trim() || s
    if (!tagIds.includes(s)) tagIds.push(s)
  }
  return { tagIds, labelById }
}

export function mergeStatusOptions(remote: WazaAccessoriPayload | null): {
  ids: string[]
  labelById: Record<string, string>
} {
  const del = new Set(
    (remote?.deletedStatusIds ?? []).map((s) => s.trim()).filter(Boolean),
  )
  const labelById: Record<string, string> = {
    ...(WAZA_STATUS_APPLICABILI_LABELS as Record<string, string>),
  }
  const ids: string[] = WAZA_STATUS_APPLICABILI.filter((id) => !del.has(id))
  for (const { id, label } of remote?.status ?? []) {
    const s = id?.trim()
    if (!s) continue
    labelById[s] = label?.trim() || s
    if (!ids.includes(s)) ids.push(s)
  }
  return { ids, labelById }
}

export function mergeCounterOptions(remote: WazaAccessoriPayload | null): {
  ids: string[]
  labelById: Record<string, string>
} {
  const del = new Set(
    (remote?.deletedCounterIds ?? []).map((s) => s.trim()).filter(Boolean),
  )
  const labelById: Record<string, string> = {
    ...(WAZA_COUNTER_APPLICABILI_LABELS as Record<string, string>),
  }
  const ids: string[] = WAZA_COUNTER_APPLICABILI.filter((id) => !del.has(id))
  for (const { id, label } of remote?.counter ?? []) {
    const s = id?.trim()
    if (!s) continue
    labelById[s] = label?.trim() || s
    if (!ids.includes(s)) ids.push(s)
  }
  return { ids, labelById }
}

export function mergeAllAccessori(remote: WazaAccessoriPayload | null) {
  return {
    weapon: mergeWeaponConditionOptions(remote),
    status: mergeStatusOptions(remote),
    counter: mergeCounterOptions(remote),
  }
}
