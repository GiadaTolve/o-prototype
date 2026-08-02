/**
 * Editor città su mappa Giappone:
 * seleziona area → riempi casupole; disegna strade/acqua/mura (le casupole si spostano).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { JapanInteractiveMap } from '@/components/dashboard/map/JapanInteractiveMap'
import { CasupoleOverlay, type District } from './CasupoleOverlay'
import {
  refillDistricts,
  type Corridor,
  type Casupola,
  type GeoPt,
} from './casupole-pack'
import './JapanCityPainter.css'

type Tool = 'pan' | 'area' | 'road' | 'water' | 'wall'

const WIDTHS: Record<'road' | 'water' | 'wall', number> = {
  road: 70,
  water: 110,
  wall: 22,
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

export function JapanCityPainter() {
  const mapRef = useRef<L.Map | null>(null)
  const overlayRef = useRef<CasupoleOverlay | null>(null)
  const [tool, setTool] = useState<Tool>('area')
  const toolRef = useRef<Tool>(tool)
  toolRef.current = tool

  const [districts, setDistricts] = useState<District[]>([])
  const [corridors, setCorridors] = useState<Corridor[]>([])
  const [buildings, setBuildings] = useState<Casupola[]>([])
  const [draft, setDraft] = useState<GeoPt[]>([])
  const draftRef = useRef<GeoPt[]>([])
  draftRef.current = draft

  const [density, setDensity] = useState(0.82)
  const densityRef = useRef(density)
  densityRef.current = density

  const [status, setStatus] = useState(
    'Seleziona Area: click per i vertici, doppio-click o «Chiudi area» per riempire di casupole.',
  )

  const districtsRef = useRef(districts)
  const corridorsRef = useRef(corridors)
  districtsRef.current = districts
  corridorsRef.current = corridors

  const syncOverlay = useCallback(
    (
      next?: Partial<{
        districts: District[]
        corridors: Corridor[]
        buildings: Casupola[]
        draft: GeoPt[]
        draftKind: Tool | null
      }>,
    ) => {
      overlayRef.current?.setData({
        districts: next?.districts ?? districtsRef.current,
        corridors: next?.corridors ?? corridorsRef.current,
        buildings: next?.buildings ?? buildings,
        draft: next?.draft ?? draftRef.current,
        draftKind:
          next?.draftKind === undefined
            ? toolRef.current === 'pan'
              ? null
              : toolRef.current
            : next.draftKind === 'pan'
              ? null
              : (next.draftKind as 'area' | 'road' | 'water' | 'wall' | null),
      })
    },
    [buildings],
  )

  useEffect(() => {
    overlayRef.current?.setData({
      districts,
      corridors,
      buildings,
      draft,
      draftKind: tool === 'pan' ? null : tool,
    })
  }, [districts, corridors, buildings, draft, tool])

  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)

  const rebuildBuildings = useCallback(
    (dists: District[], corrs: Corridor[], label?: string) => {
      if (busyRef.current) return
      busyRef.current = true
      setBusy(true)
      setStatus(label ?? 'Generazione casupole…')

      // Lascia respirare il main thread (evita schermo grigio)
      window.setTimeout(() => {
        try {
          const { buildings: next, skippedHuge } = refillDistricts(
            dists,
            corrs,
            densityRef.current,
          )
          setBuildings(next)
          if (skippedHuge > 0) {
            setStatus(
              `Area troppo grande (${skippedHuge}) — zoom e seleziona un pezzo più piccolo. · ${next.length} casupole`,
            )
          } else {
            setStatus(`Pronto · ${next.length} casupole`)
          }
        } catch (err) {
          setBuildings([])
          setStatus(
            `Errore packing: ${err instanceof Error ? err.message : 'riprova con un’area più piccola'}`,
          )
        } finally {
          busyRef.current = false
          setBusy(false)
        }
      }, 30)
    },
    [],
  )

  const finishDraft = useCallback(() => {
    if (busyRef.current) {
      setStatus('Attendi fine generazione…')
      return
    }
    const pts = draftRef.current
    const t = toolRef.current
    if (t === 'area') {
      if (pts.length < 3) {
        setStatus('Servono almeno 3 punti per un’area')
        return
      }
      const district: District = { id: uid('dist'), ring: [...pts] }
      const nextDistricts = [...districtsRef.current, district]
      setDistricts(nextDistricts)
      setDraft([])
      rebuildBuildings(nextDistricts, corridorsRef.current, 'Riempimento area…')
      return
    }
    if (t === 'road' || t === 'water' || t === 'wall') {
      if (pts.length < 2) {
        setStatus('Servono almeno 2 punti')
        return
      }
      const corr: Corridor = {
        id: uid(t),
        kind: t,
        path: [...pts],
        widthM: WIDTHS[t],
      }
      const nextCorr = [...corridorsRef.current, corr]
      setCorridors(nextCorr)
      setDraft([])
      rebuildBuildings(
        districtsRef.current,
        nextCorr,
        t === 'road'
          ? 'Spostamento casupole per strada…'
          : t === 'water'
            ? 'Spostamento casupole per acqua…'
            : 'Aggiornamento per mura…',
      )
    }
  }, [rebuildBuildings])

  const refill = () => {
    rebuildBuildings(districtsRef.current, corridorsRef.current, 'Rigenerazione…')
  }
  const onMapReady = useCallback(
    (map: L.Map) => {
      mapRef.current = map
      if (overlayRef.current) {
        map.removeLayer(overlayRef.current)
      }
      const overlay = new CasupoleOverlay()
      overlay.addTo(map)
      overlayRef.current = overlay
      syncOverlay()

      const onClick = (e: L.LeafletMouseEvent) => {
        const t = toolRef.current
        if (t === 'pan') return
        const pt: GeoPt = { lat: e.latlng.lat, lng: e.latlng.lng }
        setDraft((prev) => [...prev, pt])
      }

      const onDblClick = (e: L.LeafletMouseEvent) => {
        L.DomEvent.preventDefault(e.originalEvent)
        // Il secondo click del dblclick aggiunge un punto: toglilo
        setDraft((prev) => {
          const trimmed = prev.length > 0 ? prev.slice(0, -1) : prev
          draftRef.current = trimmed
          return trimmed
        })
        queueMicrotask(() => finishDraft())
      }

      map.on('click', onClick)
      map.on('dblclick', onDblClick)
      map.doubleClickZoom.disable()

      // store cleanup on map
      ;(map as L.Map & { __jcpCleanup?: () => void }).__jcpCleanup = () => {
        map.off('click', onClick)
        map.off('dblclick', onDblClick)
        map.doubleClickZoom.enable()
        if (overlayRef.current) {
          map.removeLayer(overlayRef.current)
          overlayRef.current = null
        }
      }
    },
    [finishDraft, syncOverlay],
  )

  useEffect(() => {
    return () => {
      const map = mapRef.current as (L.Map & { __jcpCleanup?: () => void }) | null
      map?.__jcpCleanup?.()
    }
  }, [])

  const selectTool = (t: Tool) => {
    setTool(t)
    setDraft([])
    const msgs: Record<Tool, string> = {
      pan: 'Pan / zoom mappa',
      area: 'Area: click vertici · doppio-click o Chiudi area → casupole',
      road: 'Strada: click vertici · doppio-click → le casupole si spostano',
      water: 'Acqua: click vertici · doppio-click → le casupole si spostano',
      wall: 'Mura: click vertici · doppio-click → torri ai nodi',
    }
    setStatus(msgs[t])
  }

  const clearAll = () => {
    setDistricts([])
    setCorridors([])
    setBuildings([])
    setDraft([])
    setStatus('Mappa città azzerata')
  }

  return (
    <div className={`jcp ${busy ? 'is-busy' : ''}`}>
      <div className="jcp__map">
        <JapanInteractiveMap
          onSelectGameMap={() => {}}
          initialScope="ogon"
          onMapReady={onMapReady}
          suppressRegionSelect={tool !== 'pan'}
          className="jcp__jim"
        />
        <div className="jcp__status" role="status">
          {status}
          {draft.length > 0 ? ` · draft ${draft.length} pts` : ''}
          {buildings.length > 0 ? ` · ${buildings.length} casupole` : ''}
        </div>
      </div>

      <aside className="jcp__sidebar">
        <header className="jcp__head">
          <h2>Casupole su Giappone</h2>
          <p>Seleziona un pezzo piccolo · max ~900 casupole</p>
        </header>

        <div className="jcp__tools">
          {(
            [
              ['pan', 'Pan'],
              ['area', 'Seleziona area'],
              ['road', 'Disegna strada'],
              ['water', 'Corso d’acqua'],
              ['wall', 'Mura'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`jcp__btn ${tool === id ? 'is-active' : ''}`}
              onClick={() => selectTool(id)}
              disabled={busy}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="jcp__slider">
          <span>
            Densità casupole <em>{density.toFixed(2)}</em>
          </span>
          <input
            type="range"
            min={0.4}
            max={1}
            step={0.01}
            value={density}
            disabled={busy}
            onChange={(e) => setDensity(Number(e.target.value))}
          />
        </label>

        <div className="jcp__actions">
          <button
            type="button"
            className="jcp__btn jcp__btn--accent"
            onClick={finishDraft}
            disabled={busy}
          >
            {tool === 'area' ? 'Chiudi area e riempi' : 'Termina tratto'}
          </button>
          <button type="button" className="jcp__btn" onClick={refill} disabled={busy}>
            Rigenera casupole
          </button>
          <button
            type="button"
            className="jcp__btn"
            disabled={busy}
            onClick={() => {
              setDraft((d) => d.slice(0, -1))
            }}
          >
            Annulla ultimo punto
          </button>
          <button type="button" className="jcp__btn" onClick={clearAll} disabled={busy}>
            Pulisci tutto
          </button>
        </div>

        <p className="jcp__hint">
          Zoom vicino (quartiere / città), non mezza prefettura. Aree troppo grandi vengono
          rifiutate per evitare crash. Strade/acqua spostano le casupole.
        </p>
      </aside>
    </div>
  )
}
