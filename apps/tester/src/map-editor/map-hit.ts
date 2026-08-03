/**
 * Hit-test e helper geometrici per interazione canvas (Step 4).
 */
import type {
  Building,
  CityWall,
  MapLabel,
  MedievalMapDocument,
  Polyline,
  Vec2,
} from './map-schema'

export function dist(a: Vec2, b: Vec2) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function distToSegment(p: Vec2, a: Vec2, b: Vec2): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  if (len2 < 1e-6) return dist(p, a)
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return dist(p, { x: a.x + t * dx, y: a.y + t * dy })
}

export function pointInPolygon(p: Vec2, poly: Vec2[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const pi = poly[i]!
    const pj = poly[j]!
    const intersect =
      pi.y > p.y !== pj.y > p.y &&
      p.x < ((pj.x - pi.x) * (p.y - pi.y)) / (pj.y - pi.y + 1e-12) + pi.x
    if (intersect) inside = !inside
  }
  return inside
}

export type BezierHandle = 'p0' | 'p1' | 'p2' | 'p3'

export function ensureLabelBezier(label: MapLabel): MapLabel {
  if (label.bezier) return label
  const { anchor, startAngle, arcAngle, radius } = label
  if (Math.abs(arcAngle) < 0.02 || radius < 1) {
    const w = Math.max(40, label.text.length * label.font.size * 0.42)
    return {
      ...label,
      bezier: {
        p0: { x: anchor.x - w / 2, y: anchor.y },
        p1: { x: anchor.x - w / 6, y: anchor.y },
        p2: { x: anchor.x + w / 6, y: anchor.y },
        p3: { x: anchor.x + w / 2, y: anchor.y },
      },
    }
  }

  const p0 = {
    x: anchor.x + Math.cos(startAngle) * radius,
    y: anchor.y + Math.sin(startAngle) * radius,
  }
  const p3 = {
    x: anchor.x + Math.cos(startAngle + arcAngle) * radius,
    y: anchor.y + Math.sin(startAngle + arcAngle) * radius,
  }
  const k = (4 / 3) * Math.tan(arcAngle / 4)
  const p1 = {
    x: p0.x + -Math.sin(startAngle) * k * radius,
    y: p0.y + Math.cos(startAngle) * k * radius,
  }
  const end = startAngle + arcAngle
  const p2 = {
    x: p3.x - -Math.sin(end) * k * radius,
    y: p3.y - Math.cos(end) * k * radius,
  }
  return { ...label, bezier: { p0, p1, p2, p3 } }
}

export function labelCenter(label: MapLabel): Vec2 {
  const b = label.bezier
  if (!b) return label.anchor
  return {
    x: (b.p0.x + b.p1.x + b.p2.x + b.p3.x) / 4,
    y: (b.p0.y + b.p1.y + b.p2.y + b.p3.y) / 4,
  }
}

export function translateLabel(label: MapLabel, dx: number, dy: number): MapLabel {
  const move = (p: Vec2) => ({ x: p.x + dx, y: p.y + dy })
  return {
    ...label,
    anchor: move(label.anchor),
    bezier: label.bezier
      ? {
          p0: move(label.bezier.p0),
          p1: move(label.bezier.p1),
          p2: move(label.bezier.p2),
          p3: move(label.bezier.p3),
        }
      : undefined,
  }
}

export function hitLabel(
  doc: MedievalMapDocument,
  pt: Vec2,
  threshold = 36,
): string | null {
  let best: string | null = null
  let bestD = threshold
  for (const l of doc.labels.labels) {
    const c = labelCenter(l)
    const d = dist(c, pt)
    if (d < bestD) {
      bestD = d
      best = l.id
    }
    if (l.bezier) {
      for (const h of [l.bezier.p0, l.bezier.p1, l.bezier.p2, l.bezier.p3]) {
        const hd = dist(h, pt)
        if (hd < bestD) {
          bestD = hd
          best = l.id
        }
      }
    }
  }
  return best
}

export function hitBezierHandle(
  label: MapLabel,
  pt: Vec2,
  threshold = 14,
): BezierHandle | null {
  if (!label.bezier) return null
  const keys: BezierHandle[] = ['p0', 'p1', 'p2', 'p3']
  let best: BezierHandle | null = null
  let bestD = threshold
  for (const k of keys) {
    const d = dist(label.bezier[k], pt)
    if (d < bestD) {
      bestD = d
      best = k
    }
  }
  return best
}

export function hitBuilding(
  doc: MedievalMapDocument,
  pt: Vec2,
): Building | null {
  // Top-most last
  for (let i = doc.buildings.buildings.length - 1; i >= 0; i--) {
    const b = doc.buildings.buildings[i]!
    if (pointInPolygon(pt, b.footprint)) return b
  }
  return null
}

export type WallSegmentHit = {
  wallId: string
  segmentIndex: number
}

export function hitWallSegment(
  doc: MedievalMapDocument,
  pt: Vec2,
  threshold = 10,
): WallSegmentHit | null {
  let best: WallSegmentHit | null = null
  let bestD = threshold
  for (const wall of doc.walls.walls) {
    for (let i = 0; i < wall.path.length - 1; i++) {
      const d = distToSegment(pt, wall.path[i]!, wall.path[i + 1]!)
      if (d < bestD) {
        bestD = d
        best = { wallId: wall.id, segmentIndex: i }
      }
    }
  }
  return best
}

export function deleteBuilding(
  doc: MedievalMapDocument,
  buildingId: string,
): MedievalMapDocument {
  return {
    ...doc,
    buildings: {
      buildings: doc.buildings.buildings.filter((b) => b.id !== buildingId),
    },
  }
}

/** Rimuove un segmento di muro; spezza la polilinea o elimina se troppo corta. */
export function deleteWallSegment(
  doc: MedievalMapDocument,
  wallId: string,
  segmentIndex: number,
): MedievalMapDocument {
  const walls: CityWall[] = []
  for (const wall of doc.walls.walls) {
    if (wall.id !== wallId) {
      walls.push(wall)
      continue
    }
    const path = wall.path
    if (path.length < 3 || segmentIndex < 0 || segmentIndex >= path.length - 1) {
      // rimuovi intero muro se non si può spezzare
      continue
    }
    const left: Polyline = path.slice(0, segmentIndex + 1)
    const right: Polyline = path.slice(segmentIndex + 1)
    if (left.length >= 2) {
      walls.push({
        ...wall,
        id: `${wall.id}-a`,
        path: left,
        towers: [],
        gates: [],
      })
    }
    if (right.length >= 2) {
      walls.push({
        ...wall,
        id: `${wall.id}-b`,
        path: right,
        towers: [],
        gates: [],
      })
    }
  }
  return { ...doc, walls: { walls } }
}
