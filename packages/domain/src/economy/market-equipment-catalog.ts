import type { EconomyMaterialCost, ItemCategory } from './types'

/** Sottocategoria mercato — armi, protezioni, veicoli, consumabili craft. */
export type MarketEquipmentKind =
  | 'arma_bianca'
  | 'arma_fuoco'
  | 'arma_lancio'
  | 'protezione'
  | 'veicolo'
  | 'consumabile'

export type MarketEquipmentLegacyType = 'WEAPON' | 'ARMOR' | 'GENERIC'

export interface MarketEquipmentDef {
  /** Chiave catalogo stabile (es. `equip-sabimaru`). */
  readonly id: string
  readonly kind: MarketEquipmentKind
  readonly category: ItemCategory
  readonly type: MarketEquipmentLegacyType
  /** Nome trilingue: Romaji (Kanji) — Titolo italiano. */
  readonly name: string
  readonly description: string
  readonly integrityMax?: number
  /** Regole meccaniche brevi (scheda oggetto). */
  readonly effectText: string
  readonly inventorySlotCost: number
  readonly isStackable: boolean
  readonly blueprintId?: string
  readonly craftMaterials?: readonly EconomyMaterialCost[]
}

function tri(jpRomaji: string, kanji: string, italian: string): string {
  return `${jpRomaji} (${kanji}) — ${italian}`
}

/** Catalogo equipaggiamento mercato — 20 armi, 10 protezioni, 5 veicoli (+ Kaen-bin consumabile). */
export const MARKET_EQUIPMENT_CATALOG: readonly MarketEquipmentDef[] = [
  // ─── Armi bianche (8) ───
  {
    id: 'equip-sabimaru',
    kind: 'arma_bianca',
    category: 'equipaggiamento',
    type: 'WEAPON',
    name: tri('Sabimaru', '錆丸', 'La Lama Arrugginita'),
    description:
      'Katana del vecchio mondo, mangiata dalla ruggine ma ancora letale. L\'arma più comune tra chi combatte.',
    integrityMax: 20,
    effectText: 'Arma da mischia',
    inventorySlotCost: 1,
    isStackable: false,
  },
  {
    id: 'equip-kubikiri',
    kind: 'arma_bianca',
    category: 'equipaggiamento',
    type: 'WEAPON',
    name: tri('Kubikiri', '首切り', 'Il Taglia-Colli'),
    description:
      'Mannaia massiccia da macello, riforgiata per la guerra. Lenta, brutale, pesantissima.',
    integrityMax: 30,
    effectText: 'Arma da mischia · richiede Kairiki 3+',
    inventorySlotCost: 2,
    isStackable: false,
  },
  {
    id: 'equip-hotarubi',
    kind: 'arma_bianca',
    category: 'equipaggiamento',
    type: 'WEAPON',
    name: tri('Hotarubi', '蛍火', 'La Lucciola'),
    description:
      'Tantō corto con lama brunita che non riflette la luce. L\'arma del lavoro silenzioso.',
    integrityMax: 15,
    effectText: 'Arma da mischia · +1 Indice nelle azioni furtive',
    inventorySlotCost: 1,
    isStackable: false,
  },
  {
    id: 'equip-onikama',
    kind: 'arma_bianca',
    category: 'equipaggiamento',
    type: 'WEAPON',
    name: tri('Onikama', '鬼鎌', 'La Falce dell\'Orco'),
    description: 'Kusarigama: falce con catena zavorrata.',
    integrityMax: 20,
    effectText: 'Portata 3 m · può agganciare arti o armi',
    inventorySlotCost: 1,
    isStackable: false,
  },
  {
    id: 'equip-yarinobori',
    kind: 'arma_bianca',
    category: 'equipaggiamento',
    type: 'WEAPON',
    name: tri('Yarinobori', '槍昇り', 'La Lancia Ascendente'),
    description: 'Yari da fanteria con asta in metallo recuperato.',
    integrityMax: 25,
    effectText: 'Chi la impugna ingaggia a 2 m',
    inventorySlotCost: 1,
    isStackable: false,
  },
  {
    id: 'equip-kanabo-namida',
    kind: 'arma_bianca',
    category: 'equipaggiamento',
    type: 'WEAPON',
    name: tri('Kanabō no Namida', '金棒の涙', 'La Lacrima del Demone'),
    description: 'Mazza kanabō tempestata di bulloni e chiodi industriali.',
    integrityMax: 30,
    effectText: 'Ignora 2 Scudo del bersaglio · richiede Kairiki 4+',
    inventorySlotCost: 2,
    isStackable: false,
  },
  {
    id: 'equip-kagenui-hari',
    kind: 'arma_bianca',
    category: 'equipaggiamento',
    type: 'WEAPON',
    name: tri('Kagenui no Hari', '影縫いの針', 'L\'Ago Cuci-Ombre'),
    description: 'Stiletto sottilissimo ricavato da un raggio di bicicletta temprato. Quasi invisibile in mano.',
    integrityMax: 10,
    effectText: 'Non rilevabile nelle perquisizioni sommarie',
    inventorySlotCost: 1,
    isStackable: false,
  },
  {
    id: 'equip-nokogiri-to',
    kind: 'arma_bianca',
    category: 'equipaggiamento',
    type: 'WEAPON',
    name: tri('Nokogiri-tō', '鋸刀', 'La Spada-Sega'),
    description: 'Lama dentata ricavata da una sega industriale.',
    integrityMax: 20,
    effectText: 'Ferite curate dal medico a costo doppio',
    inventorySlotCost: 1,
    isStackable: false,
  },

  // ─── Armi da fuoco (7) ───
  {
    id: 'equip-tanuki-me',
    kind: 'arma_fuoco',
    category: 'equipaggiamento',
    type: 'WEAPON',
    name: tri('Tanuki no Me', '狸の目', 'L\'Occhio del Tanuki'),
    description: 'Revolver del vecchio mondo, tamburo da 6, affidabile anche sporco.',
    integrityMax: 20,
    effectText: 'Arma da fuoco · tamburo 6 colpi',
    inventorySlotCost: 1,
    isStackable: false,
  },
  {
    id: 'equip-kaminari-tsutsu',
    kind: 'arma_fuoco',
    category: 'equipaggiamento',
    type: 'WEAPON',
    name: tri('Kaminari-tsutsu', '雷筒', 'Il Tubo del Tuono'),
    description: 'Fucile a canna liscia artigianale, canna ricavata da tubatura idraulica.',
    integrityMax: 15,
    effectText: 'Devastante entro 10 m · inutile oltre',
    inventorySlotCost: 2,
    isStackable: false,
  },
  {
    id: 'equip-shinigami-yubi',
    kind: 'arma_fuoco',
    category: 'equipaggiamento',
    type: 'WEAPON',
    name: tri('Shinigami no Yubi', '死神の指', 'Il Dito dello Shinigami'),
    description: 'Fucile a otturatore con ottica di fortuna. Un colpo, lungo da ricaricare.',
    integrityMax: 20,
    effectText: 'Colpo singolo · ricarica 1 quarto',
    inventorySlotCost: 2,
    isStackable: false,
  },
  {
    id: 'equip-hachi-su',
    kind: 'arma_fuoco',
    category: 'equipaggiamento',
    type: 'WEAPON',
    name: tri('Hachi no Su', '蜂の巣', 'Il Nido di Vespe'),
    description: 'Pistola mitragliatrice recuperata, inceppamenti frequenti.',
    integrityMax: 15,
    effectText: 'Raffica: 2 attacchi/quarto · inceppamento possibile (1 quarto)',
    inventorySlotCost: 2,
    isStackable: false,
  },
  {
    id: 'equip-karasu-uchi',
    kind: 'arma_fuoco',
    category: 'equipaggiamento',
    type: 'WEAPON',
    name: tri('Karasu-uchi', '烏撃ち', 'Lo Scaccia-Corvi'),
    description: 'Doppietta a canne mozze da contadino.',
    integrityMax: 20,
    effectText: 'Due colpi · poi ricarica',
    inventorySlotCost: 1,
    isStackable: false,
  },
  {
    id: 'equip-yumihari',
    kind: 'arma_fuoco',
    category: 'equipaggiamento',
    type: 'WEAPON',
    name: tri('Yumihari', '弓張り', 'L\'Arco Teso'),
    description: 'Balestra pesante con verricello, silenziosa e riutilizzabile — i dardi si recuperano.',
    integrityMax: 20,
    effectText: 'Balestra · ricarica 1 quarto · dardi recuperabili',
    inventorySlotCost: 2,
    isStackable: false,
  },
  {
    id: 'equip-hinawa',
    kind: 'arma_fuoco',
    category: 'equipaggiamento',
    type: 'WEAPON',
    name: tri('Hinawa', '火縄', 'La Miccia'),
    description: 'Pistola a colpo singolo di fabbricazione artigianale (Kajishi), stile tanegashima.',
    integrityMax: 10,
    effectText: 'Colpo singolo · ricarica 1 quarto · dopo lo sparo la posizione è nota a tutti',
    inventorySlotCost: 1,
    isStackable: false,
  },

  // ─── Armi da lancio (4 equip + 1 consumabile) ───
  {
    id: 'equip-tsubute',
    kind: 'arma_lancio',
    category: 'equipaggiamento',
    type: 'WEAPON',
    name: tri('Tsubute', '礫', 'I Sassi del Silenzio'),
    description: 'Set di 6 pesi metallici da lancio, riutilizzabili.',
    integrityMax: 10,
    effectText: 'Danno basso · zero rumore · set da 6',
    inventorySlotCost: 1,
    isStackable: false,
  },
  {
    id: 'consumable-kaen-bin',
    kind: 'consumabile',
    category: 'consumabile',
    type: 'GENERIC',
    name: tri('Kaen-bin', '火炎瓶', 'La Bottiglia di Fiamma'),
    description: 'Molotov artigianale. Consumabile.',
    effectText: 'Area 2 m in fiamme per 2 turni · danno da fuoco a chi attraversa',
    inventorySlotCost: 1,
    isStackable: true,
    blueprintId: 'artigiano-kaen-bin',
    craftMaterials: [
      { materialId: 'reagente', quantity: 1 },
      { materialId: 'stoffa', quantity: 1 },
    ],
  },
  {
    id: 'equip-kugi-shuriken',
    kind: 'arma_lancio',
    category: 'equipaggiamento',
    type: 'WEAPON',
    name: tri('Kugi-shuriken', '釘手裏剣', 'Le Stelle di Chiodi'),
    description: 'Shuriken saldati da chiodi da cantiere.',
    integrityMax: 10,
    effectText: 'Set da 8 · metà recuperabile dopo l\'uso',
    inventorySlotCost: 1,
    isStackable: false,
  },
  {
    id: 'equip-doku-fukiya',
    kind: 'arma_lancio',
    category: 'equipaggiamento',
    type: 'WEAPON',
    name: tri('Doku-fukiya', '毒吹き矢', 'La Cerbottana Avvelenata'),
    description: 'Cerbottana in canna di bambù + dardi.',
    integrityMax: 10,
    effectText: 'Danno irrisorio · i dardi accettano veleni Yakushi',
    inventorySlotCost: 1,
    isStackable: false,
  },
  {
    id: 'equip-kusari-tama',
    kind: 'arma_lancio',
    category: 'equipaggiamento',
    type: 'WEAPON',
    name: tri('Kusari-tama', '鎖玉', 'La Sfera Incatenata'),
    description: 'Bolas di catene e pesi.',
    integrityMax: 15,
    effectText: 'Immobilizza le gambe (1 turno o confronto per liberarsi)',
    inventorySlotCost: 1,
    isStackable: false,
  },

  // ─── Protezioni (10) ───
  {
    id: 'equip-boro-yoroi',
    kind: 'protezione',
    category: 'equipaggiamento',
    type: 'ARMOR',
    name: tri('Boro no Yoroi', '襤褸の鎧', 'L\'Armatura di Stracci'),
    description: 'Strati di stoffa pressata e cucita. La protezione dei disperati.',
    integrityMax: 10,
    effectText: 'Scudo 4 (T1)',
    inventorySlotCost: 1,
    isStackable: false,
  },
  {
    id: 'equip-kawa-dogi',
    kind: 'protezione',
    category: 'equipaggiamento',
    type: 'ARMOR',
    name: tri('Kawa-dōgi', '革胴着', 'Il Corpetto di Cuoio'),
    description: 'Giubbotto in cuoio trattato, silenzioso e flessibile.',
    integrityMax: 15,
    effectText: 'Scudo 4 (T1) · nessuna penalità',
    inventorySlotCost: 1,
    isStackable: false,
  },
  {
    id: 'equip-teppan-do',
    kind: 'protezione',
    category: 'equipaggiamento',
    type: 'ARMOR',
    name: tri('Teppan-dō', '鉄板胴', 'Il Busto di Lamiera'),
    description: 'Corazza battuta da segnaletica stradale e lamiere d\'auto.',
    integrityMax: 20,
    effectText: 'Scudo 8 (T2) · −1 m Movimento',
    inventorySlotCost: 2,
    isStackable: false,
  },
  {
    id: 'equip-taiya-kata',
    kind: 'protezione',
    category: 'equipaggiamento',
    type: 'ARMOR',
    name: tri('Taiya no Kata', 'タイヤの肩', 'Le Spalle di Gomma'),
    description: 'Spallacci ricavati da pneumatici.',
    integrityMax: 15,
    effectText: 'Scudo 4 (T1) · +2 Scudo extra contro armi da botta',
    inventorySlotCost: 1,
    isStackable: false,
  },
  {
    id: 'equip-mushi-karada',
    kind: 'protezione',
    category: 'equipaggiamento',
    type: 'ARMOR',
    name: tri('Mushi no Karada', '蟲の体', 'Il Corpo d\'Insetto'),
    description: 'Armatura completa a piastre sovrapposte, sagomata come un carapace.',
    integrityMax: 30,
    effectText: 'Scudo 12 (T3) · −2 m Movimento · richiede Kairiki 3+',
    inventorySlotCost: 3,
    isStackable: false,
  },
  {
    id: 'equip-mempo-namida',
    kind: 'protezione',
    category: 'equipaggiamento',
    type: 'ARMOR',
    name: tri('Menpō no Namida', '面頬の涙', 'La Maschera che Piange'),
    description: 'Mezza maschera in metallo con colature di stagno simili a lacrime.',
    integrityMax: 10,
    effectText: 'Protegge il volto: attacchi mirati alla testa perdono il bonus',
    inventorySlotCost: 1,
    isStackable: false,
  },
  {
    id: 'equip-kasa-tate',
    kind: 'protezione',
    category: 'equipaggiamento',
    type: 'ARMOR',
    name: tri('Kasa no Tate', '傘の盾', 'L\'Ombrello-Scudo'),
    description: 'Ombrello rinforzato in lamina d\'acciaio, si apre in scudo.',
    integrityMax: 15,
    effectText: 'Scudo 8 (T2) solo se aperto e impugnato',
    inventorySlotCost: 1,
    isStackable: false,
  },
  {
    id: 'equip-jizo-sei',
    kind: 'protezione',
    category: 'equipaggiamento',
    type: 'ARMOR',
    name: tri('Jizō no Sei', '地蔵の背', 'La Schiena del Jizō'),
    description: 'Scudo dorsale in pietra composita, scolpito come una statuina votiva.',
    integrityMax: 20,
    effectText: 'Scudo 8 (T2) solo dai colpi alle spalle · annulla bonus sorpresa se fugge',
    inventorySlotCost: 2,
    isStackable: false,
  },
  {
    id: 'equip-kegawa-gaito',
    kind: 'protezione',
    category: 'equipaggiamento',
    type: 'ARMOR',
    name: tri('Kegawa no Gaitō', '毛皮の外套', 'Il Mantello di Pelliccia'),
    description: 'Mantello in pelli di preda pregiata (materiale da Kōya no Ryōshi).',
    integrityMax: 15,
    effectText: 'Scudo 4 (T1) · immunità penalità da freddo',
    inventorySlotCost: 1,
    isStackable: false,
  },
  {
    id: 'equip-ofuda-kote',
    kind: 'protezione',
    category: 'equipaggiamento',
    type: 'ARMOR',
    name: tri('Ofuda-kote', '御札籠手', 'I Bracciali Sigillati'),
    description:
      'Bracciali in cuoio coperti di Ofuda esauriti cuciti a strati. Richiede Artigiano + Sacerdote per la costruzione.',
    integrityMax: 15,
    effectText:
      'Scudo 4 (T1) · 1/scena annulla 1 attacco onirico (Kyōfu/Kizu), poi −5 Integrità',
    inventorySlotCost: 1,
    isStackable: false,
  },

  // ─── Veicoli (5) ───
  {
    id: 'equip-tetsuba',
    kind: 'veicolo',
    category: 'equipaggiamento',
    type: 'GENERIC',
    name: tri('Tetsuba', '鉄馬', 'Il Cavallo di Ferro'),
    description: 'Moto da enduro del vecchio mondo, rimessa in vita da un Karakurishi.',
    integrityMax: 30,
    effectText: 'Movimento ×4 · 1 persona (2 strette) · consuma carburante',
    inventorySlotCost: 3,
    isStackable: false,
  },
  {
    id: 'equip-yon-ashi',
    kind: 'veicolo',
    category: 'equipaggiamento',
    type: 'GENERIC',
    name: tri('Yon-ashi', '四脚', 'Il Quattro-Zampe'),
    description: 'Quad da lavoro con pianale di carico.',
    integrityMax: 35,
    effectText: 'Movimento ×3 · 2 persone + 4 slot inventario · consuma carburante',
    inventorySlotCost: 4,
    isStackable: false,
  },
  {
    id: 'equip-yoru-tomo',
    kind: 'veicolo',
    category: 'equipaggiamento',
    type: 'GENERIC',
    name: tri('Yoru no Tomo', '夜の友', 'L\'Amico della Notte'),
    description:
      'Cavallo da sella, razza sopravvissuta e riaddomesticata. Creatura: lo cura il medico, non l\'artigiano.',
    integrityMax: 25,
    effectText:
      'Movimento ×3 · 1 persona + 2 slot · HP 25 · 1 Erba comune/giorno · spavento onirico (Fudōshin)',
    inventorySlotCost: 3,
    isStackable: false,
  },
  {
    id: 'equip-niguruma',
    kind: 'veicolo',
    category: 'equipaggiamento',
    type: 'GENERIC',
    name: tri('Niguruma', '荷車', 'Il Carro del Viandante'),
    description: 'Carretto a traino (umano o animale).',
    integrityMax: 25,
    effectText: 'Movimento ×1 a mano, ×2 con Yoru no Tomo · +10 slot inventario',
    inventorySlotCost: 5,
    isStackable: false,
  },
  {
    id: 'equip-sabi-guruma',
    kind: 'veicolo',
    category: 'equipaggiamento',
    type: 'GENERIC',
    name: tri('Sabi-guruma', '錆車', 'La Carcassa che Cammina'),
    description: 'Furgone del vecchio mondo tenuto insieme da saldature e preghiere.',
    integrityMax: 40,
    effectText:
      'Movimento ×3 · 4 persone + 8 slot · molto carburante · avvio incerto (1 quarto, Karakurishi/Shokunin)',
    inventorySlotCost: 5,
    isStackable: false,
  },
] as const

const catalogById = new Map(MARKET_EQUIPMENT_CATALOG.map((e) => [e.id, e]))

export function getMarketEquipmentDef(id: string): MarketEquipmentDef | undefined {
  return catalogById.get(id)
}

export function marketEquipmentByKind(
  kind: MarketEquipmentKind,
): readonly MarketEquipmentDef[] {
  return MARKET_EQUIPMENT_CATALOG.filter((e) => e.kind === kind)
}
