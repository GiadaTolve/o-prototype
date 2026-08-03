/**
 * Watabou-style medieval vector map — data model (Step 1).
 * Coordinate: piano 2D locale (origine in alto a sinistra, y verso il basso), unità arbitrarie.
 */

/** Punto 2D. */
export type Vec2 = { x: number; y: number }

/** Poligono chiuso (primo punto ≠ ultimo; il renderer chiude il path). */
export type Polygon = Vec2[]

/** Polilinea aperta. */
export type Polyline = Vec2[]

/** Identificatore stabile (uuid o slug). */
export type EntityId = string

// ─── Terrain ───────────────────────────────────────────────────────────────

export type CoastStyle = 'rocky' | 'smooth' | 'marsh'

export type TerrainState = {
  /** Contorno terraferma (isola / penisola). */
  landmass: Polygon
  /** Frastagliatura costa: ampiezza rumore 0–1 applicata al bordo. */
  jaggedness: number
  coastStyle: CoastStyle
  /** Griglia di sfondo (stile carta). */
  grid: {
    enabled: boolean
    /** Passo in unità mappa. */
    spacing: number
    opacity: number
  }
}

// ─── Water ─────────────────────────────────────────────────────────────────

export type WaterKind = 'river' | 'lake' | 'canal' | 'sea'
export type BankStyle = 'natural' | 'stone' | 'dock'

export type WaterFeature = {
  id: EntityId
  kind: WaterKind
  /** Fiume/canale = polyline; lago/mare locale = polygon. */
  geometry: Polyline | Polygon
  /** Spessore in unità mappa (rilevante per river/canal). */
  width: number
  bankStyle: BankStyle
  label?: string
}

export type WaterState = {
  features: WaterFeature[]
}

// ─── Walls ─────────────────────────────────────────────────────────────────

export type WallGate = {
  id: EntityId
  /** Indice segmento o t lungo la polilinea 0–1. */
  t: number
  width: number
  name?: string
}

export type WallTower = {
  id: EntityId
  t: number
  radius: number
}

export type CityWall = {
  id: EntityId
  path: Polyline
  thickness: number
  towers: WallTower[]
  gates: WallGate[]
}

export type WallsState = {
  walls: CityWall[]
}

// ─── Roads ─────────────────────────────────────────────────────────────────

export type RoadKind = 'primary' | 'secondary' | 'alley'

export type Bridge = {
  id: EntityId
  /** Posizione lungo la strada 0–1. */
  t: number
  length: number
  /** Id feature water attraversata (opzionale). */
  overWaterId?: EntityId
}

export type Road = {
  id: EntityId
  kind: RoadKind
  path: Polyline
  width: number
  bridges: Bridge[]
}

export type RoadsState = {
  roads: Road[]
}

// ─── Districts ─────────────────────────────────────────────────────────────

export type DistrictKind =
  | 'castle'
  | 'market'
  | 'docks'
  | 'slums'
  | 'temple'
  | 'green'
  | 'residential'
  | 'other'

export type District = {
  id: EntityId
  name: string
  kind: DistrictKind
  polygon: Polygon
  /** Colore fill opzionale (hex); altrimenti dal kind. */
  fill?: string
}

export type DistrictsState = {
  districts: District[]
}

// ─── Buildings ─────────────────────────────────────────────────────────────

export type BuildingKind = 'house' | 'landmark' | 'warehouse' | 'temple' | 'keep'

export type Building = {
  id: EntityId
  kind: BuildingKind
  /** Rettangolo o poligono irregolare. */
  footprint: Polygon
  /** Fuori le mura / shantytown. */
  outsideWalls?: boolean
  districtId?: EntityId
  /** Landmark pieni scuri (stile Watabou). */
  solid?: boolean
}

export type BuildingsState = {
  buildings: Building[]
}

// ─── Forests ───────────────────────────────────────────────────────────────

export type ForestKind = 'grove' | 'woods' | 'orchard'

export type Forest = {
  id: EntityId
  kind: ForestKind
  /** Area bosco (poligono) e/o alberi singoli. */
  canopy?: Polygon
  trees: Vec2[]
}

export type ForestsState = {
  forests: Forest[]
}

// ─── Labels ────────────────────────────────────────────────────────────────

export type LabelFont = {
  family: string
  size: number
  weight?: number
  letterSpacing?: number
  fill: string
}

/** Testo lungo curva (arco / Bezier semplificata). */
export type MapLabel = {
  id: EntityId
  text: string
  font: LabelFont
  /** Centro dell’arco o punto di ancoraggio. */
  anchor: Vec2
  /** Angolo iniziale (radianti). */
  startAngle: number
  /** Ampiezza arco (radianti); 0 = testo dritto. */
  arcAngle: number
  /** Raggio dell’arco. */
  radius: number
  /** Rotazione aggiuntiva del glifo (radianti). */
  rotation: number
  /** Controlli Bezier opzionali (se presenti, hanno priorità sull’arco). */
  bezier?: {
    p0: Vec2
    p1: Vec2
    p2: Vec2
    p3: Vec2
  }
}

export type LabelsState = {
  labels: MapLabel[]
}

// ─── Root map document ─────────────────────────────────────────────────────

export type MapMeta = {
  name: string
  /** Dimensioni canvas logiche. */
  width: number
  height: number
  /** Seed opzionale (procgen / Watabou). */
  seed?: number
  version: 1
}

/**
 * Documento mappa completo — fonte di verità dell’editor.
 */
export type MedievalMapDocument = {
  meta: MapMeta
  terrain: TerrainState
  water: WaterState
  walls: WallsState
  roads: RoadsState
  districts: DistrictsState
  buildings: BuildingsState
  forests: ForestsState
  labels: LabelsState
}

/** Palette di riferimento stile Watabou / SVG export. */
export const WATABOU_PALETTE = {
  parchment: '#D4CFC4',
  building: '#B9B5B0',
  buildingDark: '#5C5960',
  ink: '#1A1820',
  inkDeep: '#141218',
  water: '#5C5960',
  forest: '#4A4750',
} as const
