/**
 * Pool Patti (premio) — stesso shape meccanico di WazaDef ma con `branch: PattiRamo`.
 * Incolla qui le voci generate dal tool «Patti (premio)».
 */

import type { WazaDef } from './wazaPool'
import type { PattiRamo } from './pattiTaxonomy'

export type PattiDef = Omit<WazaDef, 'branch'> & { branch: PattiRamo }

export const PATTI_POOL: PattiDef[] = []
