import { buildSokaijuCatalogEntries, SOKAIJU_BRANCH_DESCRIPTION } from './sokaiju-index'
import { buildJinElementiCatalogEntries, JIN_ELEMENTI_BRANCH } from './jin-elementi-catalog'
import type { SkiruBranchDef, SkiruDef } from './types'

/** Rami Skiru per dominio (UltimateManual). */
export const SKIRU_BRANCHES: readonly SkiruBranchDef[] = [
  { id: 'shakai-kaikyu', label: 'Classe Sociale', labelRomaji: 'Shakai Kaikyū', labelJa: '社会階級', domain: 'ten', description:
      "Il ruolo occupato dall'individuo all'interno della società e il percorso professionale che ne ha plasmato competenze, conoscenze e relazioni." },
  { id: 'seishin-tanren', label: 'Disciplina Mentale', labelRomaji: 'Seishin Tanren', labelJa: '精神鍛錬', domain: 'ten', description:
      "L'addestramento della mente e della volontà. Comprende lucidità, concentrazione, autocontrollo e resistenza alle influenze esterne." },
  { id: 'toso', label: 'Combattimento', labelRomaji: 'Tōsō', labelJa: '闘争', domain: 'chi', description:
      'Tōsō è il ramo del conflitto fisico diretto: qui scegli una specialità — lame, armi da fuoco o corpo a corpo — e ne aumenti l\'Indice di Riuscita (+1 per punto sulla maestria scelta). Ogni via apre passive acquistabili (ambidestria, arma o tecnica dichiarata, colpi doppi) che definiscono lo stile e le opzioni del tuo combattente in scena.' },
  { id: 'binsho', label: 'Agilità', labelRomaji: 'Binshō', labelJa: '敏捷', domain: 'chi', description:
      'Binshō misura l\'agilità corporea: quanto lontano ti sposti in un quarto d\'azione, quanto in fretta reagisci agli stimoli e quanto controllo fine hai su gesti, equilibrio e posizione. È il ramo da investire per inseguimenti, schivate, acrobazie e prove che premiano velocità e destrezza.' },
  { id: 'nintai', label: 'Tempra', labelRomaji: 'Nintai', labelJa: '忍耐', domain: 'chi', description:
      'Nintai misura la tempra fisica: resistenza a veleni e ambienti ostili, tolleranza al dolore e alla ferita, e volontà di spingere il corpo oltre la stanchezza. È il ramo da investire per restare in piedi più a lungo — Dokusei e Konjō aumentano gli HP massimi, Itami mitiga il danno che subisci dopo lo Scudo.' },
  { id: 'kairyoku', label: 'Vigore', labelRomaji: 'Kairyoku', labelJa: '怪力', domain: 'chi', description:
      'Kairyoku misura la forza bruta applicata al mondo fisico: esplosività del gesto, capacità di sollevare e rompere, pressione che piega la resistenza altrui. È il ramo da investire per imporre il proprio peso in combattimento, nelle prese e nelle prove che premiano potenza pura.' },
  {
    id: 'shinka-no-nagare',
    label: 'Libero Flusso',
    labelRomaji: 'Shinka no Nagare',
    labelJa: '進化の流れ',
    domain: 'jin',
    description:
      'La capacità di prendere controllo del flusso del proprio Ego, stabilizzandolo e rendendolo utilizzabile come energia attiva. È la base di ogni tecnica spirituale e di incanalamento.',
  },
  {
    id: 'sokaiju',
    label: 'Il Doppio Albero dei Mondi',
    labelRomaji: 'Sōkaiju',
    labelJa: '双界樹',
    domain: 'jin',
    description: SOKAIJU_BRANCH_DESCRIPTION,
  },
  JIN_ELEMENTI_BRANCH,
  {
    id: 'jiga-no-shihaisha',
    label: "Padrone dell'Io",
    labelRomaji: 'Jiga no Shihaisha',
    labelJa: '自我の支配者',
    domain: 'jin',
    description:
      'Dominio completo di una singola scuola di Waza. Il praticante raggiunge una perfetta sintonia con una sola via tecnica, ottenendo un potenziamento permanente delle sue tecniche. Può essere scelto una sola volta e richiede approvazione narrativa (non si può acquistare, viene inserito in scheda dalla moderazione).',
  },
] as const

/** Catalogo completo Skiru (UltimateManual). */
export const SKIRU_CATALOG: readonly SkiruDef[] = [
  // ─── Ten · Shakai Kaikyū ───
  {
    id: 'ishi',
    name: 'Medico',
    nameRomaji: 'Ishi',
    nameJa: '医師',
    domain: 'ten',
    branchId: 'shakai-kaikyu',
    description:
      'Colui che studia il corpo e le sue afflizioni. Un punto sblocca la classe sociale Medico (#Medico) e la tool dedicata; non è potenziabile oltre.',
    kind: 'standard',
    maxPoints: 1,
  },
  {
    id: 'shokunin',
    name: 'Artigiano',
    nameRomaji: 'Shokunin',
    nameJa: '職人',
    domain: 'ten',
    branchId: 'shakai-kaikyu',
    description:
      'Maestro della creazione e della lavorazione. Un punto sblocca la classe sociale Artigiano (#Artigiano) e la tool dedicata; non è potenziabile oltre.',
    kind: 'standard',
    maxPoints: 1,
  },
  {
    id: 'ryoshi',
    name: 'Cacciatore',
    nameRomaji: 'Ryōshi',
    nameJa: '猟師',
    domain: 'ten',
    branchId: 'shakai-kaikyu',
    description:
      'Esperto della natura e della sopravvivenza. Un punto sblocca la classe sociale Cacciatore (#Cacciatore) e la tool dedicata; non è potenziabile oltre.',
    kind: 'standard',
    maxPoints: 1,
  },
  {
    id: 'seijika',
    name: 'Politico',
    nameRomaji: 'Seijika',
    nameJa: '政治家',
    domain: 'ten',
    branchId: 'shakai-kaikyu',
    description:
      'Abile nelle relazioni sociali e nelle dinamiche di potere. Un punto sblocca la classe sociale Politico (#Politico) e la tool dedicata; non è potenziabile oltre.',
    kind: 'standard',
    maxPoints: 1,
  },
  {
    id: 'shisai',
    name: 'Sacerdote',
    nameRomaji: 'Shisai',
    nameJa: '司祭',
    domain: 'ten',
    branchId: 'shakai-kaikyu',
    description:
      'Custode di tradizioni, culti e pratiche spirituali. Un punto sblocca la classe sociale Sacerdote (#Sacerdote) e la tool dedicata; non è potenziabile oltre.',
    kind: 'standard',
    maxPoints: 1,
  },

  // ─── Ten · Seishin Tanren ───
  {
    id: 'fudoshin',
    name: 'Fermezza',
    nameRomaji: 'Fudōshin',
    nameJa: '不動心',
    domain: 'ten',
    branchId: 'seishin-tanren',
    description:
      'La capacità di mantenere lucidità e autocontrollo di fronte a paura, provocazioni, manipolazione e pressioni emotive.',
    kind: 'standard',
  },
  {
    id: 'kansatsu',
    name: 'Osservazione',
    nameRomaji: 'Kansatsu',
    nameJa: '観察',
    domain: 'ten',
    branchId: 'seishin-tanren',
    description:
      "L'abilità di cogliere dettagli, anomalie e informazioni nascoste nell'ambiente circostante.",
    kind: 'standard',
  },
  {
    id: 'chokaku',
    name: 'Percezione Superiore',
    nameRomaji: 'Chōkaku',
    nameJa: '超覚',
    domain: 'ten',
    branchId: 'seishin-tanren',
    description:
      'La capacità di cogliere ciò che sfugge ai sensi ordinari, percependo sogni, presagi, energie e fenomeni nascosti.',
    kind: 'standard',
  },

  // ─── Chi · Tōsō ───
  {
    id: 'kensei',
    name: 'Maestro delle Lame',
    nameRomaji: 'Kensei',
    nameJa: '剣聖',
    domain: 'chi',
    branchId: 'toso',
    description:
      'Hai consacrato la tua vita allo studio delle armi da taglio. Le tue tecniche sono precise, letali e affinate da innumerevoli battaglie.',
    derivedFormula: '+1 Indice di Riuscita per punto investito.',
    kind: 'standard',
  },
  {
    id: 'jusei',
    name: 'Maestro delle Armi da Fuoco',
    nameRomaji: 'Jūsei',
    nameJa: '銃聖',
    domain: 'chi',
    branchId: 'toso',
    description:
      'Pochi possono eguagliare la tua mira e il tuo sangue freddo. Ogni colpo è calcolato, ogni proiettile una sentenza.',
    derivedFormula: '+1 Indice di Riuscita per punto investito.',
    kind: 'standard',
  },
  {
    id: 'kenka-o',
    name: 'Re della Rissa',
    nameRomaji: 'Kenka-Ō',
    nameJa: '喧嘩王',
    domain: 'chi',
    branchId: 'toso',
    description:
      'Il combattimento corpo a corpo è il tuo regno. Pugni, gomitate, prese e colpi improvvisati diventano strumenti di dominio assoluto.',
    derivedFormula: '+1 Indice di Riuscita per punto investito.',
    kind: 'standard',
  },
  {
    id: 'kensei-ambidestria',
    name: 'Ambidestria · Lame',
    domain: 'chi',
    branchId: 'toso',
    description:
      'Facoltà di usare entrambe le braccia con la stessa efficacia in combattimento con lame.',
    kind: 'standard',
    parentSkiruId: 'kensei',
    minParentPoints: 1,
    maxPoints: 1,
  },
  {
    id: 'kensei-arma-favorita',
    name: 'Arma Favorita · Lame',
    domain: 'chi',
    branchId: 'toso',
    description:
      "L'utilizzatore dichiara un'arma specifica all'acquisizione della Skiru.",
    derivedFormula: '+10% Danno con arma dichiarata.',
    kind: 'standard',
    parentSkiruId: 'kensei',
    minParentPoints: 1,
    maxPoints: 1,
  },
  {
    id: 'kensei-doppio-colpo',
    name: 'Doppio Colpo · Lame',
    domain: 'chi',
    branchId: 'toso',
    description:
      "Permette due colpi fisici in rapida successione nello stesso quarto. Non utilizzabile con Waza. Richiede Ambidestria.",
    kind: 'standard',
    parentSkiruId: 'kensei',
    minParentPoints: 1,
    maxPoints: 1,
  },
  {
    id: 'jusei-ambidestria',
    name: 'Ambidestria · Fuoco',
    domain: 'chi',
    branchId: 'toso',
    description:
      'Facoltà di usare entrambe le braccia con la stessa efficacia con armi da fuoco.',
    kind: 'standard',
    parentSkiruId: 'jusei',
    minParentPoints: 1,
    maxPoints: 1,
  },
  {
    id: 'jusei-arma-favorita',
    name: 'Arma Favorita · Fuoco',
    domain: 'chi',
    branchId: 'toso',
    description:
      "L'utilizzatore dichiara un'arma da fuoco specifica all'acquisizione della Skiru.",
    derivedFormula: '+10% Danno con arma dichiarata.',
    kind: 'standard',
    parentSkiruId: 'jusei',
    minParentPoints: 1,
    maxPoints: 1,
  },
  {
    id: 'jusei-doppio-colpo',
    name: 'Doppio Colpo · Fuoco',
    domain: 'chi',
    branchId: 'toso',
    description:
      'Permette due colpi fisici in rapida successione nello stesso quarto. Non utilizzabile con Waza. Richiede Ambidestria.',
    kind: 'standard',
    parentSkiruId: 'jusei',
    minParentPoints: 1,
    maxPoints: 1,
  },
  {
    id: 'kenka-o-ambidestria',
    name: 'Ambidestria · Rissa',
    domain: 'chi',
    branchId: 'toso',
    description:
      'Facoltà di usare entrambe le braccia con la stessa efficacia nel corpo a corpo.',
    kind: 'standard',
    parentSkiruId: 'kenka-o',
    minParentPoints: 1,
    maxPoints: 1,
  },
  {
    id: 'kenka-o-tecnica-perfetta',
    name: 'Tecnica Perfetta',
    domain: 'chi',
    branchId: 'toso',
    description:
      "L'utilizzatore dichiara una tecnica specifica all'acquisizione della Skiru.",
    derivedFormula: '+10% Danno con tecnica dichiarata.',
    kind: 'standard',
    parentSkiruId: 'kenka-o',
    minParentPoints: 1,
    maxPoints: 1,
  },
  {
    id: 'kenka-o-doppio-colpo',
    name: 'Doppio Colpo · Rissa',
    domain: 'chi',
    branchId: 'toso',
    description:
      'Permette due colpi fisici in rapida successione nello stesso quarto. Non utilizzabile con Waza. Richiede Ambidestria.',
    kind: 'standard',
    parentSkiruId: 'kenka-o',
    minParentPoints: 1,
    maxPoints: 1,
  },

  // ─── Chi · Binshō ───
  {
    id: 'undo',
    name: 'Movimento',
    nameRomaji: 'Undō',
    nameJa: '運動',
    domain: 'chi',
    branchId: 'binsho',
    description:
      'La capacità di spostarsi con velocità, equilibrio e controllo. Comprende corsa, acrobazia, arrampicata e mobilità generale.',
    derivedFormula:
      'Ogni punto: +1,5 m di movimento per quarto d\'azione. Base 2 m; totale 2 + 1,5 × punti Undō.',
    kind: 'standard',
    drivesDerived: ['movement'],
  },
  {
    id: 'hansha',
    name: 'Riflessi',
    nameRomaji: 'Hansha',
    nameJa: '反射',
    domain: 'chi',
    branchId: 'binsho',
    description:
      'La rapidità di reazione agli stimoli esterni. Determina schivate, tempi di risposta e capacità di cogliere opportunità improvvise.',
    kind: 'standard',
  },
  {
    id: 'seimitsu',
    name: 'Precisione',
    nameRomaji: 'Seimitsu',
    nameJa: '精密',
    domain: 'chi',
    branchId: 'binsho',
    description:
      'Vertice per armi da fuoco e armi bianche: misura precisione ed efficacia dei colpi con arma.',
    derivedFormula:
      '+1 CAD per punto investito.',
    kind: 'standard',
    drivesDerived: ['cad'],
  },

  // ─── Chi · Nintai ───
  {
    id: 'dokusei',
    name: 'Robustezza',
    nameRomaji: 'Dokusei',
    nameJa: '毒性',
    domain: 'chi',
    branchId: 'nintai',
    description:
      'La resistenza a veleni, malattie, tossine e condizioni ambientali estreme.',
    derivedFormula:
      'Ogni punto: +5 HP massimi (con Konjō). Totale HP: 20 + 5 × (Dokusei + Konjō).',
    kind: 'standard',
    drivesDerived: ['hp'],
  },
  {
    id: 'itami',
    name: 'Dolore',
    nameRomaji: 'Itami',
    nameJa: '痛み',
    domain: 'chi',
    branchId: 'nintai',
    description:
      'La tolleranza al dolore fisico e alla ferita. Determina quanto il corpo continua a funzionare anche quando è danneggiato.',
    derivedFormula:
      'Ogni punto: +3% mitigazione al danno subito (max 30%). Totale: 3% × punti Itami.',
    kind: 'standard',
    drivesDerived: ['mitigation'],
  },
  {
    id: 'konjou',
    name: 'Tenacia',
    nameRomaji: 'Konjō',
    nameJa: '根性',
    domain: 'chi',
    branchId: 'nintai',
    description:
      'La capacità di spingere il corpo oltre il limite. Resistenza alla fatica e alla stanchezza attraverso pura volontà fisica.',
    derivedFormula:
      'Ogni punto: +5 HP massimi (con Dokusei). Totale HP: 20 + 5 × (Dokusei + Konjō).',
    kind: 'standard',
    drivesDerived: ['hp'],
  },

  // ─── Chi · Kairyoku ───
  {
    id: 'bakuryoku',
    name: 'Potenza',
    nameRomaji: 'Bakuryoku',
    nameJa: '爆力',
    domain: 'chi',
    branchId: 'kairyoku',
    description:
      'Vertice del danno corpo a corpo: misura la potenza dei colpi a mani nude e nel combattimento ravvicinato.',
    derivedFormula: '+1 CAC per punto investito.',
    kind: 'standard',
    drivesDerived: ['cac'],
  },
  {
    id: 'kairiki',
    name: 'Forza Bruta',
    nameRomaji: 'Kairiki',
    nameJa: '怪力',
    domain: 'chi',
    branchId: 'kairyoku',
    description:
      'La forza massimale sostenuta. Sollevare, trascinare, rompere, forzare.',
    kind: 'standard',
  },
  {
    id: 'goatsu',
    name: 'Pressione',
    nameRomaji: 'Gōatsu',
    nameJa: '強圧',
    domain: 'chi',
    branchId: 'kairyoku',
    description:
      'La capacità di schiacciare, comprimere o sopraffare fisicamente una resistenza.',
    kind: 'standard',
  },

  // ─── Jin · Shinka no Nagare ───
  {
    id: 'itten-kokan',
    name: 'Incanalamento nelle Armi Bianche',
    nameRomaji: 'Itten Kōkan',
    nameJa: '一転交換',
    domain: 'jin',
    branchId: 'shinka-no-nagare',
    description:
      'La capacità di trasferire il proprio Ego nelle armi da taglio, fondendolo con la lama per potenziarne letalità, precisione e risonanza spirituale.',
    kind: 'standard',
  },
  {
    id: 'juryoku-kokan',
    name: 'Incanalamento nelle Armi da Fuoco',
    nameRomaji: 'Jūryoku Kōkan',
    nameJa: '重力交換',
    domain: 'jin',
    branchId: 'shinka-no-nagare',
    description:
      'La capacità di proiettare il proprio Ego attraverso armi a distanza, alterando traiettoria, impatto e qualità del colpo.',
    kind: 'standard',
  },
  {
    id: 'shintai-kokan',
    name: 'Incanalamento negli Arti',
    nameRomaji: 'Shintai Kōkan',
    nameJa: '身体交換',
    domain: 'jin',
    branchId: 'shinka-no-nagare',
    description:
      'La capacità di far fluire l\'Ego nel corpo stesso, potenziando tecniche fisiche, impatti e controllo del movimento.',
    kind: 'standard',
  },
  {
    id: 'sochu-kokan',
    name: 'Incanalamento Diretto',
    nameRomaji: 'Sochū Kōkan',
    nameJa: '素中交換',
    domain: 'jin',
    branchId: 'shinka-no-nagare',
    description:
      'La maestria nel proiettare la Jigo-Ka senza alcun tramite — né lama, né arma, né corpo. L\'Ego prende forma nello spazio da sé. Governa l\'Indice delle waza prive di consistenza fisica o medium, le pure emanazioni psichiche.',
    kind: 'standard',
  },

  // ─── Jin · Sōkaiju (11 nodi doppio volto) ───
  ...buildSokaijuCatalogEntries(),

  // ─── Jin · Elementi (affinità Gojū — inserimento narrativo) ───
  ...buildJinElementiCatalogEntries(),

  // ─── Jin · Jiga no Shihaisha (milestone) ───
  {
    id: 'keishosha',
    name: 'Erede',
    nameRomaji: 'Keishōsha',
    nameJa: '継承者',
    domain: 'jin',
    branchId: 'jiga-no-shihaisha',
    description: 'Possesso del 55% delle tecniche della propria Madoshō.',
    derivedFormula: '+5% Danno su waza Madoshō. +10% IR su waza Madoshō.',
    kind: 'milestone',
    maxPoints: 1,
    expPurchasable: false,
  },
  {
    id: 'kanpeki-keishosha',
    name: 'Erede Perfetto',
    nameRomaji: 'Kanpeki Keishōsha',
    nameJa: '完璧継承者',
    domain: 'jin',
    branchId: 'jiga-no-shihaisha',
    description:
      'Possesso dell\'85% o più delle tecniche della propria Madoshō. Richiede Erede.',
    derivedFormula: '+10% Danno su waza Madoshō. +15% IR su waza Madoshō.',
    kind: 'milestone',
    parentSkiruId: 'keishosha',
    minParentPoints: 1,
    maxPoints: 1,
    expPurchasable: false,
  },
  {
    id: 'renkinjutsushi',
    name: 'Alchimista',
    nameRomaji: 'Renkinjutsushi',
    nameJa: '錬金術師',
    domain: 'jin',
    branchId: 'jiga-no-shihaisha',
    description: 'Possesso di almeno 4 Waza della stessa consistenza.',
    derivedFormula:
      '+5% Danno su waza della consistenza dichiarata. +10% IR su waza della consistenza dichiarata.',
    kind: 'milestone',
    maxPoints: 1,
    expPurchasable: false,
  },
  {
    id: 'daisei-no-renkin',
    name: 'Opus Magna',
    nameRomaji: 'Daisei no Renkin',
    nameJa: '大成の錬金',
    domain: 'jin',
    branchId: 'jiga-no-shihaisha',
    description:
      'Possesso di almeno 8 Waza della stessa consistenza. Richiede Alchimista.',
    derivedFormula:
      '+10% Danno su waza della consistenza dichiarata. +15% IR su waza della consistenza dichiarata.',
    kind: 'milestone',
    parentSkiruId: 'renkinjutsushi',
    minParentPoints: 1,
    maxPoints: 1,
    expPurchasable: false,
  },
  {
    id: 'inkyo',
    name: 'Eremita',
    nameRomaji: 'Inkyo',
    nameJa: '隠居',
    domain: 'jin',
    branchId: 'jiga-no-shihaisha',
    description: 'Possesso del 55% del proprio premio.',
    derivedFormula:
      '+10% Danno su waza del premio dichiarato. +15% IR su waza del premio dichiarato.',
    kind: 'milestone',
    maxPoints: 1,
    expPurchasable: false,
  },
  {
    id: 'sento-senshi',
    name: "Soldato Scelto",
    nameRomaji: 'Sentō Senshi',
    nameJa: '戦闘戦士',
    domain: 'jin',
    branchId: 'jiga-no-shihaisha',
    description: "Possesso del 55% dell'arsenale d'ordine.",
    derivedFormula:
      "+10% Danno su waza d'ordine dichiarata. +15% IR su waza d'ordine dichiarata.",
    kind: 'milestone',
    maxPoints: 1,
    expPurchasable: false,
  },
] as const

const catalogById = new Map(SKIRU_CATALOG.map((s) => [s.id, s]))

export function getSkiruDef(id: string): SkiruDef | undefined {
  return catalogById.get(id)
}

export function listSkiruByDomain(domain: SkiruDef['domain']): SkiruDef[] {
  return SKIRU_CATALOG.filter((s) => s.domain === domain)
}

export function listSkiruByBranch(branchId: string): SkiruDef[] {
  return SKIRU_CATALOG.filter((s) => s.branchId === branchId)
}

export function getSkiruBranch(branchId: string): SkiruBranchDef | undefined {
  return SKIRU_BRANCHES.find((b) => b.id === branchId)
}

export { mergeCatalogWithSkiruVocab, skiruDefFromVocab } from './vocab-fallback'
export type { SkiruVocabExtra } from './vocab-fallback'
