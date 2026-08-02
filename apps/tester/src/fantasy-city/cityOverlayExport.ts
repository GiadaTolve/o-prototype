/**
 * Export overlay città → GeoJSON-like per la mappa dashboard (prototipo reversibile).
 */
import { buildingCorners, type Building, type Pt, type RoadLike, type Zone } from './parcelPack'
import { canvasToLngLat, type JapanMapWorld } from './japanMapBg'

export type CityOverlayLngLat = [number, number] // [lng, lat]

export type CityOverlayPayload = {
  version: 1
  id?: string
  name?: string
  prototype: true
  createdAt: string
  note: string
  zones: { ring: CityOverlayLngLat[] }[]
  buildings: { ring: CityOverlayLngLat[]; color: string }[]
  roads: { line: CityOverlayLngLat[]; width: number }[]
  rivers: { line: CityOverlayLngLat[]; width: number }[]
  walls: { line: CityOverlayLngLat[]; width: number }[]
}

const MAX_BUILDINGS = 2500

/** Destinazioni possibili (dev monorepo). */
const DASHBOARD_ENDPOINTS = [
  'http://localhost:3000/api/dev/city-overlay',
  'http://127.0.0.1:3000/api/dev/city-overlay',
  '/__oyasumi/city-overlay',
]

function toRing(pts: Pt[], world: JapanMapWorld): CityOverlayLngLat[] {
  return pts.map((p) => {
    const { lng, lat } = canvasToLngLat(p, world)
    return [lng, lat]
  })
}

export function buildCityOverlayPayload(opts: {
  world: JapanMapWorld
  zones: Zone[]
  buildings: Building[]
  roads: RoadLike[]
  rivers: RoadLike[]
  walls: { pts: Pt[]; width: number }[]
  id?: string
  name?: string
}): CityOverlayPayload {
  const { world } = opts
  const buildings = opts.buildings.slice(0, MAX_BUILDINGS).map((b) => ({
    ring: toRing(buildingCorners(b), world),
    color: b.color,
  }))

  return {
    version: 1,
    id: opts.id,
    name: opts.name,
    prototype: true,
    createdAt: new Date().toISOString(),
    note:
      'PROTOTIPO — zone solo authoring (non disegnate in dashboard). Rollback: elimina city-overlay.json / city-blocks/* o spegni «Città».',
    zones: opts.zones.map((z) => ({ ring: toRing(z.pts, world) })),
    buildings,
    roads: opts.roads.map((r) => ({ line: toRing(r.pts, world), width: r.width })),
    rivers: opts.rivers.map((r) => ({ line: toRing(r.pts, world), width: r.width })),
    walls: opts.walls.map((w) => ({ line: toRing(w.pts, world), width: w.width })),
  }
}

async function postOverlay(
  url: string,
  body: unknown,
): Promise<{ ok: true; path?: string } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      return { ok: false, error: `${url} → ${(await res.text()) || res.status}` }
    }
    const data = (await res.json().catch(() => ({}))) as { path?: string }
    return { ok: true, path: data.path }
  } catch (e) {
    return { ok: false, error: `${url} → ${e instanceof Error ? e.message : String(e)}` }
  }
}

/** Scrive su disco via Next API (preferito) o plugin Vite tester. */
export async function applyCityOverlayToDashboard(
  payload: CityOverlayPayload,
  opts?: { saveAs?: string },
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const body = { payload, saveAs: opts?.saveAs }
  const errors: string[] = []
  for (const url of DASHBOARD_ENDPOINTS) {
    const result = await postOverlay(url, body)
    if (result.ok) {
      return { ok: true, path: result.path ?? url }
    }
    errors.push(result.error)
  }
  return { ok: false, error: errors.join(' | ') }
}

export async function clearCityOverlayOnDashboard(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const errors: string[] = []
  for (const url of DASHBOARD_ENDPOINTS) {
    const result = await postOverlay(url, { clear: true })
    if (result.ok) return { ok: true }
    errors.push(result.error)
  }
  return { ok: false, error: errors.join(' | ') }
}
