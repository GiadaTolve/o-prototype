"use client";

/**
 * Mappa Giappone — Custom Image Overlay (stile Diablo IV / Watch Dogs).
 * Leaflet CRS.Simple + L.imageOverlay. Nessun terreno vettoriale di base.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GameMapId } from "@/config/map-config";
import {
  MAP_BOUNDS_PAD,
  MAP_IMAGE_DEFAULT_SIZE,
  MAP_IMAGE_FALLBACK_URL,
  MAP_IMAGE_URL,
  MAP_ZOOM,
} from "./japan-image-map-config";
import {
  IMAGE_POIS,
  IMAGE_REGIONS,
  IMAGE_ROUTES,
  POI_META,
  type ImagePoint,
  type ImageRegionDef,
} from "./japan-image-map-data";
import type { MapScope } from "./map-place-memory";
import "./japan-image-overlay-map.css";

type Props = {
  onSelectGameMap: (id: GameMapId) => void;
  initialScope?: MapScope;
  onScopeChange?: (scope: MapScope) => void;
  className?: string;
};

type MapSize = { width: number; height: number };

function toCrs(p: ImagePoint, height: number): [number, number] {
  return [height - p.y, p.x];
}

function ringToLatLngs(ring: ImagePoint[], height: number): L.LatLngExpression[] {
  const pts = ring.map((p) => toCrs(p, height));
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
    pts.push(first);
  }
  return pts;
}

function imageBounds(size: MapSize): L.LatLngBounds {
  return L.latLngBounds([0, 0], [size.height, size.width]);
}

function paddedBounds(size: MapSize): L.LatLngBounds {
  return imageBounds(size).pad(MAP_BOUNDS_PAD);
}

function regionStyle(
  state: "base" | "hover" | "selected",
  glow: "gold" | "violet",
): L.PathOptions {
  const violet = glow === "violet";
  if (state === "hover") {
    return {
      fillColor: violet ? "rgba(74, 21, 75, 0.55)" : "rgba(94, 77, 39, 0.5)",
      fillOpacity: 1,
      color: violet ? "rgba(184, 50, 184, 0.95)" : "rgba(255, 215, 0, 0.92)",
      weight: 2.2,
      opacity: 1,
      className: `jim-img-region jim-img-region--hover jim-img-region--${glow}`,
    };
  }
  if (state === "selected") {
    return {
      fillColor: violet ? "rgba(74, 21, 75, 0.62)" : "rgba(94, 77, 39, 0.58)",
      fillOpacity: 1,
      color: violet ? "rgba(200, 80, 200, 1)" : "rgba(255, 215, 0, 1)",
      weight: 2.4,
      opacity: 1,
      className: `jim-img-region jim-img-region--selected jim-img-region--${glow}`,
    };
  }
  return {
    fillColor: violet ? "rgba(40, 24, 52, 0.42)" : "rgba(28, 22, 34, 0.4)",
    fillOpacity: 1,
    color: "rgba(201, 168, 74, 0.55)",
    weight: 1.15,
    opacity: 0.85,
    className: `jim-img-region jim-img-region--${glow}`,
  };
}

function routeStyle(kind: "river" | "rail" | "road"): L.PathOptions {
  if (kind === "river") {
    return {
      color: "rgba(90, 140, 175, 0.75)",
      weight: 2.2,
      opacity: 0.85,
      className: "jim-img-route jim-img-route--river",
    };
  }
  if (kind === "rail") {
    return {
      color: "rgba(162, 112, 255, 0.8)",
      weight: 2,
      opacity: 0.9,
      dashArray: "6 8",
      className: "jim-img-route jim-img-route--rail",
    };
  }
  return {
    color: "rgba(201, 168, 74, 0.7)",
    weight: 1.8,
    opacity: 0.85,
    className: "jim-img-route jim-img-route--road",
  };
}

function loadImageSize(url: string): Promise<MapSize> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () =>
      resolve({
        width: img.naturalWidth || MAP_IMAGE_DEFAULT_SIZE.width,
        height: img.naturalHeight || MAP_IMAGE_DEFAULT_SIZE.height,
      });
    img.onerror = () => resolve({ ...MAP_IMAGE_DEFAULT_SIZE });
    img.src = url;
  });
}

async function resolveMapImage(): Promise<{ url: string; size: MapSize }> {
  const primary = await new Promise<boolean>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = MAP_IMAGE_URL;
  });
  const url = primary ? MAP_IMAGE_URL : MAP_IMAGE_FALLBACK_URL;
  const size = await loadImageSize(url);
  return { url, size };
}

export function JapanImageOverlayMap({
  onSelectGameMap,
  initialScope = "ogon",
  onScopeChange,
  className,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const regionLayersRef = useRef<Map<string, L.Polygon>>(new Map());
  const selectedRef = useRef<string | null>(null);
  const onSelectRef = useRef(onSelectGameMap);
  const onScopeChangeRef = useRef(onScopeChange);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ImageRegionDef | null>(null);
  const [coords, setCoords] = useState("— / —");
  const [imageLabel, setImageLabel] = useState("mappa_giappone.jpg");

  useEffect(() => {
    onSelectRef.current = onSelectGameMap;
  }, [onSelectGameMap]);
  useEffect(() => {
    onScopeChangeRef.current = onScopeChange;
  }, [onScopeChange]);

  const paintRegion = useCallback((id: string, state: "base" | "hover" | "selected") => {
    const layer = regionLayersRef.current.get(id);
    const def = IMAGE_REGIONS.find((r) => r.id === id);
    if (!layer || !def) return;
    layer.setStyle(regionStyle(state, def.glow));
  }, []);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    let cancelled = false;
    let map: L.Map | null = null;

    (async () => {
      try {
        const { url, size } = await resolveMapImage();
        if (cancelled) return;

        setImageLabel(url.split("/").pop() ?? "mappa");

        const bounds = imageBounds(size);
        const maxBounds = paddedBounds(size);

        map = L.map(el, {
          crs: L.CRS.Simple,
          minZoom: MAP_ZOOM.min,
          maxZoom: MAP_ZOOM.max,
          zoomSnap: 0.25,
          zoomDelta: 0.5,
          maxBounds,
          maxBoundsViscosity: 1.0,
          attributionControl: false,
          zoomControl: false,
        });
        mapRef.current = map;

        L.control.zoom({ position: "bottomright" }).addTo(map);

        L.imageOverlay(url, bounds, {
          interactive: false,
          className: "jim-img-overlay",
        }).addTo(map);

        map.setMaxBounds(maxBounds);
        map.fitBounds(bounds);
        map.setView(bounds.getCenter(), MAP_ZOOM.start);

        map.createPane("jimImgRegions");
        const regionsPane = map.getPane("jimImgRegions");
        if (regionsPane) regionsPane.style.zIndex = "450";

        map.createPane("jimImgRoutes");
        const routesPane = map.getPane("jimImgRoutes");
        if (routesPane) {
          routesPane.style.zIndex = "460";
          routesPane.style.pointerEvents = "none";
        }

        map.createPane("jimImgPois");
        const poisPane = map.getPane("jimImgPois");
        if (poisPane) poisPane.style.zIndex = "470";

        for (const region of IMAGE_REGIONS) {
          const poly = L.polygon(ringToLatLngs(region.ring, size.height), {
            pane: "jimImgRegions",
            ...regionStyle("base", region.glow),
          });
          poly.on("mouseover", () => {
            if (selectedRef.current !== region.id) paintRegion(region.id, "hover");
            try {
              poly.bringToFront();
            } catch {
              /* ignore */
            }
          });
          poly.on("mouseout", () => {
            paintRegion(region.id, selectedRef.current === region.id ? "selected" : "base");
          });
          poly.on("click", () => {
            const prev = selectedRef.current;
            if (prev && prev !== region.id) paintRegion(prev, "base");
            selectedRef.current = region.id;
            paintRegion(region.id, "selected");
            setSelected(region);
            onSelectRef.current(region.id);
            if (region.id === "ogon") onScopeChangeRef.current?.("ogon");
            map?.fitBounds(poly.getBounds().pad(0.15), { animate: true, maxZoom: 1.25 });
          });
          poly.addTo(map);
          regionLayersRef.current.set(region.id, poly);
        }

        for (const route of IMAGE_ROUTES) {
          L.polyline(
            route.points.map((p) => toCrs(p, size.height)),
            { pane: "jimImgRoutes", interactive: false, ...routeStyle(route.kind) },
          )
            .bindTooltip(route.label, {
              sticky: true,
              className: "jim-img-tooltip",
              direction: "top",
            })
            .addTo(map!);
        }

        for (const poi of IMAGE_POIS) {
          const meta = POI_META[poi.kind];
          const icon = L.divIcon({
            className: `jim-img-poi jim-img-poi--${poi.kind}`,
            html: `<span class="jim-img-poi__glyph" aria-hidden="true">${meta.icon}</span><span class="jim-img-poi__label">${poi.label}</span>`,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          });
          L.marker(toCrs({ x: poi.x, y: poi.y }, size.height), {
            pane: "jimImgPois",
            icon,
            keyboard: true,
            title: poi.label,
          })
            .bindTooltip(`${meta.label} · ${poi.label}`, {
              className: "jim-img-tooltip",
              direction: "top",
              offset: [0, -12],
            })
            .addTo(map!);
        }

        map.on("mousemove", (e: L.LeafletMouseEvent) => {
          const yTop = size.height - e.latlng.lat;
          const x = e.latlng.lng;
          if (x < 0 || yTop < 0 || x > size.width || yTop > size.height) {
            setCoords("fuori mappa");
            return;
          }
          setCoords(`${x.toFixed(0)} · ${yTop.toFixed(0)} px`);
        });

        map.on("drag", () => {
          map?.panInsideBounds(maxBounds, { animate: false });
        });

        if (!cancelled) {
          setReady(true);
          setError(null);
          if (initialScope === "ogon") {
            const ogon = regionLayersRef.current.get("ogon");
            if (ogon) {
              selectedRef.current = "ogon";
              paintRegion("ogon", "selected");
              setSelected(IMAGE_REGIONS.find((r) => r.id === "ogon") ?? null);
              map.fitBounds(ogon.getBounds().pad(0.2), { animate: false, maxZoom: 0.75 });
            }
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Errore mappa immagine");
        }
      }
    })();

    return () => {
      cancelled = true;
      regionLayersRef.current.clear();
      map?.remove();
      mapRef.current = null;
    };
  }, [initialScope, paintRegion]);

  return (
    <div className={`jim-img${className ? ` ${className}` : ""}`}>
      <div className="jim-img__stage" ref={hostRef} role="application" aria-label="Mappa Giappone" />

      <div className="jim-img__hud jim-img__hud--top">
        <div>
          <strong>OYASUMI</strong>
          <span>{imageLabel}</span>
        </div>
        <div className="jim-img__hud-coords" aria-live="polite">
          {coords}
        </div>
      </div>

      <div className="jim-img__hud jim-img__hud--bottom">
        <span>Trascina · Rotella zoom · Click regione</span>
        {selected ? (
          <em>
            {selected.labelJa} · {selected.label}
          </em>
        ) : (
          <em>Seleziona una regione</em>
        )}
      </div>

      {!ready && !error && <div className="jim-img__boot">Caricamento mappa…</div>}
      {error && <div className="jim-img__boot jim-img__boot--err">{error}</div>}
    </div>
  );
}
