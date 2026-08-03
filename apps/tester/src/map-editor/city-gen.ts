/**
 * Generatore città Watabou-like: wards → subdivision a blocchi → packing edifici
 * lungo i bordi strada (non griglia jitterata).
 */
import type {
  Building,
  MapLabel,
  MedievalMapDocument,
  Polygon,
  Polyline,
  Road,
  Vec2,
} from './map-schema'
import { WATABOU_PALETTE } from './map-schema'

type Rand = () => number

function mulberry32(seed: number): Rand {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function uid(prefix: string, rand: Rand) {
  return `${prefix}-${Math.floor(rand() * 1e9).toString(36)}`
}

function dist(a: Vec2, b: Vec2) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function lerp(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y }
}

function scale(a: Vec2, s: number): Vec2 {
  return { x: a.x * s, y: a.y * s }
}

function perp(a: Vec2): Vec2 {
  return { x: -a.y, y: a.x }
}

function pointInPoly(p: Vec2, poly: Polygon): boolean {
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

function distToSeg(p: Vec2, a: Vec2, b: Vec2): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  if (len2 < 1e-6) return dist(p, a)
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return dist(p, { x: a.x + t * dx, y: a.y + t * dy })
}

function distToPolyline(p: Vec2, path: Polyline): number {
  let best = Infinity
  for (let i = 0; i < path.length - 1; i++) {
    best = Math.min(best, distToSeg(p, path[i]!, path[i + 1]!))
  }
  return best
}

function smoothPolyline(pts: Polyline, rounds = 2): Polyline {
  let cur = pts
  for (let r = 0; r < rounds; r++) {
    const next: Polyline = [cur[0]!]
    for (let i = 0; i < cur.length - 1; i++) {
      const a = cur[i]!
      const b = cur[i + 1]!
      next.push(
        { x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 },
        { x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 },
      )
    }
    next.push(cur[cur.length - 1]!)
    cur = next
  }
  return cur
}

function orientRect(cx: number, cy: number, w: number, h: number, ang: number): Polygon {
  const hw = w / 2
  const hh = h / 2
  const cos = Math.cos(ang)
  const sin = Math.sin(ang)
  return [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ].map((c) => ({
    x: cx + c.x * cos - c.y * sin,
    y: cy + c.x * sin + c.y * cos,
  }))
}

function irregularBuilding(
  cx: number,
  cy: number,
  w: number,
  h: number,
  ang: number,
  rand: Rand,
  jitter = 0.9,
): Polygon {
  return orientRect(cx, cy, w, h, ang).map((p) => ({
    x: p.x + (rand() - 0.5) * jitter,
    y: p.y + (rand() - 0.5) * jitter,
  }))
}

type Block = {
  ang: number
  c: Vec2
  halfU: number
  halfV: number
  density: number
  solid?: boolean
}

type Ward = {
  c: Vec2
  halfU: number
  halfV: number
  ang: number
  density: number
  solid?: boolean
  alley: number
}

/** Suddivisione ricorsiva con gap (vicoli) tra i pezzi. */
function subdivideBlock(
  c: Vec2,
  halfU: number,
  halfV: number,
  ang: number,
  density: number,
  rand: Rand,
  minU: number,
  minV: number,
  depth: number,
  out: Block[],
  alleyW: number,
) {
  const w = halfU * 2
  const h = halfV * 2
  const tooSmall = w < minU * 2.2 || h < minV * 2.2 || depth > 7
  const stopChance = depth > 2 && rand() < 0.22
  if (tooSmall || stopChance) {
    out.push({ c, halfU, halfV, ang, density })
    return
  }

  const splitU = w >= h
  const gap = alleyW * (0.55 + rand() * 0.7)
  if (splitU) {
    const cut = (0.35 + rand() * 0.3) * w - halfU
    const leftW = cut + halfU - gap / 2
    const rightW = halfU - cut - gap / 2
    if (leftW < minU || rightW < minU) {
      out.push({ c, halfU, halfV, ang, density })
      return
    }
    const dir = { x: Math.cos(ang), y: Math.sin(ang) }
    const cL = add(c, scale(dir, -halfU + leftW / 2))
    const cR = add(c, scale(dir, halfU - rightW / 2))
    subdivideBlock(cL, leftW / 2, halfV, ang, density, rand, minU, minV, depth + 1, out, alleyW)
    subdivideBlock(cR, rightW / 2, halfV, ang, density, rand, minU, minV, depth + 1, out, alleyW)
  } else {
    const cut = (0.35 + rand() * 0.3) * h - halfV
    const topH = cut + halfV - gap / 2
    const botH = halfV - cut - gap / 2
    if (topH < minV || botH < minV) {
      out.push({ c, halfU, halfV, ang, density })
      return
    }
    const dir = { x: -Math.sin(ang), y: Math.cos(ang) }
    const cT = add(c, scale(dir, -halfV + topH / 2))
    const cB = add(c, scale(dir, halfV - botH / 2))
    subdivideBlock(cT, halfU, topH / 2, ang, density, rand, minU, minV, depth + 1, out, alleyW)
    subdivideBlock(cB, halfU, botH / 2, ang, density, rand, minU, minV, depth + 1, out, alleyW)
  }
}

/**
 * Pack edifici in un blocco: file lungo i 4 lati (facciata su strada),
 * poi riempimento interno.
 */
function packBlockBuildings(
  block: Block,
  rand: Rand,
  riverPath: Polyline,
  riverW: number,
  land: Polygon,
  coastY: number,
): Building[] {
  const out: Building[] = []
  const { c, halfU, halfV, ang, density, solid } = block
  const dirU = { x: Math.cos(ang), y: Math.sin(ang) }
  const dirV = perp(dirU)

  const inset = 1.2
  const u0 = -halfU + inset
  const u1 = halfU - inset
  const v0 = -halfV + inset
  const v1 = halfV - inset
  if (u1 - u0 < 6 || v1 - v0 < 6) return out

  const depthMin = 5.5
  const depthMax = 9 + density * 4
  const frontMin = 5
  const frontMax = 8.5 + density * 3

  const tryPlace = (cx: number, cy: number, w: number, h: number, a: number, forceSolid?: boolean) => {
    const p = { x: cx, y: cy }
    if (!pointInPoly(p, land)) return
    if (p.y < coastY + 10) return
    if (distToPolyline(p, riverPath) < riverW * 0.52 + 3) return
    out.push({
      id: uid('b', rand),
      kind: forceSolid || solid ? 'landmark' : 'house',
      solid: forceSolid || solid,
      footprint: irregularBuilding(cx, cy, w, h, a, rand, solid ? 0.4 : 1.1),
    })
  }

  const placeEdge = (alongU: boolean, sign: number, edgeHalf: number) => {
    let cursor = alongU ? u0 : v0
    const end = alongU ? u1 : v1
    while (cursor < end - frontMin) {
      if (rand() > 0.08 + density * 0.9) {
        cursor += frontMin * 0.6
        continue
      }
      const front = frontMin + rand() * (frontMax - frontMin)
      const depth = depthMin + rand() * (depthMax - depthMin)
      if (cursor + front > end) break
      const mid = cursor + front / 2
      const local = alongU
        ? add(add(c, scale(dirU, mid)), scale(dirV, sign * (edgeHalf - depth / 2 - inset * 0.3)))
        : add(add(c, scale(dirV, mid)), scale(dirU, sign * (edgeHalf - depth / 2 - inset * 0.3)))
      const a = alongU ? ang : ang + Math.PI / 2
      tryPlace(local.x, local.y, front, depth, a)
      cursor += front + 0.7 + rand() * 1.4
    }
  }

  placeEdge(true, -1, halfV)
  placeEdge(true, 1, halfV)
  placeEdge(false, -1, halfU)
  placeEdge(false, 1, halfU)

  const innerPad = depthMax + 1.5
  const iu0 = u0 + innerPad
  const iu1 = u1 - innerPad
  const iv0 = v0 + innerPad
  const iv1 = v1 - innerPad
  if (iu1 > iu0 && iv1 > iv0 && density > 0.35) {
    const stepU = 7.5 - density * 2
    const stepV = 7.5 - density * 2
    for (let u = iu0; u < iu1; u += stepU) {
      for (let v = iv0; v < iv1; v += stepV) {
        if (rand() > density * 0.85) continue
        const w = 5 + rand() * 5
        const h = 5 + rand() * 5
        const p = add(
          add(c, scale(dirU, u + (rand() - 0.5) * 1.5)),
          scale(dirV, v + (rand() - 0.5) * 1.5),
        )
        tryPlace(p.x, p.y, w, h, ang + (rand() - 0.5) * 0.2)
      }
    }
  }

  return out
}

function labelAlong(
  text: string,
  path: Polyline,
  t0: number,
  t1: number,
  size: number,
  id: string,
): MapLabel {
  const n = 24
  const samples: Vec2[] = []
  for (let i = 0; i <= n; i++) {
    const t = t0 + (t1 - t0) * (i / n)
    const f = t * (path.length - 1)
    const i0 = Math.min(path.length - 2, Math.floor(f))
    const u = f - i0
    const a = path[i0]!
    const b = path[i0 + 1]!
    samples.push({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u })
  }
  const p0 = samples[0]!
  const p3 = samples[samples.length - 1]!
  const p1 = samples[Math.floor(n / 3)]!
  const p2 = samples[Math.floor((2 * n) / 3)]!
  return {
    id,
    text,
    font: {
      family: 'IM Fell Great Primer, EB Garamond, Georgia, serif',
      size,
      letterSpacing: 0.12,
      fill: WATABOU_PALETTE.ink,
    },
    anchor: { x: (p0.x + p3.x) / 2, y: (p0.y + p3.y) / 2 },
    startAngle: 0,
    arcAngle: 0,
    radius: 0,
    rotation: 0,
    bezier: { p0, p1, p2, p3 },
  }
}

export type CityGenOptions = {
  width?: number
  height?: number
  seed?: number
  name?: string
  density?: number
}

export function generateWatabouCity(opts: CityGenOptions = {}): MedievalMapDocument {
  const width = opts.width ?? 1100
  const height = opts.height ?? 820
  const seed = opts.seed ?? Math.floor(Math.random() * 1e9)
  const name = opts.name ?? 'Bluewood'
  const density = Math.max(0.25, Math.min(1, opts.density ?? 0.78))
  const rand = mulberry32(seed)

  const coastY = 95 + rand() * 28
  const landmass: Polygon = [
    { x: 0, y: coastY + 35 },
    { x: 90, y: coastY + 8 },
    { x: 220, y: coastY - 4 },
    { x: 400, y: coastY + 10 },
    { x: 580, y: coastY - 8 },
    { x: 760, y: coastY + 6 },
    { x: 940, y: coastY },
    { x: width, y: coastY + 22 },
    { x: width, y: height },
    { x: 0, y: height },
  ]

  const riverX = width * (0.4 + rand() * 0.12)
  const riverPath = smoothPolyline(
    [
      { x: riverX + (rand() - 0.5) * 24, y: height },
      { x: riverX + 35 + (rand() - 0.5) * 30, y: height * 0.74 },
      { x: riverX - 18 + (rand() - 0.5) * 24, y: height * 0.5 },
      { x: riverX + 8, y: height * 0.3 },
      { x: riverX - 4, y: coastY + 6 },
    ],
    2,
  )
  const riverWidth = 26 + rand() * 10

  const roads: Road[] = []
  const addRoad = (kind: Road['kind'], w: number, path: Polyline, bridges: Road['bridges'] = []) => {
    roads.push({
      id: uid('rd', rand),
      kind,
      width: w,
      path: smoothPolyline(path, 1),
      bridges,
    })
  }

  const ring: Polyline = [
    { x: riverX + 55, y: height * 0.8 },
    { x: riverX + 110, y: height * 0.58 },
    { x: riverX + 170, y: height * 0.4 },
    { x: width * 0.74, y: height * 0.33 },
    { x: width * 0.84, y: height * 0.28 },
  ]
  addRoad('primary', 10, ring)

  addRoad(
    'primary',
    9,
    [
      { x: 30, y: height * 0.64 },
      { x: width * 0.22, y: height * 0.6 },
      { x: riverX - 38, y: height * 0.56 },
    ],
    [{ id: uid('br', rand), t: 0.95, length: 34 }],
  )

  addRoad(
    'primary',
    9,
    [
      { x: riverX - 28, y: height * 0.56 },
      { x: riverX + 28, y: height * 0.55 },
      { x: width * 0.72, y: height * 0.52 },
      { x: width * 0.92, y: height * 0.5 },
    ],
    [{ id: uid('br', rand), t: 0.16, length: 38 }],
  )

  addRoad('secondary', 6.5, [
    { x: 50, y: coastY + 55 },
    { x: width * 0.22, y: coastY + 85 },
    { x: riverX - 55, y: coastY + 72 },
  ])

  addRoad('secondary', 6, [
    { x: riverX + 50, y: coastY + 60 },
    { x: width * 0.65, y: coastY + 90 },
    { x: width * 0.88, y: height * 0.38 },
  ])

  for (let i = 0; i < 10; i++) {
    const x0 = 50 + rand() * (width - 100)
    const y0 = coastY + 70 + rand() * (height - coastY - 120)
    const ang = rand() * Math.PI
    const L = 70 + rand() * 140
    addRoad(rand() > 0.4 ? 'alley' : 'secondary', 3.2 + rand() * 2.5, [
      { x: x0, y: y0 },
      {
        x: x0 + Math.cos(ang) * L * 0.45 + (rand() - 0.5) * 20,
        y: y0 + Math.sin(ang) * L * 0.45,
      },
      { x: x0 + Math.cos(ang) * L, y: y0 + Math.sin(ang) * L },
    ])
  }

  const castleCx = width * 0.78
  const castleCy = height * 0.3
  const castleR = 58
  const wallPath: Polyline = []
  for (let i = 0; i < 14; i++) {
    const t = (i / 14) * Math.PI * 2
    const j = 0.86 + rand() * 0.22
    wallPath.push({
      x: castleCx + Math.cos(t) * castleR * j,
      y: castleCy + Math.sin(t) * castleR * j * 0.88,
    })
  }

  const wards: Ward[] = [
    { c: { x: width * 0.22, y: height * 0.55 }, halfU: 140, halfV: 120, ang: -0.12, density: density * 0.95, alley: 5.5 },
    { c: { x: width * 0.2, y: coastY + 95 }, halfU: 130, halfV: 55, ang: 0.05, density: density * 0.85, alley: 5 },
    { c: { x: riverX - 95, y: height * 0.48 }, halfU: 85, halfV: 130, ang: 0.08, density, alley: 4.8 },
    { c: { x: riverX + 100, y: height * 0.5 }, halfU: 95, halfV: 125, ang: -0.05, density, alley: 4.8 },
    { c: { x: width * 0.62, y: height * 0.45 }, halfU: 110, halfV: 100, ang: 0.35, density: density * 0.92, alley: 5.2 },
    { c: { x: width * 0.75, y: height * 0.68 }, halfU: 120, halfV: 90, ang: -0.15, density: density * 0.7, alley: 6 },
    { c: { x: width * 0.1, y: height * 0.72 }, halfU: 90, halfV: 80, ang: 0.2, density: density * 0.45, alley: 7 },
    { c: { x: width * 0.9, y: height * 0.55 }, halfU: 70, halfV: 100, ang: -0.25, density: density * 0.5, alley: 7 },
    { c: { x: width * 0.68, y: height * 0.34 }, halfU: 70, halfV: 55, ang: 0.1, density: density * 0.8, alley: 5 },
    {
      c: { x: castleCx, y: castleCy },
      halfU: 38,
      halfV: 32,
      ang: 0.15,
      density: 0.9,
      alley: 3,
      solid: true,
    },
  ]

  const blocks: Block[] = []
  for (const w of wards) {
    const minU = w.solid ? 14 : 11 - density * 3
    const minV = w.solid ? 12 : 10 - density * 2.5
    if (w.solid) {
      blocks.push({
        c: w.c,
        halfU: w.halfU,
        halfV: w.halfV,
        ang: w.ang,
        density: w.density,
        solid: true,
      })
    } else {
      subdivideBlock(w.c, w.halfU, w.halfV, w.ang, w.density, rand, minU, minV, 0, blocks, w.alley)
    }
  }

  const buildings: Building[] = []
  for (const b of blocks) {
    if (b.solid) {
      const dir = { x: Math.cos(b.ang), y: Math.sin(b.ang) }
      const nrm = perp(dir)
      for (let i = 0; i < 6 + Math.floor(rand() * 3); i++) {
        const ou = (rand() - 0.5) * b.halfU * 1.4
        const ov = (rand() - 0.5) * b.halfV * 1.4
        const p = add(add(b.c, scale(dir, ou)), scale(nrm, ov))
        if (dist(p, b.c) > castleR * 0.78) continue
        buildings.push({
          id: uid('keep', rand),
          kind: i === 0 ? 'keep' : 'landmark',
          solid: true,
          footprint: irregularBuilding(
            p.x,
            p.y,
            12 + rand() * 16,
            10 + rand() * 14,
            b.ang + rand() * 0.3,
            rand,
            0.5,
          ),
        })
      }
      continue
    }
    buildings.push(...packBlockBuildings(b, rand, riverPath, riverWidth, landmass, coastY))
  }

  for (let i = 0; i < 6; i++) {
    const dx = 110 + i * 26 + rand() * 6
    const top = coastY - 16 - rand() * 18
    buildings.push({
      id: uid('dock', rand),
      kind: 'warehouse',
      footprint: [
        { x: dx, y: top },
        { x: dx + 9, y: top },
        { x: dx + 9, y: coastY + 6 },
        { x: dx, y: coastY + 6 },
      ],
      outsideWalls: true,
    })
  }
  for (let i = 0; i < 5; i++) {
    const dx = riverX + 70 + i * 24
    const top = coastY - 12 - rand() * 14
    buildings.push({
      id: uid('dock', rand),
      kind: 'warehouse',
      footprint: [
        { x: dx, y: top },
        { x: dx + 8, y: top },
        { x: dx + 8, y: coastY + 5 },
        { x: dx, y: coastY + 5 },
      ],
      outsideWalls: true,
    })
  }

  for (const w of wards) {
    if (w.solid) continue
    const dir = { x: Math.cos(w.ang), y: Math.sin(w.ang) }
    const nrm = perp(dir)
    const a = add(add(w.c, scale(dir, -w.halfU)), scale(nrm, -w.halfV * 0.15))
    const bpt = add(add(w.c, scale(dir, w.halfU)), scale(nrm, w.halfV * 0.1))
    if (rand() > 0.35) {
      addRoad('alley', 3.5, [a, lerp(a, bpt, 0.5), bpt])
    }
  }

  const labels: MapLabel[] = [
    labelAlong(
      name.toUpperCase(),
      [
        { x: width * 0.3, y: coastY - 34 },
        { x: width * 0.48, y: coastY - 40 },
        { x: width * 0.66, y: coastY - 32 },
      ],
      0,
      1,
      28,
      'lbl-city',
    ),
    labelAlong(
      'WESTERN ' + name.toUpperCase(),
      [
        { x: 45, y: height * 0.74 },
        { x: 130, y: height * 0.72 },
        { x: 220, y: height * 0.7 },
      ],
      0,
      1,
      13,
      'lbl-west',
    ),
    labelAlong(
      'WEST DOCKS',
      [
        { x: 95, y: coastY + 30 },
        { x: 165, y: coastY + 34 },
        { x: 230, y: coastY + 30 },
      ],
      0,
      1,
      11,
      'lbl-wdock',
    ),
    labelAlong(
      'HAUNTED DOCKS',
      [
        { x: riverX + 55, y: coastY + 28 },
        { x: riverX + 125, y: coastY + 32 },
        { x: riverX + 195, y: coastY + 28 },
      ],
      0,
      1,
      11,
      'lbl-hdock',
    ),
    {
      id: 'lbl-castle',
      text: 'CASTLE',
      font: {
        family: 'IM Fell Great Primer, EB Garamond, Georgia, serif',
        size: 14,
        fill: WATABOU_PALETTE.ink,
      },
      anchor: { x: castleCx, y: castleCy - 6 },
      startAngle: 0,
      arcAngle: 0,
      radius: 0,
      rotation: 0,
    },
    labelAlong('BREAD RING', ring, 0.12, 0.55, 12, 'lbl-bread'),
    labelAlong('CLOUDFALL ROAD', roads[2]!.path, 0.3, 0.85, 12, 'lbl-cloud'),
    labelAlong(
      'GRIMFIRE DISTRICT',
      [
        { x: width * 0.62, y: height * 0.74 },
        { x: width * 0.74, y: height * 0.72 },
        { x: width * 0.86, y: height * 0.7 },
      ],
      0,
      1,
      12,
      'lbl-grim',
    ),
  ]

  return {
    meta: { name, width, height, seed, version: 1 },
    terrain: {
      landmass,
      jaggedness: 0.12,
      coastStyle: 'smooth',
      grid: { enabled: true, spacing: 72, opacity: 0.16 },
    },
    water: {
      features: [
        {
          id: 'bay',
          kind: 'sea',
          width: 0,
          bankStyle: 'natural',
          geometry: [
            { x: 0, y: 0 },
            { x: width, y: 0 },
            { x: width, y: coastY + 18 },
            { x: width * 0.72, y: coastY + 4 },
            { x: width * 0.42, y: coastY + 16 },
            { x: width * 0.16, y: coastY - 2 },
            { x: 0, y: coastY + 12 },
          ],
        },
        {
          id: 'river-main',
          kind: 'river',
          width: riverWidth,
          bankStyle: 'natural',
          geometry: riverPath,
        },
      ],
    },
    walls: {
      walls: [
        {
          id: 'wall-castle',
          thickness: 5.5,
          path: wallPath,
          towers: Array.from({ length: 10 }, (_, i) => ({
            id: uid('tw', rand),
            t: i / 10,
            radius: 5.5 + (i % 2),
          })),
          gates: [{ id: uid('gate', rand), t: 0.62, width: 16, name: 'Castle Gate' }],
        },
      ],
    },
    roads: { roads },
    districts: { districts: [] },
    buildings: { buildings },
    forests: { forests: [] },
    labels: { labels },
  }
}
