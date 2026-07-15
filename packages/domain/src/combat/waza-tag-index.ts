import { WAZA_TAG_CATALOG } from './waza-tag-catalog.generated'
import { buildWazaTagIndex, resolveWazaTagPreview } from './waza-tag-preview'
import { WAZA_LAUNCH_PROFILE_DATA } from './waza-launch-profile-data'

const catalogWithFlags = WAZA_TAG_CATALOG.map((entry) => {
  const flags = entry.poolId ? WAZA_LAUNCH_PROFILE_DATA[entry.poolId] : undefined
  return flags ? { ...entry, launchFlags: flags } : entry
})

/** Indice nome → metadata per tag chat [waza:…] (con launchFlags mergiati). */
export const WAZA_TAG_INDEX = buildWazaTagIndex(catalogWithFlags)

export { WAZA_TAG_CATALOG, resolveWazaTagPreview }
