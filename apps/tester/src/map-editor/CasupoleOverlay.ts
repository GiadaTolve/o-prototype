/**
 * Overlay Leaflet: casupole + strade/acqua/mura (redraw throttled).
 */
import L from 'leaflet'
import type { Casupola, Corridor, GeoPt } from './casupole-pack'

export type District = { id: string; ring: GeoPt[] }

const C = {
  building: '#C4C0BA',
  buildingStroke: '#1A1820',
  shadow: '#5A565E',
  landmark: '#1A1820',
  road: 'rgba(212, 207, 196, 0.55)',
  roadEdge: 'rgba(26, 24, 32, 0.35)',
  water: '#5C5960',
  wall: '#141218',
  draft: '#c9a84a',
  district: 'rgba(201, 168, 74, 0.18)',
  districtStroke: 'rgba(201, 168, 74, 0.85)',
}

type LayerData = {
  buildings: Casupola[]
  corridors: Corridor[]
  districts: District[]
  draft: GeoPt[]
  draftKind: 'area' | 'road' | 'water' | 'wall' | null
}

export class CasupoleOverlay extends L.Layer {
  private canvas: HTMLCanvasElement | null = null
  private raf = 0
  private data: LayerData = {
    buildings: [],
    corridors: [],
    districts: [],
    draft: [],
    draftKind: null,
  }

  onAdd(map: L.Map): this {
    const pane = map.getPane('overlayPane') ?? map.getContainer()
    const canvas = L.DomUtil.create('canvas', 'jcp-casupole-canvas') as HTMLCanvasElement
    canvas.style.position = 'absolute'
    canvas.style.left = '0'
    canvas.style.top = '0'
    canvas.style.pointerEvents = 'none'
    pane.appendChild(canvas)
    this.canvas = canvas
    map.on('moveend zoomend resize viewreset', this.scheduleRedraw, this)
    map.on('move', this.scheduleRedraw, this)
    this.scheduleRedraw()
    return this
  }

  onRemove(map: L.Map): this {
    map.off('moveend zoomend resize viewreset', this.scheduleRedraw, this)
    map.off('move', this.scheduleRedraw, this)
    if (this.raf) cancelAnimationFrame(this.raf)
    if (this.canvas?.parentNode) this.canvas.parentNode.removeChild(this.canvas)
    this.canvas = null
    return this
  }

  setData(partial: Partial<LayerData>) {
    this.data = { ...this.data, ...partial }
    this.scheduleRedraw()
  }

  private scheduleRedraw = () => {
    if (this.raf) return
    this.raf = requestAnimationFrame(() => {
      this.raf = 0
      this.paint()
    })
  }

  private paint() {
    const map = this._map
    const canvas = this.canvas
    if (!map || !canvas) return

    try {
      const size = map.getSize()
      if (size.x < 2 || size.y < 2) return
      const dpr = Math.min(1.75, window.devicePixelRatio || 1)
      canvas.width = Math.floor(size.x * dpr)
      canvas.height = Math.floor(size.y * dpr)
      canvas.style.width = `${size.x}px`
      canvas.style.height = `${size.y}px`
      const topLeft = map.containerPointToLayerPoint([0, 0])
      L.DomUtil.setPosition(canvas, topLeft)

      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, size.x, size.y)

      const toPt = (g: GeoPt) => {
        const p = map.latLngToContainerPoint([g.lat, g.lng])
        return { x: p.x, y: p.y }
      }

      const zoom = map.getZoom()
      const drawShadow = zoom >= 8 && this.data.buildings.length < 500
      const pad = 40

      for (const d of this.data.districts) {
        if (d.ring.length < 3) continue
        const pts = d.ring.map(toPt)
        ctx.beginPath()
        ctx.moveTo(pts[0]!.x, pts[0]!.y)
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y)
        ctx.closePath()
        ctx.fillStyle = C.district
        ctx.strokeStyle = C.districtStroke
        ctx.lineWidth = 1.5
        ctx.fill()
        ctx.stroke()
      }

      const strokeCorridor = (c: Corridor, color: string, extra = 0) => {
        if (c.path.length < 2) return
        const pts = c.path.map(toPt)
        const mid = c.path[Math.floor(c.path.length / 2)]!
        const cosLat = Math.cos((mid.lat * Math.PI) / 180) || 0.5
        const p0 = map.latLngToContainerPoint([mid.lat, mid.lng])
        const p1 = map.latLngToContainerPoint([
          mid.lat,
          mid.lng + c.widthM / (111320 * cosLat),
        ])
        const wPx = Math.max(3, Math.abs(p1.x - p0.x)) + extra
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.strokeStyle = color
        ctx.lineWidth = wPx
        ctx.beginPath()
        ctx.moveTo(pts[0]!.x, pts[0]!.y)
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y)
        ctx.stroke()
      }

      for (const c of this.data.corridors) {
        if (c.kind === 'water') strokeCorridor(c, C.water)
      }

      ctx.fillStyle = C.building
      ctx.strokeStyle = C.buildingStroke
      ctx.lineWidth = 0.65

      for (const b of this.data.buildings) {
        if (b.footprint.length < 3) continue
        const pts = b.footprint.map(toPt)
        // skip off-screen
        let minX = Infinity
        let minY = Infinity
        let maxX = -Infinity
        let maxY = -Infinity
        for (const p of pts) {
          minX = Math.min(minX, p.x)
          minY = Math.min(minY, p.y)
          maxX = Math.max(maxX, p.x)
          maxY = Math.max(maxY, p.y)
        }
        if (maxX < -pad || maxY < -pad || minX > size.x + pad || minY > size.y + pad) continue

        if (drawShadow && !b.solid) {
          ctx.beginPath()
          ctx.moveTo(pts[0]!.x + 1.4, pts[0]!.y + 1.4)
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]!.x + 1.4, pts[i]!.y + 1.4)
          ctx.closePath()
          ctx.fillStyle = C.shadow
          ctx.fill()
          ctx.fillStyle = C.building
        }

        ctx.beginPath()
        ctx.moveTo(pts[0]!.x, pts[0]!.y)
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y)
        ctx.closePath()
        if (b.solid) {
          ctx.fillStyle = C.landmark
          ctx.fill()
          ctx.stroke()
          ctx.fillStyle = C.building
        } else {
          ctx.fill()
          ctx.stroke()
        }
      }

      for (const c of this.data.corridors) {
        if (c.kind === 'road') {
          strokeCorridor(c, C.roadEdge, 1.2)
          strokeCorridor(c, C.road, 0)
        }
      }

      for (const c of this.data.corridors) {
        if (c.kind !== 'wall' || c.path.length < 2) continue
        const pts = c.path.map(toPt)
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.strokeStyle = C.wall
        ctx.lineWidth = 3.2
        ctx.beginPath()
        ctx.moveTo(pts[0]!.x, pts[0]!.y)
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y)
        ctx.stroke()
        ctx.fillStyle = C.wall
        for (const p of pts) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      if (this.data.draft.length > 0) {
        const pts = this.data.draft.map(toPt)
        ctx.strokeStyle = C.draft
        ctx.fillStyle = C.draft
        ctx.lineWidth = 2
        ctx.setLineDash([6, 4])
        ctx.beginPath()
        ctx.moveTo(pts[0]!.x, pts[0]!.y)
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y)
        if (this.data.draftKind === 'area' && pts.length > 2) ctx.closePath()
        ctx.stroke()
        ctx.setLineDash([])
        for (const p of pts) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    } catch {
      /* non far crashare la mappa per un paint fallito */
    }
  }
}
