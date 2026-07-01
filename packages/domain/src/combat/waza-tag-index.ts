import { WAZA_TAG_CATALOG } from './waza-tag-catalog.generated'
import { buildWazaTagIndex, resolveWazaTagPreview } from './waza-tag-preview'

/** Indice nome → metadata per tag chat [waza:…]. */
export const WAZA_TAG_INDEX = buildWazaTagIndex(WAZA_TAG_CATALOG)

export { WAZA_TAG_CATALOG, resolveWazaTagPreview }
