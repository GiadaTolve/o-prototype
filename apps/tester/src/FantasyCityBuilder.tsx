/**
 * Fantasy City Builder — mappa Giappone + parcellation Watabou (palette Dark Arcane).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  buildBlock,
  buildScatter,
  pointInPoly,
  type Building,
  type Pt,
  type RoadLike,
  type Zone,
} from './fantasy-city/parcelPack'
import {
  drawJapanBackground,
  drawJimPitchBackground,
  drawJimViewportFx,
  loadJapanMapWorld,
  regionBounds,
  MAP_PALETTE,
  type JapanMapWorld,
} from './fantasy-city/japanMapBg'
import {
  applyCityOverlayToDashboard,
  buildCityOverlayPayload,
  clearCityOverlayOnDashboard,
} from './fantasy-city/cityOverlayExport'
import './FantasyCityBuilder.css'

type Tool = 'zone' | 'road' | 'river' | 'wall' | 'erase'
type GenMode = 'block' | 'scatter'

type Wall = { pts: Pt[]; width: number }

type Params = {
  rows: number
  size: number
  depth: number
  gap: number
  rot: number
  color: string
  rw: number
  rm: number
}

const DEFAULT_P: Params = {
  rows: 2,
  size: 6,
  depth: 5,
  gap: 1.2,
  rot: 2,
  color: MAP_PALETTE.building,
  rw: 14,
  rm: 6,
}

/** Adatta i lotti alla scala della zona (casupole piccole, dense). */
function adaptZoneLots(zone: Zone): Zone {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of zone.pts) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }
  const short = Math.min(maxX - minX, maxY - minY)
  if (!(short > 4)) return zone
  // Più lotti sul lato corto → edifici più piccoli
  const target = short / 22
  const size = Math.max(2.2, Math.min(short / 5, target * (zone.size / 6)))
  const depth = Math.max(2.0, Math.min(short / 5.5, target * (zone.depth / 6) * 0.9))
  const gap = Math.max(0.7, Math.min(3, size * 0.12))
  // Quante file entrano verso l’interno
  const fitRows = Math.max(1, Math.floor((short / 2 - 2) / (depth + gap)))
  const rows = Math.min(Math.max(zone.rows, fitRows), 14)
  return { ...zone, size, depth, gap, rows }
}

export default function FantasyCityBuilder() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const [tool, setTool] = useState<Tool>('zone')
  const [genMode, setGenMode] = useState<GenMode>('block')
  const [P, setP] = useState<Params>(DEFAULT_P)
  const [status, setStatus] = useState('Caricamento mappa Giappone…')
  const [zoomPct, setZoomPct] = useState(100)
  const [mapReady, setMapReady] = useState(false)

  const stateRef = useRef({
    vpX: 0,
    vpY: 0,
    vpZ: 1,
    bgImage: null as HTMLImageElement | null,
    japanWorld: null as JapanMapWorld | null,
    bgW: 1600,
    bgH: 1100,
    zones: [] as Zone[],
    roads: [] as RoadLike[],
    rivers: [] as RoadLike[],
    walls: [] as Wall[],
    buildings: [] as Building[],
    drawing: false,
    curPts: [] as Pt[],
    mouse: { x: 0, y: 0 } as Pt,
    isPanning: false,
    spaceDown: false,
    panStart: { x: 0, y: 0 },
    vpStart: { x: 0, y: 0 },
    tool: 'zone' as Tool,
    genMode: 'block' as GenMode,
    P: DEFAULT_P,
  })

  stateRef.current.tool = tool
  stateRef.current.genMode = genMode
  stateRef.current.P = P

  const s2w = useCallback((sx: number, sy: number): Pt => {
    const s = stateRef.current
    return { x: (sx - s.vpX) / s.vpZ, y: (sy - s.vpY) / s.vpZ }
  }, [])

  const centerView = useCallback((focusRegion?: string) => {
    const wrap = wrapRef.current
    const s = stateRef.current
    if (!wrap) return
    let minX = 0
    let minY = 0
    let maxX = s.bgW
    let maxY = s.bgH
    if (focusRegion && s.japanWorld) {
      const b = regionBounds(s.japanWorld, focusRegion)
      if (b) {
        minX = b.minX
        minY = b.minY
        maxX = b.maxX
        maxY = b.maxY
      }
    }
    const w = maxX - minX
    const h = maxY - minY
    const pad = 0.12
    s.vpZ =
      Math.min(wrap.clientWidth / (w * (1 + pad)), wrap.clientHeight / (h * (1 + pad))) *
      0.92
    s.vpX = wrap.clientWidth / 2 - ((minX + maxX) / 2) * s.vpZ
    s.vpY = wrap.clientHeight / 2 - ((minY + maxY) / 2) * s.vpZ
    setZoomPct(Math.round(s.vpZ * 100))
  }, [])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    const s = stateRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)

    if (s.japanWorld && !s.bgImage) {
      drawJimPitchBackground(ctx, W, H, s.japanWorld.stone)
    }

    ctx.save()
    ctx.translate(s.vpX, s.vpY)
    ctx.scale(s.vpZ, s.vpZ)

    if (s.bgImage) {
      ctx.drawImage(s.bgImage, 0, 0, s.bgW, s.bgH)
    } else if (s.japanWorld) {
      drawJapanBackground(ctx, s.japanWorld, { focusRegion: 'ogon', fillOcean: false })
    } else {
      ctx.fillStyle = MAP_PALETTE.ocean
      ctx.fillRect(0, 0, s.bgW, s.bgH)
    }

    const C = MAP_PALETTE

    for (const r of s.rivers) {
      if (r.pts.length < 2) continue
      ctx.beginPath()
      ctx.moveTo(r.pts[0]!.x, r.pts[0]!.y)
      for (let i = 1; i < r.pts.length; i++) {
        if (i < r.pts.length - 1) {
          const mx = (r.pts[i]!.x + r.pts[i + 1]!.x) / 2
          const my = (r.pts[i]!.y + r.pts[i + 1]!.y) / 2
          ctx.quadraticCurveTo(r.pts[i]!.x, r.pts[i]!.y, mx, my)
        } else ctx.lineTo(r.pts[i]!.x, r.pts[i]!.y)
      }
      ctx.strokeStyle = C.river
      ctx.lineWidth = r.width + 3
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
      ctx.strokeStyle = C.riverHighlight
      ctx.lineWidth = r.width * 0.45
      ctx.stroke()
    }

    for (const r of s.roads) {
      if (r.pts.length < 2) continue
      ctx.beginPath()
      ctx.moveTo(r.pts[0]!.x, r.pts[0]!.y)
      for (let i = 1; i < r.pts.length; i++) ctx.lineTo(r.pts[i]!.x, r.pts[i]!.y)
      ctx.strokeStyle = C.roadEdge
      ctx.lineWidth = r.width + 3
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
      ctx.strokeStyle = C.road
      ctx.lineWidth = r.width
      ctx.stroke()
    }

    for (const w of s.walls) {
      if (w.pts.length < 2) continue
      const lw = Math.min(0.7, Math.max(0.55, w.width > 1 ? 0.7 : w.width))
      ctx.beginPath()
      ctx.moveTo(w.pts[0]!.x, w.pts[0]!.y)
      for (let i = 1; i < w.pts.length; i++) ctx.lineTo(w.pts[i]!.x, w.pts[i]!.y)
      ctx.strokeStyle = C.wallCore
      ctx.lineWidth = lw + 0.45
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
      ctx.strokeStyle = C.wall
      ctx.lineWidth = lw
      ctx.stroke()
      const towerR = Math.max(0.85, lw * 0.7)
      for (let i = 0; i < w.pts.length; i++) {
        const p = w.pts[i]!
        ctx.beginPath()
        ctx.arc(p.x, p.y, towerR, 0, Math.PI * 2)
        ctx.fillStyle = C.wall
        ctx.fill()
      }
    }

    for (const b of s.buildings) {
      ctx.save()
      ctx.translate(b.x, b.y)
      ctx.rotate(b.angle)
      ctx.shadowColor = C.buildingShadow
      ctx.shadowBlur = 2
      ctx.shadowOffsetX = 1.4
      ctx.shadowOffsetY = 1.4
      ctx.fillStyle = b.color
      ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h)
      ctx.shadowColor = 'transparent'
      ctx.strokeStyle = C.buildingStroke
      ctx.lineWidth = Math.max(0.55, 0.9 / Math.max(s.vpZ, 0.2))
      ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h)
      ctx.restore()
    }

    for (const z of s.zones) {
      ctx.beginPath()
      ctx.moveTo(z.pts[0]!.x, z.pts[0]!.y)
      for (let i = 1; i < z.pts.length; i++) ctx.lineTo(z.pts[i]!.x, z.pts[i]!.y)
      ctx.closePath()
      ctx.fillStyle = C.zoneFill
      ctx.fill()
      ctx.strokeStyle = C.zoneStroke
      ctx.lineWidth = 1 / s.vpZ
      ctx.setLineDash([5 / s.vpZ, 4 / s.vpZ])
      ctx.stroke()
      ctx.setLineDash([])
    }

    if (s.drawing && s.curPts.length > 0) {
      ctx.beginPath()
      ctx.moveTo(s.curPts[0]!.x, s.curPts[0]!.y)
      for (let i = 1; i < s.curPts.length; i++) ctx.lineTo(s.curPts[i]!.x, s.curPts[i]!.y)
      ctx.lineTo(s.mouse.x, s.mouse.y)
      if (s.tool === 'zone') ctx.closePath()
      const colors: Record<string, { f: string | null; s: string }> = {
        zone: { f: 'rgba(201,168,74,.12)', s: C.gold },
        road: { f: null, s: C.road },
        river: { f: null, s: C.violet },
        wall: { f: null, s: C.wall },
      }
      const c = colors[s.tool] ?? { f: null, s: C.gold }
      if (c.f) {
        ctx.fillStyle = c.f
        ctx.fill()
      }
      ctx.strokeStyle = c.s
      ctx.lineWidth = 1.5 / s.vpZ
      ctx.setLineDash([6 / s.vpZ, 3 / s.vpZ])
      ctx.stroke()
      ctx.setLineDash([])
      for (const p of s.curPts) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, 4 / s.vpZ, 0, Math.PI * 2)
        ctx.fillStyle = c.s
        ctx.fill()
      }
    }

    ctx.restore()

    if (s.japanWorld && !s.bgImage) {
      drawJimViewportFx(ctx, W, H)
    }
  }, [])

  const resize = useCallback(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    canvas.width = wrap.clientWidth
    canvas.height = wrap.clientHeight
    render()
  }, [render])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    resize()

    let cancelled = false
    ;(async () => {
      try {
        const world = await loadJapanMapWorld({ width: 1600, height: 1100 })
        if (cancelled) return
        const s = stateRef.current
        s.japanWorld = world
        s.bgW = world.width
        s.bgH = world.height
        s.bgImage = null
        setMapReady(true)
        centerView('ogon')
        render()
        setStatus('Mappa Oyasumi caricata · zoom su Ogon. Disegna una zona e genera edifici.')
      } catch (err) {
        if (!cancelled) {
          setStatus(
            `Errore mappa: ${err instanceof Error ? err.message : 'geojson non trovato'}`,
          )
        }
      }
    })()

    return () => {
      cancelled = true
      ro.disconnect()
    }
  }, [resize, centerView, render])

  /** Chiude la bozza corrente in una zona (se valida), senza richiedere doppio click. */
  const commitOpenZone = useCallback(() => {
    const s = stateRef.current
    if (s.tool !== 'zone' || !s.drawing || s.curPts.length < 3) return false
    const p = s.P
    s.zones.push({
      pts: [...s.curPts],
      rows: p.rows,
      size: p.size,
      depth: p.depth,
      gap: p.gap,
      rot: Math.min(2, p.rot),
      color: p.color,
    })
    s.curPts = []
    s.drawing = false
    return true
  }, [])

  const generateBuildings = useCallback(() => {
    const s = stateRef.current
    // Spesso l’area è ancora in bozza (gialla) — non è in s.zones finché non si chiude.
    const justCommitted = commitOpenZone()
    if (!s.zones.length) {
      setStatus(
        'Nessuna zona chiusa. Disegna ≥3 punti (strumento Zona), poi doppio click / Enter — oppure Genera con la bozza aperta.',
      )
      render()
      return
    }
    const all: Building[] = []
    for (const zone of s.zones) {
      const z = adaptZoneLots({ ...zone, rot: Math.min(2, zone.rot) })
      const blds =
        s.genMode === 'block'
          ? buildBlock(z, s.roads, s.rivers)
          : buildScatter(z, s.roads, s.rivers)
      all.push(...blds)
    }
    s.buildings = all
    const hint = justCommitted ? ' (bozza chiusa in automatico)' : ''
    if (all.length === 0) {
      setStatus(
        `0 edifici in ${s.zones.length} zone${hint}. Prova una zona più grande o riduci larghezza/profondità lotti.`,
      )
    } else {
      setStatus(`✓ ${all.length} edifici in ${s.zones.length} zone${hint}.`)
    }
    render()
  }, [commitOpenZone, render])

  const genRef = useRef(generateBuildings)
  genRef.current = generateBuildings

  const undoLast = () => {
    const s = stateRef.current
    if (s.curPts.length > 0) {
      s.curPts.pop()
      render()
      return
    }
    if (s.buildings.length) {
      s.buildings = []
      render()
      setStatus('Edifici rimossi.')
      return
    }
    if (s.zones.length) {
      s.zones.pop()
      render()
      setStatus('Ultima zona rimossa.')
      return
    }
    if (s.roads.length) {
      s.roads.pop()
      render()
      setStatus('Ultima strada rimossa.')
      return
    }
    if (s.rivers.length) {
      s.rivers.pop()
      render()
      setStatus('Ultimo fiume rimosso.')
      return
    }
    if (s.walls.length) {
      s.walls.pop()
      render()
      setStatus('Ultime mura rimosse.')
    }
  }

  const clearAll = () => {
    const s = stateRef.current
    s.zones = []
    s.roads = []
    s.rivers = []
    s.walls = []
    s.buildings = []
    s.curPts = []
    s.drawing = false
    render()
    setStatus('Tutto cancellato.')
  }

  const applyToDashboard = async (opts?: { saveAsParadise?: boolean }) => {
    const s = stateRef.current
    commitOpenZone()
    if (!s.japanWorld) {
      setStatus('Mappa Giappone non pronta.')
      return
    }
    if (!s.zones.length && !s.buildings.length) {
      setStatus('Niente da applicare: crea zone e genera edifici prima.')
      return
    }
    if (!s.buildings.length && s.zones.length) {
      genRef.current()
    }
    const asParadise = opts?.saveAsParadise !== false
    const payload = buildCityOverlayPayload({
      world: s.japanWorld,
      zones: s.zones,
      buildings: s.buildings,
      roads: s.roads,
      rivers: s.rivers,
      walls: s.walls,
      id: asParadise ? 'paradise' : undefined,
      name: asParadise ? 'Blocco Paradise' : undefined,
    })
    setStatus(asParadise ? 'Salvo Blocco Paradise…' : 'Applico overlay alla dashboard…')
    const result = await applyCityOverlayToDashboard(payload, {
      saveAs: asParadise ? 'paradise' : undefined,
    })
    if (!result.ok) {
      // Fallback: download JSON se il plugin Vite non risponde
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = asParadise ? 'paradise.json' : 'city-overlay.json'
      a.click()
      URL.revokeObjectURL(a.href)
      setStatus(
        `Plugin non raggiungibile (${result.error}). Scaricato JSON — mettilo in apps/client/public/maps/city-blocks/ e ricarica.`,
      )
      return
    }
    setStatus(
      `✓ ${asParadise ? 'Blocco Paradise salvato' : 'Overlay applicato'} (${payload.buildings.length} edifici). Zone non visibili in dashboard. Clicca ↻ sulla mappa.`,
    )
  }

  const clearDashboardOverlay = async () => {
    const result = await clearCityOverlayOnDashboard()
    if (!result.ok) {
      setStatus(`Errore clear: ${result.error}`)
      return
    }
    setStatus('✓ Overlay dashboard rimosso (city-overlay.json cancellato). Ricarica la mappa.')
  }

  const exportPNG = () => {
    const s = stateRef.current
    const ec = document.createElement('canvas')
    ec.width = s.bgW
    ec.height = s.bgH
    const e = ec.getContext('2d')
    if (!e) return
    if (s.bgImage) e.drawImage(s.bgImage, 0, 0, s.bgW, s.bgH)
    else if (s.japanWorld) drawJapanBackground(e, s.japanWorld, { focusRegion: 'ogon' })
    else {
      e.fillStyle = MAP_PALETTE.ocean
      e.fillRect(0, 0, s.bgW, s.bgH)
    }
    const C = MAP_PALETTE
    for (const r of s.rivers) {
      if (r.pts.length < 2) continue
      e.beginPath()
      e.moveTo(r.pts[0]!.x, r.pts[0]!.y)
      for (let i = 1; i < r.pts.length; i++) {
        if (i < r.pts.length - 1) {
          const mx = (r.pts[i]!.x + r.pts[i + 1]!.x) / 2
          const my = (r.pts[i]!.y + r.pts[i + 1]!.y) / 2
          e.quadraticCurveTo(r.pts[i]!.x, r.pts[i]!.y, mx, my)
        } else e.lineTo(r.pts[i]!.x, r.pts[i]!.y)
      }
      e.strokeStyle = C.river
      e.lineWidth = r.width
      e.lineCap = 'round'
      e.lineJoin = 'round'
      e.stroke()
    }
    for (const r of s.roads) {
      if (r.pts.length < 2) continue
      e.beginPath()
      e.moveTo(r.pts[0]!.x, r.pts[0]!.y)
      for (let i = 1; i < r.pts.length; i++) e.lineTo(r.pts[i]!.x, r.pts[i]!.y)
      e.strokeStyle = C.roadEdge
      e.lineWidth = r.width + 4
      e.lineCap = 'round'
      e.lineJoin = 'round'
      e.stroke()
      e.strokeStyle = C.road
      e.lineWidth = r.width
      e.stroke()
    }
    for (const w of s.walls) {
      if (w.pts.length < 2) continue
      const lw = Math.min(0.7, Math.max(0.55, w.width > 1 ? 0.7 : w.width))
      e.beginPath()
      e.moveTo(w.pts[0]!.x, w.pts[0]!.y)
      for (let i = 1; i < w.pts.length; i++) e.lineTo(w.pts[i]!.x, w.pts[i]!.y)
      e.strokeStyle = C.wallCore
      e.lineWidth = lw + 0.45
      e.lineCap = 'round'
      e.stroke()
      e.strokeStyle = C.wall
      e.lineWidth = lw
      e.stroke()
      const towerR = Math.max(0.85, lw * 0.7)
      for (const p of w.pts) {
        e.beginPath()
        e.arc(p.x, p.y, towerR, 0, Math.PI * 2)
        e.fillStyle = C.wall
        e.fill()
      }
    }
    for (const b of s.buildings) {
      e.save()
      e.translate(b.x, b.y)
      e.rotate(b.angle)
      e.shadowColor = C.buildingShadow
      e.shadowBlur = 2
      e.shadowOffsetX = 1.4
      e.shadowOffsetY = 1.4
      e.fillStyle = b.color
      e.fillRect(-b.w / 2, -b.h / 2, b.w, b.h)
      e.shadowColor = 'transparent'
      e.strokeStyle = C.buildingStroke
      e.lineWidth = 0.5
      e.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h)
      e.restore()
    }
    const a = document.createElement('a')
    a.download = 'fantasy-city-map.png'
    a.href = ec.toDataURL('image/png')
    a.click()
    setStatus('Mappa esportata!')
  }

  const onLoadFile = (file: File) => {
    const r = new FileReader()
    r.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const s = stateRef.current
        s.bgImage = img
        s.bgW = img.width
        s.bgH = img.height
        centerView()
        render()
        setStatus('Sfondo immagine caricato (sovrascrive la mappa Giappone).')
      }
      img.src = String(ev.target?.result ?? '')
    }
    r.readAsDataURL(file)
  }

  const useJapanMap = () => {
    const s = stateRef.current
    if (!s.japanWorld) {
      setStatus('Mappa Giappone non ancora pronta.')
      return
    }
    s.bgImage = null
    s.bgW = s.japanWorld.width
    s.bgH = s.japanWorld.height
    centerView('ogon')
    render()
    setStatus('Sfondo: mappa Giappone (Ogon).')
  }

  // Patch finishShape to call genRef for road regen
  const finishShapeSafe = useCallback(() => {
    const s = stateRef.current
    const p = s.P
    if (!s.drawing || s.curPts.length < 2) {
      s.curPts = []
      s.drawing = false
      render()
      return
    }
    const pts = [...s.curPts]
    if (s.tool === 'zone' && pts.length >= 3) {
      s.zones.push({
        pts,
        rows: p.rows,
        size: p.size,
        depth: p.depth,
        gap: p.gap,
        rot: Math.min(2, p.rot),
        color: p.color,
      })
      s.curPts = []
      s.drawing = false
      render()
      setStatus(`Zona aggiunta (${s.zones.length}) — genero edifici…`)
      genRef.current()
      return
    } else if (s.tool === 'zone') {
      setStatus('Zona non chiusa: servono almeno 3 punti, poi doppio click / Enter.')
    } else if (s.tool === 'road') {
      s.roads.push({ pts, width: p.rw, margin: p.rm })
      setStatus('Strada aggiunta.')
      s.curPts = []
      s.drawing = false
      render()
      if (s.buildings.length || s.zones.length) genRef.current()
      return
    } else if (s.tool === 'river') {
      s.rivers.push({ pts, width: p.rw * 1.6, margin: p.rm * 1.4 })
      setStatus('Fiume aggiunto.')
      s.curPts = []
      s.drawing = false
      render()
      if (s.buildings.length || s.zones.length) genRef.current()
      return
    } else if (s.tool === 'wall') {
      s.walls.push({ pts, width: 0.7 })
      setStatus('Mura aggiunte.')
    }
    s.curPts = []
    s.drawing = false
    render()
  }, [render])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const s = stateRef.current
      const f = e.deltaY < 0 ? 1.1 : 0.91
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      s.vpX = mx - (mx - s.vpX) * f
      s.vpY = my - (my - s.vpY) * f
      s.vpZ = Math.max(0.04, Math.min(s.vpZ * f, 20))
      setZoomPct(Math.round(s.vpZ * 100))
      render()
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current
      if (e.code === 'Space') {
        s.spaceDown = true
        canvas.style.cursor = 'grab'
        e.preventDefault()
      }
      if (e.key === 'Escape') {
        s.curPts = []
        s.drawing = false
        render()
      }
      if (e.key === 'Enter') finishShapeSafe()
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') undoLast()
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        stateRef.current.spaceDown = false
        canvas.style.cursor = 'crosshair'
      }
    }

    const onMouseDown = (e: MouseEvent) => {
      const s = stateRef.current
      const rect = canvas.getBoundingClientRect()
      s.mouse = s2w(e.clientX - rect.left, e.clientY - rect.top)
      if (s.spaceDown) {
        s.isPanning = true
        s.panStart = { x: e.clientX, y: e.clientY }
        s.vpStart = { x: s.vpX, y: s.vpY }
        canvas.style.cursor = 'grabbing'
      }
    }
    const onMouseMove = (e: MouseEvent) => {
      const s = stateRef.current
      const rect = canvas.getBoundingClientRect()
      s.mouse = s2w(e.clientX - rect.left, e.clientY - rect.top)
      if (s.isPanning) {
        s.vpX = s.vpStart.x + (e.clientX - s.panStart.x)
        s.vpY = s.vpStart.y + (e.clientY - s.panStart.y)
        render()
        return
      }
      if (s.drawing) render()
    }
    const onMouseUp = () => {
      const s = stateRef.current
      s.isPanning = false
      canvas.style.cursor = s.spaceDown ? 'grab' : 'crosshair'
    }
    const onClick = (e: MouseEvent) => {
      const s = stateRef.current
      if (s.spaceDown || s.isPanning) return
      const rect = canvas.getBoundingClientRect()
      const w = s2w(e.clientX - rect.left, e.clientY - rect.top)
      if (['zone', 'road', 'river', 'wall'].includes(s.tool)) {
        s.drawing = true
        s.curPts.push({ x: w.x, y: w.y })
        setStatus(
          `${s.curPts.length} punt${s.curPts.length === 1 ? 'o' : 'i'} — doppio click / Enter per chiudere.`,
        )
        render()
      } else if (s.tool === 'erase') {
        for (let i = s.zones.length - 1; i >= 0; i--) {
          if (pointInPoly(w, s.zones[i]!.pts)) {
            s.zones.splice(i, 1)
            s.buildings = []
            render()
            setStatus('Zona rimossa.')
            return
          }
        }
      }
    }

    const onDblClick = (e: MouseEvent) => {
      e.preventDefault()
      const s = stateRef.current
      if (s.spaceDown || s.isPanning) return
      // Il 2° click del doppio-click ha già aggiunto un punto: toglilo e chiudi.
      if (s.drawing && s.curPts.length > 0) s.curPts.pop()
      finishShapeSafe()
    }

    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('click', onClick)
    canvas.addEventListener('dblclick', onDblClick)
    canvas.addEventListener('contextmenu', (e) => e.preventDefault())
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)

    return () => {
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('click', onClick)
      canvas.removeEventListener('dblclick', onDblClick)
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
    }
  }, [finishShapeSafe, render, s2w])

  const setParam = <K extends keyof Params>(key: K, value: Params[K]) => {
    setP((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="fcb">
      <aside className="fcb__sidebar">
        <h1>City Builder</h1>

        <div className="fcb__sec">
          <div className="fcb__sec-t">Sfondo</div>
          <button type="button" className="fcb__btn is-active" onClick={useJapanMap} disabled={!mapReady}>
            Mappa Giappone (Ogon)
          </button>
          <label className="fcb__btn">
            Carica immagine…
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onLoadFile(f)
              }}
            />
          </label>
        </div>
        <div className="fcb__sec">
          <div className="fcb__sec-t">Strumento</div>
          {(
            [
              ['zone', 'Zona edifici'],
              ['road', 'Strada'],
              ['river', 'Fiume / lago'],
              ['wall', 'Mura cittadine'],
              ['erase', 'Cancella zona'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`fcb__btn ${tool === id ? 'is-active' : ''}`}
              onClick={() => {
                setTool(id)
                stateRef.current.curPts = []
                stateRef.current.drawing = false
                render()
              }}
            >
              {label}
            </button>
          ))}
          <p className="fcb__hint">
            Click = punto · Doppio click / Enter = chiudi · ESC = annulla · Ctrl+Z = undo
          </p>
        </div>

        <div className="fcb__sec">
          <div className="fcb__sec-t">Modalità generazione</div>
          <div className="fcb__mode-row">
            <button
              type="button"
              className={`fcb__mode ${genMode === 'block' ? 'is-active' : ''}`}
              onClick={() => setGenMode('block')}
            >
              Blocchi
            </button>
            <button
              type="button"
              className={`fcb__mode ${genMode === 'scatter' ? 'is-active' : ''}`}
              onClick={() => setGenMode('scatter')}
            >
              Sparso
            </button>
          </div>
          <p className="fcb__hint">
            {genMode === 'block'
              ? 'Parcellation: lotti adiacenti allineati a strade/bordi (Watabou).'
              : 'Distribuzione organica (Poisson).'}
          </p>
        </div>

        <div className="fcb__sec">
          <div className="fcb__sec-t">Parametri edifici</div>
          <Slider
            label="Righe profonde"
            value={P.rows}
            min={1}
            max={5}
            step={1}
            onChange={(v) => setParam('rows', v)}
          />
          <Slider
            label="Larghezza"
            value={P.size}
            min={2}
            max={20}
            suffix="px"
            onChange={(v) => setParam('size', v)}
          />
          <Slider
            label="Profondità"
            value={P.depth}
            min={2}
            max={18}
            suffix="px"
            onChange={(v) => setParam('depth', v)}
          />
          <Slider
            label="Gap"
            value={P.gap}
            min={0.5}
            max={5}
            step={0.5}
            suffix="px"
            onChange={(v) => setParam('gap', v)}
          />
          <Slider
            label="Jitter rotazione"
            value={P.rot}
            min={0}
            max={2}
            step={0.5}
            suffix="°"
            onChange={(v) => setParam('rot', v)}
          />
          <label className="fcb__color">
            <span>Colore</span>
            <input
              type="color"
              value={P.color}
              onChange={(e) => setParam('color', e.target.value)}
            />
          </label>
        </div>

        <div className="fcb__sec">
          <div className="fcb__sec-t">Strade / fiumi</div>
          <Slider
            label="Larghezza"
            value={P.rw}
            min={4}
            max={60}
            suffix="px"
            onChange={(v) => setParam('rw', v)}
          />
          <Slider
            label="Margine libero"
            value={P.rm}
            min={0}
            max={30}
            suffix="px"
            onChange={(v) => setParam('rm', v)}
          />
        </div>

        <div className="fcb__sec">
          <div className="fcb__sec-t">Azioni</div>
          <button type="button" className="fcb__btn fcb__btn--go" onClick={generateBuildings}>
            Genera edifici
          </button>
          <button type="button" className="fcb__btn" onClick={undoLast}>
            Annulla ultima
          </button>
          <button type="button" className="fcb__btn" onClick={clearAll}>
            Cancella tutto
          </button>
          <button type="button" className="fcb__btn" onClick={exportPNG}>
            Esporta PNG
          </button>
          <button type="button" className="fcb__btn fcb__btn--go" onClick={() => void applyToDashboard({ saveAsParadise: true })}>
            Salva Blocco Paradise
          </button>
          <button type="button" className="fcb__btn" onClick={() => void clearDashboardOverlay()}>
            Rimuovi overlay dashboard
          </button>
          <p className="fcb__hint">
            Le zone restano solo nel tester (selezione). In dashboard: edifici / strade / mura. File:{' '}
            <code>city-blocks/paradise.json</code>
          </p>
        </div>

        <div className="fcb__sec">
          <p className="fcb__hint">Scroll = zoom · Spazio+trascina = pan</p>
        </div>
      </aside>

      <div className="fcb__stage" ref={wrapRef}>
        <canvas ref={canvasRef} className="fcb__canvas" />
        <div className="fcb__status">{status}</div>
        <div className="fcb__zoom">{zoomPct}%</div>
      </div>
    </div>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = '',
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  suffix?: string
  onChange: (v: number) => void
}) {
  return (
    <label className="fcb__slider">
      <span>
        {label}{' '}
        <em>
          {step < 1 ? value.toFixed(1) : Math.round(value)}
          {suffix}
        </em>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}
