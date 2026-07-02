/** Le cinque classi sociali (Shakai Kaikyū). */
export type SocialClassId = 'ishi' | 'shokunin' | 'ryoshi' | 'seijika' | 'shisai'

export type SocialSubclassRole = 'keystone' | 'path' | 'capstone'

/** Tag invisibile per blueprint e tool (es. `#Medico`). */
export type SocialClassTag = '#Medico' | '#Artigiano' | '#Cacciatore' | '#Politico' | '#Sacerdote'

export interface SocialClassDef {
  id: SocialClassId
  /** Id corrispondente in `SKIRU_CATALOG` (ramo `shakai-kaikyu`). */
  skiruId: SocialClassId
  tag: SocialClassTag
  nameItalian: string
  nameRomaji: string
  nameJa?: string
  toolSummary: string
}

export interface SocialSubclassDef {
  id: string
  classId: SocialClassId
  role: SocialSubclassRole
  nameRomaji: string
  nameJa?: string
  /** Titolo italiano (es. «L'Apprendista»). */
  labelItalian: string
  xpCost: number
  description: string
  /** Prerequisiti espliciti (capstone: keystone + un sentiero). */
  prerequisiteIds?: readonly string[]
  /** Limite giornaliero cura HP (Ishi). */
  dailyHealHpMax?: number
  /** Limite giornaliero Integrità oggetti (Shokunin). */
  dailyIntegrityMax?: number
  /** Limite giornaliero unità Raccolta (Ryōshi). */
  dailyGatherMax?: number
  /** Peso massimo Patti attivi (Seijika). */
  pactWeightMax?: number
  /** Numero massimo Patti contemporanei (Seijika). */
  pactActiveMax?: number
  /** Potere massimo Ofuda (Shisai). */
  ofudaPowerMax?: number
  /** Numero massimo Ofuda attivi (Shisai). */
  ofudaActiveMax?: number
  /** Vincoli o trade-off narrativi (contesto formale, ritardo, usura, ecc.). */
  tradeoffs?: string
}

/** Sottoclassi sbloccate su un personaggio. */
export type SocialSubclassSheet = Readonly<Record<string, boolean>>

/** Materiali da crafting / junklist (Shakai Kaikyū). */
export type SocialMaterialId =
  | 'rottame_metallico'
  | 'componente_meccanico'
  | 'componente_fine'
  | 'stoffa'
  | 'cuoio'
  | 'legno'
  | 'carta'
  | 'reagente'
  | 'erba_comune'
  | 'erba_rara'
  | 'carne'
  | 'carne_pregiata'
  | 'frammento_onirico'
  | 'trofeo'
  | 'trofeo_maggiore'

export type SocialBlueprintKind =
  | 'recipe'
  | 'project'
  | 'gather'
  | 'procedure'
  | 'pact_template'
  | 'rite'

export interface SocialMaterialCost {
  readonly materialId: SocialMaterialId
  readonly quantity: number
}

export interface SocialBlueprintDef {
  readonly id: string
  readonly tag: SocialClassTag
  readonly classId: SocialClassId
  /** Sottoclasse che sblocca la voce (keystone/path/capstone). */
  readonly requiredSubclassId: string
  readonly kind: SocialBlueprintKind
  readonly name: string
  readonly description: string
  readonly materials?: readonly SocialMaterialCost[]
  /** Costo in unità Raccolta (Cacciatore). */
  readonly gatherUnits?: number
  /** Consumo budget giornaliero (cura HP o integrità). */
  readonly dailyBudgetCost?: number
  /** Peso Patto (Politico) o Potere Ofuda (Sacerdote). */
  readonly weightOrPower?: number
  /** Richiede input materiali oltre al gather (es. trappole). */
  readonly gatherRequires?: readonly SocialMaterialCost[]
  /** Procedura: non genera oggetto inventario. */
  readonly isProcedure?: boolean
  /** Vincolo sentiero (flag moderazione / UI). */
  readonly pathConstraint?: string
  /** Solo capstone o sottoclasse specifica. */
  readonly exclusiveSubclassIds?: readonly string[]
}
