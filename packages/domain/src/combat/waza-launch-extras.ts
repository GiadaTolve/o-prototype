import type { GiurisdizioneCategory } from '../styles/ito/giurisdizione'
import type { HogosuturaKind } from '../styles/naikan/hogo'
import type { WazaLaunchTargetSpec } from './waza-launch'

export type WazaLaunchExtras = {
  giurisdizioneCategory?: GiurisdizioneCategory | null
  suturaKind?: HogosuturaKind | null
  /** `[sorpresa:1]` — Hikan vs schivata reattiva. */
  surpriseAttack?: boolean
  /** `[decreto: …]` — Chokurei. */
  decretoText?: string | null
  /** `[meisaku:Nome]` — Opera Prima. */
  meisakuLabel?: string | null
}

export type WazaLaunchProfile = {
  poolId: string
  needsGiurisdizioneCategory?: boolean
  needsSuturaKind?: boolean
  needsDecreto?: boolean
  needsTarget?: boolean
  allowsSurprise?: boolean
  needsMeisakuLabel?: boolean
}

const LAUNCH_PROFILES: Record<string, WazaLaunchProfile> = {
  'kankatsu-giurisdizione': {
    poolId: 'kankatsu-giurisdizione',
    needsGiurisdizioneCategory: true,
    allowsSurprise: true,
  },
  'chokurei-decreto': {
    poolId: 'chokurei-decreto',
    needsDecreto: true,
    allowsSurprise: true,
  },
  'hogo-sutura-ego': {
    poolId: 'hogo-sutura-ego',
    needsSuturaKind: true,
    needsTarget: true,
  },
  'mugen-shihai-dominazione-onirica': {
    poolId: 'mugen-shihai-dominazione-onirica',
    allowsSurprise: true,
  },
  'meisaku-opera-prima': {
    poolId: 'meisaku-opera-prima',
    needsMeisakuLabel: true,
  },
  'shakkin-indebitamento': {
    poolId: 'shakkin-indebitamento',
    needsTarget: true,
  },
}

export function getWazaLaunchProfile(poolId?: string | null): WazaLaunchProfile | null {
  if (!poolId) return null
  return LAUNCH_PROFILES[poolId] ?? null
}

function buildTargetNameForTag(target: WazaLaunchTargetSpec): string | null {
  if (target.characterId) return `id:${target.characterId}`
  if (target.nameQuery) return target.nameQuery
  return null
}

/** Tag aggiuntivi per waza avanzate (Giurisdizione, Hōgō, Decreto, Sorpresa…). */
export function buildWazaLaunchExtraTags(
  poolId: string | null | undefined,
  extras: WazaLaunchExtras | null | undefined,
  target?: WazaLaunchTargetSpec | null,
): string[] {
  if (!poolId || !extras) return []
  const tags: string[] = []
  const profile = getWazaLaunchProfile(poolId)

  if (profile?.needsGiurisdizioneCategory && extras.giurisdizioneCategory) {
    tags.push(`[giurisdizione:${extras.giurisdizioneCategory}]`)
  }

  if (profile?.needsDecreto && extras.decretoText?.trim()) {
    tags.push(`[decreto:${extras.decretoText.trim()}]`)
  }

  if (profile?.needsMeisakuLabel && extras.meisakuLabel?.trim()) {
    tags.push(`[meisaku:${extras.meisakuLabel.trim()}]`)
  }

  if (profile?.needsSuturaKind && extras.suturaKind && target) {
    const who = buildTargetNameForTag(target)
    if (who) tags.push(`[sutura:${who}:${extras.suturaKind}]`)
  }

  if (profile?.poolId === 'shakkin-indebitamento' && target) {
    const who = target.nameQuery ?? (target.characterId ? `id:${target.characterId}` : null)
    if (who) tags.push(`[debito:${who}]`)
  }

  if (extras.surpriseAttack) {
    tags.push('[sorpresa:1]')
  }

  return tags
}

export function messageDeclaresSurpriseAttack(text: string): boolean {
  return /\[sorpresa:1\]/i.test(text)
}
