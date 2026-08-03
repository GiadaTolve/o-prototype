/**
 * Mutazioni sullo stato mappa (Step 3) — aggiornano MedievalMapDocument.
 */
import type {
  Building,
  Forest,
  MapLabel,
  MedievalMapDocument,
  Polygon,
  Polyline,
  Road,
  Vec2,
} from './map-schema'
import { WATABOU_PALETTE } from './map-schema'
import { EXAMPLE_MAP } from './example-map'
import { generateWatabouCity } from './city-gen'

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

function seeded(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

function centroid(poly: Polygon): Vec2 {
  const n = poly.length || 1
  return {
    x: poly.reduce((a, p) => a + p.x, 0) / n,
    y: poly.reduce((a, p) => a + p.y, 0) / n,
  }
}

function scalePoly(poly: Polygon, factor: number, c: Vec2): Polygon {
  return poly.map((p) => ({
    x: c.x + (p.x - c.x) * factor,
    y: c.y + (p.y - c.y) * factor,
  }))
}

/** Overall size: scala la landmass rispetto al centro canvas. */
export function applyOverallSize(doc: MedievalMapDocument, size01: number): MedievalMapDocument {
  const base = EXAMPLE_MAP.terrain.landmass
  const c = { x: doc.meta.width / 2, y: doc.meta.height / 2 }
  const factor = 0.55 + size01 * 0.9
  return {
    ...doc,
    terrain: {
      ...doc.terrain,
      landmass: scalePoly(base, factor, c),
    },
  }
}

/** Shape complexity: più vertici lungo il bordo. */
export function applyShapeComplexity(
  doc: MedievalMapDocument,
  complexity01: number,
): MedievalMapDocument {
  const land = doc.terrain.landmass
  if (land.length < 3) return doc
  const steps = 1 + Math.round(complexity01 * 3)
  if (steps <= 1) return doc
  const out: Vec2[] = []
  const rand = seeded((doc.meta.seed ?? 1) + Math.round(complexity01 * 100))
  for (let i = 0; i < land.length; i++) {
    const a = land[i]!
    const b = land[(i + 1) % land.length]!
    out.push(a)
    for (let s = 1; s < steps; s++) {
      const t = s / steps
      const mx = a.x + (b.x - a.x) * t
      const my = a.y + (b.y - a.y) * t
      const nx = -(b.y - a.y)
      const ny = b.x - a.x
      const len = Math.hypot(nx, ny) || 1
      const amp = (rand() - 0.5) * complexity01 * 28
      out.push({ x: mx + (nx / len) * amp, y: my + (ny / len) * amp })
    }
  }
  return { ...doc, terrain: { ...doc.terrain, landmass: out } }
}

export function reshapeLandmass(doc: MedievalMapDocument): MedievalMapDocument {
  const seed = (doc.meta.seed ?? 1) + Date.now() % 10000
  const rand = seeded(seed)
  const n = 10 + Math.floor(rand() * 8)
  const cx = doc.meta.width / 2
  const cy = doc.meta.height / 2
  const rx = doc.meta.width * (0.28 + rand() * 0.12)
  const ry = doc.meta.height * (0.28 + rand() * 0.12)
  const land: Polygon = []
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2
    const j = 0.75 + rand() * 0.35
    land.push({
      x: cx + Math.cos(t) * rx * j,
      y: cy + Math.sin(t) * ry * j,
    })
  }
  return {
    ...doc,
    meta: { ...doc.meta, seed },
    terrain: { ...doc.terrain, landmass: land },
  }
}

function rect(x: number, y: number, w: number, h: number): Polygon {
  return [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
  ]
}

/** Rigenera edifici in base a densità (full city Watabou). */
export function rebuildHousing(
  doc: MedievalMapDocument,
  density01: number,
  _heightVariety01: number,
  _commercialHubs: boolean,
): MedievalMapDocument {
  return generateWatabouCity({
    name: doc.meta.name,
    seed: doc.meta.seed ?? 1,
    width: doc.meta.width,
    height: doc.meta.height,
    density: density01,
  })
}

export function regenerateMap(doc: MedievalMapDocument): MedievalMapDocument {
  return generateWatabouCity({
    name: doc.meta.name || 'Bluewood',
    seed: Math.floor(Math.random() * 1e9),
    width: doc.meta.width,
    height: doc.meta.height,
    density: 0.78,
  })
}

export function cloneExample(): MedievalMapDocument {
  return structuredClone(EXAMPLE_MAP)
}

export function addKeep(doc: MedievalMapDocument): MedievalMapDocument {
  const c = centroid(doc.terrain.landmass)
  const keep: Building = {
    id: uid('keep'),
    kind: 'keep',
    solid: true,
    footprint: rect(c.x - 22, c.y - 22, 44, 44),
  }
  return {
    ...doc,
    buildings: { buildings: [...doc.buildings.buildings, keep] },
  }
}

export function addForest(doc: MedievalMapDocument, treeDensity01: number): MedievalMapDocument {
  const rand = seeded((doc.meta.seed ?? 1) + 199)
  const land = doc.terrain.landmass
  const c = centroid(land)
  const ox = c.x - 140 + rand() * 40
  const oy = c.y - 100 + rand() * 30
  const n = Math.round(4 + treeDensity01 * 28)
  const trees: Vec2[] = []
  for (let i = 0; i < n; i++) {
    trees.push({
      x: ox + (rand() - 0.5) * 90,
      y: oy + (rand() - 0.5) * 70,
    })
  }
  const forest: Forest = {
    id: uid('forest'),
    kind: 'woods',
    canopy: [
      { x: ox - 45, y: oy - 35 },
      { x: ox + 50, y: oy - 40 },
      { x: ox + 55, y: oy + 40 },
      { x: ox - 40, y: oy + 45 },
    ],
    trees,
  }
  return { ...doc, forests: { forests: [...doc.forests.forests, forest] } }
}

export function addLake(doc: MedievalMapDocument): MedievalMapDocument {
  const c = centroid(doc.terrain.landmass)
  const lx = c.x + 80
  const ly = c.y - 90
  return {
    ...doc,
    water: {
      features: [
        ...doc.water.features,
        {
          id: uid('lake'),
          kind: 'lake',
          width: 0,
          bankStyle: 'natural',
          geometry: [
            { x: lx, y: ly },
            { x: lx + 50, y: ly - 15 },
            { x: lx + 70, y: ly + 20 },
            { x: lx + 40, y: ly + 45 },
            { x: lx + 5, y: ly + 30 },
          ],
        },
      ],
    },
  }
}

export function addRiver(doc: MedievalMapDocument): MedievalMapDocument {
  const w = doc.meta.width
  const h = doc.meta.height
  const path: Polyline = [
    { x: 20, y: h * 0.35 },
    { x: w * 0.25, y: h * 0.4 },
    { x: w * 0.5, y: h * 0.48 },
    { x: w * 0.75, y: h * 0.55 },
    { x: w - 20, y: h * 0.62 },
  ]
  return {
    ...doc,
    water: {
      features: [
        ...doc.water.features,
        {
          id: uid('river'),
          kind: 'river',
          width: 14,
          bankStyle: 'natural',
          geometry: path,
        },
      ],
    },
  }
}

export function addWalls(doc: MedievalMapDocument): MedievalMapDocument {
  const c = centroid(doc.terrain.landmass)
  const r = 95
  const path: Polyline = []
  for (let i = 0; i < 12; i++) {
    const t = (i / 12) * Math.PI * 2
    path.push({ x: c.x + Math.cos(t) * r, y: c.y + Math.sin(t) * r })
  }
  return {
    ...doc,
    walls: {
      walls: [
        ...doc.walls.walls,
        {
          id: uid('wall'),
          thickness: 4,
          path,
          towers: [0, 0.25, 0.5, 0.75].map((t, i) => ({
            id: uid(`tw${i}`),
            t,
            radius: 6,
          })),
          gates: [{ id: uid('gate'), t: 0.1, width: 14, name: 'Gate' }],
        },
      ],
    },
  }
}

/** Mura da polilinea disegnata a mano (Step 4). */
export function addWallFromPath(doc: MedievalMapDocument, path: Polyline): MedievalMapDocument {
  if (path.length < 2) return doc
  return {
    ...doc,
    walls: {
      walls: [
        ...doc.walls.walls,
        {
          id: uid('wall'),
          thickness: 4,
          path: path.map((p) => ({ ...p })),
          towers: path.length >= 3
            ? [
                { id: uid('tw'), t: 0, radius: 5 },
                { id: uid('tw'), t: 1, radius: 5 },
              ]
            : [],
          gates: [],
        },
      ],
    },
  }
}

/**
 * Pennello bosco: aggiunge alberi vicino a `pt`.
 * Se esiste un forest vicino, lo estende; altrimenti ne crea uno nuovo.
 */
export function paintForestBrush(
  doc: MedievalMapDocument,
  pt: Vec2,
  density01: number,
): MedievalMapDocument {
  const spacing = 14 - density01 * 8
  const jitter = 6 + density01 * 6
  const treesToAdd: Vec2[] = []
  const n = 1 + Math.floor(density01 * 2)
  for (let i = 0; i < n; i++) {
    treesToAdd.push({
      x: pt.x + (Math.random() - 0.5) * jitter * 2,
      y: pt.y + (Math.random() - 0.5) * jitter * 2,
    })
  }

  const forests = [...doc.forests.forests]
  let targetIdx = -1
  let bestD = 70
  for (let i = 0; i < forests.length; i++) {
    const f = forests[i]!
    for (const t of f.trees) {
      const d = Math.hypot(t.x - pt.x, t.y - pt.y)
      if (d < bestD) {
        bestD = d
        targetIdx = i
      }
    }
  }

  if (targetIdx < 0) {
    forests.push({
      id: uid('forest'),
      kind: 'woods',
      trees: treesToAdd,
      canopy: [
        { x: pt.x - 28, y: pt.y - 22 },
        { x: pt.x + 28, y: pt.y - 22 },
        { x: pt.x + 28, y: pt.y + 22 },
        { x: pt.x - 28, y: pt.y + 22 },
      ],
    })
  } else {
    const f = forests[targetIdx]!
    const nextTrees = [...f.trees]
    for (const t of treesToAdd) {
      if (nextTrees.every((e) => Math.hypot(e.x - t.x, e.y - t.y) >= spacing * 0.55)) {
        nextTrees.push(t)
      }
    }
    // Expand canopy loosely
    const xs = nextTrees.map((t) => t.x)
    const ys = nextTrees.map((t) => t.y)
    const pad = 22
    const minX = Math.min(...xs) - pad
    const maxX = Math.max(...xs) + pad
    const minY = Math.min(...ys) - pad
    const maxY = Math.max(...ys) + pad
    forests[targetIdx] = {
      ...f,
      trees: nextTrees,
      canopy: [
        { x: minX, y: minY },
        { x: maxX, y: minY },
        { x: maxX, y: maxY },
        { x: minX, y: maxY },
      ],
    }
  }

  return { ...doc, forests: { forests } }
}

export function widenRoads(doc: MedievalMapDocument, factor = 1.35): MedievalMapDocument {
  return {
    ...doc,
    roads: {
      roads: doc.roads.roads.map((r) => ({
        ...r,
        width: Math.min(18, r.width * factor),
      })),
    },
  }
}

export function incurvateRoads(doc: MedievalMapDocument): MedievalMapDocument {
  const rand = seeded((doc.meta.seed ?? 1) + 3)
  return {
    ...doc,
    roads: {
      roads: doc.roads.roads.map((road) => {
        if (road.path.length < 2) return road
        const path: Polyline = [road.path[0]!]
        for (let i = 0; i < road.path.length - 1; i++) {
          const a = road.path[i]!
          const b = road.path[i + 1]!
          const mx = (a.x + b.x) / 2 + (rand() - 0.5) * 36
          const my = (a.y + b.y) / 2 + (rand() - 0.5) * 36
          path.push({ x: mx, y: my }, b)
        }
        return { ...road, path }
      }),
    },
  }
}

export function addRoad(
  doc: MedievalMapDocument,
  path: Polyline,
  bridgeType: 'drawbridge' | 'arch' | 'none',
): MedievalMapDocument {
  if (path.length < 2) return doc
  const road: Road = {
    id: uid('road'),
    kind: 'primary',
    width: 7,
    path,
    bridges:
      bridgeType === 'none'
        ? []
        : [
            {
              id: uid('br'),
              t: 0.5,
              length: bridgeType === 'drawbridge' ? 32 : 24,
            },
          ],
  }
  return { ...doc, roads: { roads: [...doc.roads.roads, road] } }
}

export function addOrUpdateDraftLabel(
  doc: MedievalMapDocument,
  text: string,
  fontFamily: string,
  fontSize: number,
  arcAngle: number,
  radius: number,
  anchor?: Vec2,
): MedievalMapDocument {
  const c = anchor ?? centroid(doc.terrain.landmass)
  const label: MapLabel = {
    id: uid('lbl'),
    text: text.toUpperCase() || 'LABEL',
    font: {
      family: fontFamily,
      size: fontSize,
      letterSpacing: 0.18,
      fill: WATABOU_PALETTE.ink,
    },
    anchor: c,
    startAngle: -0.5,
    arcAngle,
    radius,
    rotation: 0,
  }
  return { ...doc, labels: { labels: [...doc.labels.labels, label] } }
}

export function updateAllLabelCurves(
  doc: MedievalMapDocument,
  arcAngle: number,
  radius: number,
): MedievalMapDocument {
  return {
    ...doc,
    labels: {
      labels: doc.labels.labels.map((l) => ({ ...l, arcAngle, radius })),
    },
  }
}
