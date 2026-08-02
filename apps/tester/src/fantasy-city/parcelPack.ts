/**
 * Generazione casupole stile Watabou — parcellation / OBB packing.
 * Edifici in lotti adiacenti, allineati alle strade/bordi zona.
 */

export type Pt = { x: number; y: number }

export type Zone = {
  pts: Pt[]
  rows: number
  size: number
  depth: number
  gap: number
  rot: number
  color: string
}

export type RoadLike = {
  pts: Pt[]
  width: number
  margin: number
}

export type Building = {
  x: number
  y: number
  w: number
  h: number
  angle: number
  color: string
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v))
}

function hexToRgb(h: string) {
  const s = h.replace('#', '')
  return {
    r: parseInt(s.slice(0, 2), 16),
    g: parseInt(s.slice(2, 4), 16),
    b: parseInt(s.slice(4, 6), 16),
  }
}

function rgbToHex(r: number, g: number, b: number) {
  return (
    '#' +
    [r, g, b]
      .map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0'))
      .join('')
  )
}

export function shadeColor(hex: string, amount: number) {
  const c = hexToRgb(hex)
  return rgbToHex(c.r + amount, c.g + amount, c.b + amount)
}

export function randShade(hex: string, spread = 36) {
  return shadeColor(hex, Math.floor((Math.random() - 0.5) * spread))
}

export function pointInPoly(pt: Pt, poly: Pt[]): boolean {
  let inside = false
  const n = poly.length
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = poly[i]!.x
    const yi = poly[i]!.y
    const xj = poly[j]!.x
    const yj = poly[j]!.y
    if (yi > pt.y !== yj > pt.y && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi + 1e-12) + xi) {
      inside = !inside
    }
  }
  return inside
}

export function polyCentroid(poly: Pt[]): Pt {
  let cx = 0
  let cy = 0
  for (const p of poly) {
    cx += p.x
    cy += p.y
  }
  const n = poly.length || 1
  return { x: cx / n, y: cy / n }
}

function distToSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  if (len2 < 1e-8) return Math.hypot(px - ax, py - ay)
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

export function distToPolyline(px: number, py: number, pts: Pt[]) {
  let d = 1e9
  for (let i = 0; i < pts.length - 1; i++) {
    d = Math.min(d, distToSeg(px, py, pts[i]!.x, pts[i]!.y, pts[i + 1]!.x, pts[i + 1]!.y))
  }
  return d
}

/** 4 vertici OBB (world space). */
export function buildingCorners(b: Building): Pt[] {
  const cos = Math.cos(b.angle)
  const sin = Math.sin(b.angle)
  const hw = b.w / 2
  const hh = b.h / 2
  return [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ].map((c) => ({
    x: b.x + c.x * cos - c.y * sin,
    y: b.y + c.x * sin + c.y * cos,
  }))
}

function satAxes(corners: Pt[]): Pt[] {
  const axes: Pt[] = []
  for (let i = 0; i < 4; i++) {
    const a = corners[i]!
    const b = corners[(i + 1) % 4]!
    const ex = b.x - a.x
    const ey = b.y - a.y
    const len = Math.hypot(ex, ey) || 1
    axes.push({ x: -ey / len, y: ex / len })
  }
  return axes
}

function project(corners: Pt[], axis: Pt) {
  let min = Infinity
  let max = -Infinity
  for (const c of corners) {
    const p = c.x * axis.x + c.y * axis.y
    min = Math.min(min, p)
    max = Math.max(max, p)
  }
  return { min, max }
}

/** Separating Axis Theorem per due OBB. */
export function obbOverlap(a: Building, b: Building, pad = 0.4): boolean {
  const ca = buildingCorners(a)
  const cb = buildingCorners(b)
  const axes = [...satAxes(ca).slice(0, 2), ...satAxes(cb).slice(0, 2)]
  for (const axis of axes) {
    const pa = project(ca, axis)
    const pb = project(cb, axis)
    if (pa.max + pad < pb.min || pb.max + pad < pa.min) return false
  }
  return true
}

function allCornersInside(b: Building, zone: Pt[]): boolean {
  const corners = buildingCorners(b)
  let inside = 0
  for (const c of corners) if (pointInPoly(c, zone)) inside++
  // Centro obbligatorio; almeno 3/4 angoli (poligoni irregolari / bordi)
  return pointInPoly({ x: b.x, y: b.y }, zone) && inside >= 3
}

function blockedByCorridors(b: Building, corridors: RoadLike[]): boolean {
  const corners = buildingCorners(b)
  const center = { x: b.x, y: b.y }
  for (const r of corridors) {
    const clear = r.width / 2 + r.margin
    if (distToPolyline(center.x, center.y, r.pts) < clear + Math.min(b.w, b.h) * 0.25) {
      return true
    }
    for (const c of corners) {
      if (distToPolyline(c.x, c.y, r.pts) < clear) return true
    }
  }
  return false
}

type Front = {
  ax: number
  ay: number
  bx: number
  by: number
  angle: number
  nx: number
  ny: number
  len: number
}

function collectFronts(zone: Zone, roads: RoadLike[], rivers: RoadLike[]): Front[] {
  const fronts: Front[] = []
  const centroid = polyCentroid(zone.pts)
  const n = zone.pts.length

  // Bordi zona — normale verso l’interno
  for (let i = 0; i < n; i++) {
    const a = zone.pts[i]!
    const b = zone.pts[(i + 1) % n]!
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy)
    if (len < 4) continue
    const angle = Math.atan2(dy, dx)
    let nx = -dy / len
    let ny = dx / len
    const midX = (a.x + b.x) / 2
    const midY = (a.y + b.y) / 2
    if ((centroid.x - midX) * nx + (centroid.y - midY) * ny < 0) {
      nx = -nx
      ny = -ny
    }
    fronts.push({ ax: a.x, ay: a.y, bx: b.x, by: b.y, angle, nx, ny, len })
  }

  // Strade/fiumi che intersecano o sfiorano la zona
  const corridors = [...roads, ...rivers]
  for (const road of corridors) {
    for (let i = 0; i < road.pts.length - 1; i++) {
      const a = road.pts[i]!
      const b = road.pts[i + 1]!
      const dx = b.x - a.x
      const dy = b.y - a.y
      const len = Math.hypot(dx, dy)
      if (len < 4) continue
      const angle = Math.atan2(dy, dx)
      const nx = -dy / len
      const ny = dx / len
      // due lati della strada
      for (const side of [-1, 1] as const) {
        // campiona mid: se vicino/dentro zona, è un fronte utile
        const mx = (a.x + b.x) / 2 + nx * side * (road.width / 2 + road.margin + 2)
        const my = (a.y + b.y) / 2 + ny * side * (road.width / 2 + road.margin + 2)
        if (!pointInPoly({ x: mx, y: my }, zone.pts)) continue
        fronts.push({
          ax: a.x,
          ay: a.y,
          bx: b.x,
          by: b.y,
          angle,
          nx: nx * side,
          ny: ny * side,
          len,
        })
      }
    }
  }

  return fronts
}

/**
 * Suddivide un fronte in lotti adiacenti (strisce → rettangoli).
 * Angolo condiviso per tutto l’isolato (± micro jitter).
 */
function parcelFront(
  front: Front,
  zone: Zone,
  corridors: RoadLike[],
  placed: Building[],
  streetSetback: number,
): Building[] {
  const { size, depth, gap, rows, color, rot } = zone
  const out: Building[] = []
  const lotGap = Math.max(0.6, Math.min(1.8, gap))
  const lotW = Math.max(2.2, size)
  const lotD = Math.max(2.0, depth)
  const spacing = lotW + lotGap

  const count = Math.max(1, Math.floor((front.len - lotGap) / spacing))
  if (count < 1) return out
  const used = count * spacing - lotGap
  const startOff = (front.len - used) / 2

  // Angolo di base condiviso (jitter max ±2° o rot limitato)
  const maxJitter = Math.min(2, Math.max(0, rot)) * (Math.PI / 180)
  const baseAngle = front.angle

  for (let k = 0; k < count; k++) {
    const t = (startOff + k * spacing + lotW / 2) / front.len
    if (t < 0.02 || t > 0.98) continue
    const ex = front.ax + (front.bx - front.ax) * t
    const ey = front.ay + (front.by - front.ay) * t

    for (let row = 0; row < rows; row++) {
      const inset = streetSetback + lotD / 2 + 1.2 + row * (lotD + lotGap)
      const px = ex + front.nx * inset
      const py = ey + front.ny * inset

      // Variazione lieve di footprint ma stesso angolo di isolato
      const w = lotW * (0.88 + Math.random() * 0.22)
      const h = lotD * (0.88 + Math.random() * 0.22)
      const angle = baseAngle + (Math.random() - 0.5) * 2 * maxJitter

      const b: Building = {
        x: px,
        y: py,
        w,
        h,
        angle,
        color: randShade(color, 28),
      }

      if (!allCornersInside(b, zone.pts)) continue
      if (blockedByCorridors(b, corridors)) continue

      let hits = false
      for (const other of placed) {
        if (obbOverlap(b, other, lotGap * 0.35)) {
          hits = true
          break
        }
      }
      if (hits) continue
      for (const other of out) {
        if (obbOverlap(b, other, lotGap * 0.35)) {
          hits = true
          break
        }
      }
      if (hits) continue

      out.push(b)
      placed.push(b)
    }
  }

  return out
}

/**
 * buildBlock — parcellation lungo street grid (zone edges + roads).
 */
export function buildBlock(zone: Zone, roads: RoadLike[], rivers: RoadLike[]): Building[] {
  const corridors = [...roads, ...rivers]
  const fronts = collectFronts(zone, roads, rivers)
  const placed: Building[] = []
  const result: Building[] = []

  // Priorità: fronti strada (più lunghi / più “urbani”) prima, poi bordi zona
  fronts.sort((a, b) => b.len - a.len)

  for (const front of fronts) {
    // setback: se il fronte è un bordo zona, parti da ~1px; se strada, già offset in nx
    const isLikelyRoad =
      corridors.some(
        (r) =>
          distToPolyline((front.ax + front.bx) / 2, (front.ay + front.by) / 2, r.pts) <
          r.width / 2 + r.margin + 8,
      )
    const setback = isLikelyRoad ? 0.5 : 1.0
    const lots = parcelFront(front, zone, corridors, placed, setback)
    result.push(...lots)
  }

  return result
}

/** Scatter (Poisson) — opzionale, invariato nello spirito. */
export function buildScatter(zone: Zone, roads: RoadLike[], rivers: RoadLike[]): Building[] {
  const corridors = [...roads, ...rivers]
  const minDist = Math.max(5, (zone.size + zone.depth) / 2 * 0.55)
  const samples = poissonDisc(zone.pts, minDist)
  const blds: Building[] = []
  const placed: Building[] = []

  for (const sp of samples) {
    const sScale = 0.7 + Math.random() * 0.7
    const w = zone.size * sScale
    const h = zone.depth * sScale
    const base = Math.random() < 0.5 ? 0 : Math.PI / 2
    const jitter = Math.min(2, zone.rot) * (Math.PI / 180)
    const b: Building = {
      x: sp.x,
      y: sp.y,
      w,
      h,
      angle: base + (Math.random() - 0.5) * 2 * jitter,
      color: randShade(zone.color, 28),
    }
    if (!allCornersInside(b, zone.pts)) continue
    if (blockedByCorridors(b, corridors)) continue
    if (placed.some((o) => obbOverlap(b, o, 1))) continue
    placed.push(b)
    blds.push(b)
  }
  return blds
}

function polyBounds(poly: Pt[]) {
  let minX = 1e9
  let minY = 1e9
  let maxX = -1e9
  let maxY = -1e9
  for (const p of poly) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }
  return { minX, minY, maxX, maxY }
}

function poissonDisc(poly: Pt[], minDist: number, tries = 28): Pt[] {
  const b = polyBounds(poly)
  const cell = minDist / Math.SQRT2
  const gW = Math.ceil((b.maxX - b.minX) / cell) + 1
  const gH = Math.ceil((b.maxY - b.minY) / cell) + 1
  const grid: (Pt | null)[] = new Array(gW * gH).fill(null)

  const gi = (x: number, y: number) =>
    Math.floor((y - b.minY) / cell) * gW + Math.floor((x - b.minX) / cell)

  const valid = (x: number, y: number) => {
    if (x < b.minX || x > b.maxX || y < b.minY || y > b.maxY || !pointInPoly({ x, y }, poly)) {
      return false
    }
    const gx = Math.floor((x - b.minX) / cell)
    const gy = Math.floor((y - b.minY) / cell)
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = gx + dx
        const ny = gy + dy
        if (nx < 0 || ny < 0 || nx >= gW || ny >= gH) continue
        const p = grid[ny * gW + nx]
        if (p && Math.hypot(x - p.x, y - p.y) < minDist) return false
      }
    }
    return true
  }

  const pts: Pt[] = []
  const active: Pt[] = []
  for (let t = 0; t < 200; t++) {
    const sx = b.minX + Math.random() * (b.maxX - b.minX)
    const sy = b.minY + Math.random() * (b.maxY - b.minY)
    if (pointInPoly({ x: sx, y: sy }, poly)) {
      const s = { x: sx, y: sy }
      pts.push(s)
      active.push(s)
      grid[gi(sx, sy)] = s
      break
    }
  }
  if (!pts.length) return pts

  while (active.length && pts.length < 4000) {
    const i = Math.floor(Math.random() * active.length)
    const p = active[i]!
    let found = false
    for (let k = 0; k < tries; k++) {
      const a = Math.random() * Math.PI * 2
      const r = minDist * (1 + Math.random())
      const nx = p.x + Math.cos(a) * r
      const ny = p.y + Math.sin(a) * r
      if (valid(nx, ny)) {
        const np = { x: nx, y: ny }
        pts.push(np)
        active.push(np)
        grid[gi(nx, ny)] = np
        found = true
        break
      }
    }
    if (!found) active.splice(i, 1)
  }
  return pts
}
