import type { SkiruDef, SkiruDerivedDriver, SokaijuFaceDef } from './types'

export type { SokaijuFaceDef }

/** Ancoraggio corporeo 1 (apice testa) → 11 (pianta del piede). */
export type SokaijuAnchorNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11

export interface SokaijuAnchorDef {
  anchor: SokaijuAnchorNumber
  /** Id catalogo Skiru (unico per ancoraggio). */
  id: string
  /** Titolo narrativo (es. «Il Terzo Occhio»). */
  sectionTitle: string
  /** Etichetta ancoraggio corporeo (UI). */
  bodyAnchor: string
  meiju: SokaijuFaceDef
  shiju: SokaijuFaceDef
  /** Testo lore per l'ancoraggio (Meiju + Shiju). */
  loreBody: string
  /** Suggerimento giocatore («Potenziarlo serve a…»). */
  gameplayHint: string
  /** Formula meccanica (motore). */
  derivedFormula: string
  drivesDerived?: SkiruDerivedDriver[]
}

export const SOKAIJU_INTRO_LORE: readonly string[] = [
  'Ogni Analista porta dentro di sé un albero. Non di legno: di Ego. La Jigo-Ka sgorga da un unico punto in cima al capo — il Terzo Occhio — e da lì scende lungo il corpo, ramificandosi in una serie di nodi che vanno dalla fronte fino alla pianta dei piedi. Ciascun nodo è un punto in cui quell\'energia può essere trattenuta, addensata, resa competenza. Più un nodo è coltivato, più la Jigo-Ka che vi passa attraverso lavora a tuo favore.',
  'L\'albero ha due volti. Lo stesso nodo può fiorire nella sua forma luminosa — il Meiju, l\'Albero della Vita — oppure marcire nella sua ombra gemella — lo Shiju, l\'Albero della Morte. Non sono due alberi diversi: sono la stessa potenza vista da due lati. Ciò che nutre può avvelenare, ciò che costruisce può divorare. Ogni nodo, qui sotto, porta entrambi i nomi.',
  'I nodi sono ancorati al corpo, e si leggono dall\'alto verso il basso — nell\'ordine in cui la Jigo-Ka li attraversa scendendo dal Terzo Occhio.',
] as const

export const SOKAIJU_PLAYING_TIP =
  'In breve, per chi gioca: il Terzo Occhio è la tua sorgente; tutto il resto sono i luoghi del corpo dove quella sorgente diventa una capacità precisa. Potenzia i nodi che parlano al tuo stile — chi picchia coltiva il Fondamento (Kongen), chi costruisce il Regno (Genkai) e la Saggezza (Chikō), chi sostiene la squadra la Misericordia (Jikai), chi vuole colpire per primo la Grazia (Kashin). Ogni nodo ha un lato luminoso e un lato oscuro: la stessa forza, due modi di lasciarla scorrere.'

export const SOKAIJU_ELEMENTALS_INTRO =
  'Chi coltiva la Comprensione sceglie una sola affinità elementale, radicata nella propria storia più che comprata con l\'esperienza. L\'elemento tinge le tecniche e, quando vanno a segno, lascia sul nemico uno status che dura tre turni.'

/** Skiru Sōkaiju che sblocca l'albero (Terzo Occhio) — accademica, non potenziabile con EXP. */
export const SOKAIJU_GATE_SKIRU_ID = 'tenkan'

export const SOKAIJU_BRANCH_DESCRIPTION = SOKAIJU_INTRO_LORE.join(' ')

/** Undici ancoraggi Sōkaiju — una Skiru per nodo, doppio volto Meiju / Shiju. */
export const SOKAIJU_ANCHORS: readonly SokaijuAnchorDef[] = [
  {
    anchor: 1,
    id: 'tenkan',
    sectionTitle: 'Il Terzo Occhio',
    bodyAnchor: 'apice del capo',
    meiju: {
      labelItalian: 'la Corona',
      nameRomaji: 'Tenkan',
      nameJa: '転換',
      treeSphere: 'Keter',
      description: 'La sorgente. Tutta la Jigo-Ka nasce qui e defluisce nel resto dell\'albero.',
    },
    shiju: {
      labelItalian: 'il Mare Morto',
      nameRomaji: 'Shikai',
      nameJa: '死海',
      treeSphere: 'Nehemoth',
      description: 'L\'energia ristagna, si gonfia oltre misura e marcisce, ritorcendosi contro chi l\'ha trattenuta.',
    },
    loreBody:
      'È la sorgente. Tutta la Jigo-Ka di un Analista nasce qui e da qui defluisce nel resto dell\'albero — per questo lo si chiama comunemente il Terzo Occhio. Nella sua forma viva, Tenkan, la Corona si apre e lascia affluire energia in abbondanza: più l\'Analista si concentra e si esprime, più la sorgente zampilla. Ma un\'apertura spinta troppo oltre diventa Shikai, il Mare Morto: l\'energia ristagna, si gonfia oltre misura e marcisce, ritorcendosi contro chi l\'ha trattenuta.',
    gameplayHint:
      'Skiru accademica — non si potenzia con EXP. Simboleggia l\'apertura del Terzo Occhio ed è il prerequisito per coltivare tutti gli altri ancoraggi Sōkaiju. In combattimento si usa con [tenkan] in chat (accumulo CS, non rank).',
    derivedFormula:
      '+3 CS/turno con [tenkan] e azione ≥500 caratteri. Oltre 20 CS: −2 HP/stack a fine turno. Non ha rank investibili.',
    drivesDerived: ['chronoStack'],
  },
  {
    anchor: 2,
    id: 'chiko',
    sectionTitle: 'La Saggezza',
    bodyAnchor: 'tempia sinistra',
    meiju: {
      labelItalian: 'la Luce del Sapere',
      nameRomaji: 'Chikō',
      nameJa: '智光',
      treeSphere: 'Chokmah',
      description: 'La mente che progetta: il nodo di chi tiene molte cose nel mondo contemporaneamente.',
    },
    shiju: {
      labelItalian: 'la Consunzione',
      nameRomaji: 'Muga',
      nameJa: '無我',
      treeSphere: '—',
      description: 'La lucidità si svuota: l\'Analista si dissolve in ciò che ha creato.',
    },
    loreBody:
      'La mente che progetta. Qui la Jigo-Ka prende disegno prima di prendere forma: è il nodo di chi tiene molte cose "scritte" nel mondo contemporaneamente, gestendole con lucidità. Nel suo lato oscuro, Muga, quella lucidità si svuota: l\'Analista perde i propri contorni, si dissolve in ciò che ha creato fino a non distinguersi più.',
    gameplayHint: 'Potenziarlo serve a: creare più costrutti nello stesso momento, e farli più grandi.',
    derivedFormula: 'Costrutti attivi max = 1 + rank. Taglia massima dichiarabile +1 grado ogni 2 rank.',
    drivesDerived: ['maxConstructs'],
  },
  {
    anchor: 3,
    id: 'goju',
    sectionTitle: 'La Comprensione',
    bodyAnchor: 'tempia destra',
    meiju: {
      labelItalian: 'la Comprensione',
      nameRomaji: 'Gojū',
      nameJa: '悟修',
      treeSphere: 'Binah',
      description: 'Comprendere la natura di ciò che ci circonda e piegarla — il nodo degli elementi.',
    },
    shiju: {
      labelItalian: 'le Cose Vane',
      nameRomaji: 'Kyogai',
      nameJa: '虚妄',
      treeSphere: 'Chramazon',
      description: 'La comprensione si perde dietro cose vuote, e la forza si disperde in nulla.',
    },
    loreBody:
      'Comprendere la natura di ciò che ci circonda e piegarla. È il nodo degli elementi: fuoco, fulmine, acqua, gravità, aria. Da esso l\'Analista trae un\'affinità che tinge le sue tecniche e lascia un segno sul nemico. Nel suo lato oscuro, Kyogai, la comprensione si perde dietro cose vuote, e la forza si disperde in nulla.',
    gameplayHint:
      'Potenziarlo serve a: dare al tuo elemento e allo status che infligge (bruciare, sovraccaricare, intorpidire…) più mordente.',
    derivedFormula: 'Waza [Elementale] a segno con affinità attiva → status elementale per 3 turni (auto).',
    drivesDerived: ['elementalStatus'],
  },
  {
    anchor: 4,
    id: 'jikai',
    sectionTitle: 'La Misericordia',
    bodyAnchor: 'gola',
    meiju: {
      labelItalian: 'il Mare di Compassione',
      nameRomaji: 'Jikai',
      nameJa: '慈海',
      treeSphere: 'Chesed',
      description: 'La forza rivolta agli altri per sostenerli — cure e rinforzi.',
    },
    shiju: {
      labelItalian: 'il Tiranno',
      nameRomaji: 'Hegaiō',
      nameJa: '暴君',
      treeSphere: 'Ademmach',
      description: 'La stessa forza smette di aiutare e comincia a costringere: un dono che diventa catena.',
    },
    loreBody:
      'La forza rivolta agli altri per sostenerli. Da questo nodo passano le cure e i rinforzi: curare una ferita, irrobustire un compagno, tenere in piedi chi sta cadendo. Nel suo lato oscuro, Hegaiō, la stessa forza smette di aiutare e comincia a costringere: un dono che diventa catena.',
    gameplayHint: 'Potenziarlo serve a: rendere più forti le tue cure e i tuoi potenziamenti.',
    derivedFormula: 'Cure e buff che applichi: +rank al valore di cura o al bonus del buff.',
    drivesDerived: ['supportPower'],
  },
  {
    anchor: 5,
    id: 'gojin',
    sectionTitle: 'La Giustizia',
    bodyAnchor: 'spalla sinistra',
    meiju: {
      labelItalian: 'la Giustizia Ferma',
      nameRomaji: 'Gōjin',
      nameJa: '剛仁',
      treeSphere: 'Gevurah',
      description: 'Rispondere al colpo con il colpo — il nodo della ritorsione.',
    },
    shiju: {
      labelItalian: "l'Ombra che Offusca",
      nameRomaji: 'Emu',
      nameJa: '翳務',
      treeSphere: 'Gomaliel',
      description: 'La giustizia degenera in accanimento cieco, punizione che non sa più fermarsi.',
    },
    loreBody:
      'Rispondere al colpo con il colpo. È il nodo della ritorsione: chi ti ferisce trova, nella tua risposta, un peso maggiore di quello che si aspettava. Nel suo lato oscuro, Emu, la giustizia degenera in accanimento cieco, punizione che non sa più fermarsi.',
    gameplayHint: 'Potenziarlo serve a: rendere più forti i tuoi contrattacchi — le risposte a chi ti colpisce.',
    derivedFormula: 'Contrattacchi e risposte reattive: +rank danno (oltre al floor Kongen).',
    drivesDerived: ['counterBonus'],
  },
  {
    anchor: 6,
    id: 'kashin',
    sectionTitle: 'La Grazia',
    bodyAnchor: 'spalla destra',
    meiju: {
      labelItalian: 'il Cuore in Fiore',
      nameRomaji: 'Kashin',
      nameJa: '華心',
      treeSphere: 'Tiferet',
      description: 'L\'armonia del gesto — un movimento eseguito con grazia arriva prima.',
    },
    shiju: {
      labelItalian: 'le Ali Avvelenate',
      nameRomaji: 'Dokuyoku',
      nameJa: '毒翼',
      treeSphere: 'Samael',
      description: 'Eleganza che nasconde la lama: bellezza che seduce per avvelenare.',
    },
    loreBody:
      'L\'armonia del gesto. Un movimento eseguito con grazia arriva prima, si insinua nel momento giusto senza sprecarlo. È il nodo di chi sembra sempre un passo avanti. Nel suo lato oscuro, Dokuyoku, quella stessa bellezza seduce per avvelenare: eleganza che nasconde la lama.',
    gameplayHint: 'Potenziarlo serve a: agire prima degli altri quando siete alla pari — essere più svelto sullo scatto.',
    derivedFormula: 'A parità di IR: agisce/risolve prima chi ha rank più alto → poi [Energetiche] → attaccante.',
    drivesDerived: ['initiativeTiebreak'],
  },
  {
    anchor: 7,
    id: 'shodo',
    sectionTitle: 'La Vittoria',
    bodyAnchor: 'plesso solare',
    meiju: {
      labelItalian: 'la Via della Vittoria',
      nameRomaji: 'Shōdō',
      nameJa: '勝道',
      treeSphere: 'Netzach',
      description: 'La costanza che fa durare — status, rinforzi e costrutti reggono più a lungo.',
    },
    shiju: {
      labelItalian: 'il Serpente Scisso',
      nameRomaji: 'Retsuja',
      nameJa: '裂蛇',
      treeSphere: "A'arab Zaraq",
      description: 'La spinta si spezza a metà, e ciò che era stabile comincia a oscillare e a cedere.',
    },
    loreBody:
      'La costanza che fa durare. Ciò che questo nodo sostiene non svanisce in fretta: uno status, un rinforzo, un costrutto reggono più a lungo grazie alla sua tenuta. Nel suo lato oscuro, Retsuja, la spinta si spezza a metà, e ciò che era stabile comincia a oscillare e a cedere.',
    gameplayHint:
      'Potenziarlo serve a: far durare più a lungo i tuoi effetti (status, potenziamenti, costrutti).',
    derivedFormula: 'Effetti a tempo che applichi: +floor(rank / 2) turni di durata.',
    drivesDerived: ['effectDuration'],
  },
  {
    anchor: 8,
    id: 'eiga',
    sectionTitle: 'La Gloria',
    bodyAnchor: 'fianco sinistro',
    meiju: {
      labelItalian: 'la Gloria Elegante',
      nameRomaji: 'Eiga',
      nameJa: '栄雅',
      treeSphere: 'Hod',
      description: 'Toccare le emozioni altrui — paura, ira e altri moti dell\'animo.',
    },
    shiju: {
      labelItalian: 'il Sole Nero',
      nameRomaji: 'Kokuyō',
      nameJa: '黒曜',
      treeSphere: 'Thagirion',
      description: 'Emozione portata all\'eccesso: una luce così intensa da bruciare nera.',
    },
    loreBody:
      'Toccare le emozioni altrui. Da questo nodo l\'Analista instilla paura, ira, e altri moti dell\'animo che piegano il nemico dall\'interno. Nel suo lato oscuro, Kokuyō, l\'emozione è portata all\'eccesso: una luce così intensa da bruciare nera, che travolge senza controllo.',
    gameplayHint: 'Potenziarlo serve a: rendere più pesanti gli status emotivi che infliggi (paura, ira…).',
    derivedFormula: 'Status emotivi che applichi: +floor(rank / 2) stack.',
    drivesDerived: ['emotionalPower'],
  },
  {
    anchor: 9,
    id: 'kongen',
    sectionTitle: 'Il Fondamento',
    bodyAnchor: 'fianco destro',
    meiju: {
      labelItalian: 'la Sorgente',
      nameRomaji: 'Kongen',
      nameJa: '根源',
      treeSphere: 'Yesod',
      description: 'La mole di Jigo-Ka che scorre in te — peso a tutto ciò che fai.',
    },
    shiju: {
      labelItalian: 'il Corno di Guerra',
      nameRomaji: 'Senkaku',
      nameJa: '戦角',
      treeSphere: 'Harab Sarapel',
      description: 'Potenza che si indurisce in pura furia bellica: più devastante, ma cieca.',
    },
    loreBody:
      'La mole di Jigo-Ka che scorre in te. È il nodo che misura quanto sei "pieno" di potere: non riguarda una singola tecnica, ma dà peso a tutto ciò che fai. Più profonda è la sorgente, più forte è ogni tuo colpo. Nel suo lato oscuro, Senkaku, quella potenza si indurisce in pura furia bellica: più devastante, ma cieca.',
    gameplayHint:
      'Potenziarlo serve a: fare più male con ogni singolo colpo. È la tua potenza di base, quella che alza tutto.',
    derivedFormula: 'Floor danno su ogni waza: +round(rank × 1,5).',
    drivesDerived: ['damageFloor'],
  },
  {
    anchor: 10,
    id: 'hikan',
    sectionTitle: 'Il Segreto',
    bodyAnchor: 'ginocchia',
    meiju: {
      labelItalian: "l'Anello Segreto",
      nameRomaji: 'Hikan',
      nameJa: '秘環',
      treeSphere: 'Da\'at',
      description: 'Colpire senza farsi vedere arrivare, aggirando la difesa imprevedibile.',
    },
    shiju: {
      labelItalian: 'i Divoratori',
      nameRomaji: 'Ketchiju',
      nameJa: '喰樹',
      treeSphere: 'Gemchicoth',
      description: 'Il segreto smette di proteggere e comincia a divorare dall\'interno.',
    },
    loreBody:
      'Ciò che resta nascosto. È il nodo di chi colpisce senza farsi vedere arrivare, aggirando la difesa di un nemico che non poteva prevedere il colpo. Nel suo lato oscuro, Ketchiju, il segreto smette di proteggere e comincia a divorare, consumando dall\'interno chi lo custodisce.',
    gameplayHint: 'Potenziarlo serve a: far sì che i tuoi colpi a sorpresa scavalchino la difesa del nemico.',
    derivedFormula:
      'Colpo a sorpresa (bersaglio non poteva percepire): bypass schivata reattiva se rank > Chōkaku bersaglio.',
    drivesDerived: ['surprise'],
  },
  {
    anchor: 11,
    id: 'genkai',
    sectionTitle: 'Il Regno',
    bodyAnchor: 'pianta del piede',
    meiju: {
      labelItalian: 'il Regno',
      nameRomaji: 'Genkai',
      nameJa: '限界',
      treeSphere: 'Malkut',
      description: 'Dare corpo solido alle cose — la Jigo-Ka giunta a terra si fa materia che regge.',
    },
    shiju: {
      labelItalian: 'la Duplice Oscurità',
      nameRomaji: 'Sōmei',
      nameJa: '双冥',
      treeSphere: 'Thaumiel',
      description: 'Ogni cosa reale proietta la sua ombra gemella, e il mondo raddoppia nel buio.',
    },
    loreBody:
      'Dare corpo solido alle cose. È il punto in cui la Jigo-Ka, giunta a terra, si fa materia che regge: quanto sono robusti i costrutti che pianti nel mondo dipende da qui. Nel suo lato oscuro, Sōmei, ogni cosa reale proietta la sua ombra gemella, e il mondo raddoppia nel buio.',
    gameplayHint: 'Potenziarlo serve a: rendere i tuoi costrutti più resistenti, più difficili da distruggere.',
    derivedFormula: 'Resistenza costrutto = (rank + tier waza) × moltiplicatore taglia.',
    drivesDerived: ['constructResistance'],
  },
] as const

const GOJU_ELEMENTAL_ENTRIES: readonly SkiruDef[] = [
  {
    id: 'goju-fuoco',
    name: 'Fuoco',
    nameRomaji: 'Ka',
    nameJa: '火',
    domain: 'jin',
    branchId: 'sokaiju',
    description: 'Lascia il bersaglio Incendiato: continua a bruciare nel tempo.',
    derivedFormula: 'Waza [Elementale] a segno → [Incendiato] per 3 turni.',
    kind: 'standard',
    parentSkiruId: 'goju',
    minParentPoints: 1,
    maxPoints: 1,
    expPurchasable: false,
    sokaijuAnchor: 3,
  },
  {
    id: 'goju-fulmine',
    name: 'Fulmine',
    nameRomaji: 'Kaminari',
    nameJa: '雷',
    domain: 'jin',
    branchId: 'sokaiju',
    description: 'Lascia il bersaglio Sovraccarico: la sua energia si ingorga e si ritorce contro di lui.',
    derivedFormula: 'Waza [Elementale] a segno → [Sovraccarico] per 3 turni.',
    kind: 'standard',
    parentSkiruId: 'goju',
    minParentPoints: 1,
    maxPoints: 1,
    expPurchasable: false,
    sokaijuAnchor: 3,
  },
  {
    id: 'goju-acqua',
    name: 'Acqua',
    nameRomaji: 'Mizu',
    nameJa: '水',
    domain: 'jin',
    branchId: 'sokaiju',
    description: 'Lascia il bersaglio Intorpidito (Torpore): movimenti più lenti e pesanti.',
    derivedFormula: 'Waza [Elementale] a segno → [Torpore] per 3 turni.',
    kind: 'standard',
    parentSkiruId: 'goju',
    minParentPoints: 1,
    maxPoints: 1,
    expPurchasable: false,
    sokaijuAnchor: 3,
  },
  {
    id: 'goju-gravita',
    name: 'Gravità',
    nameRomaji: 'Jūryoku',
    nameJa: '重力',
    domain: 'jin',
    branchId: 'sokaiju',
    description: 'Lascia il bersaglio Appesantito: schiacciato verso il basso, fatica a muoversi.',
    derivedFormula: 'Waza [Elementale] a segno → [Appesantimento] per 3 turni.',
    kind: 'standard',
    parentSkiruId: 'goju',
    minParentPoints: 1,
    maxPoints: 1,
    expPurchasable: false,
    sokaijuAnchor: 3,
  },
  {
    id: 'goju-aria',
    name: 'Aria',
    nameRomaji: 'Kaze',
    nameJa: '風',
    domain: 'jin',
    branchId: 'sokaiju',
    description: 'Lascia il bersaglio con le Vertigini: perde equilibrio e orientamento.',
    derivedFormula: 'Waza [Elementale] a segno → [Vertigini] per 3 turni.',
    kind: 'standard',
    parentSkiruId: 'goju',
    minParentPoints: 1,
    maxPoints: 1,
    expPurchasable: false,
    sokaijuAnchor: 3,
  },
] as const

function formatSokaijuDualName(anchor: SokaijuAnchorDef): string {
  return `${anchor.meiju.nameRomaji}, ${anchor.meiju.labelItalian} · ${anchor.shiju.nameRomaji}, ${anchor.shiju.labelItalian}`
}

function formatSokaijuDualRomaji(anchor: SokaijuAnchorDef): string {
  return `${anchor.meiju.nameRomaji} / ${anchor.shiju.nameRomaji}`
}

function formatSokaijuDualKanji(anchor: SokaijuAnchorDef): string | undefined {
  const parts = [anchor.meiju.nameJa, anchor.shiju.nameJa].filter(Boolean)
  return parts.length > 0 ? parts.join(' / ') : undefined
}

function anchorToSkiruDef(anchor: SokaijuAnchorDef): SkiruDef {
  const isGate = anchor.id === SOKAIJU_GATE_SKIRU_ID
  return {
    id: anchor.id,
    name: formatSokaijuDualName(anchor),
    nameRomaji: formatSokaijuDualRomaji(anchor),
    nameJa: formatSokaijuDualKanji(anchor),
    domain: 'jin',
    branchId: 'sokaiju',
    description: isGate
      ? `${anchor.sectionTitle} — ${anchor.bodyAnchor}. Skiru accademica (apertura del Terzo Occhio).`
      : `${anchor.sectionTitle} — ${anchor.bodyAnchor}.`,
    derivedFormula: anchor.derivedFormula,
    kind: isGate ? 'milestone' : 'standard',
    maxPoints: isGate ? 1 : undefined,
    expPurchasable: isGate ? false : undefined,
    parentSkiruId: isGate ? undefined : SOKAIJU_GATE_SKIRU_ID,
    minParentPoints: isGate ? undefined : 1,
    drivesDerived: anchor.drivesDerived,
    sokaijuAnchor: anchor.anchor,
    sokaijuMeiju: anchor.meiju,
    sokaijuShiju: anchor.shiju,
  }
}

/** Voci catalogo Sōkaiju (11 nodi doppio volto + 5 affinità elementali Gojū). */
export function buildSokaijuCatalogEntries(): SkiruDef[] {
  return [...SOKAIJU_ANCHORS.map(anchorToSkiruDef), ...GOJU_ELEMENTAL_ENTRIES]
}

export function getSokaijuAnchorDef(anchor: number): SokaijuAnchorDef | undefined {
  return SOKAIJU_ANCHORS.find((a) => a.anchor === anchor)
}

export function getSokaijuAnchorBySkiruId(skiruId: string): SokaijuAnchorDef | undefined {
  return SOKAIJU_ANCHORS.find((a) => a.id === skiruId)
}

export function isSokaijuTreeNode(def: Pick<SkiruDef, 'sokaijuAnchor' | 'parentSkiruId'>): boolean {
  return def.sokaijuAnchor != null && !def.parentSkiruId
}
