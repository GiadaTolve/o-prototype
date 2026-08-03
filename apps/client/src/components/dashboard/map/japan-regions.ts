/**
 * Metadati Dark-Fantasy per regioni mappa (mockup).
 */
import type { GameMapId } from "@/config/map-config";

export type RegionGlowTheme = "spectral-gold" | "mystic-violet";

export type OyasumiRegionDef = {
  id: Exclude<GameMapId, "altrove">;
  label: string;
  /** Latin spaced sub-label, es. "O G O N" */
  labelSpaced: string;
  labelJa: string;
  blurb: string;
  glow: RegionGlowTheme;
  /** Centro etichetta [lat, lng] */
  labelLatLng: [number, number];
  /** Centro HUD coordinate (mock) */
  coords: { lat: number; lng: number };
};

export const OYASUMI_REGIONS: OyasumiRegionDef[] = [
  {
    id: "ogon",
    label: "Ogon",
    labelSpaced: "O G O N",
    labelJa: "黄金",
    blurb:
      "Mastodontica prefettura-cuore del gioco: Tokyo e l’intero blocco civile dove si svolge la vita quotidiana degli analisti.",
    glow: "spectral-gold",
    labelLatLng: [36.1, 139.5],
    coords: { lat: 36.2893, lng: 139.0281 },
  },
  {
    id: "izayoi",
    label: "Izayoi",
    labelSpaced: "I Z A Y O I",
    labelJa: "十六夜",
    blurb: "Kyoto, Kansai e le porte di Shikoku — tradizione, notte, mare interno.",
    glow: "mystic-violet",
    labelLatLng: [34.7, 135.5],
    coords: { lat: 34.6046, lng: 135.1696 },
  },
  {
    id: "onimori",
    label: "Onimori",
    labelSpaced: "O N I M O R I",
    labelJa: "鬼の森",
    blurb: "Tutto il resto del rettō — wasteland e terre ai margini.",
    glow: "mystic-violet",
    labelLatLng: [33.6, 131.5],
    coords: { lat: 33.5904, lng: 130.4017 },
  },
  {
    id: "ezochi",
    label: "Ezochi",
    labelSpaced: "E Z O C H I",
    labelJa: "蝦夷地",
    blurb: "Tutto Hokkaido — frontiera nord e isolamento.",
    glow: "spectral-gold",
    labelLatLng: [43.3, 142.5],
    coords: { lat: 43.0618, lng: 141.3545 },
  },
];

/** GeoJSON regioni già fuse (un poligono per regione di gioco). */
export const GEOJSON_URL = "/maps/geo/japan-regions.geojson";

export function regionDef(id: GameMapId): OyasumiRegionDef | undefined {
  return OYASUMI_REGIONS.find((r) => r.id === id);
}

export function parseRegionId(raw: unknown): Exclude<GameMapId, "altrove"> | null {
  if (typeof raw !== "string") return null;
  const id = raw.trim().toLowerCase();
  if (id === "ogon" || id === "izayoi" || id === "onimori" || id === "ezochi") {
    return id;
  }
  return null;
}
