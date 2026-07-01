import { containsResolvedDice, isDiceRollMessage } from '../chat/dice-display'

/**
 * Tenkan (Corona / Keter) — accumulo CS automatico in chat.
 * ON: apre accumulo · ogni azione ≥500 caratteri → +3/turno (+ bonus status).
 * OFF: chiude la Corona fino al prossimo [tenkan].
 */

/** Stessa soglia azione narrativa (EXP / quest): almeno 500 caratteri totali. */
export const CHRONO_ACTION_MIN_CHARS = 500

const TENKAN_OFF_TAG = /\[tenkan(?:\s*,\s*|\s*:\s*|\s+)off[^\]]*\]/i
const TENKAN_ON_TAG = /\[tenkan(?!\s*[:\s,]*off)(?:\s*,[^\]]*)?\]/i
const TENKAN_SKIRU_TAG = /\[skiru:tenkan[^\]]*\]/i
const TENKAN_LAUNCH = /\bTenkan\b[^[\n]{0,40}(?:Corona|Keter|転換)/i

export function detectTenkanOffInChatMessage(text: string): boolean {
  if (!text.trim()) return false
  return TENKAN_OFF_TAG.test(text)
}

/** Rileva apertura Tenkan (esclude [tenkan:off]). */
export function detectTenkanOnInChatMessage(text: string): boolean {
  if (!text.trim()) return false
  if (detectTenkanOffInChatMessage(text)) return false
  if (TENKAN_ON_TAG.test(text)) return true
  if (TENKAN_SKIRU_TAG.test(text)) return true
  if (TENKAN_LAUNCH.test(text)) return true
  return false
}

/** @deprecated Usare detectTenkanOnInChatMessage */
export function detectTenkanInChatMessage(text: string): boolean {
  return detectTenkanOnInChatMessage(text)
}

/** Azione narrativa valida per tick CS automatico (≥500 char, non solo dado). */
export function isChronoQualifyingAction(totalChars: number, content: string): boolean {
  if (totalChars < CHRONO_ACTION_MIN_CHARS) return false
  if (containsResolvedDice(content) && isDiceRollMessage(content)) return false
  return true
}

export function buildTenkanLaunchInsertLine(): string {
  return '[tenkan] '
}

export function buildTenkanOffInsertLine(): string {
  return '[tenkan:off] '
}
