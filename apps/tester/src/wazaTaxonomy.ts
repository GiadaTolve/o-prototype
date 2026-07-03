/**
 * Tassonomia Waza — sottocategorie per ramo (authoring tester).
 * Consistenze e categorie: source of truth in @domain/combat/waza-taxonomy.
 */

import type { WazaBranch } from './wazaBranches'

export {
  WAZA_CONSISTENCIES,
  WAZA_CATEGORIES,
  WAZA_CONSISTENCY_IDS,
  WAZA_CATEGORY_IDS,
  extractWazaTaxonomyFromText,
  classifyBracketTag,
  formatWazaTaxonomyTagsInText,
} from '@domain/combat/waza-taxonomy'

export interface WazaSubcategoryDef {
  id: string
  branch: WazaBranch
  name: string
  description?: string
}

export const WAZA_SUBCATEGORIES: WazaSubcategoryDef[] = []
