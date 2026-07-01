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
