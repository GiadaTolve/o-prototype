/** Tipologia contratto abitativo. */
export type HousingRentKind = 'daily_deduction' | 'monthly' | 'free'

export interface HousingCatalogDef {
  /** Codice stabile (`housing_types.code`). */
  readonly id: string
  /** Romaji (Kanji), es. "Kontena (コンテナ)". */
  readonly nameRomaji: string
  /** Titolo italiano in vetrina. */
  readonly nameItalian: string
  readonly description: string
  readonly squareMeters: number
  readonly hpBonus: number
  readonly inventorySlotsBonus: number
  readonly rentKind: HousingRentKind
  /** Detrazione giornaliera dallo stipendio (Stanza dell'Ordine). */
  readonly dailyRent?: number
  /** Affitto mensile (pagamento al 15). */
  readonly monthlyRent?: number
  readonly requirements?: { readonly paradisePass?: boolean }
  /** Riepilogo meccanico per card (se omesso, derivato). */
  readonly effectText?: string
}

export function buildHousingEffectText(def: HousingCatalogDef): string {
  if (def.effectText) return def.effectText
  const parts = [`${def.squareMeters} m²`, `+${def.inventorySlotsBonus} slot inventario`]
  if (def.hpBonus > 0) parts.push(`+${def.hpBonus} PF`)
  if (def.rentKind === 'daily_deduction' && def.dailyRent != null) {
    parts.push(`−${def.dailyRent} REM/giorno dallo stipendio`)
  }
  if (def.rentKind === 'monthly' && def.monthlyRent != null) {
    parts.push(`Affitto ${def.monthlyRent} REM/mese`)
  }
  if (def.requirements?.paradisePass) parts.push('Richiede Paradise Pass')
  return parts.join(' · ')
}

export function housingDisplayPriceRem(def: HousingCatalogDef): number | null {
  if (def.rentKind === 'daily_deduction') return def.dailyRent ?? null
  if (def.rentKind === 'monthly') return def.monthlyRent ?? null
  return null
}

/** Catalogo abitazioni Oyasumi — allineato a `seed-housing-types` e tab Immobiliare. */
export const HOUSING_CATALOG: readonly HousingCatalogDef[] = [
  {
    id: 'order_room',
    nameRomaji: 'Ordō no Heya (秩序の部屋)',
    nameItalian: "La Stanza dell'Ordine",
    description:
      'Alloggio minimo assegnato ai membri dell\'Ordine: un cubicolo spoglio ma riconosciuto, con accesso alla chat privata della caserma.',
    squareMeters: 10,
    hpBonus: 0,
    inventorySlotsBonus: 5,
    rentKind: 'daily_deduction',
    dailyRent: 5,
    effectText: '10 m² · +5 slot · Chat casa · −5 REM/giorno dallo stipendio',
  },
  {
    id: 'container',
    nameRomaji: 'Kontena (コンテナ)',
    nameItalian: 'Il Container del Cosmicon',
    description:
      'Modulo abitativo riciclato nel Cosmicon Complex: metallo rangido, tubature a vista, ma spazio sufficiente per chi non chiede lussi.',
    squareMeters: 25,
    hpBonus: 5,
    inventorySlotsBonus: 10,
    rentKind: 'monthly',
    monthlyRent: 100,
    effectText: '25 m² · +10 slot · +5 PF · Chat casa · 100 REM/mese',
  },
  {
    id: 'monolocale',
    nameRomaji: 'Mono-Rūmu (ワンルーム)',
    nameItalian: 'Monolocale a Wall Town',
    description:
      'Unità compatta nei quartieri densi di Wall Town: una stanza, un bagno, e la promessa fragile di una vita quasi normale.',
    squareMeters: 35,
    hpBonus: 5,
    inventorySlotsBonus: 13,
    rentKind: 'monthly',
    monthlyRent: 120,
    effectText: '35 m² · +13 slot · +5 PF · Chat casa · 120 REM/mese',
  },
  {
    id: 'bilocale',
    nameRomaji: 'Ni-Dōkyo (二同居)',
    nameItalian: 'Il Bilocale',
    description:
      'Due ambienti separati per chi vuole dividere sonno e lavoro — o semplicemente nascondere qualcosa agli occhi dei vicini.',
    squareMeters: 45,
    hpBonus: 5,
    inventorySlotsBonus: 15,
    rentKind: 'monthly',
    monthlyRent: 150,
    effectText: '45 m² · +15 slot · +5 PF · Chat casa · 150 REM/mese',
  },
  {
    id: 'cottage',
    nameRomaji: 'Kotage (コテージ)',
    nameItalian: 'Il Cottage',
    description:
      'Piccola casa indipendente ai margini urbani: legno scrostato, giardino stretto, aria che sa ancora di pioggia e terra.',
    squareMeters: 55,
    hpBonus: 10,
    inventorySlotsBonus: 15,
    rentKind: 'monthly',
    monthlyRent: 250,
    effectText: '55 m² · +15 slot · +10 PF · Chat casa · 250 REM/mese',
  },
  {
    id: 'appartamento_borghese',
    nameRomaji: 'Bourgeois Apāto (ブルジョアアパート)',
    nameItalian: "L'Appartamento Borghese",
    description:
      'Residenza signorile nei distretti alti: parquet, doppi vetri e la quiete di chi può permettersi di non scendere in strada.',
    squareMeters: 70,
    hpBonus: 10,
    inventorySlotsBonus: 18,
    rentKind: 'monthly',
    monthlyRent: 280,
    effectText: '70 m² · +18 slot · +10 PF · Chat casa · 280 REM/mese',
  },
  {
    id: 'villa',
    nameRomaji: 'Bessō (別荘)',
    nameItalian: 'La Villa',
    description:
      'Proprietà distesa con più locali e servizi: status, spazio e l\'illusione che il mondo fuori non possa entrare.',
    squareMeters: 85,
    hpBonus: 10,
    inventorySlotsBonus: 20,
    rentKind: 'monthly',
    monthlyRent: 300,
    effectText: '85 m² · +20 slot · +10 PF · Chat casa · 300 REM/mese',
  },
  {
    id: 'proprieta_paradise',
    nameRomaji: 'Paradaisu no Shōzai (パラダイスの邸宅)',
    nameItalian: 'Proprietà nel Paradise',
    description:
      'Residenza esclusiva nel Paradise: architettura onirica, sicurezza assoluta e l\'accesso riservato a chi possiede il Pass.',
    squareMeters: 100,
    hpBonus: 15,
    inventorySlotsBonus: 25,
    rentKind: 'monthly',
    monthlyRent: 400,
    requirements: { paradisePass: true },
    effectText: '100 m² · +25 slot · +15 PF · Chat casa · Paradise Pass · 400 REM/mese',
  },
] as const

const byCode = new Map(HOUSING_CATALOG.map((h) => [h.id, h]))

export function getHousingCatalogDef(code: string): HousingCatalogDef | undefined {
  return byCode.get(code)
}
