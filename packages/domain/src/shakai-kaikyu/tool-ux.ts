import type { SocialClassId } from './types'

export interface SocialToolUxDef {
  readonly classId: SocialClassId
  readonly panelA: string
  readonly panelB?: string
  readonly summary: string
}

/** UX tool per classe — vedi `SHAKAI_KAIKYU_TOOLS_BLUEPRINTS.md`. */
export const SOCIAL_TOOL_UX: readonly SocialToolUxDef[] = [
  {
    classId: 'ishi',
    panelA: 'Cura',
    panelB: 'Preparati',
    summary:
      'Apre scheda bersaglio. Cura scala budget HP giornaliero; Preparati consuma materiali e genera oggetti inventario.',
  },
  {
    classId: 'shokunin',
    panelA: 'Riparazione',
    panelB: 'Costruzione',
    summary:
      'Riparazione scala budget Integrità; Costruzione verifica materiali e crea oggetti con Integrità massima.',
  },
  {
    classId: 'ryoshi',
    panelA: 'Battuta',
    summary:
      'Sceglie zona e catalogo; spende unità Raccolta per estrarre prede/risorse. Prede pericolose possono richiedere scena.',
  },
  {
    classId: 'seijika',
    panelA: 'Registro Patti',
    summary:
      'Patti attivi/spesi/decaduti con Peso e leva. Creazione in gioco + convalida mod. Nessun materiale.',
  },
  {
    classId: 'shisai',
    panelA: 'Reliquiario',
    panelB: 'Fabbricazione',
    summary:
      'Ofuda con Rito e Potere; fabbricazione consuma materiali. Attivazione consuma Ofuda. Vincoli sentiero in fabbricazione.',
  },
] as const

export function getSocialToolUx(classId: SocialClassId): SocialToolUxDef | undefined {
  return SOCIAL_TOOL_UX.find((t) => t.classId === classId)
}
