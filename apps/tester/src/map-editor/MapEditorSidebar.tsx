/**
 * Sidebar di controllo — sezioni pieghevoli (Step 3–4).
 */
import type { ReactNode } from 'react'

export type BridgeType = 'drawbridge' | 'arch' | 'none'
export type FeatureKind = 'castle' | 'forest' | 'lake' | 'river' | 'walls'
export type EditMode =
  | 'idle'
  | 'draw-road'
  | 'draw-walls'
  | 'edit-labels'
  | 'forest-brush'
  | 'eraser'

export type EditorControls = {
  overallSize: number
  shapeComplexity: number
  coastlineJaggedness: number
  housingDensity: number
  heightVariety: number
  commercialHubs: boolean
  bridgeType: BridgeType
  featureKind: FeatureKind
  treeDensity: number
  labelText: string
  labelFont: string
  labelArc: number
  labelRadius: number
  editMode: EditMode
}

type Props = {
  controls: EditorControls
  onChange: (patch: Partial<EditorControls>) => void
  onReshapeLandmass: () => void
  onDrawNewRoad: () => void
  onDrawWalls: () => void
  onWidenRoad: () => void
  onIncurvateRoad: () => void
  onAddFeature: () => void
  onForestBrush: () => void
  onEraser: () => void
  onAddLabel: () => void
  onEditLabels: () => void
  onRegenerate: () => void
  onSaveSeed: () => void
  onLoadSetup: () => void
  onFinishPolyline: () => void
  draftPoints: number
}

function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  return (
    <details className="map-ed-section" defaultOpen={defaultOpen}>
      <summary className="map-ed-section__title">{title}</summary>
      <div className="map-ed-section__body">{children}</div>
    </details>
  )
}

function SliderRow({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  onChange,
}: {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (v: number) => void
}) {
  return (
    <label className="map-ed-slider">
      <span className="map-ed-slider__label">
        {label}
        <em>{value.toFixed(2)}</em>
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

const FONTS = [
  { id: 'IM Fell Great Primer, EB Garamond, serif', label: 'IM Fell / Garamond' },
  { id: 'Philosopher, serif', label: 'Philosopher' },
  { id: 'EB Garamond, serif', label: 'EB Garamond' },
  { id: 'Source Sans 3, sans-serif', label: 'Source Sans 3' },
]

export function MapEditorSidebar(props: Props) {
  const { controls: c, onChange } = props
  const drawing =
    c.editMode === 'draw-road' || c.editMode === 'draw-walls'

  return (
    <aside className="map-ed-sidebar" aria-label="Map editor controls">
      <header className="map-ed-sidebar__head">
        <h2>Map Editor</h2>
        <p>Step 4 · drag, draw, brush</p>
      </header>

      <div className="map-ed-sidebar__scroll">
        <Section title="Terrain & Landmass">
          <SliderRow
            label="Overall Size"
            value={c.overallSize}
            onChange={(v) => onChange({ overallSize: v })}
          />
          <SliderRow
            label="Shape Complexity"
            value={c.shapeComplexity}
            onChange={(v) => onChange({ shapeComplexity: v })}
          />
          <SliderRow
            label="Coastline Jaggedness"
            value={c.coastlineJaggedness}
            onChange={(v) => onChange({ coastlineJaggedness: v })}
          />
          <button type="button" className="map-ed-btn" onClick={props.onReshapeLandmass}>
            Reshape Landmass
          </button>
        </Section>

        <Section title="Building Blocks">
          <SliderRow
            label="Housing Density"
            value={c.housingDensity}
            onChange={(v) => onChange({ housingDensity: v })}
          />
          <SliderRow
            label="Building Height Variety"
            value={c.heightVariety}
            onChange={(v) => onChange({ heightVariety: v })}
          />
          <label className="map-ed-check">
            <input
              type="checkbox"
              checked={c.commercialHubs}
              onChange={(e) => onChange({ commercialHubs: e.target.checked })}
            />
            Commercial Hubs
          </label>
        </Section>

        <Section title="Infrastructure">
          <button
            type="button"
            className={`map-ed-btn ${c.editMode === 'draw-road' ? 'is-active' : ''}`}
            onClick={props.onDrawNewRoad}
          >
            Draw New Road
            {c.editMode === 'draw-road' ? ` (${props.draftPoints} pts)` : ''}
          </button>
          <button type="button" className="map-ed-btn" onClick={props.onWidenRoad}>
            Widen Existing Road
          </button>
          <button type="button" className="map-ed-btn" onClick={props.onIncurvateRoad}>
            Incurvate Road
          </button>
          <label className="map-ed-field">
            <span>Bridge type</span>
            <select
              value={c.bridgeType}
              onChange={(e) => onChange({ bridgeType: e.target.value as BridgeType })}
            >
              <option value="drawbridge">Drawbridge</option>
              <option value="arch">Arch</option>
              <option value="none">None</option>
            </select>
          </label>
        </Section>

        <Section title="Features & Landmarks">
          <label className="map-ed-field">
            <span>Add feature</span>
            <select
              value={c.featureKind}
              onChange={(e) => onChange({ featureKind: e.target.value as FeatureKind })}
            >
              <option value="castle">Castle/Keep</option>
              <option value="forest">Area Boscosa</option>
              <option value="lake">Aggiungi Lago</option>
              <option value="river">Corso d&apos;acqua</option>
              <option value="walls">Aggiungi Mura</option>
            </select>
          </label>
          {(c.featureKind === 'forest' || c.editMode === 'forest-brush') && (
            <SliderRow
              label="Densità alberi"
              value={c.treeDensity}
              onChange={(v) => onChange({ treeDensity: v })}
            />
          )}
          <button type="button" className="map-ed-btn map-ed-btn--accent" onClick={props.onAddFeature}>
            {c.featureKind === 'walls' ? 'Attiva Disegno Mura' : 'Aggiungi'}
          </button>
          <button
            type="button"
            className={`map-ed-btn ${c.editMode === 'draw-walls' ? 'is-active' : ''}`}
            onClick={props.onDrawWalls}
          >
            Aggiungi Mura (draw)
            {c.editMode === 'draw-walls' ? ` (${props.draftPoints} pts)` : ''}
          </button>
          <button
            type="button"
            className={`map-ed-btn ${c.editMode === 'forest-brush' ? 'is-active' : ''}`}
            onClick={props.onForestBrush}
          >
            Forest Brush
          </button>
          {drawing && (
            <button type="button" className="map-ed-btn map-ed-btn--accent" onClick={props.onFinishPolyline}>
              Finish polyline (o doppio-click)
            </button>
          )}
        </Section>

        <Section title="Text Labels">
          <label className="map-ed-field">
            <span>Testo</span>
            <input
              type="text"
              value={c.labelText}
              onChange={(e) => onChange({ labelText: e.target.value })}
              placeholder="CITY NAME"
            />
          </label>
          <label className="map-ed-field">
            <span>Font</span>
            <select
              value={c.labelFont}
              onChange={(e) => onChange({ labelFont: e.target.value })}
            >
              {FONTS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <SliderRow
            label="Arc angle"
            value={c.labelArc}
            min={0.2}
            max={1.8}
            onChange={(v) => onChange({ labelArc: v })}
          />
          <SliderRow
            label="Radius"
            value={c.labelRadius}
            min={20}
            max={160}
            step={1}
            onChange={(v) => onChange({ labelRadius: v })}
          />
          <button type="button" className="map-ed-btn" onClick={props.onAddLabel}>
            Place Label
          </button>
          <button
            type="button"
            className={`map-ed-btn ${c.editMode === 'edit-labels' ? 'is-active' : ''}`}
            onClick={props.onEditLabels}
          >
            Move and Edit Existing Labels
          </button>
        </Section>

        <Section title="Selection / Eraser">
          <button
            type="button"
            className={`map-ed-btn ${c.editMode === 'eraser' ? 'is-active' : ''}`}
            onClick={props.onEraser}
          >
            Gomma (edifici / muri)
          </button>
          <p className="map-ed-hint">
            Tasto destro sul canvas: elimina edificio o segmento di muro. In modalità gomma vale anche il click sinistro.
          </p>
        </Section>
      </div>

      <footer className="map-ed-sidebar__gen">
        <button type="button" className="map-ed-btn map-ed-btn--regen" onClick={props.onRegenerate}>
          REGENERATE MAP
        </button>
        <div className="map-ed-sidebar__gen-row">
          <button type="button" className="map-ed-btn" onClick={props.onSaveSeed}>
            Save Seed
          </button>
          <button type="button" className="map-ed-btn" onClick={props.onLoadSetup}>
            Load Setup
          </button>
        </div>
      </footer>
    </aside>
  )
}
