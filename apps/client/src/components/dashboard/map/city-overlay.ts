/**
 * PROTOTIPO reversibile — overlay città dal Fantasy City Builder.
 *
 * Rollback:
 * 1) Elimina `public/maps/city-overlay.json` (+ eventuale city-blocks/*)
 * 2) Oppure spegni il toggle «Città» in mappa
 * 3) Per rimuovere il codice: questo file + wiring in JapanInteractiveMap
 *
 * Nota: le zone sono solo selezione authoring — NON vengono disegnate in dashboard.
 */
import type L from "leaflet";

export const CITY_OVERLAY_URL = "/maps/city-overlay.json";
export const CITY_OVERLAY_API = "/api/dev/city-overlay";
export const CITY_BLOCK_PARADISE_URL = "/maps/city-blocks/paradise.json";

export type CityOverlayPayload = {
  version: 1;
  id?: string;
  name?: string;
  prototype?: boolean;
  zones?: { ring: [number, number][] }[];
  buildings?: { ring: [number, number][]; color?: string }[];
  roads?: { line: [number, number][]; width?: number }[];
  rivers?: { line: [number, number][]; width?: number }[];
  walls?: { line: [number, number][]; width?: number }[];
};

/** ring/line sono [lng, lat] → Leaflet vuole [lat, lng]. */
function toLatLngs(ring: [number, number][]): L.LatLngExpression[] {
  return ring.map(([lng, lat]) => [lat, lng] as [number, number]);
}

/** Larghezza tratto in px schermo, indipendente dallo zoom geografico estremo. */
function screenWeight(map: L.Map, worldPx: number, min = 0.8, max = 4): number {
  // Approssima: a zoom Ogon (~7.5) 1 world-px canvas ≈ pochi metri → tratto sottile
  const z = map.getZoom();
  const scale = Math.pow(2, Math.max(0, z - 6)) * 0.08;
  return Math.max(min, Math.min(max, worldPx * scale));
}

export async function fetchCityOverlay(): Promise<CityOverlayPayload | null> {
  for (const url of [
    `${CITY_OVERLAY_API}?t=${Date.now()}`,
    `${CITY_OVERLAY_URL}?t=${Date.now()}`,
    `${CITY_BLOCK_PARADISE_URL}?t=${Date.now()}`,
  ]) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.status === 404) continue;
      if (!res.ok) continue;
      const data = (await res.json()) as CityOverlayPayload & { missing?: boolean };
      if (data && data.missing) continue;
      if (data && (data.buildings?.length || data.roads?.length || data.walls?.length)) {
        return data;
      }
      // zone-only: ancora utile per “disponibile”, ma mount disegnerà poco
      if (data && data.zones?.length) return data;
    } catch {
      /* try next */
    }
  }
  return null;
}

export function mountCityOverlay(
  Lns: typeof import("leaflet"),
  map: L.Map,
  data: CityOverlayPayload,
): L.LayerGroup {
  if (!map.getPane("jimCityOverlay")) {
    map.createPane("jimCityOverlay");
    const pane = map.getPane("jimCityOverlay");
    if (pane) {
      pane.style.zIndex = "650";
      pane.style.pointerEvents = "none";
    }
  }

  const group = Lns.layerGroup();

  // Zone: intenzionalmente NON disegnate (solo selezione nel tester).

  for (const r of data.rivers ?? []) {
    if (!r.line || r.line.length < 2) continue;
    Lns.polyline(toLatLngs(r.line), {
      pane: "jimCityOverlay",
      interactive: false,
      color: "rgba(74, 50, 110, 0.85)",
      weight: screenWeight(map, (r.width ?? 14) * 0.35, 1.2, 5),
      opacity: 0.9,
      lineCap: "round",
      lineJoin: "round",
      className: "jim-city-river",
    }).addTo(group);
  }

  for (const r of data.roads ?? []) {
    if (!r.line || r.line.length < 2) continue;
    // bordo scuro + oro (come tester)
    Lns.polyline(toLatLngs(r.line), {
      pane: "jimCityOverlay",
      interactive: false,
      color: "rgba(10, 10, 15, 0.7)",
      weight: screenWeight(map, (r.width ?? 14) * 0.45, 1.4, 6),
      opacity: 0.85,
      lineCap: "round",
      lineJoin: "round",
      className: "jim-city-road-edge",
    }).addTo(group);
    Lns.polyline(toLatLngs(r.line), {
      pane: "jimCityOverlay",
      interactive: false,
      color: "#8a7340",
      weight: screenWeight(map, (r.width ?? 14) * 0.28, 1, 4),
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round",
      className: "jim-city-road",
    }).addTo(group);
  }

  for (const w of data.walls ?? []) {
    if (!w.line || w.line.length < 2) continue;
    Lns.polyline(toLatLngs(w.line), {
      pane: "jimCityOverlay",
      interactive: false,
      color: "#1a1624",
      weight: screenWeight(map, Math.max(1.2, (w.width ?? 0.7) + 0.45), 1, 2.5),
      opacity: 0.9,
      lineCap: "round",
      className: "jim-city-wall-core",
    }).addTo(group);
    Lns.polyline(toLatLngs(w.line), {
      pane: "jimCityOverlay",
      interactive: false,
      color: "#c9a84a",
      weight: screenWeight(map, Math.max(0.7, w.width ?? 0.7), 0.7, 1.8),
      opacity: 0.95,
      lineCap: "round",
      className: "jim-city-wall",
    }).addTo(group);
  }

  // Edifici: rettangoli axis-aligned packed stile videogame
  const buildings = (data.buildings ?? []).slice(0, 12000);
  for (const b of buildings) {
    if (!b.ring || b.ring.length < 3) continue;
    Lns.polygon(toLatLngs(b.ring), {
      pane: "jimCityOverlay",
      interactive: false,
      fillColor: b.color ?? "#1a1628",
      fillOpacity: 1,
      color: "rgba(10, 7, 18, 0.92)",
      weight: 0.3,
      opacity: 1,
      className: "jim-city-building",
    }).addTo(group);
  }

  group.addTo(map);
  return group;
}
