/**
 * Pool Madōsho (clan) — stesso shape meccanico di WazaDef ma con `branch: MadoshoRamo`.
 * Incolla qui le voci generate dal tool «Madōsho (clan)».
 */

import type { WazaDef } from './wazaPool'
import type { MadoshoRamo } from './madoshoTaxonomy'

export type MadoshoDef = Omit<WazaDef, 'branch'> & { branch: MadoshoRamo }

import { MADOSHO_WAZA_POOL } from './pools/madosho-waza-pool'

/** 55 waza da Parte IV PDF (5 lignaggi; Komonoire senza elenco nel manuale). */
export const MADOSHO_POOL: MadoshoDef[] = MADOSHO_WAZA_POOL
