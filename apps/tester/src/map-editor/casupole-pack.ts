/**
 * Packing casupole Watabou in un poligono geografico (limiti antifreeze).
 */
export type GeoPt = { lat: number; lng: number }

export type Corridor = {
  id: string
  kind: 'road' | 'water' | 'wall'
  path: GeoPt[]
  widthM: number
}

export type Casupola = {
  id: string
  footprint: GeoPt[]
  solid?: boolean
}

type XY = { x: number; y: number }

type LocalProj = {
  toXY: (p: GeoPt) => XY
  toGeo: (p: XY) => GeoPt
}

/** Cap assoluto per non far crashare canvas/UI. */
export const MAX_CASUPOLE = 900

function makeProj(origin: GeoPt): LocalProj {
  const mPerDegLat = 111_320
  const mPerDegLng = 111_320 * Math.cos((origin.lat * Math.PI) / 180)
  return {
    toXY: (p) => ({
      x: (p.lng - origin.lng) * mPerDegLng,
      y: (p.lat - origin.lat) * mPerDegLat,
    }),
    toGeo: (p) => ({
      lat: origin.lat + p.y / mPerDegLat,
      lng: origin.lng + p.x / mPerDegLng,
    }),
  }
}

function mulberry32(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function centroidGeo(ring: GeoPt[]): GeoPt {
  let lat = 0
  let lng = 0
  for (const p of ring) {
    lat += p.lat
    lng += p.lng
  }
  const n = ring.length || 1
  return { lat: lat / n, lng: lng / n }
}

function pointInPoly(p: XY, poly: XY[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const pi = poly[i]!
    const pj = poly[j]!
    const hit =
      pi.y > p.y !== pj.y > p.y &&
      p.x < ((pj.x - pi.x) * (p.y - pi.y)) / (pj.y - pi.y + 1e-12) + pi.x
    if (hit) inside = !inside
  }
  return inside
}

function distToSeg(p: XY, a: XY, b: XY): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  if (len2 < 1e-8) return Math.hypot(p.x - a.x, p.y - a.y)
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

function distToPath(p: XY, path: XY[]): number {
  let best = Infinity
  for (let i = 0; i < path.length - 1; i++) {
    best = Math.min(best, distToSeg(p, path[i]!, path[i + 1]!))
  }
  return best
}

function bbox(poly: XY[]) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of poly) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }
  return { minX, minY, maxX, maxY }
}

function irregularQuad(
  cx: number,
  cy: number,
  w: number,
  h: number,
  ang: number,
  rand: () => number,
): XY[] {
  const hw = w / 2
  const hh = h / 2
  const cos = Math.cos(ang)
  const sin = Math.sin(ang)
  const j = 0.7
  return [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ].map((c) => {
    const x = c.x + (rand() - 0.5) * j
    const y = c.y + (rand() - 0.5) * j
    return {
      x: cx + x * cos - y * sin,
      y: cy + x * sin + y * cos,
    }
  })
}

type Block = { cx: number; cy: number; halfU: number; halfV: number; ang: number }

function subdivide(
  cx: number,
  cy: number,
  halfU: number,
  halfV: number,
  ang: number,
  rand: () => number,
  minSize: number,
  depth: number,
  alley: number,
  out: Block[],
  maxBlocks: number,
) {
  if (out.length >= maxBlocks) return
  const w = halfU * 2
  const h = halfV * 2
  if (w < minSize * 2.15 || h < minSize * 2.15 || depth > 5 || (depth > 1 && rand() < 0.28)) {
    out.push({ cx, cy, halfU, halfV, ang })
    return
  }

  const gap = alley * (0.55 + rand() * 0.55)
  if (w >= h) {
    const cut = (0.38 + rand() * 0.24) * w - halfU
    const leftW = cut + halfU - gap / 2
    const rightW = halfU - cut - gap / 2
    if (leftW < minSize || rightW < minSize) {
      out.push({ cx, cy, halfU, halfV, ang })
      return
    }
    const dirx = Math.cos(ang)
    const diry = Math.sin(ang)
    subdivide(cx + dirx * (-halfU + leftW / 2), cy + diry * (-halfU + leftW / 2), leftW / 2, halfV, ang, rand, minSize, depth + 1, alley, out, maxBlocks)
    subdivide(cx + dirx * (halfU - rightW / 2), cy + diry * (halfU - rightW / 2), rightW / 2, halfV, ang, rand, minSize, depth + 1, alley, out, maxBlocks)
  } else {
    const cut = (0.38 + rand() * 0.24) * h - halfV
    const topH = cut + halfV - gap / 2
    const botH = halfV - cut - gap / 2
    if (topH < minSize || botH < minSize) {
      out.push({ cx, cy, halfU, halfV, ang })
      return
    }
    const dirx = -Math.sin(ang)
    const diry = Math.cos(ang)
    subdivide(cx + dirx * (-halfV + topH / 2), cy + diry * (-halfV + topH / 2), halfU, topH / 2, ang, rand, minSize, depth + 1, alley, out, maxBlocks)
    subdivide(cx + dirx * (halfV - botH / 2), cy + diry * (halfV - botH / 2), halfU, botH / 2, ang, rand, minSize, depth + 1, alley, out, maxBlocks)
  }
}

function packBlock(
  block: Block,
  rand: () => number,
  poly: XY[],
  corridors: { path: XY[]; halfW: number }[],
  density: number,
  remaining: number,
): XY[][] {
  if (remaining <= 0) return []
  const out: XY[][] = []
  const { cx, cy, halfU, halfV, ang } = block
  const dirU = { x: Math.cos(ang), y: Math.sin(ang) }
  const dirV = { x: -Math.sin(ang), y: Math.cos(ang) }

  const clear = (p: XY) => {
    if (!pointInPoly(p, poly)) return false
    for (const c of corridors) {
      if (distToPath(p, c.path) < c.halfW) return false
    }
    return true
  }

  const place = (px: number, py: number, w: number, h: number, a: number) => {
    if (out.length >= remaining) return
    if (!clear({ x: px, y: py })) return
    out.push(irregularQuad(px, py, w, h, a, rand))
  }

  const inset = 1.4
  const u0 = -halfU + inset
  const u1 = halfU - inset
  const v0 = -halfV + inset
  const v1 = halfV - inset
  if (u1 - u0 < 8 || v1 - v0 < 8) return out

  // Scala footprint con dimensione blocco (aree grandi = casupole più grosse, meno pezzi)
  const scale = Math.max(1, Math.min(4, Math.min(halfU, halfV) / 28))
  const depthMin = 5.5 * scale
  const depthMax = (8 + density * 3) * scale
  const frontMin = 5 * scale
  const frontMax = (7.5 + density * 2.5) * scale
  const step = Math.max(6, (7.5 - density * 1.5) * scale)

  const edge = (alongU: boolean, sign: number, edgeHalf: number) => {
    let cursor = alongU ? u0 : v0
    const end = alongU ? u1 : v1
    let guard = 0
    while (cursor < end - frontMin && out.length < remaining && guard++ < 80) {
      if (rand() > 0.12 + density * 0.85) {
        cursor += frontMin * 0.6
        continue
      }
      const front = frontMin + rand() * (frontMax - frontMin)
      const depth = depthMin + rand() * (depthMax - depthMin)
      if (cursor + front > end) break
      const mid = cursor + front / 2
      const px = alongU
        ? cx + dirU.x * mid + dirV.x * sign * (edgeHalf - depth / 2)
        : cx + dirV.x * mid + dirU.x * sign * (edgeHalf - depth / 2)
      const py = alongU
        ? cy + dirU.y * mid + dirV.y * sign * (edgeHalf - depth / 2)
        : cy + dirV.y * mid + dirU.y * sign * (edgeHalf - depth / 2)
      place(px, py, front, depth, alongU ? ang : ang + Math.PI / 2)
      cursor += front + 1 + rand() * 1.5 * scale
    }
  }

  edge(true, -1, halfV)
  edge(true, 1, halfV)
  edge(false, -1, halfU)
  edge(false, 1, halfU)

  const pad = depthMax + 2
  let iu = 0
  for (let u = u0 + pad; u < u1 - pad && out.length < remaining; u += step) {
    for (let v = v0 + pad; v < v1 - pad && out.length < remaining; v += step) {
      if (++iu > 400) return out
      if (rand() > density * 0.75) continue
      place(
        cx + dirU.x * u + dirV.x * v,
        cy + dirU.y * u + dirV.y * v,
        4.5 * scale + rand() * 4 * scale,
        4.5 * scale + rand() * 4 * scale,
        ang + (rand() - 0.5) * 0.12,
      )
    }
  }

  return out
}

export type FillOptions = {
  density?: number
  seed?: number
  angle?: number
  maxBuildings?: number
}

export function fillAreaWithCasupole(
  ring: GeoPt[],
  corridors: Corridor[],
  opts: FillOptions = {},
): Casupola[] {
  if (ring.length < 3) return []

  try {
    const density = Math.max(0.3, Math.min(1, opts.density ?? 0.75))
    const maxBuildings = Math.min(MAX_CASUPOLE, opts.maxBuildings ?? MAX_CASUPOLE)
    const seed =
      opts.seed ??
      Math.floor(ring.reduce((a, p) => a + p.lat * 1e3 + p.lng * 1e5, 0) + corridors.length * 97)
    const rand = mulberry32(seed >>> 0)
    const origin = centroidGeo(ring)
    const proj = makeProj(origin)
    const poly = ring.map(proj.toXY)
    const bb = bbox(poly)
    const width = bb.maxX - bb.minX
    const height = bb.maxY - bb.minY
    if (width < 25 || height < 25) return []

    const area = width * height
    // Rifiuta aree enormi (es. mezza prefettura) — crash garantito
    if (area > 12_000_000) {
      return []
    }

    const target = Math.min(maxBuildings, Math.max(40, Math.floor(area / 900)))
    const minSize = Math.max(18, Math.sqrt(area / Math.max(40, target)) * 0.7)
    const alley = Math.max(5, minSize * 0.2)
    const maxBlocks = Math.min(180, Math.max(12, Math.floor(target / 4)))

    const corrLocal = corridors
      .filter((c) => c.path.length >= 2)
      .map((c) => ({
        path: c.path.map(proj.toXY),
        halfW: c.widthM / 2 + (c.kind === 'wall' ? 5 : c.kind === 'water' ? 3 : 2),
      }))

    const ang =
      opts.angle ?? (width >= height ? 0 : Math.PI / 2) + (rand() - 0.5) * 0.15
    const cx = (bb.minX + bb.maxX) / 2
    const cy = (bb.minY + bb.maxY) / 2
    const halfU = Math.max(width, height) * 0.48
    const halfV = Math.min(width, height) * 0.48

    const blocks: Block[] = []
    subdivide(cx, cy, halfU, halfV, ang, rand, minSize, 0, alley, blocks, maxBlocks)

    const result: Casupola[] = []
    let id = 1
    for (const b of blocks) {
      if (result.length >= target) break
      if (!pointInPoly({ x: b.cx, y: b.cy }, poly)) continue
      if (corrLocal.some((c) => distToPath({ x: b.cx, y: b.cy }, c.path) < c.halfW + 3)) continue

      const footprints = packBlock(b, rand, poly, corrLocal, density, target - result.length)
      for (const fp of footprints) {
        if (result.length >= target) break
        const inside = fp.filter((p) => pointInPoly(p, poly)).length
        if (inside < 3) continue
        if (fp.some((p) => corrLocal.some((c) => distToPath(p, c.path) < c.halfW * 0.9))) continue
        result.push({
          id: `c-${id++}`,
          footprint: fp.map(proj.toGeo),
        })
      }
    }
    return result
  } catch {
    return []
  }
}

export function refillDistricts(
  districts: { id: string; ring: GeoPt[] }[],
  corridors: Corridor[],
  density = 0.75,
): { buildings: Casupola[]; skippedHuge: number } {
  const all: Casupola[] = []
  let skippedHuge = 0
  const perDistrict = Math.max(80, Math.floor(MAX_CASUPOLE / Math.max(1, districts.length)))

  for (const d of districts) {
    if (all.length >= MAX_CASUPOLE) break
    const packed = fillAreaWithCasupole(d.ring, corridors, {
      density,
      seed: Math.floor((d.ring[0]?.lat ?? 0) * 1e6 + (d.ring[0]?.lng ?? 0) * 1e6),
      maxBuildings: Math.min(perDistrict, MAX_CASUPOLE - all.length),
    })
    if (packed.length === 0) {
      // probabilmente area troppo grande
      const origin = centroidGeo(d.ring)
      const proj = makeProj(origin)
      const bb = bbox(d.ring.map(proj.toXY))
      const area = (bb.maxX - bb.minX) * (bb.maxY - bb.minY)
      if (area > 12_000_000) skippedHuge++
    }
    for (const b of packed) {
      all.push({ ...b, id: `${d.id}-${b.id}` })
    }
  }
  return { buildings: all, skippedHuge }
}
