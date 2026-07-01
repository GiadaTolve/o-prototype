/**
 * @deprecated Il catalogo Skiru vive in packages/domain/src/skiru/catalog.ts.
 * Snapshot runtime (tester-api) conservano JSON; non rigenerare skiruPool.ts locale.
 */

import type { SkiruDef } from './skiruPool'
import { CANONICAL_SKIRU_CATALOG_PATH } from './skiruPool'

export function skiruDefToPoolLine(_d: SkiruDef): string {
  throw new Error(`Modifica ${CANONICAL_SKIRU_CATALOG_PATH} — skiruPool.ts è un adapter read-only.`)
}

export function buildSkiruPoolTsFile(_entries: SkiruDef[]): string {
  throw new Error(`Modifica ${CANONICAL_SKIRU_CATALOG_PATH} — skiruPool.ts è un adapter read-only.`)
}
