import type { SkiruDomain } from './types'
import { SOKAIJU_ANCHORS, SOKAIJU_BRANCH_DESCRIPTION } from './sokaiju-index'
import { GOJU_ELEMENTAL_SKIRU_IDS } from './progression'
import { JIN_ELEMENTI_BRANCH, JIN_ELEMENTI_INTRO, JIN_ELEMENTI_SECTION_ID } from './jin-elementi-catalog'

/** Nodo visualizzato nell'albero (rombo). `skiruId` = investibile se presente in catalogo. */
export type SkiruTreeNodeKind = 'domain' | 'branch' | 'skill' | 'subskill' | 'milestone'

export type SkiruTreeNodeDef = {
  id: string
  /** Id catalogo Skiru — assente = solo display (es. sotto-rami Tōsō non ancora in API). */
  skiruId?: string
  label: string
  labelJa?: string
  description: string
  kind: SkiruTreeNodeKind
  domain: SkiruDomain
  branchId?: string
  /** Posizione griglia (col, row) per layout a rombi. */
  col: number
  row: number
  parentNodeId?: string
}

export type SkiruTreeSectionDef = {
  id: string
  domain: SkiruDomain
  title: string
  titleJa?: string
  domainDescription: string
  nodes: SkiruTreeNodeDef[]
  /** Larghezza griglia (colonne). */
  cols: number
  /** Altezza griglia (righe). */
  rows: number
}

const SUB_AMBIDESTRIA =
  'Facoltà di usare entrambe le braccia con la stessa efficacia in combattimento.'
const SUB_ARMA_FAVORITA =
  "L'utilizzatore dichiara un'arma specifica all'acquisizione della Skiru."
const SUB_DOPPIO_COLPO =
  'Permette due colpi fisici in rapida successione nello stesso quarto. Non utilizzabile con Waza. Richiede Ambidestria.'
const SUB_TECNICA_PERFETTA =
  "L'utilizzatore dichiara una tecnica specifica all'acquisizione della Skiru."

function combatColumn(
  branchNodeId: string,
  col: number,
  master: { skiruId: string; label: string; labelJa: string; description: string },
  subs: Array<{ id: string; label: string; description: string; skiruId?: string }>,
): SkiruTreeNodeDef[] {
  const nodes: SkiruTreeNodeDef[] = [
    {
      id: master.skiruId,
      skiruId: master.skiruId,
      label: master.label,
      labelJa: master.labelJa,
      description: master.description,
      kind: 'skill',
      domain: 'chi',
      branchId: 'toso',
      col,
      row: 1,
      parentNodeId: branchNodeId,
    },
  ]
  subs.forEach((sub, i) => {
    nodes.push({
      id: sub.id,
      skiruId: sub.skiruId,
      label: sub.label,
      description: sub.description,
      kind: 'subskill',
      domain: 'chi',
      branchId: 'toso',
      col,
      row: 2 + i,
      parentNodeId: master.skiruId,
    })
  })
  return nodes
}

function buildSokaijuTreeNodes(): SkiruTreeNodeDef[] {
  const branchId = 'branch-sokaiju'
  const nodes: SkiruTreeNodeDef[] = [
    {
      id: branchId,
      label: 'Il Doppio Albero dei Mondi',
      labelJa: '双界樹',
      description: SOKAIJU_BRANCH_DESCRIPTION,
      kind: 'branch',
      domain: 'jin',
      branchId: 'sokaiju',
      col: 1,
      row: 0,
    },
  ]

  SOKAIJU_ANCHORS.forEach((anchor, index) => {
    const row = index + 1
    nodes.push({
      id: anchor.id,
      skiruId: anchor.id,
      label: `${anchor.meiju.nameRomaji} / ${anchor.shiju.nameRomaji}`,
      labelJa: [anchor.meiju.nameJa, anchor.shiju.nameJa].filter(Boolean).join(' / ') || undefined,
      description: `${anchor.bodyAnchor} · Meiju ${anchor.meiju.treeSphere} / Shiju ${anchor.shiju.treeSphere}.`,
      kind: 'skill',
      domain: 'jin',
      branchId: 'sokaiju',
      col: 1,
      row,
      parentNodeId: branchId,
    })
  })

  return nodes
}

function buildJinElementiTreeNodes(): SkiruTreeNodeDef[] {
  const branchNodeId = 'branch-jin-elementi'
  const nodes: SkiruTreeNodeDef[] = [
    {
      id: branchNodeId,
      label: JIN_ELEMENTI_BRANCH.label,
      labelJa: JIN_ELEMENTI_BRANCH.labelJa,
      description: JIN_ELEMENTI_BRANCH.description ?? '',
      kind: 'branch',
      domain: 'jin',
      branchId: JIN_ELEMENTI_BRANCH.id,
      col: 1,
      row: 0,
    },
    {
      id: JIN_ELEMENTI_SECTION_ID,
      skiruId: JIN_ELEMENTI_SECTION_ID,
      label: 'Elenco degli elementi',
      labelJa: '元素一覧',
      description: JIN_ELEMENTI_INTRO,
      kind: 'skill',
      domain: 'jin',
      branchId: JIN_ELEMENTI_BRANCH.id,
      col: 1,
      row: 1,
      parentNodeId: branchNodeId,
    },
  ]

  GOJU_ELEMENTAL_SKIRU_IDS.forEach((id, index) => {
    nodes.push({
      id,
      skiruId: id,
      label: id.replace('goju-', '').replace(/^./, (c) => c.toUpperCase()),
      description: 'Affinità elementale — inserimento narrativo in scheda.',
      kind: 'subskill',
      domain: 'jin',
      branchId: JIN_ELEMENTI_BRANCH.id,
      col: 1,
      row: 2 + index,
      parentNodeId: JIN_ELEMENTI_SECTION_ID,
    })
  })

  return nodes
}

/** Sezioni albero Skiru — struttura dal PDF «Skiru Tree Structure». */
export const SKIRU_TREE_SECTIONS: readonly SkiruTreeSectionDef[] = [
  // ─── Chi · Tōsō ───
  {
    id: 'chi-toso',
    domain: 'chi',
    title: 'Chi',
    titleJa: '地',
    domainDescription: 'Fisicità, presenza materiale, perseveranza.',
    cols: 3,
    rows: 5,
    nodes: [
      {
        id: 'branch-toso',
        label: 'Combattimento',
        labelJa: '闘争',
        description:
          'Tōsō è il ramo del conflitto fisico diretto: qui scegli una specialità — lame, armi da fuoco o corpo a corpo — e ne aumenti l\'Indice di Riuscita (+1 per punto sulla maestria scelta). Ogni via apre passive acquistabili (ambidestria, arma o tecnica dichiarata, colpi doppi) che definiscono lo stile e le opzioni del tuo combattente in scena.',
        kind: 'branch',
        domain: 'chi',
        branchId: 'toso',
        col: 1,
        row: 0,
      },
      ...combatColumn('branch-toso', 0, {
        skiruId: 'kensei',
        label: 'Maestro delle Lame',
        labelJa: '剣聖',
        description:
          'Hai consacrato la tua vita allo studio delle armi da taglio. Le tue tecniche sono precise, letali e affinate da innumerevoli battaglie.',
      }, [
        { id: 'kensei-ambidestria', skiruId: 'kensei-ambidestria', label: 'Ambidestria', description: SUB_AMBIDESTRIA },
        { id: 'kensei-arma-favorita', skiruId: 'kensei-arma-favorita', label: 'Arma Favorita', description: SUB_ARMA_FAVORITA },
        { id: 'kensei-doppio-colpo', skiruId: 'kensei-doppio-colpo', label: 'Doppio Colpo', description: SUB_DOPPIO_COLPO },
      ]),
      ...combatColumn('branch-toso', 1, {
        skiruId: 'jusei',
        label: 'Maestro delle Armi da Fuoco',
        labelJa: '銃聖',
        description:
          'Pochi possono eguagliare la tua mira e il tuo sangue freddo. Ogni colpo è calcolato, ogni proiettile una sentenza.',
      }, [
        { id: 'jusei-ambidestria', skiruId: 'jusei-ambidestria', label: 'Ambidestria', description: SUB_AMBIDESTRIA },
        { id: 'jusei-arma-favorita', skiruId: 'jusei-arma-favorita', label: 'Arma Favorita', description: SUB_ARMA_FAVORITA },
        { id: 'jusei-doppio-colpo', skiruId: 'jusei-doppio-colpo', label: 'Doppio Colpo', description: SUB_DOPPIO_COLPO },
      ]),
      ...combatColumn('branch-toso', 2, {
        skiruId: 'kenka-o',
        label: 'Re della Rissa',
        labelJa: '喧嘩王',
        description:
          'Il combattimento corpo a corpo è il tuo regno. Pugni, gomitate, prese e colpi improvvisati diventano strumenti di dominio assoluto.',
      }, [
        { id: 'kenka-o-ambidestria', skiruId: 'kenka-o-ambidestria', label: 'Ambidestria', description: SUB_AMBIDESTRIA },
        { id: 'kenka-o-tecnica-perfetta', skiruId: 'kenka-o-tecnica-perfetta', label: 'Tecnica Perfetta', description: SUB_TECNICA_PERFETTA },
        { id: 'kenka-o-doppio-colpo', skiruId: 'kenka-o-doppio-colpo', label: 'Doppio Colpo', description: SUB_DOPPIO_COLPO },
      ]),
    ],
  },

  // ─── Chi · Binshō ───
  {
    id: 'chi-binsho',
    domain: 'chi',
    title: 'Chi',
    titleJa: '地',
    domainDescription: 'Fisicità, presenza materiale, perseveranza.',
    cols: 3,
    rows: 2,
    nodes: [
      {
        id: 'branch-binsho',
        label: 'Agilità',
        labelJa: '敏捷',
        description:
          'Binshō misura l\'agilità corporea: quanto lontano ti sposti in un quarto d\'azione, quanto in fretta reagisci agli stimoli e quanto controllo fine hai su gesti, equilibrio e posizione. È il ramo da investire per inseguimenti, schivate, acrobazie e prove che premiano velocità e destrezza.',
        kind: 'branch',
        domain: 'chi',
        branchId: 'binsho',
        col: 1,
        row: 0,
      },
      {
        id: 'undo',
        skiruId: 'undo',
        label: 'Movimento',
        labelJa: '運動',
        description:
          'La capacità di spostarsi con velocità, equilibrio e controllo. Comprende corsa, acrobazia, arrampicata e mobilità generale.',
        kind: 'skill',
        domain: 'chi',
        branchId: 'binsho',
        col: 0,
        row: 1,
        parentNodeId: 'branch-binsho',
      },
      {
        id: 'hansha',
        skiruId: 'hansha',
        label: 'Riflessi',
        labelJa: '反射',
        description:
          'La rapidità di reazione agli stimoli esterni. Determina schivate, tempi di risposta e capacità di cogliere opportunità improvvise.',
        kind: 'skill',
        domain: 'chi',
        branchId: 'binsho',
        col: 1,
        row: 1,
        parentNodeId: 'branch-binsho',
      },
      {
        id: 'seimitsu',
        skiruId: 'seimitsu',
        label: 'Precisione',
        labelJa: '精密',
        description:
          'Vertice per armi da fuoco e armi bianche: misura precisione ed efficacia dei colpi con arma.',
        kind: 'skill',
        domain: 'chi',
        branchId: 'binsho',
        col: 2,
        row: 1,
        parentNodeId: 'branch-binsho',
      },
    ],
  },

  // ─── Chi · Nintai ───
  {
    id: 'chi-nintai',
    domain: 'chi',
    title: 'Chi',
    titleJa: '地',
    domainDescription: 'Fisicità, presenza materiale, perseveranza.',
    cols: 3,
    rows: 2,
    nodes: [
      {
        id: 'branch-nintai',
        label: 'Tempra',
        labelJa: '忍耐',
        description:
          'Nintai misura la tempra fisica: resistenza a veleni e ambienti ostili, tolleranza al dolore e alla ferita, e volontà di spingere il corpo oltre la stanchezza. È il ramo da investire per restare in piedi più a lungo — Dokusei e Konjō aumentano gli HP massimi, Itami mitiga il danno che subisci dopo lo Scudo.',
        kind: 'branch',
        domain: 'chi',
        branchId: 'nintai',
        col: 1,
        row: 0,
      },
      {
        id: 'dokusei',
        skiruId: 'dokusei',
        label: 'Robustezza',
        labelJa: '毒性',
        description:
          'La resistenza a veleni, malattie, tossine e condizioni ambientali estreme.',
        kind: 'skill',
        domain: 'chi',
        branchId: 'nintai',
        col: 0,
        row: 1,
        parentNodeId: 'branch-nintai',
      },
      {
        id: 'itami',
        skiruId: 'itami',
        label: 'Dolore',
        labelJa: '痛み',
        description:
          'La tolleranza al dolore fisico e alla ferita. Determina quanto il corpo continua a funzionare anche quando è danneggiato.',
        kind: 'skill',
        domain: 'chi',
        branchId: 'nintai',
        col: 1,
        row: 1,
        parentNodeId: 'branch-nintai',
      },
      {
        id: 'konjou',
        skiruId: 'konjou',
        label: 'Tenacia',
        labelJa: '根性',
        description:
          'La capacità di spingere il corpo oltre il limite. Resistenza alla fatica e alla stanchezza attraverso pura volontà fisica.',
        kind: 'skill',
        domain: 'chi',
        branchId: 'nintai',
        col: 2,
        row: 1,
        parentNodeId: 'branch-nintai',
      },
    ],
  },

  // ─── Chi · Kairyoku ───
  {
    id: 'chi-kairyoku',
    domain: 'chi',
    title: 'Chi',
    titleJa: '地',
    domainDescription: 'Fisicità, presenza materiale, perseveranza.',
    cols: 3,
    rows: 2,
    nodes: [
      {
        id: 'branch-kairyoku',
        label: 'Vigore',
        labelJa: '怪力',
        description:
          'Kairyoku misura la forza bruta applicata al mondo fisico: esplosività del gesto, capacità di sollevare e rompere, pressione che piega la resistenza altrui. È il ramo da investire per imporre il proprio peso in combattimento, nelle prese e nelle prove che premiano potenza pura.',
        kind: 'branch',
        domain: 'chi',
        branchId: 'kairyoku',
        col: 1,
        row: 0,
      },
      {
        id: 'bakuryoku',
        skiruId: 'bakuryoku',
        label: 'Potenza',
        labelJa: '爆力',
        description:
          'Vertice del danno corpo a corpo: misura la potenza dei colpi a mani nude e nel combattimento ravvicinato.',
        kind: 'skill',
        domain: 'chi',
        branchId: 'kairyoku',
        col: 0,
        row: 1,
        parentNodeId: 'branch-kairyoku',
      },
      {
        id: 'kairiki',
        skiruId: 'kairiki',
        label: 'Forza Bruta',
        labelJa: '怪力',
        description:
          'La forza massimale sostenuta. Sollevare, trascinare, rompere, forzare.',
        kind: 'skill',
        domain: 'chi',
        branchId: 'kairyoku',
        col: 1,
        row: 1,
        parentNodeId: 'branch-kairyoku',
      },
      {
        id: 'goatsu',
        skiruId: 'goatsu',
        label: 'Pressione',
        labelJa: '強圧',
        description:
          'La capacità di schiacciare, comprimere o sopraffare fisicamente una resistenza.',
        kind: 'skill',
        domain: 'chi',
        branchId: 'kairyoku',
        col: 2,
        row: 1,
        parentNodeId: 'branch-kairyoku',
      },
    ],
  },

  // ─── Ten · Shakai Kaikyū ───
  {
    id: 'ten-shakai',
    domain: 'ten',
    title: 'Ten',
    titleJa: '天',
    domainDescription:
      'Intelletto, capacità di comprensione, visione.',
    cols: 5,
    rows: 2,
    nodes: [
      {
        id: 'branch-shakai-kaikyu',
        label: 'Classe Sociale',
        labelJa: '社会階級',
        description:
          "Il ruolo occupato dall'individuo all'interno della società e il percorso professionale che ne ha plasmato competenze, conoscenze e relazioni.",
        kind: 'branch',
        domain: 'ten',
        branchId: 'shakai-kaikyu',
        col: 2,
        row: 0,
      },
      {
        id: 'ishi',
        skiruId: 'ishi',
        label: 'Medico',
        labelJa: '医師',
        description:
          'Colui che studia il corpo e le sue afflizioni. Specializzato nella cura, nella diagnosi e nella conoscenza anatomica.',
        kind: 'skill',
        domain: 'ten',
        branchId: 'shakai-kaikyu',
        col: 0,
        row: 1,
        parentNodeId: 'branch-shakai-kaikyu',
      },
      {
        id: 'shokunin',
        skiruId: 'shokunin',
        label: 'Artigiano',
        labelJa: '職人',
        description:
          'Maestro della creazione e della lavorazione. Eccelle nella costruzione, riparazione e modifica di oggetti e strumenti.',
        kind: 'skill',
        domain: 'ten',
        branchId: 'shakai-kaikyu',
        col: 1,
        row: 1,
        parentNodeId: 'branch-shakai-kaikyu',
      },
      {
        id: 'ryoshi',
        skiruId: 'ryoshi',
        label: 'Cacciatore',
        labelJa: '猟師',
        description:
          'Esperto della natura e della sopravvivenza. Traccia prede, raccoglie risorse e si orienta negli ambienti più ostili.',
        kind: 'skill',
        domain: 'ten',
        branchId: 'shakai-kaikyu',
        col: 2,
        row: 1,
        parentNodeId: 'branch-shakai-kaikyu',
      },
      {
        id: 'seijika',
        skiruId: 'seijika',
        label: 'Politico',
        labelJa: '政治家',
        description:
          'Abile nelle relazioni sociali e nelle dinamiche di potere. Sa influenzare, negoziare e muoversi tra alleanze e conflitti.',
        kind: 'skill',
        domain: 'ten',
        branchId: 'shakai-kaikyu',
        col: 3,
        row: 1,
        parentNodeId: 'branch-shakai-kaikyu',
      },
      {
        id: 'shisai',
        skiruId: 'shisai',
        label: 'Sacerdote',
        labelJa: '司祭',
        description:
          'Custode di tradizioni, culti e pratiche spirituali. Interpreta simboli, rituali e fenomeni trascendenti.',
        kind: 'skill',
        domain: 'ten',
        branchId: 'shakai-kaikyu',
        col: 4,
        row: 1,
        parentNodeId: 'branch-shakai-kaikyu',
      },
    ],
  },

  // ─── Ten · Seishin Tanren ───
  {
    id: 'ten-seishin',
    domain: 'ten',
    title: 'Ten',
    titleJa: '天',
    domainDescription:
      'Intelletto, capacità di comprensione, visione.',
    cols: 3,
    rows: 2,
    nodes: [
      {
        id: 'branch-seishin-tanren',
        label: 'Disciplina Mentale',
        labelJa: '精神鍛錬',
        description:
          "L'addestramento della mente e della volontà. Comprende lucidità, concentrazione, autocontrollo e resistenza alle influenze esterne.",
        kind: 'branch',
        domain: 'ten',
        branchId: 'seishin-tanren',
        col: 1,
        row: 0,
      },
      {
        id: 'fudoshin',
        skiruId: 'fudoshin',
        label: 'Fermezza',
        labelJa: '不動心',
        description:
          'La capacità di mantenere lucidità e autocontrollo di fronte a paura, provocazioni, manipolazione e pressioni emotive.',
        kind: 'skill',
        domain: 'ten',
        branchId: 'seishin-tanren',
        col: 0,
        row: 1,
        parentNodeId: 'branch-seishin-tanren',
      },
      {
        id: 'kansatsu',
        skiruId: 'kansatsu',
        label: 'Osservazione',
        labelJa: '観察',
        description:
          "L'abilità di cogliere dettagli, anomalie e informazioni nascoste nell'ambiente circostante.",
        kind: 'skill',
        domain: 'ten',
        branchId: 'seishin-tanren',
        col: 1,
        row: 1,
        parentNodeId: 'branch-seishin-tanren',
      },
      {
        id: 'chokaku',
        skiruId: 'chokaku',
        label: 'Percezione Superiore',
        labelJa: '超覚',
        description:
          'La capacità di cogliere ciò che sfugge ai sensi ordinari, percependo sogni, presagi, energie e fenomeni nascosti.',
        kind: 'skill',
        domain: 'ten',
        branchId: 'seishin-tanren',
        col: 2,
        row: 1,
        parentNodeId: 'branch-seishin-tanren',
      },
    ],
  },

  // ─── Jin · Shinka no Nagare ───
  {
    id: 'jin-shinka',
    domain: 'jin',
    title: 'Jin',
    titleJa: '人',
    domainDescription: 'Lo spirito: fra volontà e identità.',
    cols: 4,
    rows: 2,
    nodes: [
      {
        id: 'branch-shinka-no-nagare',
        label: 'Libero Flusso',
        labelJa: '進化の流れ',
        description:
          'La capacità di prendere controllo del flusso del proprio Ego, stabilizzandolo e rendendolo utilizzabile come energia attiva. È la base di ogni tecnica spirituale e di incanalamento.',
        kind: 'branch',
        domain: 'jin',
        branchId: 'shinka-no-nagare',
        col: 1,
        row: 0,
      },
      {
        id: 'itten-kokan',
        skiruId: 'itten-kokan',
        label: 'Incanalamento nelle Armi Bianche',
        labelJa: '一転交換',
        description:
          'La capacità di trasferire il proprio Ego nelle armi da taglio, fondendolo con la lama per potenziarne letalità, precisione e risonanza spirituale.',
        kind: 'skill',
        domain: 'jin',
        branchId: 'shinka-no-nagare',
        col: 0,
        row: 1,
        parentNodeId: 'branch-shinka-no-nagare',
      },
      {
        id: 'juryoku-kokan',
        skiruId: 'juryoku-kokan',
        label: 'Incanalamento nelle Armi da Fuoco',
        labelJa: '重力交換',
        description:
          'La capacità di proiettare il proprio Ego attraverso armi a distanza, alterando traiettoria, impatto e qualità del colpo.',
        kind: 'skill',
        domain: 'jin',
        branchId: 'shinka-no-nagare',
        col: 1,
        row: 1,
        parentNodeId: 'branch-shinka-no-nagare',
      },
      {
        id: 'shintai-kokan',
        skiruId: 'shintai-kokan',
        label: 'Incanalamento negli Arti',
        labelJa: '身体交換',
        description:
          'La capacità di far fluire l’Ego nel corpo stesso, potenziando tecniche fisiche, impatti e controllo del movimento.',
        kind: 'skill',
        domain: 'jin',
        branchId: 'shinka-no-nagare',
        col: 2,
        row: 1,
        parentNodeId: 'branch-shinka-no-nagare',
      },
      {
        id: 'sochu-kokan',
        skiruId: 'sochu-kokan',
        label: 'Incanalamento Diretto',
        labelJa: '素中交換',
        description:
          'La maestria nel proiettare la Jigo-Ka senza alcun tramite — né lama, né arma, né corpo. L\'Ego prende forma nello spazio da sé. Governa l\'Indice delle waza prive di consistenza fisica o medium, le pure emanazioni psichiche.',
        kind: 'skill',
        domain: 'jin',
        branchId: 'shinka-no-nagare',
        col: 3,
        row: 1,
        parentNodeId: 'branch-shinka-no-nagare',
      },
    ],
  },

  // ─── Jin · Elementi (affinità Gojū) ───
  {
    id: 'jin-elementi',
    domain: 'jin',
    title: 'Jin',
    titleJa: '人',
    domainDescription: 'Lo spirito: fra volontà e identità.',
    cols: 2,
    rows: 8,
    nodes: buildJinElementiTreeNodes(),
  },

  // ─── Jin · Sōkaiju (Meiju / Shiju · 11 ancoraggi) ───
  {
    id: 'jin-sokaiju',
    domain: 'jin',
    title: 'Jin',
    titleJa: '人',
    domainDescription: 'Lo spirito: fra volontà e identità.',
    cols: 3,
    rows: 12,
    nodes: buildSokaijuTreeNodes(),
  },

  // ─── Jin · Jiga no Shihaisha (milestone) ───
  {
    id: 'jin-jiga',
    domain: 'jin',
    title: 'Jin',
    titleJa: '人',
    domainDescription: 'Lo spirito: fra volontà e identità.',
    cols: 3,
    rows: 3,
    nodes: [
      {
        id: 'branch-jiga-no-shihaisha',
        label: "Padrone dell'Io",
        labelJa: '自我の支配者',
        description:
          'Dominio completo di una singola scuola di Waza. Il praticante raggiunge una perfetta sintonia con una sola via tecnica, ottenendo un potenziamento permanente delle sue tecniche. Può essere scelto una sola volta e richiede approvazione narrativa (non si può acquistare, viene inserito in scheda dalla moderazione).',
        kind: 'branch',
        domain: 'jin',
        branchId: 'jiga-no-shihaisha',
        col: 1,
        row: 0,
      },
      {
        id: 'keishosha',
        skiruId: 'keishosha',
        label: 'Erede',
        labelJa: '継承者',
        description:
          'Possesso del 55% delle tecniche della propria Madoshō.',
        kind: 'milestone',
        domain: 'jin',
        branchId: 'jiga-no-shihaisha',
        col: 0,
        row: 1,
        parentNodeId: 'branch-jiga-no-shihaisha',
      },
      {
        id: 'kanpeki-keishosha',
        skiruId: 'kanpeki-keishosha',
        label: 'Erede Perfetto',
        labelJa: '完璧継承者',
        description:
          'Possesso dell\'85% o più delle tecniche della propria Madoshō. Richiede Erede.',
        kind: 'milestone',
        domain: 'jin',
        branchId: 'jiga-no-shihaisha',
        col: 1,
        row: 1,
        parentNodeId: 'branch-jiga-no-shihaisha',
      },
      {
        id: 'renkinjutsushi',
        skiruId: 'renkinjutsushi',
        label: 'Alchimista',
        labelJa: '錬金術師',
        description: 'Possesso di almeno 4 Waza della stessa consistenza.',
        kind: 'milestone',
        domain: 'jin',
        branchId: 'jiga-no-shihaisha',
        col: 2,
        row: 1,
        parentNodeId: 'branch-jiga-no-shihaisha',
      },
      {
        id: 'daisei-no-renkin',
        skiruId: 'daisei-no-renkin',
        label: 'Opus Magna',
        labelJa: '大成の錬金',
        description:
          'Possesso di almeno 8 Waza della stessa consistenza. Richiede Alchimista.',
        kind: 'milestone',
        domain: 'jin',
        branchId: 'jiga-no-shihaisha',
        col: 0,
        row: 2,
        parentNodeId: 'branch-jiga-no-shihaisha',
      },
      {
        id: 'inkyo',
        skiruId: 'inkyo',
        label: 'Eremita',
        labelJa: '隠居',
        description: 'Possesso del 55% del proprio premio.',
        kind: 'milestone',
        domain: 'jin',
        branchId: 'jiga-no-shihaisha',
        col: 1,
        row: 2,
        parentNodeId: 'branch-jiga-no-shihaisha',
      },
      {
        id: 'sento-senshi',
        skiruId: 'sento-senshi',
        label: 'Soldato Scelto',
        labelJa: '戦闘戦士',
        description: "Possesso del 55% dell'arsenale d'ordine.",
        kind: 'milestone',
        domain: 'jin',
        branchId: 'jiga-no-shihaisha',
        col: 2,
        row: 2,
        parentNodeId: 'branch-jiga-no-shihaisha',
      },
    ],
  },
] as const

export function listSkiruTreeSections(domain?: SkiruDomain): SkiruTreeSectionDef[] {
  if (!domain) return [...SKIRU_TREE_SECTIONS]
  return SKIRU_TREE_SECTIONS.filter((s) => s.domain === domain)
}

/** Coordinate pixel per layout SVG (rombi). */
export function getSkiruTreeNodePosition(
  section: SkiruTreeSectionDef,
  node: SkiruTreeNodeDef,
  cellW = 108,
  cellH = 96,
  padX = 48,
  padY = 32,
): { x: number; y: number } {
  const x = padX + node.col * cellW + cellW / 2
  const y = padY + node.row * cellH + cellH / 2
  return { x, y }
}

export function getSkiruTreeSectionSize(
  section: SkiruTreeSectionDef,
  cellW = 108,
  cellH = 96,
  padX = 48,
  padY = 32,
): { width: number; height: number } {
  return {
    width: padX * 2 + section.cols * cellW,
    // Extra spazio basso per label multilinea dei nodi estremi.
    height: padY * 2 + section.rows * cellH + 84,
  }
}
