import type { SkiruBranchDef, SkiruDef } from './types'

/** Ramo Jin · affinità elementali Gojū (inserimento narrativo, non EXP). */
export const JIN_ELEMENTI_BRANCH: SkiruBranchDef = {
  id: 'jin-elementi',
  label: 'Elementi',
  labelRomaji: 'Genso',
  labelJa: '元素',
  domain: 'jin',
  description:
    'Le affinità elementali legate alla Comprensione (Gojū): fuoco, fulmine, acqua, gravità, aria. Si radicano nella storia del personaggio — una sola attiva, non si acquistano con EXP.',
}

export const JIN_ELEMENTI_SECTION_ID = 'elementi-elenco'

export const JIN_ELEMENTI_INTRO =
  'Chi coltiva la Comprensione può ricevere in scheda una sola affinità elementale. L\'elemento tinge le tecniche e, quando vanno a segno su waza [Elementale], lascia sul nemico uno status per tre turni.'

const ELEMENTAL_DEFS: readonly Omit<SkiruDef, 'branchId' | 'parentSkiruId'>[] = [
  {
    id: 'goju-fuoco',
    name: 'Fuoco',
    nameRomaji: 'Kansai',
    nameJa: '火',
    domain: 'jin',
    description: 'Affinità al fuoco — status Incendiato su colpo [Elementale] a segno.',
    derivedFormula: 'Status Incendiato (3 turni) su waza [Elementale] a segno.',
    kind: 'standard',
    maxPoints: 1,
    expPurchasable: false,
    drivesDerived: ['elementalStatus'],
  },
  {
    id: 'goju-fulmine',
    name: 'Fulmine',
    nameRomaji: 'Raijin',
    nameJa: '雷',
    domain: 'jin',
    description: 'Affinità al fulmine — status Sovraccarico su colpo [Elementale] a segno.',
    derivedFormula: 'Status Sovraccarico (3 turni) su waza [Elementale] a segno.',
    kind: 'standard',
    maxPoints: 1,
    expPurchasable: false,
    drivesDerived: ['elementalStatus'],
  },
  {
    id: 'goju-acqua',
    name: 'Acqua',
    nameRomaji: 'Suijin',
    nameJa: '水',
    domain: 'jin',
    description: 'Affinità all\'acqua — status Torpore su colpo [Elementale] a segno.',
    derivedFormula: 'Status Torpore (3 turni) su waza [Elementale] a segno.',
    kind: 'standard',
    maxPoints: 1,
    expPurchasable: false,
    drivesDerived: ['elementalStatus'],
  },
  {
    id: 'goju-gravita',
    name: 'Gravità',
    nameRomaji: 'Jūryoku',
    nameJa: '重力',
    domain: 'jin',
    description: 'Affinità alla gravità — status Appesantimento su colpo [Elementale] a segno.',
    derivedFormula: 'Status Appesantimento (3 turni) su waza [Elementale] a segno.',
    kind: 'standard',
    maxPoints: 1,
    expPurchasable: false,
    drivesDerived: ['elementalStatus'],
  },
  {
    id: 'goju-aria',
    name: 'Aria',
    nameRomaji: 'Fūjin',
    nameJa: '風',
    domain: 'jin',
    description: 'Affinità all\'aria — status Vertigini su colpo [Elementale] a segno.',
    derivedFormula: 'Status Vertigini (3 turni) su waza [Elementale] a segno.',
    kind: 'standard',
    maxPoints: 1,
    expPurchasable: false,
    drivesDerived: ['elementalStatus'],
  },
] as const

/** Voci catalogo Jin · Elementi (sezione + 5 affinità). */
export function buildJinElementiCatalogEntries(): SkiruDef[] {
  const section: SkiruDef = {
    id: JIN_ELEMENTI_SECTION_ID,
    name: 'Elenco degli elementi',
    nameRomaji: 'Genso Ichiran',
    nameJa: '元素一覧',
    domain: 'jin',
    branchId: JIN_ELEMENTI_BRANCH.id,
    description: JIN_ELEMENTI_INTRO,
    kind: 'standard',
    maxPoints: 0,
    expPurchasable: false,
  }
  const children = ELEMENTAL_DEFS.map((def) => ({
    ...def,
    branchId: JIN_ELEMENTI_BRANCH.id,
    parentSkiruId: JIN_ELEMENTI_SECTION_ID,
    minParentPoints: 0,
  }))
  return [section, ...children]
}
