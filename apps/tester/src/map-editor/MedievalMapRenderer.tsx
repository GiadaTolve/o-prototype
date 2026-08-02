/**
 * Renderer mappa stile Watabou — pergamena, densità urbana, mura nere.
 */
import { useEffect, useRef } from 'react'
import type {
  Building,
  Forest,
  MapLabel,
  MedievalMapDocument,
  Polygon,
  Polyline,
  Road,
  Vec2,
  WaterFeature,
} from './map-schema'

/** Palette allineata a Medieval Fantasy City Generator (Bluewood). */
const C = {
  parchment: '#D4CFC4',
  grid: 'rgba(40, 36, 48, 0.14)',
  water: '#5C5960',
  waterEdge: '#3F3C44',
  buildingFill: '#B9B5B0',
  buildingStroke: '#2A2730',
  landmark: '#1A1820',
  wall: '#141218',
  roadGap: '#D4CFC4',
  roadEdge: 'rgba(40, 36, 48, 0.22)',
  forest: '#4A4750',
  forestRing: '#1A1820',
  label: '#1A1820',
  ink: '#1A1820',
} as const

function isClosedPolygon(pts: Vec2[], kind: WaterFeature['kind']): pts is Polygon {
  return kind === 'lake' || kind === 'sea'
}

function pointOnPolyline(path: Polyline, t: number): Vec2 {
  if (path.length === 0) return { x: 0, y: 0 }
  if (path.length === 1) return path[0]!
  const clamped = Math.min(1, Math.max(0, t))
  const total = path.length - 1
  const f = clamped * total
  const i = Math.min(total - 1, Math.floor(f))
  const u = f - i
  const a = path[i]!
  const b = path[i + 1]!
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u }
}

function pathPoly(ctx: CanvasRenderingContext2D, pts: Vec2[], close: boolean) {
  if (pts.length < 2) return
  ctx.beginPath()
  ctx.moveTo(pts[0]!.x, pts[0]!.y)
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y)
  if (close) ctx.closePath()
}

function strokeRiver(ctx: CanvasRenderingContext2D, path: Polyline, width: number) {
  if (path.length < 2) return
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = C.waterEdge
  ctx.lineWidth = width + 1.8
  pathPoly(ctx, path, false)
  ctx.stroke()
  ctx.strokeStyle = C.water
  ctx.lineWidth = width
  pathPoly(ctx, path, false)
  ctx.stroke()
}

function drawBuilding(ctx: CanvasRenderingContext2D, b: Building) {
  const solid = b.solid || b.kind === 'keep' || b.kind === 'temple' || b.kind === 'landmark'
  // Ombra / estrusione Watabou (offset basso-destra)
  if (!solid && b.footprint.length >= 3) {
    ctx.beginPath()
    ctx.moveTo(b.footprint[0]!.x + 1.8, b.footprint[0]!.y + 1.8)
    for (let i = 1; i < b.footprint.length; i++) {
      ctx.lineTo(b.footprint[i]!.x + 1.8, b.footprint[i]!.y + 1.8)
    }
    ctx.closePath()
    ctx.fillStyle = '#6E6A72'
    ctx.fill()
  }
  pathPoly(ctx, b.footprint, true)
  ctx.fillStyle = solid ? C.landmark : C.buildingFill
  ctx.strokeStyle = C.buildingStroke
  ctx.lineWidth = solid ? 1.1 : 0.65
  ctx.fill()
  ctx.stroke()
}

function drawForest(ctx: CanvasRenderingContext2D, f: Forest) {
  for (const t of f.trees) {
    const r = 5.5 + (t.x * 0.01) % 2.5
    ctx.beginPath()
    ctx.arc(t.x, t.y, r, 0, Math.PI * 2)
    ctx.fillStyle = C.forest
    ctx.strokeStyle = C.forestRing
    ctx.lineWidth = 1
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(t.x - 1.8, t.y - 1.2, r * 0.7, 0, Math.PI * 2)
    ctx.fillStyle = C.forest
    ctx.fill()
    ctx.stroke()
  }
}

function drawArcedLabel(ctx: CanvasRenderingContext2D, label: MapLabel) {
  const chars = [...label.text]
  if (!chars.length) return
  ctx.fillStyle = label.font.fill || C.label
  ctx.font = `${label.font.weight ?? 500} ${label.font.size}px ${label.font.family}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  if (label.bezier) {
    const { p0, p1, p2, p3 } = label.bezier
    const n = Math.max(1, chars.length - 1)
    for (let i = 0; i < chars.length; i++) {
      const t = i / n
      const x =
        (1 - t) ** 3 * p0.x +
        3 * (1 - t) ** 2 * t * p1.x +
        3 * (1 - t) * t ** 2 * p2.x +
        t ** 3 * p3.x
      const y =
        (1 - t) ** 3 * p0.y +
        3 * (1 - t) ** 2 * t * p1.y +
        3 * (1 - t) * t ** 2 * p2.y +
        t ** 3 * p3.y
      const dx =
        3 * (1 - t) ** 2 * (p1.x - p0.x) +
        6 * (1 - t) * t * (p2.x - p1.x) +
        3 * t ** 2 * (p3.x - p2.x)
      const dy =
        3 * (1 - t) ** 2 * (p1.y - p0.y) +
        6 * (1 - t) * t * (p2.y - p1.y) +
        3 * t ** 2 * (p3.y - p2.y)
      const angle = Math.atan2(dy, dx) + label.rotation
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(angle)
      ctx.fillText(chars[i]!, 0, 0)
      ctx.restore()
    }
    return
  }

  const { anchor, startAngle, arcAngle, radius, rotation } = label
  if (Math.abs(arcAngle) < 0.02 || radius < 1) {
    ctx.save()
    ctx.translate(anchor.x, anchor.y)
    ctx.rotate(rotation)
    ctx.fillText(label.text, 0, 0)
    ctx.restore()
    return
  }

  const n = Math.max(1, chars.length - 1)
  for (let i = 0; i < chars.length; i++) {
    const t = i / n
    const angle = startAngle + t * arcAngle
    const x = anchor.x + Math.cos(angle) * radius
    const y = anchor.y + Math.sin(angle) * radius
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle + Math.PI / 2 + rotation)
    ctx.fillText(chars[i]!, 0, 0)
    ctx.restore()
  }
}

/** Strade = corridoi di pergamena (gap), non grey fill. */
function drawRoad(ctx: CanvasRenderingContext2D, road: Road) {
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = C.roadEdge
  ctx.lineWidth = road.width + 1.2
  pathPoly(ctx, road.path, false)
  ctx.stroke()
  ctx.strokeStyle = C.roadGap
  ctx.lineWidth = road.width
  pathPoly(ctx, road.path, false)
  ctx.stroke()

  for (const br of road.bridges) {
    const p = pointOnPolyline(road.path, br.t)
    const i = Math.min(road.path.length - 2, Math.floor(br.t * (road.path.length - 1)))
    const a = road.path[i]!
    const b = road.path[i + 1]!
    const ang = Math.atan2(b.y - a.y, b.x - a.x)
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(ang)
    ctx.fillStyle = C.ink
    ctx.fillRect(-br.length / 2, -road.width * 0.65, br.length, road.width * 1.3)
    ctx.restore()
  }
}

function drawCompass(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save()
  ctx.translate(x, y)
  const tips = [
    { a: -Math.PI / 2, fill: C.ink },
    { a: 0, fill: C.parchment },
    { a: Math.PI / 2, fill: C.ink },
    { a: Math.PI, fill: C.parchment },
  ]
  for (const tip of tips) {
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(Math.cos(tip.a - 0.35) * r * 0.35, Math.sin(tip.a - 0.35) * r * 0.35)
    ctx.lineTo(Math.cos(tip.a) * r, Math.sin(tip.a) * r)
    ctx.lineTo(Math.cos(tip.a + 0.35) * r * 0.35, Math.sin(tip.a + 0.35) * r * 0.35)
    ctx.closePath()
    ctx.fillStyle = tip.fill
    ctx.strokeStyle = C.ink
    ctx.lineWidth = 1.2
    ctx.fill()
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2)
  ctx.fillStyle = C.ink
  ctx.fill()
  ctx.fillStyle = C.ink
  ctx.font = '700 14px IM Fell Great Primer, Georgia, serif'
  ctx.textAlign = 'center'
  ctx.fillText('N', 0, -r - 8)
  ctx.restore()
}

function drawScaleBar(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const unit = 48
  ctx.strokeStyle = C.ink
  ctx.fillStyle = C.ink
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + unit * 2, y)
  ctx.stroke()
  for (let i = 0; i <= 2; i++) {
    const px = x + i * unit
    ctx.beginPath()
    ctx.moveTo(px, y - 5)
    ctx.lineTo(px, y + 5)
    ctx.stroke()
    if (i < 2) {
      ctx.fillStyle = i % 2 === 0 ? C.ink : C.parchment
      ctx.strokeRect(px, y - 3, unit, 6)
      ctx.fillRect(px, y - 3, unit, 6)
      ctx.strokeRect(px, y - 3, unit, 6)
    }
  }
  ctx.fillStyle = C.ink
  ctx.font = '11px IM Fell Great Primer, Georgia, serif'
  ctx.textAlign = 'center'
  ctx.fillText('0', x, y + 18)
  ctx.fillText('100', x + unit, y + 18)
  ctx.fillText('200 m', x + unit * 2, y + 18)
}

export function paintMedievalMap(
  ctx: CanvasRenderingContext2D,
  doc: MedievalMapDocument,
  cssW: number,
  cssH: number,
  dpr: number,
) {
  const { width: mw, height: mh } = doc.meta
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, cssW, cssH)

  const scale = Math.min(cssW / mw, cssH / mh)
  const ox = (cssW - mw * scale) / 2
  const oy = (cssH - mh * scale) / 2
  ctx.translate(ox, oy)
  ctx.scale(scale, scale)

  // 1) Pergamena full-bleed (NON oceano scuro)
  ctx.fillStyle = C.parchment
  ctx.fillRect(0, 0, mw, mh)

  if (doc.terrain.grid.enabled) {
    const step = doc.terrain.grid.spacing
    ctx.strokeStyle = C.grid
    ctx.globalAlpha = doc.terrain.grid.opacity
    ctx.lineWidth = 1 / scale
    ctx.beginPath()
    for (let x = 0; x <= mw; x += step) {
      ctx.moveTo(x, 0)
      ctx.lineTo(x, mh)
    }
    for (let y = 0; y <= mh; y += step) {
      ctx.moveTo(0, y)
      ctx.lineTo(mw, y)
    }
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  // 2) Acqua (baia + laghi) — sopra la pergamena
  for (const w of doc.water.features) {
    if (isClosedPolygon(w.geometry, w.kind)) {
      pathPoly(ctx, w.geometry, true)
      ctx.fillStyle = C.water
      ctx.strokeStyle = C.waterEdge
      ctx.lineWidth = 1.1
      ctx.fill()
      ctx.stroke()
    }
  }

  // 3) Fiumi
  for (const w of doc.water.features) {
    if (!isClosedPolygon(w.geometry, w.kind)) {
      strokeRiver(ctx, w.geometry as Polyline, Math.max(6, w.width))
    }
  }

  // 4) Edifici (prima delle strade "gap" così i corridoi ritagliano)
  for (const b of doc.buildings.buildings) drawBuilding(ctx, b)

  // 5) Strade come gap pergamena sopra edifici (stile Watabou)
  for (const r of doc.roads.roads) drawRoad(ctx, r)

  // 6) Foreste
  for (const f of doc.forests.forests) drawForest(ctx, f)

  // 7) Mura + torri NERE piene
  for (const wall of doc.walls.walls) {
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = C.wall
    ctx.lineWidth = wall.thickness
    pathPoly(ctx, wall.path, true)
    ctx.stroke()

    for (const tw of wall.towers) {
      const p = pointOnPolyline([...wall.path, wall.path[0]!], tw.t)
      ctx.beginPath()
      ctx.arc(p.x, p.y, tw.radius, 0, Math.PI * 2)
      ctx.fillStyle = C.wall
      ctx.fill()
    }

    for (const g of wall.gates) {
      const p = pointOnPolyline([...wall.path, wall.path[0]!], g.t)
      ctx.fillStyle = C.parchment
      ctx.fillRect(
        p.x - g.width / 2,
        p.y - wall.thickness * 0.85,
        g.width,
        wall.thickness * 1.7,
      )
    }
  }

  // 8) Labels
  for (const lb of doc.labels.labels) drawArcedLabel(ctx, lb)

  // 9) Scale + compass (come reference)
  drawScaleBar(ctx, 36, mh - 42)
  drawCompass(ctx, mw - 56, mh - 56, 22)
}

type Props = {
  document: MedievalMapDocument
  className?: string
}

export function MedievalMapRenderer({ document: doc, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const draw = () => {
      const cssW = wrap.clientWidth
      const cssH = wrap.clientHeight
      if (cssW < 2 || cssH < 2) return
      const dpr = Math.min(2.5, window.devicePixelRatio || 1)
      canvas.width = Math.floor(cssW * dpr)
      canvas.height = Math.floor(cssH * dpr)
      canvas.style.width = `${cssW}px`
      canvas.style.height = `${cssH}px`
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      paintMedievalMap(ctx, doc, cssW, cssH, dpr)
    }

    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(wrap)
    if (document.fonts?.ready) {
      void document.fonts.ready.then(draw)
    }
    return () => ro.disconnect()
  }, [doc])

  return (
    <div className={className} ref={wrapRef} style={{ width: '100%', height: '100%' }}>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=IM+Fell+Great+Primer&display=swap"
      />
      <canvas ref={canvasRef} aria-label={doc.meta.name} />
    </div>
  )
}
