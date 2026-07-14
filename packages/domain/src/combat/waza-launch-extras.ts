import type { GiurisdizioneCategory } from '../styles/ito/giurisdizione'
import type { ConsistencyKind } from '../styles/hensei/nagori'
import type { HogosuturaKind } from '../styles/naikan/hogo'
import type { WazaLaunchTargetSpec } from './waza-launch'
import type { ConstructSizeId } from './constructs'
import type { ConstructProprietaId } from './construct-profile'

export type KadenIntensity = 'cs12' | 'overheat' | 'frattura'

export type WazaLaunchExtras = {
  giurisdizioneCategory?: GiurisdizioneCategory | null
  suturaKind?: HogosuturaKind | null
  nagoriShift?: { from: ConsistencyKind; to: ConsistencyKind } | null
  /** `[sorpresa:1]` — Hikan vs schivata reattiva. */
  surpriseAttack?: boolean
  /** `[decreto: …]` — Chokurei. */
  decretoText?: string | null
  /** `[meisaku:Nome]` — Opera Prima. */
  meisakuLabel?: string | null
  /** Intensità Kaden (Hadō): cs12 / overheat / frattura volontaria. */
  kadenIntensity?: KadenIntensity | null
  /** Quarto d'azione selezionato (1–4) per waza multi-quarto (Rensa, Uzu…). */
  quartoSelected?: 1 | 2 | 3 | 4 | null
  /** Waza in setup/attesa — non agisce subito (Fuin no Hi, Rensa). */
  delayedEffect?: boolean
  /** Taglia del costrutto evocato (waza con blocco EVOCA_COSTRUTTO). */
  constructTaglia?: ConstructSizeId | null
  /** Sticker attivi sul costrutto evocato (Batteria/Personale/Tōrō). */
  constructSticker?: ConstructProprietaId[] | null
}

export type MacchiatoSpendOption = {
  cost: number
  label: string
  chatTag: string
  detail: string
}

export const MACCHIATO_SPEND_OPTIONS: MacchiatoSpendOption[] = [
  { cost: 1, label: "1 counter",   chatTag: "[macchiato-spend:1]", detail: "rigenera 2 CS" },
  { cost: 2, label: "2 counter",   chatTag: "[macchiato-spend:2]", detail: "Proiettile Liquido (tier 2, danno 8) · gittata 12 m · macchia all'impatto" },
  { cost: 5, label: "5+ counter",  chatTag: "[macchiato-spend:5]", detail: "Raggio Energetico (tier 4, danno 17) · gittata 15 m" },
]

export type WazaLaunchProfile = {
  poolId: string
  needsGiurisdizioneCategory?: boolean
  needsSuturaKind?: boolean
  needsDecreto?: boolean
  needsNagoriShift?: boolean
  needsTarget?: boolean
  allowsSurprise?: boolean
  needsMeisakuLabel?: boolean
  /** Waza multi-quarto (Rensa, Uzu): mostra selettore 1/4→4/4. */
  needsQuarto?: boolean
  /** Waza a effetto rimandato (Fuin no Hi, Rensa): toggle "setup". */
  needsDelayedEffect?: boolean
  /** Waza solo-narrazione: nasconde IR/danno, mostra solo note per il Master. */
  masterOnlyCard?: boolean
  /** Waza con spesa counter Macchiato (Yobimodoshi): mostra pannello spesa. */
  needsMacchiatoSpend?: boolean
}

const LAUNCH_PROFILES: Record<string, WazaLaunchProfile> = {
  'fuin-no-hi-sigillo-della-fiamma': {
    poolId: 'fuin-no-hi-sigillo-della-fiamma',
    needsDelayedEffect: true,
  },
  'rensa-catena-fili': {
    poolId: 'rensa-catena-fili',
    needsQuarto: true,
    needsDelayedEffect: true,
  },
  'rensa-baku-detonazione-catena': {
    poolId: 'rensa-baku-detonazione-catena',
    needsQuarto: true,
  },
  'kankatsu-giurisdizione': {
    poolId: 'kankatsu-giurisdizione',
    needsGiurisdizioneCategory: true,
    allowsSurprise: true,
  },
  'nagori-principio-instabilita': {
    poolId: 'nagori-principio-instabilita',
    needsNagoriShift: true,
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
  'yobimodoshi': {
    poolId: 'yobimodoshi',
    needsMacchiatoSpend: true,
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

  if (profile?.needsNagoriShift && extras.nagoriShift) {
    tags.push(`[yuragi:${extras.nagoriShift.from}→${extras.nagoriShift.to}]`)
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

  if (extras.kadenIntensity) {
    tags.push(`[kaden:${extras.kadenIntensity}]`)
  }

  if (profile?.needsQuarto && extras.quartoSelected != null) {
    tags.push(`[quarto:${extras.quartoSelected}/4]`)
  }

  if (profile?.needsDelayedEffect && extras.delayedEffect) {
    tags.push('[setup:1]')
  }

  if (extras.constructTaglia) {
    tags.push(`[taglia:${extras.constructTaglia}]`)
  }

  if (extras.constructSticker && extras.constructSticker.length > 0) {
    tags.push(`[sticker:${extras.constructSticker.join('+')}]`)
  }

  return tags
}

export function messageDeclaresSurpriseAttack(text: string): boolean {
  return /\[sorpresa:1\]/i.test(text)
}
