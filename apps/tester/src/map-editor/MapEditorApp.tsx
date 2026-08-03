/**
 * App editor mappa: canvas interattivo + sidebar (Step 3–4).
 */
import { useCallback, useRef, useState, type PointerEvent } from 'react'
import { EXAMPLE_MAP } from './example-map'
import type { MapLabel, MedievalMapDocument, Vec2 } from './map-schema'
import { MedievalMapRenderer } from './MedievalMapRenderer'
import {
  addKeep,
  addLake,
  addOrUpdateDraftLabel,
  addRiver,
  addRoad,
  addWallFromPath,
  applyOverallSize,
  applyShapeComplexity,
  cloneExample,
  incurvateRoads,
  paintForestBrush,
  rebuildHousing,
  regenerateMap,
  reshapeLandmass,
  updateAllLabelCurves,
  widenRoads,
} from './map-mutations'
import {
  deleteBuilding,
  deleteWallSegment,
  ensureLabelBezier,
  hitBezierHandle,
  hitBuilding,
  hitLabel,
  hitWallSegment,
  labelCenter,
  translateLabel,
  type BezierHandle,
} from './map-hit'
import {
  MapEditorSidebar,
  type EditorControls,
  type EditMode,
} from './MapEditorSidebar'
import './MapEditorApp.css'

const STORAGE_KEY = 'oyasumi-map-editor-setup-v1'

const DEFAULT_CONTROLS: EditorControls = {
  overallSize: 0.55,
  shapeComplexity: 0.25,
  coastlineJaggedness: 0.35,
  housingDensity: 0.78,
  heightVariety: 0.35,
  commercialHubs: true,
  bridgeType: 'arch',
  featureKind: 'castle',
  treeDensity: 0.55,
  labelText: 'MILLHAVEN',
  labelFont: 'IM Fell Great Primer, EB Garamond, serif',
  labelArc: 0.9,
  labelRadius: 90,
  editMode: 'idle',
}

type DragState =
  | { kind: 'none' }
  | { kind: 'label-move'; id: string; last: Vec2 }
  | { kind: 'bezier'; id: string; handle: BezierHandle }
  | { kind: 'forest-brush' }

function applyTerrainParams(
  base: MedievalMapDocument,
  size: number,
  complexity: number,
  jaggedness: number,
): MedievalMapDocument {
  let d = applyOverallSize(base, size)
  d = applyShapeComplexity(d, complexity)
  return {
    ...d,
    terrain: { ...d.terrain, jaggedness },
  }
}

function setMode(
  prev: EditMode,
  next: EditMode,
): EditMode {
  return prev === next ? 'idle' : next
}

export function MapEditorApp() {
  const [controls, setControls] = useState<EditorControls>(DEFAULT_CONTROLS)
  const [doc, setDoc] = useState<MedievalMapDocument>(() => structuredClone(EXAMPLE_MAP))
  const [polyDraft, setPolyDraft] = useState<Vec2[]>([])
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null)
  const [status, setStatus] = useState('Pronto — Step 4 interattivo')
  const [drag, setDrag] = useState<DragState>({ kind: 'none' })
  const canvasHostRef = useRef<HTMLDivElement>(null)
  const lastBrushRef = useRef<Vec2 | null>(null)
  const controlsRef = useRef(controls)
  const polyDraftRef = useRef(polyDraft)
  controlsRef.current = controls
  polyDraftRef.current = polyDraft

  const patchControls = useCallback((patch: Partial<EditorControls>) => {
    setControls((prev) => {
      const next = { ...prev, ...patch }

      setDoc((prevDoc) => {
        let d = prevDoc

        if (
          patch.overallSize !== undefined ||
          patch.shapeComplexity !== undefined ||
          patch.coastlineJaggedness !== undefined
        ) {
          const size = patch.overallSize ?? next.overallSize
          const complexity = patch.shapeComplexity ?? next.shapeComplexity
          const jagged = patch.coastlineJaggedness ?? next.coastlineJaggedness
          const base = {
            ...prevDoc,
            terrain: {
              ...prevDoc.terrain,
              landmass: structuredClone(EXAMPLE_MAP.terrain.landmass),
            },
          }
          d = applyTerrainParams(base, size, complexity, jagged)
        }

        if (
          patch.housingDensity !== undefined ||
          patch.heightVariety !== undefined ||
          patch.commercialHubs !== undefined
        ) {
          d = rebuildHousing(
            d,
            patch.housingDensity ?? next.housingDensity,
            patch.heightVariety ?? next.heightVariety,
            patch.commercialHubs ?? next.commercialHubs,
          )
        }

        if (patch.labelArc !== undefined || patch.labelRadius !== undefined) {
          d = updateAllLabelCurves(
            d,
            patch.labelArc ?? next.labelArc,
            patch.labelRadius ?? next.labelRadius,
          )
        }

        return d
      })

      return next
    })
  }, [])

  const enterMode = (mode: EditMode, message: string) => {
    setControls((c) => {
      const next = setMode(c.editMode, mode)
      setStatus(next === 'idle' ? 'Pronto' : message)
      return { ...c, editMode: next }
    })
    setPolyDraft([])
    setSelectedLabelId(null)
    setDrag({ kind: 'none' })
  }

  const onReshapeLandmass = () => {
    setDoc((d) => reshapeLandmass(d))
    setStatus('Landmass reshaped')
  }

  const onDrawNewRoad = () => {
    enterMode('draw-road', 'Draw Road: click per vertici, doppio-click o Finish per chiudere')
  }

  const onDrawWalls = () => {
    enterMode('draw-walls', 'Draw Walls: click per vertici, doppio-click o Finish per chiudere')
  }

  const onWidenRoad = () => {
    setDoc((d) => widenRoads(d))
    setStatus('Roads widened')
  }

  const onIncurvateRoad = () => {
    setDoc((d) => incurvateRoads(d))
    setStatus('Roads incurvated')
  }

  const onAddFeature = () => {
    if (controls.featureKind === 'walls') {
      onDrawWalls()
      return
    }
    if (controls.featureKind === 'forest') {
      enterMode('forest-brush', 'Forest Brush: trascina per pennellare alberi')
      return
    }
    setDoc((d) => {
      switch (controls.featureKind) {
        case 'castle':
          return addKeep(d)
        case 'lake':
          return addLake(d)
        case 'river':
          return addRiver(d)
        default:
          return d
      }
    })
    setStatus(`Added ${controls.featureKind}`)
  }

  const onForestBrush = () => {
    enterMode('forest-brush', 'Forest Brush: trascina per pennellare alberi')
  }

  const onEraser = () => {
    enterMode('eraser', 'Gomma: click sinistro su edificio/muro · o tasto destro sempre')
  }

  const onAddLabel = () => {
    setDoc((d) =>
      addOrUpdateDraftLabel(
        d,
        controls.labelText,
        controls.labelFont,
        20,
        controls.labelArc,
        controls.labelRadius,
      ),
    )
    setStatus('Label placed')
  }

  const onEditLabels = () => {
    enterMode(
      'edit-labels',
      'Labels: click per selezionare · trascina testo · nodi Bezier per la curva',
    )
  }

  const finishPolyline = () => {
    const mode = controlsRef.current.editMode
    const draft = polyDraftRef.current
    if (draft.length < 2) {
      setStatus('Servono almeno 2 punti')
      return
    }
    if (mode === 'draw-road') {
      const bridge = controlsRef.current.bridgeType
      setDoc((d) => addRoad(d, draft, bridge === 'none' ? 'none' : bridge))
      setStatus('Road drawn')
    } else if (mode === 'draw-walls') {
      setDoc((d) => addWallFromPath(d, draft))
      setStatus('Walls drawn')
    } else {
      return
    }
    setPolyDraft([])
    setControls((c) => ({ ...c, editMode: 'idle' }))
  }

  const onRegenerate = () => {
    setDoc((d) => regenerateMap(d))
    setControls((c) => ({ ...c, editMode: 'idle' }))
    setPolyDraft([])
    setSelectedLabelId(null)
    setStatus('Map regenerated')
  }

  const onSaveSeed = () => {
    const payload = { controls, doc, savedAt: Date.now() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    setStatus(`Seed saved · ${doc.meta.seed}`)
  }

  const loadSetup = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        setDoc(cloneExample())
        setControls(DEFAULT_CONTROLS)
        setStatus('No save found — loaded example')
        return
      }
      const parsed = JSON.parse(raw) as { controls: EditorControls; doc: MedievalMapDocument }
      setControls({ ...DEFAULT_CONTROLS, ...parsed.controls, editMode: 'idle' })
      setDoc(parsed.doc)
      setStatus(`Setup loaded · seed ${parsed.doc.meta.seed}`)
    } catch {
      setStatus('Load failed')
    }
  }

  const toMapPoint = (clientX: number, clientY: number): Vec2 | null => {
    const host = canvasHostRef.current
    if (!host) return null
    const canvas = host.querySelector('canvas')
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    if (rect.width < 1 || rect.height < 1) return null
    const sx = doc.meta.width / rect.width
    const sy = doc.meta.height / rect.height
    return {
      x: (clientX - rect.left) * sx,
      y: (clientY - rect.top) * sy,
    }
  }

  const docRef = useRef(doc)
  docRef.current = doc

  const tryEraseAt = (pt: Vec2): boolean => {
    const d = docRef.current
    const b = hitBuilding(d, pt)
    if (b) {
      setDoc((prev) => deleteBuilding(prev, b.id))
      setStatus(`Eliminato edificio ${b.kind}`)
      return true
    }
    const w = hitWallSegment(d, pt, 12)
    if (w) {
      setDoc((prev) => deleteWallSegment(prev, w.wallId, w.segmentIndex))
      setStatus('Eliminato segmento di muro')
      return true
    }
    return false
  }

  const selectLabel = (id: string | null) => {
    setSelectedLabelId(id)
    if (!id) return
    setDoc((d) => ({
      ...d,
      labels: {
        labels: d.labels.labels.map((l) =>
          l.id === id ? ensureLabelBezier(l) : l,
        ),
      },
    }))
    const lab = doc.labels.labels.find((l) => l.id === id)
    if (lab) {
      setControls((c) => ({
        ...c,
        labelText: lab.text,
        labelFont: lab.font.family,
        labelArc: lab.arcAngle,
        labelRadius: lab.radius,
      }))
    }
  }

  const onPointerDown = (e: PointerEvent) => {
    const pt = toMapPoint(e.clientX, e.clientY)
    if (!pt) return
    const mode = controls.editMode

    // Right-click erase always
    if (e.button === 2) {
      e.preventDefault()
      tryEraseAt(pt)
      return
    }
    if (e.button !== 0) return

    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)

    if (mode === 'eraser') {
      tryEraseAt(pt)
      return
    }

    if (mode === 'draw-road' || mode === 'draw-walls') {
      setPolyDraft((prev) => [...prev, pt])
      setStatus(
        mode === 'draw-road'
          ? `Road draft: ${polyDraft.length + 1} pts`
          : `Wall draft: ${polyDraft.length + 1} pts`,
      )
      return
    }

    if (mode === 'forest-brush') {
      lastBrushRef.current = pt
      setDrag({ kind: 'forest-brush' })
      setDoc((d) => paintForestBrush(d, pt, controls.treeDensity))
      return
    }

    if (mode === 'edit-labels') {
      // Prefer handle of selected label
      if (selectedLabelId) {
        const lab = doc.labels.labels.find((l) => l.id === selectedLabelId)
        if (lab) {
          const withBez = ensureLabelBezier(lab)
          const handle = hitBezierHandle(withBez, pt, 16)
          if (handle) {
            setDoc((d) => ({
              ...d,
              labels: {
                labels: d.labels.labels.map((l) =>
                  l.id === selectedLabelId ? withBez : l,
                ),
              },
            }))
            setDrag({ kind: 'bezier', id: selectedLabelId, handle })
            return
          }
        }
      }

      const id = hitLabel(doc, pt, 42)
      if (id) {
        selectLabel(id)
        // Ensure bezier then start move
        setDoc((d) => {
          const labels = d.labels.labels.map((l) =>
            l.id === id ? ensureLabelBezier(l) : l,
          )
          return { ...d, labels: { labels } }
        })
        setDrag({ kind: 'label-move', id, last: pt })
        setStatus('Label selezionata — trascina o muovi i nodi Bezier')
        return
      }

      selectLabel(null)
      setDrag({ kind: 'none' })
      return
    }

    // Idle: allow quick label select/drag
    if (mode === 'idle') {
      const id = hitLabel(doc, pt, 36)
      if (id) {
        setControls((c) => ({ ...c, editMode: 'edit-labels' }))
        selectLabel(id)
        setDoc((d) => ({
          ...d,
          labels: {
            labels: d.labels.labels.map((l) =>
              l.id === id ? ensureLabelBezier(l) : l,
            ),
          },
        }))
        setDrag({ kind: 'label-move', id, last: pt })
      }
    }
  }

  const onPointerMove = (e: PointerEvent) => {
    const pt = toMapPoint(e.clientX, e.clientY)
    if (!pt) return

    if (drag.kind === 'forest-brush' && (e.buttons & 1)) {
      const last = lastBrushRef.current
      if (!last || Math.hypot(pt.x - last.x, pt.y - last.y) >= 10) {
        lastBrushRef.current = pt
        setDoc((d) => paintForestBrush(d, pt, controlsRef.current.treeDensity))
      }
      return
    }

    if (drag.kind === 'label-move') {
      const dx = pt.x - drag.last.x
      const dy = pt.y - drag.last.y
      setDrag({ ...drag, last: pt })
      setDoc((d) => ({
        ...d,
        labels: {
          labels: d.labels.labels.map((l) =>
            l.id === drag.id ? translateLabel(ensureLabelBezier(l), dx, dy) : l,
          ),
        },
      }))
      return
    }

    if (drag.kind === 'bezier') {
      setDoc((d) => ({
        ...d,
        labels: {
          labels: d.labels.labels.map((l) => {
            if (l.id !== drag.id) return l
            const lb = ensureLabelBezier(l)
            if (!lb.bezier) return lb
            return {
              ...lb,
              bezier: { ...lb.bezier, [drag.handle]: pt },
              anchor: labelCenter({ ...lb, bezier: { ...lb.bezier, [drag.handle]: pt } }),
            }
          }),
        },
      }))
    }
  }

  const onPointerUp = (e: PointerEvent) => {
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      /* already released */
    }
    setDrag({ kind: 'none' })
    lastBrushRef.current = null
  }

  const onDoubleClick = () => {
    if (
      controls.editMode === 'draw-road' ||
      controls.editMode === 'draw-walls'
    ) {
      // Il secondo click del doppio-click aggiunge un punto: rimuovilo
      const trimmed = polyDraftRef.current.slice(0, -1)
      polyDraftRef.current = trimmed
      setPolyDraft(trimmed)
      // finish legge dal ref
      queueMicrotask(() => finishPolyline())
    }
  }

  const selectedLabel: MapLabel | null =
    selectedLabelId
      ? doc.labels.labels.find((l) => l.id === selectedLabelId) ?? null
      : null
  const selectedBez = selectedLabel ? ensureLabelBezier(selectedLabel).bezier : null

  const draftStroke =
    controls.editMode === 'draw-walls'
      ? 'var(--accent-violet)'
      : 'var(--accent-gold)'

  return (
    <div className="map-ed-app">
      <div
        className="map-ed-stage"
        ref={canvasHostRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
        onContextMenu={(e) => e.preventDefault()}
        data-mode={controls.editMode}
      >
        <MedievalMapRenderer document={doc} className="map-ed-canvas" />

        <svg
          className="map-ed-draft"
          viewBox={`0 0 ${doc.meta.width} ${doc.meta.height}`}
        >
          {polyDraft.length > 0 && (
            <>
              <polyline
                fill="none"
                stroke={draftStroke}
                strokeWidth={3}
                strokeDasharray="6 4"
                points={polyDraft.map((p) => `${p.x},${p.y}`).join(' ')}
              />
              {polyDraft.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={4} fill={draftStroke} />
              ))}
            </>
          )}

          {selectedBez && controls.editMode === 'edit-labels' && (
            <g className="map-ed-bezier">
              <path
                d={`M ${selectedBez.p0.x} ${selectedBez.p0.y} C ${selectedBez.p1.x} ${selectedBez.p1.y}, ${selectedBez.p2.x} ${selectedBez.p2.y}, ${selectedBez.p3.x} ${selectedBez.p3.y}`}
                fill="none"
                stroke="var(--accent-gold)"
                strokeWidth={1.2}
                strokeDasharray="4 3"
                opacity={0.85}
              />
              <line
                x1={selectedBez.p0.x}
                y1={selectedBez.p0.y}
                x2={selectedBez.p1.x}
                y2={selectedBez.p1.y}
                stroke="var(--accent-violet-light)"
                strokeWidth={1}
                opacity={0.7}
              />
              <line
                x1={selectedBez.p3.x}
                y1={selectedBez.p3.y}
                x2={selectedBez.p2.x}
                y2={selectedBez.p2.y}
                stroke="var(--accent-violet-light)"
                strokeWidth={1}
                opacity={0.7}
              />
              {(
                [
                  ['p0', selectedBez.p0],
                  ['p1', selectedBez.p1],
                  ['p2', selectedBez.p2],
                  ['p3', selectedBez.p3],
                ] as const
              ).map(([key, p]) => (
                <circle
                  key={key}
                  cx={p.x}
                  cy={p.y}
                  r={key === 'p0' || key === 'p3' ? 6 : 5}
                  className={
                    key === 'p0' || key === 'p3'
                      ? 'map-ed-handle map-ed-handle--end'
                      : 'map-ed-handle map-ed-handle--ctrl'
                  }
                />
              ))}
            </g>
          )}
        </svg>

        <div className="map-ed-status" role="status">
          {status}
          {selectedLabelId ? ` · ${selectedLabelId}` : ''}
        </div>
      </div>

      <MapEditorSidebar
        controls={controls}
        onChange={patchControls}
        onReshapeLandmass={onReshapeLandmass}
        onDrawNewRoad={onDrawNewRoad}
        onDrawWalls={onDrawWalls}
        onWidenRoad={onWidenRoad}
        onIncurvateRoad={onIncurvateRoad}
        onAddFeature={onAddFeature}
        onForestBrush={onForestBrush}
        onEraser={onEraser}
        onAddLabel={onAddLabel}
        onEditLabels={onEditLabels}
        onRegenerate={onRegenerate}
        onSaveSeed={onSaveSeed}
        onLoadSetup={loadSetup}
        onFinishPolyline={finishPolyline}
        draftPoints={polyDraft.length}
      />
    </div>
  )
}