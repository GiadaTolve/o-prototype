/**
 * Riepilogo meccaniche attive in coda a ogni azione chat.
 * Tag: `[stato: …]` — formattato in UI come blocco dedicato.
 */
import { getStatusDefinition } from './status/catalog'
import type { StatusContainer, StatusInstance } from './status/types'
import type { DoMechanicsSnapshot } from '../styles/do-mechanics'
import { formatAdvancedCombatSegments } from './waza-chat-automation'
import type { DoMechanicsUiMeta } from '../styles/do-mechanics'

export type ActionStateSummaryInput = {
  doMechanics: DoMechanicsSnapshot
  statusContainer: StatusContainer
  /** Meta ui (investimento, Kōmei, Nagori, …). */
  uiMeta?: DoMechanicsUiMeta | null
}

function statusEffectHints(stacks: number, modifiers: ReturnType<typeof getStatusDefinition>['modifiers']): string[] {
  const hints: string[] = []
  const dot = modifiers.endOfTurnSelfDamagePerStack
  if (dot && dot > 0) hints.push(`−${dot * stacks} HP/turno`)
  if (modifiers.offensiveTierBonus) hints.push(`+${modifiers.offensiveTierBonus} tier off`)
  if (modifiers.damageTakenTierBonus) hints.push(`+${modifiers.damageTakenTierBonus} tier sub`)
  if (modifiers.indexBonus) {
    hints.push(`${modifiers.indexBonus > 0 ? '+' : ''}${modifiers.indexBonus} IR`)
  }
  if (modifiers.bonusCsPerTurn) hints.push(`+${modifiers.bonusCsPerTurn} CS/turno`)
  if (modifiers.blockWaza) hints.push('no waza')
  if (modifiers.blockCsGain) hints.push('no guadagno CS')
  if (modifiers.blockHealing) hints.push('no guarigione')
  if (modifiers.movementTowardEnemyOnly) hints.push('solo verso nemico')
  if (modifiers.damageMultiplier != null && modifiers.damageMultiplier !== 1) {
    hints.push(`danno ×${modifiers.damageMultiplier}`)
  }
  return hints
}

function formatStatusSegment(instance: StatusInstance): string {
  const def = getStatusDefinition(instance.id)
  const hints = statusEffectHints(instance.stacks, def.modifiers)
  const base = `${def.tag} ×${instance.stacks}`
  return hints.length > 0 ? `${base} (${hints.join(', ')})` : base
}

function formatItoSegment(doMechanics: DoMechanicsSnapshot): string | null {
  const { ito } = doMechanics
  if (ito.rawLevel <= 0) return null
  const fili = ito.rawLevel
  const filiLabel = fili === 1 ? '1 filo in campo' : `${fili} fili in campo`
  return `Tensione: ${filiLabel}`
}

function formatMetaSegments(uiMeta: DoMechanicsUiMeta | null | undefined): string[] {
  if (!uiMeta) return []
  return formatAdvancedCombatSegments(uiMeta)
}

/** Segmenti testuali (senza tag). Tensione Itō + meta combattimento + status attivi. */
export function buildActionStateSummarySegments(input: ActionStateSummaryInput): string[] {
  const segments: string[] = []

  const ito = formatItoSegment(input.doMechanics)
  if (ito) segments.push(ito)

  segments.push(...formatMetaSegments(input.uiMeta))

  for (const instance of input.statusContainer.statuses) {
    segments.push(formatStatusSegment(instance))
  }

  return segments
}

/** Tag chat da appendere in coda al messaggio, o null se niente da mostrare. */
export function buildActionStateSummaryTag(input: ActionStateSummaryInput): string | null {
  const segments = buildActionStateSummarySegments(input)
  if (segments.length === 0) return null
  return `\n[stato: ${segments.join(' · ')}]`
}

export function escapeHtmlForActionState(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatSegmentChip(segment: string): string {
  const trimmed = segment.trim()
  const tensione = trimmed.match(/^Tensione:\s*(.+)$/i)
  if (tensione) {
    const val = escapeHtmlForActionState(tensione[1]!)
    return `<span class="action-state-summary__chip action-state-summary__chip--tensione"><span class="action-state-summary__chip-key">Tensione</span><span class="action-state-summary__chip-val">${val}</span></span>`
  }

  const status = trimmed.match(/^(.+?)\s×(\d+)(?:\s\(([^)]+)\))?$/)
  if (status) {
    const name = escapeHtmlForActionState(status[1]!.trim())
    const stacks = status[2]
    const fx = status[3] ? escapeHtmlForActionState(status[3]) : ''
    const fxHtml = fx
      ? `<span class="action-state-summary__chip-fx">${fx}</span>`
      : ''
    return `<span class="action-state-summary__chip action-state-summary__chip--status"><span class="action-state-summary__chip-key">${name}</span><span class="action-state-summary__chip-stack">×${stacks}</span>${fxHtml}</span>`
  }

  return `<span class="action-state-summary__chip">${escapeHtmlForActionState(trimmed)}</span>`
}

/** Formatta `[stato: …]` per display HTML chat. */
export function formatActionStateTagsInText(text: string): string {
  return text.replace(/\[stato:\s*([^\]]+)\]/gi, (_m, body: string) => {
    const segments = body
      .split(/\s·\s/)
      .map((s: string) => s.trim())
      .filter(Boolean)
    const chips = segments.map(formatSegmentChip).join('')
    return `<span class="action-state-summary" title="Stato meccaniche e status"><span class="action-state-summary__label">Stato</span><span class="action-state-summary__grid">${chips}</span></span>`
  })
}
