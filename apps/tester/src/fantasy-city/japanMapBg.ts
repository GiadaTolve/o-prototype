/**
 * Sfondo mappa Giappone (GeoJSON) — estetica allineata a JapanInteractiveMap (dashboard).
 */
export type Pt = { x: number; y: number }

export type JapanRegionPoly = {
  region: string
  rings: Pt[][]
}

/** Palette allineata a JapanInteractiveMap + japan-interactive-map.css */
export const MAP_PALETTE = {
  /** --jim-pitch */
  background: '#08070a',
  ocean: '#08070a',
  /** Radial midtone under stone */
  oceanGlow: '#1a1620',
  /** FILL.base / hover / selectedGold */
  landFill: 'rgba(28, 24, 34, 0.42)',
  landFillHover: 'rgba(36, 30, 44, 0.62)',
  landFillSelected: 'rgba(94, 77, 39, 0.62)',
  /** STROKE.base / selectedGold */
  landStroke: 'rgba(138, 115, 67, 0.55)',
  landStrokeSelected: 'rgba(255, 215, 0, 0.92)',
  prefStroke: 'rgba(138, 115, 67, 0.32)',
  building: '#9a92a8',
  buildingStroke: 'rgba(201, 168, 74, 0.55)',
  buildingShadow: 'rgba(0, 0, 0, 0.55)',
  road: '#8a7340',
  roadEdge: 'rgba(10, 10, 15, 0.7)',
  river: 'rgba(74, 50, 110, 0.85)',
  riverHighlight: 'rgba(162, 112, 255, 0.35)',
  wall: '#c9a84a',
  wallCore: '#1a1624',
  zoneFill: 'rgba(201, 168, 74, 0.08)',
  zoneStroke: 'rgba(201, 168, 74, 0.45)',
  draft: '#c9a84a',
  gold: '#c9a84a',
  violet: '#a270ff',
} as const

export type JapanMapWorld = {
  width: number
  height: number
  regions: JapanRegionPoly[]
  prefs: Pt[][]
  geo: { minLng: number; minLat: number; maxLng: number; maxLat: number }
  /** darkstone.png — stesso asset della dashboard */
  stone: HTMLImageElement | null
}

function walkCoords(coords: unknown, out: number[][]): void {
  if (!Array.isArray(coords) || coords.length === 0) return
  if (typeof coords[0] === 'number') {
    out.push(coords as number[])
    return
  }
  for (const c of coords) walkCoords(c, out)
}

function projectRing(
  ring: number[][],
  geo: JapanMapWorld['geo'],
  width: number,
  height: number,
  pad: number,
): Pt[] {
  const { minLng, minLat, maxLng, maxLat } = geo
  const spanLng = maxLng - minLng || 1
  const spanLat = maxLat - minLat || 1
  const usableW = width - pad * 2
  const usableH = height - pad * 2
  return ring.map(([lng, lat]) => ({
    x: pad + ((lng! - minLng) / spanLng) * usableW,
    y: pad + (1 - (lat! - minLat) / spanLat) * usableH,
  }))
}

function boundsOf(features: GeoJSON.Feature[]): JapanMapWorld['geo'] {
  let minLng = 180
  let minLat = 90
  let maxLng = -180
  let maxLat = -90
  const pts: number[][] = []
  for (const f of features) {
    if (!f.geometry) continue
    walkCoords((f.geometry as GeoJSON.Geometry & { coordinates: unknown }).coordinates, pts)
  }
  for (const p of pts) {
    minLng = Math.min(minLng, p[0]!)
    maxLng = Math.max(maxLng, p[0]!)
    minLat = Math.min(minLat, p[1]!)
    maxLat = Math.max(maxLat, p[1]!)
  }
  return { minLng, minLat, maxLng, maxLat }
}

function extractPolygons(geom: GeoJSON.Geometry): number[][][] {
  if (geom.type === 'Polygon') {
    return [geom.coordinates[0] as number[][]]
  }
  if (geom.type === 'MultiPolygon') {
    return geom.coordinates.map((poly) => poly[0] as number[][])
  }
  return []
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

export async function loadJapanMapWorld(opts?: {
  width?: number
  height?: number
}): Promise<JapanMapWorld> {
  const width = opts?.width ?? 1600
  const height = opts?.height ?? 1100
  const pad = 40

  const [regionsRes, prefsRes, stone] = await Promise.all([
    fetch('./maps/geo/japan-regions.geojson'),
    fetch('./maps/geo/ogon-prefectures.geojson').catch(() => null),
    loadImage('./backgrounds/darkstone.png'),
  ])
  if (!regionsRes.ok) throw new Error(`japan-regions ${regionsRes.status}`)
  const regionsJson = (await regionsRes.json()) as GeoJSON.FeatureCollection
  const features = regionsJson.features ?? []
  const geo = boundsOf(features)

  const regions: JapanRegionPoly[] = []
  for (const f of features) {
    if (!f.geometry) continue
    const region = String((f.properties as { region?: string })?.region ?? 'unknown')
    const polys = extractPolygons(f.geometry)
    for (const outer of polys) {
      if (!outer || outer.length < 3) continue
      regions.push({
        region,
        rings: [projectRing(outer, geo, width, height, pad)],
      })
    }
  }

  const prefs: Pt[][] = []
  if (prefsRes && prefsRes.ok) {
    const prefsJson = (await prefsRes.json()) as GeoJSON.FeatureCollection
    for (const f of prefsJson.features ?? []) {
      if (!f.geometry) continue
      for (const outer of extractPolygons(f.geometry)) {
        if (outer.length >= 3) prefs.push(projectRing(outer, geo, width, height, pad))
      }
    }
  }

  return { width, height, regions, prefs, geo, stone }
}

/** Pad usato in projectRing — tenere allineato con loadJapanMapWorld. */
export const JAPAN_MAP_PAD = 40

/** Inverso equirettangolare: canvas → lng/lat (per overlay Leaflet). */
export function canvasToLngLat(
  pt: Pt,
  world: Pick<JapanMapWorld, 'width' | 'height' | 'geo'>,
  pad: number = JAPAN_MAP_PAD,
): { lng: number; lat: number } {
  const { minLng, minLat, maxLng, maxLat } = world.geo
  const spanLng = maxLng - minLng || 1
  const spanLat = maxLat - minLat || 1
  const usableW = world.width - pad * 2
  const usableH = world.height - pad * 2
  const lng = minLng + ((pt.x - pad) / usableW) * spanLng
  const lat = minLat + (1 - (pt.y - pad) / usableH) * spanLat
  return { lng, lat }
}

/** Focus viewport su regione (es. ogon). */
export function regionBounds(world: JapanMapWorld, regionId: string): {
  minX: number
  minY: number
  maxX: number
  maxY: number
} | null {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let found = false
  for (const r of world.regions) {
    if (r.region !== regionId) continue
    found = true
    for (const ring of r.rings) {
      for (const p of ring) {
        minX = Math.min(minX, p.x)
        minY = Math.min(minY, p.y)
        maxX = Math.max(maxX, p.x)
        maxY = Math.max(maxY, p.y)
      }
    }
  }
  return found ? { minX, minY, maxX, maxY } : null
}

/** Sfondo pitch + darkstone + glow in coordinate schermo (non zooma). */
export function drawJimPitchBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  stone: HTMLImageElement | null,
) {
  const C = MAP_PALETTE
  ctx.fillStyle = C.ocean
  ctx.fillRect(0, 0, width, height)

  if (stone) {
    const tile = 160
    const scale = tile / Math.max(stone.width, 1)
    ctx.save()
    ctx.scale(scale, scale)
    const fillPat = ctx.createPattern(stone, 'repeat')
    if (fillPat) {
      ctx.fillStyle = fillPat
      ctx.fillRect(0, 0, width / scale, height / scale)
    }
    ctx.restore()
  }

  const glow = ctx.createRadialGradient(
    width * 0.5,
    height * 0.45,
    0,
    width * 0.5,
    height * 0.45,
    Math.max(width, height) * 0.55,
  )
  glow.addColorStop(0, 'rgba(26, 22, 32, 0.85)')
  glow.addColorStop(0.72, 'rgba(8, 7, 10, 0.55)')
  glow.addColorStop(1, 'rgba(8, 7, 10, 0.92)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, width, height)

  const paperGold = ctx.createRadialGradient(
    width * 0.3,
    height * 0.2,
    0,
    width * 0.3,
    height * 0.2,
    Math.max(width, height) * 0.55,
  )
  paperGold.addColorStop(0, 'rgba(138, 115, 67, 0.1)')
  paperGold.addColorStop(0.55, 'transparent')
  ctx.fillStyle = paperGold
  ctx.fillRect(0, 0, width, height)

  const paperViolet = ctx.createRadialGradient(
    width * 0.8,
    height * 0.7,
    0,
    width * 0.8,
    height * 0.7,
    Math.max(width, height) * 0.45,
  )
  paperViolet.addColorStop(0, 'rgba(74, 21, 75, 0.08)')
  paperViolet.addColorStop(0.5, 'transparent')
  ctx.fillStyle = paperViolet
  ctx.fillRect(0, 0, width, height)
}

/** Geometrie regione/pref — fill semitrasparenti (la pietra resta sotto, screen-space). */
export function drawJapanBackground(
  ctx: CanvasRenderingContext2D,
  world: JapanMapWorld,
  opts?: { focusRegion?: string; fillOcean?: boolean },
) {
  const { width: bgW, height: bgH } = world
  const C = MAP_PALETTE
  const focus = opts?.focusRegion

  // Export / fallback: ocean+stone in world space
  if (opts?.fillOcean !== false) {
    ctx.fillStyle = C.ocean
    ctx.fillRect(0, 0, bgW, bgH)
    if (world.stone) {
      const tile = 160
      const scale = tile / Math.max(world.stone.width, 1)
      ctx.save()
      ctx.scale(scale, scale)
      const fillPat = ctx.createPattern(world.stone, 'repeat')
      if (fillPat) {
        ctx.fillStyle = fillPat
        ctx.fillRect(0, 0, bgW / scale, bgH / scale)
      }
      ctx.restore()
    }
  }

  for (const r of world.regions) {
    const selected = focus != null && r.region === focus
    for (const ring of r.rings) {
      if (ring.length < 3) continue
      ctx.beginPath()
      ctx.moveTo(ring[0]!.x, ring[0]!.y)
      for (let i = 1; i < ring.length; i++) ctx.lineTo(ring[i]!.x, ring[i]!.y)
      ctx.closePath()
      ctx.fillStyle = selected ? C.landFillSelected : C.landFill
      ctx.fill()
      ctx.strokeStyle = selected ? C.landStrokeSelected : C.landStroke
      ctx.lineWidth = selected ? 1.4 : 1.1
      ctx.stroke()
    }
  }

  ctx.strokeStyle = C.prefStroke
  ctx.lineWidth = 0.9
  ctx.globalAlpha = 0.75
  ctx.setLineDash([4, 5])
  for (const ring of world.prefs) {
    if (ring.length < 3) continue
    ctx.beginPath()
    ctx.moveTo(ring[0]!.x, ring[0]!.y)
    for (let i = 1; i < ring.length; i++) ctx.lineTo(ring[i]!.x, ring[i]!.y)
    ctx.closePath()
    ctx.stroke()
  }
  ctx.setLineDash([])
  ctx.globalAlpha = 1
}

/** Fog + vignette in coordinate schermo (come overlay .jim__fx). */
export function drawJimViewportFx(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const fogTop = ctx.createLinearGradient(0, 0, 0, height * 0.26)
  fogTop.addColorStop(0, 'rgba(8, 7, 10, 0.38)')
  fogTop.addColorStop(0.4, 'rgba(8, 7, 10, 0.12)')
  fogTop.addColorStop(1, 'transparent')
  ctx.fillStyle = fogTop
  ctx.fillRect(0, 0, width, height * 0.26)

  const fogBot = ctx.createLinearGradient(0, height, 0, height * 0.68)
  fogBot.addColorStop(0, 'rgba(8, 7, 10, 0.5)')
  fogBot.addColorStop(0.35, 'rgba(8, 7, 10, 0.18)')
  fogBot.addColorStop(1, 'transparent')
  ctx.fillStyle = fogBot
  ctx.fillRect(0, height * 0.68, width, height * 0.32)

  const sideL = ctx.createLinearGradient(0, 0, width * 0.2, 0)
  sideL.addColorStop(0, 'rgba(8, 7, 10, 0.32)')
  sideL.addColorStop(1, 'transparent')
  ctx.fillStyle = sideL
  ctx.fillRect(0, 0, width * 0.2, height)

  const sideR = ctx.createLinearGradient(width, 0, width * 0.8, 0)
  sideR.addColorStop(0, 'rgba(8, 7, 10, 0.32)')
  sideR.addColorStop(1, 'transparent')
  ctx.fillStyle = sideR
  ctx.fillRect(width * 0.8, 0, width * 0.2, height)

  const vignette = ctx.createRadialGradient(
    width * 0.5,
    height * 0.48,
    Math.min(width, height) * 0.28,
    width * 0.5,
    height * 0.48,
    Math.max(width, height) * 0.72,
  )
  vignette.addColorStop(0, 'transparent')
  vignette.addColorStop(0.55, 'transparent')
  vignette.addColorStop(0.78, 'rgba(8, 7, 10, 0.14)')
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.32)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, width, height)
}
