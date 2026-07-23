"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GameMapId } from "@/config/map-config";
import {
  GEOJSON_URL,
  parseRegionId,
  regionDef,
  type RegionGlowTheme,
} from "./japan-regions";
import {
  OGON_PREFECTURES,
  OGON_PREFECTURES_GEOJSON_URL,
} from "./ogon-prefectures";
import { playRegionHover, playRegionSelect, unlockMapAudio } from "./map-audio";
import { kamonSvg } from "./map-kamon";
import type { MapScope } from "./map-place-memory";
import "./japan-interactive-map.css";

type Props = {
  onSelectGameMap: (id: GameMapId) => void;
  initialScope?: MapScope;
  onScopeChange?: (scope: MapScope) => void;
  className?: string;
};

const FILL = {
  base: "rgba(28, 24, 34, 0.42)",
  hover: "rgba(36, 30, 44, 0.62)",
  selectedGold: "rgba(94, 77, 39, 0.62)",
  selectedViolet: "rgba(74, 21, 75, 0.6)",
} as const;

const STROKE = {
  base: "rgba(138, 115, 67, 0.55)",
  hover: "rgba(255, 215, 0, 0.75)",
  selectedGold: "rgba(255, 215, 0, 0.92)",
  selectedViolet: "rgba(184, 50, 184, 0.9)",
} as const;

const CINEMA_DURATION = 1.5;
const BASE_MIN_ZOOM = 4;
const BASE_MAX_ZOOM = 10;

const OGON_FALLBACK: L.LatLngBoundsExpression = [
  [34.6, 136.8],
  [38.8, 141.2],
];
const IZAYOI_FALLBACK: L.LatLngBoundsExpression = [
  [33.4, 134.2],
  [35.8, 136.6],
];
const MONDO_FALLBACK: L.LatLngBoundsExpression = [
  [24.0, 122.5],
  [46.2, 149.0],
];

/** Framing fisso da screenshot (centro + zoom) — evita fitBounds asimmetrico. */
const REGION_FOCUS_SHOT: Partial<
  Record<GameMapId, { center: [number, number]; zoom: number }>
> = {
  // Screenshot Ogon: 36.2893° N / 139.0281° E
  ogon: { center: [36.2893, 139.0281], zoom: 7.55 },
  // Screenshot Izayoi: 34.6046° N / 135.1696° E
  izayoi: { center: [34.6046, 135.1696], zoom: 7.6 },
};

/** Regioni con framing «focus» (tilt + zoom stretto + lock zoom-out). */
function isFocusRegion(id: GameMapId): boolean {
  return id === "ogon" || id === "izayoi";
}

function regionFallback(id: GameMapId): L.LatLngBoundsExpression | undefined {
  if (id === "ogon") return OGON_FALLBACK;
  if (id === "izayoi") return IZAYOI_FALLBACK;
  return undefined;
}
function unlockZoomLimits(map: L.Map): void {
  map.setMinZoom(BASE_MIN_ZOOM);
  map.setMaxZoom(BASE_MAX_ZOOM);
}

/** Blocca zoom-out al livello attuale; zoom-in resta libero. */
function lockNoZoomOut(map: L.Map): void {
  const floor = Math.round(map.getZoom() * 4) / 4;
  map.setMinZoom(floor);
  map.setMaxZoom(BASE_MAX_ZOOM);
}
function glowOf(id: GameMapId): RegionGlowTheme {
  return regionDef(id)?.glow ?? "spectral-gold";
}

function pathStyle(state: "base" | "hover" | "selected", id?: GameMapId): L.PathOptions {
  const glow = id ? glowOf(id) : "spectral-gold";
  if (state === "selected") {
    const violet = glow === "mystic-violet";
    return {
      fillColor: violet ? FILL.selectedViolet : FILL.selectedGold,
      fillOpacity: 1,
      color: violet ? STROKE.selectedViolet : STROKE.selectedGold,
      weight: 1.4,
      className: `jim-region jim-region--selected jim-region--${violet ? "violet" : "gold"}`,
    };
  }
  if (state === "hover") {
    return {
      fillColor: FILL.hover,
      fillOpacity: 1,
      color: STROKE.hover,
      weight: 1.25,
      className: "jim-region jim-region--hover",
    };
  }
  return {
    fillColor: FILL.base,
    fillOpacity: 1,
    color: STROKE.base,
    weight: 1.1,
    className: "jim-region",
  };
}

function layerBounds(layer: L.Layer | null | undefined): L.LatLngBounds | null {
  if (!layer) return null;
  try {
    const anyLayer = layer as L.Layer & {
      getBounds?: () => L.LatLngBounds;
      getLayers?: () => L.Layer[];
    };
    if (typeof anyLayer.getBounds === "function") {
      const b = anyLayer.getBounds();
      if (b?.isValid()) return b;
    }
    // FeatureGroup / MultiPolygon: unisci i figli
    if (typeof anyLayer.getLayers === "function") {
      let bounds: L.LatLngBounds | null = null;
      for (const child of anyLayer.getLayers()) {
        const cb = layerBounds(child);
        if (!cb) continue;
        if (!bounds) bounds = L.latLngBounds(cb.getSouthWest(), cb.getNorthEast());
        else bounds.extend(cb);
      }
      return bounds?.isValid() ? bounds : null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function mapHasSize(map: L.Map): boolean {
  try {
    const size = map.getSize();
    return size.x >= 2 && size.y >= 2;
  } catch {
    return false;
  }
}

function safeFitBounds(
  map: L.Map,
  bounds: L.LatLngBounds | null,
  options?: L.FitBoundsOptions & {
    cinematic?: boolean;
    padRatio?: number;
    onComplete?: () => void;
  },
  fallback?: L.LatLngBoundsExpression,
): void {
  try {
    map.invalidateSize({ animate: false });
  } catch {
    /* ignore */
  }
  if (!mapHasSize(map)) return;

  const target =
    bounds?.isValid() ? bounds : fallback ? L.latLngBounds(fallback) : null;
  if (!target?.isValid()) return;

  const cinematic = options?.cinematic !== false && options?.animate !== false;
  const duration = options?.duration ?? CINEMA_DURATION;
  const padRatio = options?.padRatio ?? 0.08;
  const padded = target.pad(padRatio);
  const onComplete = options?.onComplete;
  let completed = false;
  const done = () => {
    if (completed) return;
    completed = true;
    onComplete?.();
  };

  try {
    if (cinematic) {
      map.once("moveend", done);
      map.flyToBounds(padded, {
        duration,
        easeLinearity: 0.22,
        maxZoom: options?.maxZoom,
      });
    } else {
      map.fitBounds(padded, { animate: false, maxZoom: options?.maxZoom });
      done();
    }
  } catch {
    if (fallback) {
      try {
        map.fitBounds(L.latLngBounds(fallback).pad(0.08), { animate: false });
      } catch {
        /* ignore */
      }
    }
    done();
  }
}

function formatCoord(lat: number, lng: number): { lat: string; lng: string } {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return {
    lat: `${Math.abs(lat).toFixed(4)}° ${ns}`,
    lng: `${Math.abs(lng).toFixed(4)}° ${ew}`,
  };
}

/** Bussola vision-style (cerchio + Kanji), in alto a destra. */
function VisionCompass() {
  return (
    <div className="jim__compass" aria-hidden>
      <span className="jim__compass-w">西</span>
      <span className="jim__compass-center" />
      <span className="jim__compass-e">東</span>
    </div>
  );
}

export function JapanInteractiveMap({
  onSelectGameMap,
  initialScope = "ogon",
  onScopeChange,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ashRef = useRef<HTMLCanvasElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.GeoJSON | null>(null);
  const ogonPrefsLayerRef = useRef<L.LayerGroup | null>(null);
  const layerByRegionRef = useRef<Map<GameMapId, L.Layer>>(new Map());
  const pendingFitRef = useRef<{ scope: MapScope } | null>(null);
  const mutedRef = useRef(false);
  const mountedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<MapScope>(initialScope);
  const scopeRef = useRef<MapScope>(initialScope);
  const [selectedRegion, setSelectedRegion] = useState<GameMapId | null>(null);
  const selectedRef = useRef<GameMapId | null>(null);
  /** Regione in framing focus (Ogon/Izayoi…): resta dopo che il glow si spegne. */
  const [focusRegion, setFocusRegion] = useState<GameMapId | null>(
    initialScope === "ogon" ? "ogon" : null,
  );
  const focusRegionRef = useRef<GameMapId | null>(focusRegion);
  const onSelectRef = useRef(onSelectGameMap);
  const onScopeChangeRef = useRef(onScopeChange);
  const [coords, setCoords] = useState(() => {
    const d = regionDef("ogon")?.coords ?? { lat: 35.6762, lng: 139.6503 };
    return formatCoord(d.lat, d.lng);
  });
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const setCoordsSafe = useCallback((next: { lat: string; lng: string }) => {
    if (!mountedRef.current) return;
    setCoords(next);
  }, []);

  useEffect(() => {
    onSelectRef.current = onSelectGameMap;
  }, [onSelectGameMap]);

  useEffect(() => {
    onScopeChangeRef.current = onScopeChange;
  }, [onScopeChange]);

  useEffect(() => {
    selectedRef.current = selectedRegion;
  }, [selectedRegion]);

  useEffect(() => {
    focusRegionRef.current = focusRegion;
  }, [focusRegion]);

  useEffect(() => {
    scopeRef.current = scope;
  }, [scope]);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const paintAll = useCallback(() => {
    layerByRegionRef.current.forEach((path, id) => {
      const state = selectedRef.current === id ? "selected" : "base";
      (path as L.Path).setStyle?.(pathStyle(state, id));
    });
  }, []);

  const paintAllRef = useRef(paintAll);
  useEffect(() => {
    paintAllRef.current = paintAll;
  }, [paintAll]);

  const clearSelection = useCallback(() => {
    selectedRef.current = null;
    if (mountedRef.current) setSelectedRegion(null);
    paintAllRef.current();
  }, []);

  const fitRegion = useCallback((regionId: GameMapId, cinematic = true) => {
    const map = mapRef.current;
    if (!map || !mapHasSize(map)) return;
    unlockZoomLimits(map);

    const finishFocus = () => {
      if (!mountedRef.current || !mapRef.current) return;
      clearSelection();
      lockNoZoomOut(mapRef.current);
      const def = regionDef(regionId);
      if (def) setCoordsSafe(formatCoord(def.coords.lat, def.coords.lng));
    };

    const shot = REGION_FOCUS_SHOT[regionId];
    if (shot && isFocusRegion(regionId)) {
      // Framing calibrato sullo screenshot (non fitBounds → niente massa a sinistra)
      let doneOnce = false;
      const done = () => {
        if (doneOnce) return;
        doneOnce = true;
        finishFocus();
      };
      try {
        map.invalidateSize({ animate: false });
      } catch {
        /* ignore */
      }
      if (cinematic) {
        map.once("moveend", done);
        map.flyTo(shot.center, shot.zoom, {
          duration: CINEMA_DURATION,
          easeLinearity: 0.22,
        });
      } else {
        map.setView(shot.center, shot.zoom, { animate: false });
        done();
      }
      return;
    }

    const regionLayer = layerByRegionRef.current.get(regionId);
    const bounds = layerBounds(regionLayer);
    safeFitBounds(
      map,
      bounds,
      {
        animate: cinematic,
        cinematic,
        duration: CINEMA_DURATION,
        padRatio: 0.08,
        maxZoom: 7.5,
      },
      regionFallback(regionId),
    );
  }, [clearSelection, setCoordsSafe]);

  const fitRegionRef = useRef(fitRegion);
  useEffect(() => {
    fitRegionRef.current = fitRegion;
  }, [fitRegion]);

  const enterFocusRegion = useCallback(
    (regionId: GameMapId) => {
      focusRegionRef.current = regionId;
      if (mountedRef.current) setFocusRegion(regionId);
      // Scope «ogon» = modalità terra (non mondo): abilita tilt focus
      if (scopeRef.current !== "ogon") {
        scopeRef.current = "ogon";
        if (mountedRef.current) {
          setScope("ogon");
          onScopeChangeRef.current?.("ogon");
        }
      }
      fitRegionRef.current(regionId, true);
    },
    [],
  );

  const enterFocusRegionRef = useRef(enterFocusRegion);
  useEffect(() => {
    enterFocusRegionRef.current = enterFocusRegion;
  }, [enterFocusRegion]);

  const fitScope = useCallback((next: MapScope, cinematic = true) => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) {
      pendingFitRef.current = { scope: next };
      return;
    }
    if (!mapHasSize(map)) {
      pendingFitRef.current = { scope: next };
      return;
    }

    if (next === "mondo") {
      unlockZoomLimits(map);
      focusRegionRef.current = null;
      if (mountedRef.current) setFocusRegion(null);
      safeFitBounds(
        map,
        layerBounds(layer),
        {
          animate: cinematic,
          cinematic,
          duration: CINEMA_DURATION,
          padRatio: 0.02,
          maxZoom: 6.5,
        },
        MONDO_FALLBACK,
      );
      return;
    }

    const target = focusRegionRef.current && isFocusRegion(focusRegionRef.current)
      ? focusRegionRef.current
      : "ogon";
    focusRegionRef.current = target;
    if (mountedRef.current) setFocusRegion(target);
    fitRegion(target, cinematic);
  }, [fitRegion]);

  const fitScopeRef = useRef(fitScope);
  useEffect(() => {
    fitScopeRef.current = fitScope;
  }, [fitScope]);

  const flushPendingFit = useCallback(() => {
    const pending = pendingFitRef.current;
    if (!pending) return;
    pendingFitRef.current = null;
    fitScope(pending.scope, false);
  }, [fitScope]);

  const setScopeAndNotify = useCallback(
    (next: MapScope) => {
      void unlockMapAudio();
      playRegionSelect(mutedRef.current);
      if (!mountedRef.current) return;
      setScope(next);
      onScopeChange?.(next);
      // Nessuna regione «selezionata» di default — glow solo su hover
      selectedRef.current = null;
      setSelectedRegion(null);
      if (next === "mondo") {
        focusRegionRef.current = null;
        setFocusRegion(null);
      } else if (!focusRegionRef.current) {
        focusRegionRef.current = "ogon";
        setFocusRegion("ogon");
      }
      paintAll();
      requestAnimationFrame(() => {
        if (!mountedRef.current) return;
        fitScope(next, true);
        // Dopo il tilt CSS, ricalcola size Leaflet
        window.setTimeout(() => {
          try {
            mapRef.current?.invalidateSize({ animate: false });
          } catch {
            /* ignore */
          }
        }, next === "mondo" ? 400 : 50);
      });
    },
    [fitScope, onScopeChange, paintAll],
  );

  // Particelle cenere / scintille
  useEffect(() => {
    const canvas = ashRef.current;
    if (!canvas) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    const particles = Array.from({ length: 36 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * 1.4,
      vy: 0.00015 + Math.random() * 0.00045,
      vx: (Math.random() - 0.5) * 0.0002,
      a: 0.15 + Math.random() * 0.45,
      gold: Math.random() > 0.35,
    }));

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const tick = () => {
      if (!running) return;
      const { width: w, height: h } = canvas;
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.y -= p.vy;
        p.x += p.vx;
        if (p.y < -0.02) {
          p.y = 1.02;
          p.x = Math.random();
        }
        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;
        ctx.beginPath();
        ctx.fillStyle = p.gold
          ? `rgba(255, 215, 0, ${p.a})`
          : `rgba(200, 120, 40, ${p.a * 0.85})`;
        ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [ready]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    // Lock dimensioni prima che Leaflet scriva position:relative
    el.style.position = "absolute";
    el.style.inset = "0";
    el.style.width = "100%";
    el.style.height = "100%";
    el.style.maxHeight = "100%";

    const map = L.map(el, {
      zoomControl: false,
      attributionControl: false,
      minZoom: BASE_MIN_ZOOM,
      maxZoom: BASE_MAX_ZOOM,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 90,
      worldCopyJump: false,
      center: [36.2, 138.2],
      zoom: 5,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
    });
    mapRef.current = map;

    // Re-applica fill (Leaflet setta position:relative inline)
    el.style.position = "absolute";
    el.style.top = "0";
    el.style.right = "0";
    el.style.bottom = "0";
    el.style.left = "0";
    el.style.width = "100%";
    el.style.height = "100%";
    el.style.maxHeight = "100%";
    map.invalidateSize({ animate: false });

    const onMove = () => {
      if (!mountedRef.current) return;
      const c = map.getCenter();
      setCoordsSafe(formatCoord(c.lat, c.lng));
    };
    map.on("moveend", onMove);

    let cancelled = false;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      const h = entry?.contentRect.height ?? 0;
      const w = entry?.contentRect.width ?? 0;
      if (w < 2 || h < 2 || h > 10000) return;
      try {
        el.style.height = `${Math.round(h)}px`;
        el.style.width = `${Math.round(w)}px`;
        map.invalidateSize({ animate: false });
      } catch {
        /* ignore */
      }
      if (mapHasSize(map)) flushPendingFit();
    });
    const rotator = el.parentElement;
    if (rotator) ro.observe(rotator);
    else ro.observe(el);

    map.createPane("jimOgonPrefs");
    const ogonPrefsPane = map.getPane("jimOgonPrefs");
    if (ogonPrefsPane) {
      ogonPrefsPane.style.zIndex = "460";
      ogonPrefsPane.style.pointerEvents = "none";
    }

    (async () => {
      try {
        const [regionsRes, ogonPrefsRes] = await Promise.all([
          fetch(GEOJSON_URL),
          fetch(OGON_PREFECTURES_GEOJSON_URL),
        ]);
        if (!regionsRes.ok) throw new Error(`GeoJSON regioni ${regionsRes.status}`);
        const data = (await regionsRes.json()) as GeoJSON.FeatureCollection;
        if (cancelled) return;

        const byRegion = new Map<GameMapId, L.Layer>();

        const layer = L.geoJSON(data, {
          style: (feat) => {
            const id = parseRegionId(feat?.properties?.region) ?? undefined;
            return pathStyle("base", id);
          },
          onEachFeature: (feature, layerInstance) => {
            const path = layerInstance as L.Path;
            const regionId = parseRegionId(feature.properties?.region);
            if (!regionId || regionId === "altrove") return;
            byRegion.set(regionId, layerInstance);

            path.on("mouseover", () => {
              playRegionHover(mutedRef.current);
              path.setStyle(pathStyle("hover", regionId));
              if (typeof (path as L.Path).bringToFront === "function") {
                try {
                  path.bringToFront();
                } catch {
                  /* ignore */
                }
              }
            });
            path.on("mouseout", () => {
              path.setStyle(
                pathStyle(selectedRef.current === regionId ? "selected" : "base", regionId),
              );
            });
            path.on("click", () => {
              void unlockMapAudio();
              playRegionSelect(mutedRef.current);
              selectedRef.current = regionId;
              if (mountedRef.current) setSelectedRegion(regionId);
              byRegion.forEach((p, id) => {
                (p as L.Path).setStyle?.(pathStyle(id === regionId ? "selected" : "base", id));
              });
              if (isFocusRegion(regionId)) {
                enterFocusRegionRef.current(regionId);
                return;
              }
              fitRegionRef.current(regionId, true);
            });
          },
        });

        if (cancelled) return;

        layer.addTo(map);
        layerRef.current = layer;
        layerByRegionRef.current = byRegion;

        // Prefetture interne Ogon (Edo, …) — solo bordo tratteggiato
        if (ogonPrefsRes.ok) {
          const prefsData = (await ogonPrefsRes.json()) as GeoJSON.FeatureCollection;
          if (!cancelled) {
            const prefsGroup = L.layerGroup();
            L.geoJSON(prefsData, {
              pane: "jimOgonPrefs",
              interactive: false,
              style: {
                fill: false,
                fillOpacity: 0,
                color: "rgba(138, 115, 67, 0.32)",
                weight: 0.9,
                opacity: 0.75,
                dashArray: "4 5",
                className: "jim-ogon-pref",
              },
            }).addTo(prefsGroup);

            for (const def of OGON_PREFECTURES) {
              const icon = L.divIcon({
                className: "jim-ogon-pref-label",
                html: `<span class="jim-ogon-pref-label__ja">${def.labelJa}</span><span class="jim-ogon-pref-label__la">${def.label}</span>`,
                iconSize: [0, 0],
                iconAnchor: [0, 0],
              });
              L.marker(def.labelLatLng, {
                pane: "jimOgonPrefs",
                icon,
                interactive: false,
                keyboard: false,
              }).addTo(prefsGroup);
            }

            prefsGroup.addTo(map);
            ogonPrefsLayerRef.current = prefsGroup;
          }
        }

        byRegion.forEach((p, id) => {
          (p as L.Path).setStyle?.(pathStyle("base", id));
        });

        const doInitialFit = () => {
          if (cancelled || !mapRef.current) return;
          fitScopeRef.current(initialScope, false);
          onMove();
        };

        pendingFitRef.current = { scope: initialScope };
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (cancelled || !mountedRef.current) return;
            if (mapHasSize(map)) {
              pendingFitRef.current = null;
              doInitialFit();
            } else {
              // Resta in pending → ResizeObserver
            }
            if (mountedRef.current) setReady(true);
          });
        });
      } catch (err) {
        if (!cancelled && mountedRef.current) {
          setError(err instanceof Error ? err.message : "Errore caricamento mappa");
        }
      }
    })();

    return () => {
      cancelled = true;
      map.off("moveend", onMove);
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      ogonPrefsLayerRef.current = null;
      layerByRegionRef.current = new Map();
      pendingFitRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    paintAll();
  }, [selectedRegion, paintAll]);

  return (
    <div className={`jim ${className ?? ""}`}>
      <div
        className={`jim__canvas-rotator${
          scope === "mondo"
            ? " jim__canvas-rotator--mondo"
            : focusRegion === "ogon"
              ? " jim__canvas-rotator--focus-ogon"
              : focusRegion === "izayoi"
                ? " jim__canvas-rotator--focus-izayoi"
                : focusRegion
                  ? " jim__canvas-rotator--focus"
                  : ""
        }`}
      >
        <div ref={containerRef} className="jim__canvas" role="application" aria-label="Mappa interattiva" />
      </div>

      {/* Overlay Dark Fantasy */}
      <div className="jim__fx jim__paper" aria-hidden />
      <div className="jim__fx jim__grain" aria-hidden />
      <div className="jim__fx jim__fog" aria-hidden />
      <canvas ref={ashRef} className="jim__ash" aria-hidden />
      <div className="jim__fx jim__vignette" aria-hidden />

      {/* HUD */}
      <div className="jim__hud jim__coords" aria-hidden>
        {coords.lat}
        <span>/</span>
        {coords.lng}
      </div>
      <VisionCompass />
      {focusRegion && (
        <div
          className="jim__hud jim__kamon"
          aria-hidden
          dangerouslySetInnerHTML={{ __html: kamonSvg(focusRegion) }}
        />
      )}

      {!ready && !error && (
        <div className="jim__loading" aria-live="polite">
          Sincronizzazione reticolo…
        </div>
      )}
      {error && <div className="jim__error">{error}</div>}

      <div className="jim__topbar">
        {scope === "ogon" ? (
          <button type="button" className="jim__mondo-btn" onClick={() => setScopeAndNotify("mondo")}>
            Mondo
          </button>
        ) : (
          <button type="button" className="jim__mondo-btn" onClick={() => setScopeAndNotify("ogon")}>
            Torna a Ogon
          </button>
        )}
        <button
          type="button"
          className="jim__mute-btn"
          aria-pressed={muted}
          title={muted ? "Attiva audio UI" : "Disattiva audio UI"}
          onClick={() => {
            void unlockMapAudio();
            setMuted((m) => !m);
          }}
        >
          {muted ? "Audio ·" : "Audio ♪"}
        </button>
      </div>
    </div>
  );
}
