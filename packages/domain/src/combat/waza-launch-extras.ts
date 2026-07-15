import type { GiurisdizioneCategory } from '../styles/ito/giurisdizione'
import type { ConsistencyKind } from '../styles/hensei/nagori'
import type { HogosuturaKind } from '../styles/naikan/hogo'
import type { WazaLaunchTargetSpec } from './waza-launch'
import type { ConstructSizeId } from './constructs'
import type { ConstructProprietaId } from './construct-profile'

export type KadenIntensity = 'cs12' | 'overheat' | 'frattura'

export const SENI_GAKE_FIBRE = ['bianche', 'neuromuscolari', 'rosse'] as const
export type SeniGakeFibra = (typeof SENI_GAKE_FIBRE)[number]
export const SENI_GAKE_SETTORI = ['gambe', 'braccia', 'torace'] as const
export type SeniGakeSettore = (typeof SENI_GAKE_SETTORI)[number]

export const SENI_GAKE_FIBRA_LABELS: Record<SeniGakeFibra, string> = {
  bianche: 'Fibre Bianche → +2 Kairyoku',
  neuromuscolari: 'Fibre Neuromuscolari → +2 Binshō',
  rosse: 'Fibre Rosse → +2 Nintai',
}

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
  /** Trasformazione tag: `[trasforma:dimensione:from→to]` (Someito, Yugami, Igyō-Rensei…). */
  trasformaTag?: { dimensione: 'consistenza' | 'categoria'; from: string; to: string } | null
  /** Sen'i-Gake (Naikan): tipo fibra + settore corporeo scelti al lancio. */
  seniGakeChoice?: { fibra: SeniGakeFibra; settore: SeniGakeSettore } | null
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

function buildTargetNameForTag(target: WazaLaunchTargetSpec): string | null {
  if (target.characterId) return `id:${target.characterId}`
  if (target.nameQuery) return target.nameQuery
  return null
}

/** Tag aggiuntivi per waza avanzate (Giurisdizione, Hōgō, Decreto, Sorpresa…). */
export function buildWazaLaunchExtraTags(
  flags: import('./waza-tag-preview').WazaLaunchFlags | null | undefined,
  extras: WazaLaunchExtras | null | undefined,
  target?: WazaLaunchTargetSpec | null,
): string[] {
  if (!extras) return []
  const tags: string[] = []

  if (flags?.needsGiurisdizioneCategory && extras.giurisdizioneCategory) {
    tags.push(`[giurisdizione:${extras.giurisdizioneCategory}]`)
  }

  if (flags?.needsNagoriShift && extras.nagoriShift) {
    tags.push(`[yuragi:${extras.nagoriShift.from}→${extras.nagoriShift.to}]`)
  }

  if (flags?.needsDecreto && extras.decretoText?.trim()) {
    tags.push(`[decreto:${extras.decretoText.trim()}]`)
  }

  if (flags?.needsMeisakuLabel && extras.meisakuLabel?.trim()) {
    tags.push(`[meisaku:${extras.meisakuLabel.trim()}]`)
  }

  if (flags?.needsSuturaKind && extras.suturaKind && target) {
    const who = buildTargetNameForTag(target)
    if (who) tags.push(`[sutura:${who}:${extras.suturaKind}]`)
  }

  if (flags?.needsDebitoTag && target) {
    const who = target.nameQuery ?? (target.characterId ? `id:${target.characterId}` : null)
    if (who) tags.push(`[debito:${who}]`)
  }

  if (extras.surpriseAttack) {
    tags.push('[sorpresa:1]')
  }

  if (extras.kadenIntensity) {
    tags.push(`[kaden:${extras.kadenIntensity}]`)
  }

  if (flags?.needsQuarto && extras.quartoSelected != null) {
    tags.push(`[quarto:${extras.quartoSelected}/4]`)
  }

  if (flags?.needsDelayedEffect && extras.delayedEffect) {
    tags.push('[setup:1]')
  }

  if (extras.constructTaglia) {
    tags.push(`[taglia:${extras.constructTaglia}]`)
  }

  if (extras.constructSticker && extras.constructSticker.length > 0) {
    tags.push(`[sticker:${extras.constructSticker.join('+')}]`)
  }

  if (flags?.needsTrasformaTag && extras.trasformaTag) {
    const { dimensione, from, to } = extras.trasformaTag
    tags.push(`[trasforma:${dimensione}:${from}→${to}]`)
  }

  if (flags?.needsSeniGake && extras.seniGakeChoice) {
    const { fibra, settore } = extras.seniGakeChoice
    tags.push(`[seni-gake:${fibra}:${settore}]`)
  }

  return tags
}

export function messageDeclaresSurpriseAttack(text: string): boolean {
  return /\[sorpresa:1\]/i.test(text)
}
