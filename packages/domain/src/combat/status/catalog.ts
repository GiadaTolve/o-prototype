import type { ElementId, StatusId, StatusKind } from './types'

export interface StatusDefinition {
  id: StatusId
  tag: string
  label: string
  kind: StatusKind
  description: string
  /** Stack di default all'applicazione. */
  defaultStacks: number
  /** Cap stack (Emorragia 5, Euforia illimitato → null). */
  maxStacks: number | null
  /** −1 stack a fine turno PG salvo eccezioni. */
  decaysOnEndOfTurn: boolean
  /** Durata base elementali (turni). */
  baseDurationTurns?: number
  /** Skiru collegata (elementali). */
  linkedSkiruId?: string
  /** Moltiplicatori cumulabili quando attivo. */
  modifiers: Partial<{
    offensiveTierBonus: number
    damageTakenTierBonus: number
    damageMultiplier: number
    rangeMultiplier: number
    csCostMultiplier: number
    csCostMin: number
    blockCsGain: boolean
    blockHealing: boolean
    blockWaza: boolean
    blockAllyBuff: boolean
    movementMultiplier: number
    movementTowardEnemyOnly: boolean
    bonusCsPerTurn: number
    indexBonus: number
    forceLowestSkiruInIndex: boolean
    endOfTurnSelfDamagePerStack: number
    bonusMovementPerTwoStacks: number
    movementPenaltyMeters: number
    bonusOffensiveTierPerFourStacks: number
    tranceOnirica: boolean
    metamorphosisActive: boolean
  }>
}

export const STATUS_DEFINITIONS: Record<StatusId, StatusDefinition> = {
  ira: {
    id: 'ira',
    tag: 'Ira',
    label: 'Ira',
    kind: 'emotional',
    description: 'Furia: danno amplificato ma anche subito; movimento vincolato. Persistente.',
    defaultStacks: 1,
    maxStacks: null,
    decaysOnEndOfTurn: false,
    modifiers: {
      offensiveTierBonus: 1,
      damageTakenTierBonus: 1,
      movementTowardEnemyOnly: true,
    },
  },
  tristezza: {
    id: 'tristezza',
    tag: 'Tristezza',
    label: 'Tristezza',
    kind: 'emotional',
    description: 'Waza più economiche ma deboli; niente potenziamento alleati. Persistente.',
    defaultStacks: 1,
    maxStacks: null,
    decaysOnEndOfTurn: false,
    modifiers: {
      csCostMultiplier: 0.5,
      csCostMin: 1,
      damageMultiplier: 0.5,
      rangeMultiplier: 0.5,
      blockAllyBuff: true,
    },
  },
  disperazione: {
    id: 'disperazione',
    tag: 'Disperazione',
    label: 'Disperazione',
    kind: 'emotional',
    description: 'Waza costose; niente guarigione né guadagno CS. Persistente.',
    defaultStacks: 1,
    maxStacks: null,
    decaysOnEndOfTurn: false,
    modifiers: {
      csCostMultiplier: 2,
      blockCsGain: true,
      blockHealing: true,
    },
  },
  beatitudine: {
    id: 'beatitudine',
    tag: 'Beatitudine',
    label: 'Beatitudine',
    kind: 'emotional',
    description: 'Non decade; movimento ridotto; +1 CS/turno.',
    defaultStacks: 1,
    maxStacks: null,
    decaysOnEndOfTurn: false,
    modifiers: {
      movementMultiplier: 0.5,
      bonusCsPerTurn: 1,
    },
  },
  euforia: {
    id: 'euforia',
    tag: 'Euforia',
    label: 'Euforia',
    kind: 'emotional',
    description: 'Stack su confronto/danno; bonus movimento e tier. Persistente.',
    defaultStacks: 1,
    maxStacks: null,
    decaysOnEndOfTurn: false,
    modifiers: {
      bonusMovementPerTwoStacks: 1,
      bonusOffensiveTierPerFourStacks: 1,
    },
  },
  incendiato: {
    id: 'incendiato',
    tag: 'Incendiato',
    label: 'Incendiato',
    kind: 'elemental',
    description: 'Fuoco — danno persistente; Skiru Kairyoku. Persistente.',
    defaultStacks: 1,
    maxStacks: null,
    decaysOnEndOfTurn: false,
    baseDurationTurns: 3,
    linkedSkiruId: 'kairyoku',
    modifiers: {
      endOfTurnSelfDamagePerStack: 2,
      damageTakenTierBonus: 1,
    },
  },
  sovraccarico: {
    id: 'sovraccarico',
    tag: 'Sovraccarico',
    label: 'Sovraccarico',
    kind: 'elemental',
    description: 'Fulmine — IR penalizzato; Skiru Binshō. Persistente.',
    defaultStacks: 1,
    maxStacks: null,
    decaysOnEndOfTurn: false,
    baseDurationTurns: 3,
    linkedSkiruId: 'hansha',
    modifiers: {
      indexBonus: -2,
    },
  },
  torpore: {
    id: 'torpore',
    tag: 'Torpore',
    label: 'Torpore',
    kind: 'elemental',
    description: 'Acqua — movimento ridotto; Skiru Nintai. Persistente.',
    defaultStacks: 1,
    maxStacks: null,
    decaysOnEndOfTurn: false,
    baseDurationTurns: 3,
    linkedSkiruId: 'nintai',
    modifiers: {
      movementMultiplier: 0.5,
    },
  },
  appesantimento: {
    id: 'appesantimento',
    tag: 'Appesantimento',
    label: 'Appesantimento',
    kind: 'elemental',
    description: 'Gravità — movimento ridotto; Skiru Seishin Tanren. Persistente.',
    defaultStacks: 1,
    maxStacks: null,
    decaysOnEndOfTurn: false,
    baseDurationTurns: 3,
    linkedSkiruId: 'seishin-tanren',
    modifiers: {
      movementMultiplier: 0.75,
    },
  },
  vertigini: {
    id: 'vertigini',
    tag: 'Vertigini',
    label: 'Vertigini',
    kind: 'elemental',
    description: 'Aria — IR penalizzato; Skiru Shakai Kaikyū. Persistente.',
    defaultStacks: 1,
    maxStacks: null,
    decaysOnEndOfTurn: false,
    baseDurationTurns: 3,
    linkedSkiruId: 'shakai-kaikyu',
    modifiers: {
      indexBonus: -1,
    },
  },
  emorragia: {
    id: 'emorragia',
    tag: 'Emorragia',
    label: 'Emorragia',
    kind: 'atypical',
    description: 'Nakigara — 2 danno/turno per stack, cap 5 stack. Persistente: non decade da sola (rimuovere con 1/4 narrativo).',
    defaultStacks: 1,
    maxStacks: 5,
    decaysOnEndOfTurn: false,
    modifiers: {
      endOfTurnSelfDamagePerStack: 2,
    },
  },
  debitore: {
    id: 'debitore',
    tag: 'Debitore',
    label: 'Debitore',
    kind: 'atypical',
    description: 'Madoshō Komonoire — nell\'IR conta la Skiru più bassa tra Fisica e Incanalamento. Persistente.',
    defaultStacks: 1,
    maxStacks: null,
    decaysOnEndOfTurn: false,
    modifiers: {
      forceLowestSkiruInIndex: true,
    },
  },
  debito: {
    id: 'debito',
    tag: 'Debito',
    label: 'Debito (Shakkin)',
    kind: 'atypical',
    description: 'Hadō Shakkin — prestito forzato. Interessi +1/turno del creditore (max 6). Riscossione: 5 danno/stack in 3 m.',
    defaultStacks: 2,
    maxStacks: 6,
    decaysOnEndOfTurn: false,
    modifiers: {
      forceLowestSkiruInIndex: true,
    },
  },
  metamorfosi: {
    id: 'metamorfosi',
    tag: 'Metamorfosi',
    label: 'Metamorfosi',
    kind: 'atypical',
    description: 'Hadō — Atsuryoku e soglie CS (12 CS, Overheat…). Persistente.',
    defaultStacks: 1,
    maxStacks: null,
    decaysOnEndOfTurn: false,
    modifiers: {
      metamorphosisActive: true,
    },
  },
  trance_onirica: {
    id: 'trance_onirica',
    tag: 'Trance Onirica',
    label: 'Trance Onirica',
    kind: 'atypical',
    description: 'Anti-morte narrativa, desiderio, durata 5 turni. Persistente: Master rimuove allo scadere.',
    defaultStacks: 5,
    maxStacks: null,
    decaysOnEndOfTurn: false,
    modifiers: {
      tranceOnirica: true,
    },
  },
  sigillato: {
    id: 'sigillato',
    tag: 'Sigillato',
    label: 'Sigillato (Portafortuna)',
    kind: 'atypical',
    description: 'Impossibile usare Waza finché persiste. Persistente.',
    defaultStacks: 1,
    maxStacks: null,
    decaysOnEndOfTurn: false,
    modifiers: {
      blockWaza: true,
    },
  },
  macchiato: {
    id: 'macchiato',
    tag: 'Macchiato',
    label: 'Macchiato',
    kind: 'atypical',
    description: 'Nessuna Waza; −1 stack per colpo subito con successo.',
    defaultStacks: 1,
    maxStacks: null,
    decaysOnEndOfTurn: false,
    modifiers: {
      blockWaza: true,
    },
  },
  rallentato: {
    id: 'rallentato',
    tag: 'Rallentato',
    label: 'Rallentato',
    kind: 'atypical',
    description: 'Movimento ridotto di 2 m; nessun altro malus (es. Nenmō, zone viscose). Persistente.',
    defaultStacks: 2,
    maxStacks: null,
    decaysOnEndOfTurn: false,
    modifiers: {
      movementPenaltyMeters: 2,
    },
  },
  pressione: {
    id: 'pressione',
    tag: 'Pressione',
    label: 'Pressione',
    kind: 'atypical',
    description:
      'Gōkaon (圧): contatore stile; max 12; non decade in combattimento; perso a fine combattimento.',
    defaultStacks: 1,
    maxStacks: 12,
    decaysOnEndOfTurn: false,
    modifiers: {},
  },
  tensione: {
    id: 'tensione',
    tag: 'Tensione',
    label: 'Tensione',
    kind: 'atypical',
    description:
      'Itō-dō (緊張): fili attivi sul campo; max 8; soglia Cedimento = 2 + Fudōshin; overflow → Emorragia (motore dedicato).',
    defaultStacks: 1,
    maxStacks: 8,
    decaysOnEndOfTurn: false,
    modifiers: {},
  },
}

export const ELEMENTAL_STATUS_BY_ELEMENT: Record<
  ElementId,
  { statusId: StatusId; skiruId: string; label: string }
> = {
  fuoco: { statusId: 'incendiato', skiruId: 'kairyoku', label: 'Fuoco' },
  fulmine: { statusId: 'sovraccarico', skiruId: 'hansha', label: 'Fulmine' },
  acqua: { statusId: 'torpore', skiruId: 'nintai', label: 'Acqua' },
  gravita: { statusId: 'appesantimento', skiruId: 'seishin-tanren', label: 'Gravità' },
  aria: { statusId: 'vertigini', skiruId: 'shakai-kaikyu', label: 'Aria' },
}

const TAG_ALIASES: Record<string, StatusId> = {
  ira: 'ira',
  tristezza: 'tristezza',
  disperazione: 'disperazione',
  beatitudine: 'beatitudine',
  euforia: 'euforia',
  incendiato: 'incendiato',
  sovraccarico: 'sovraccarico',
  torpore: 'torpore',
  appesantimento: 'appesantimento',
  vertigini: 'vertigini',
  emorragia: 'emorragia',
  debitore: 'debitore',
  debito: 'debito',
  metamorfosi: 'metamorfosi',
  'trance onirica': 'trance_onirica',
  trance: 'trance_onirica',
  sigillato: 'sigillato',
  'sigillato (portafortuna)': 'sigillato',
  macchiato: 'macchiato',
  rallentato: 'rallentato',
  pressione: 'pressione',
  'pressione (圧)': 'pressione',
  tensione: 'tensione',
  'tensione (緊張)': 'tensione',
}

function normalizeTag(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function resolveStatusIdFromTag(raw: string): StatusId | null {
  const key = normalizeTag(raw)
  return TAG_ALIASES[key] ?? null
}

export function getStatusDefinition(id: StatusId): StatusDefinition {
  return STATUS_DEFINITIONS[id]
}
