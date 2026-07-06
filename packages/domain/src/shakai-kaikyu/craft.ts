import { artigianoProjectCatalogKey } from './artigiano'
import { medicoBlueprintCatalogKey } from './medico'
import { sacerdoteOfudaCatalogKey } from './sacerdote'
import type { SocialBlueprintDef } from './types'

/** Catalog key inventario prodotto da craft (recipe / project / rite). */
export function socialBlueprintOutputCatalogKey(blueprint: SocialBlueprintDef): string | null {
  if (blueprint.isProcedure || blueprint.kind === 'procedure') return null
  if (blueprint.kind === 'recipe') return medicoBlueprintCatalogKey(blueprint.id)
  if (blueprint.kind === 'project') return artigianoProjectCatalogKey(blueprint.id)
  if (blueprint.kind === 'rite') return sacerdoteOfudaCatalogKey(blueprint.id)
  return null
}

export function isCraftableBlueprint(blueprint: SocialBlueprintDef): boolean {
  return socialBlueprintOutputCatalogKey(blueprint) != null
}
