import { SKIRU_CATALOG } from './catalog'
import { getSkiruPoints, SKIRU_MAX_POINTS } from './progression'
import type { SkiruDomain, SkiruSheet } from './types'

/** Etichette UI domini (Ten / Chi / Jin). */
export const SKIRU_DOMAIN_LABELS: Record<
  SkiruDomain,
  { label: string; labelJa: string; nameItalian?: string; description?: string }
> = {
  ten: {
    label: 'Ten',
    labelJa: '天',
    nameItalian: 'Cielo',
    description: 'Intelletto, capacità di comprensione, visione.',
  },
  chi: {
    label: 'Chi',
    labelJa: '地',
    nameItalian: 'Terra',
    description: 'Fisicità, presenza materiale, perseveranza.',
  },
  jin: {
    label: 'Jin',
    labelJa: '人',
    nameItalian: 'Uomo',
    description: 'Lo spirito: fra volontà e identità.',
  },
}

export interface SkiruDomainIndex {
  domain: SkiruDomain
  label: string
  labelJa: string
  /** Somma punti Skiru standard nel dominio. */
  points: number
  maxPoints: number
  /** 0–100 per radar (punti / max teorico). */
  percent: number
}

export function calculateSkiruDomainIndices(sheet: SkiruSheet): SkiruDomainIndex[] {
  const domains: SkiruDomain[] = ['ten', 'chi', 'jin']

  return domains.map((domain) => {
    const entries = SKIRU_CATALOG.filter(
      (s) => s.domain === domain && s.kind === 'standard',
    )
    const points = entries.reduce((sum, s) => sum + getSkiruPoints(sheet, s.id), 0)
    const maxPoints = entries.length * SKIRU_MAX_POINTS
    const percent = maxPoints > 0 ? Math.round((points / maxPoints) * 100) : 0

    return {
      domain,
      label: SKIRU_DOMAIN_LABELS[domain].label,
      labelJa: SKIRU_DOMAIN_LABELS[domain].labelJa,
      points,
      maxPoints,
      percent,
    }
  })
}

export function skiruDomainIndicesToRadar(data: SkiruDomainIndex[]): {
  ten: number
  chi: number
  jin: number
} {
  const byDomain = Object.fromEntries(data.map((d) => [d.domain, d])) as Partial<
    Record<SkiruDomain, SkiruDomainIndex>
  >
  return {
    ten: byDomain.ten?.percent ?? 0,
    chi: byDomain.chi?.percent ?? 0,
    jin: byDomain.jin?.percent ?? 0,
  }
}
