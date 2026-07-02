import type { JunkItemDef } from '../economy/junklist'
import {
  ECONOMY_MATERIAL_LABELS,
  JUNK_ITEMS,
  getJunkItemDef,
} from '../economy/junklist'
import { canDismantleAsArtigiano } from '../economy/dismantle'
import type { SocialClassTag } from './types'

export { ECONOMY_MATERIAL_LABELS as SOCIAL_MATERIAL_LABELS, JUNK_ITEMS, getJunkItemDef }
export type { JunkItemDef }

/** Solo #Artigiano smantella qualsiasi junk o equipaggiamento rotto. */
export function canDismantleJunkItem(
  classTag: SocialClassTag | null,
  _item?: JunkItemDef,
): boolean {
  return canDismantleAsArtigiano(classTag)
}
