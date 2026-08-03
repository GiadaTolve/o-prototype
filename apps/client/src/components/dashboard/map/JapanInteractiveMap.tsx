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
import {
  fetchCityOverlay,
  mountCityOverlay,
  type CityOverlayPayload,
} from "./city-overlay";
import "./japan-interactive-map.css";
import { CapoluogoPanel, type CapoluogoData } from "./CapoluogoPanel";
import { GAME_MAPS } from "@/config/map-config";

// Costruisce la lista chat da una zona del config
function chatListFromZone(zoneId: string): CapoluogoData["chats"] {
  const zone = GAME_MAPS.ogon.zones.find((z) => z.id === zoneId);
  if (!zone) return [];
  const out: CapoluogoData["chats"] = [];
  for (const loc of zone.locations) {
    if ("roomId" in loc) {
      out.push({ id: loc.roomId, name: loc.label, description: loc.description });
    } else {
      for (const child of loc.children) {
        out.push({ id: child.roomId, name: child.label, description: child.description });
      }
    }
  }
  return out;
}

const CAPOLUOGHI: Record<string, CapoluogoData> = {
  kessen_0: {
    id: "kessen_0",
    mapName: "Cosmicon Complex",
    mapNameJa: "宇宙絵",
    image: "/maps/textures/tex-kessen.png",
    description: "Crocevia commerciale e culturale di Kessen. Tre anime distinte convivono tra mercati, sale giochi e vie illuminate.",
    chats: chatListFromZone("kessen"),
  },
  edo_0: {
    id: "edo_0",
    mapName: "Edo",
    mapNameJa: "江戸",
    image: "/maps/textures/tex-edo.png",
    description: "La capitale. Città di ponti e canali, sede del Consiglio degli Shogun e fulcro politico dell'intero arcipelago.",
    chats: [],
  },
  edo_1: {
    id: "edo_1",
    mapName: "Paradise",
    mapNameJa: "楽園",
    image: "/maps/textures/tex-edo.png",
    description: "Il distretto del piacere e dello spettacolo. Tra Circus e Ginza o'Clock, la notte di Edo non finisce mai.",
    chats: chatListFromZone("edo"), // Circus + Ginza o'Clock
  },
  hamanachi_0: {
    id: "hamanachi_0",
    mapName: "Hamanachi",
    mapNameJa: "浜町",
    image: "/maps/textures/tex-hamanachi.png",
    description: "Città costiera di nebbie e silenzio. Tra una casa da tè e i corridoi dell'ospedale, le storie si intrecciano.",
    chats: chatListFromZone("hamanachi"),
  },
  kotowari_0: {
    id: "kotowari_0",
    mapName: "Astrolabio",
    mapNameJa: "理",
    image: "/maps/textures/tex-kotowari.png",
    description: "Terra di osservatori e studiosi. L'Astrolabio e l'Osservatorio vigilano sul cielo di Kotowari da secoli.",
    chats: chatListFromZone("kotowari"),
  },
};

// SVG path FA tree (solid), viewBox 448×512
const FA_TREE_PATH =
  "M210.6 5.9L62 169.4c-3.9 4.2-6 9.8-6 15.5C56 197.7 66.3 208 79.1 208l24.9 0L30.6 281.4c-4.2 4.2-6.6 10-6.6 16C24 309.9 34.1 320 46.6 320L80 320 5.4 409.5C1.9 413.7 0 419 0 424.5c0 13 10.5 23.5 23.5 23.5L192 448l0 32c0 17.7 14.3 32 32 32s32-14.3 32-32l0-32 168.5 0c13 0 23.5-10.5 23.5-23.5c0-5.5-1.9-10.8-5.4-15L368 320l33.4 0c12.5 0 22.6-10.1 22.6-22.6c0-6-2.4-11.8-6.6-16L344 208l24.9 0c12.7 0 23.1-10.3 23.1-23.1c0-5.7-2.1-11.3-6-15.5L237.4 5.9C234 2.1 229.1 0 224 0s-10 2.1-13.4 5.9z";

// Luoghi di culto (templi) — sub-mappe con chat
const TEMPLI_DATA: Record<string, CapoluogoData> = {
  tempio_kessen: {
    id: "tempio_kessen",
    mapName: "Tempio di Kessen",
    mapNameJa: "結戦の社",
    image: "/maps/textures/tex-kessen.png",
    description: "Antico luogo di culto nascosto tra le vette di Kessen. Le preghiere dei guerrieri risuonano ancora tra le rocce.",
    chats: [],
  },
  tempio_kotowari: {
    id: "tempio_kotowari",
    mapName: "Tempio della Costa",
    mapNameJa: "海岸の社",
    image: "/maps/textures/tex-kotowari.png",
    description: "Santuario affacciato sull'oceano di Kotowari. Le onde portano offerte al di là del velo.",
    chats: [],
  },
  tempio_confine: {
    id: "tempio_confine",
    mapName: "Tempio del Confine",
    mapNameJa: "境界の社",
    image: "/maps/textures/tex-hamanachi.png",
    description: "Punto neutro tra Edo e Hamanachi. Né l'uno né l'altro possono rivendicare questo suolo sacro.",
    chats: [],
  },
};

// Città minori — shining-line
const CITTA_DATA: Record<string, CapoluogoData> = {
  citta_kessen_nord: {
    id: "citta_kessen_nord",
    mapName: "Costa Superiore",
    mapNameJa: "上浦",
    image: "/maps/textures/tex-kessen.png",
    description: "Insediamento costiero sul margine settentrionale di Kessen.",
    chats: [],
  },
  citta_kessen_sud: {
    id: "citta_kessen_sud",
    mapName: "Costa Inferiore",
    mapNameJa: "下浦",
    image: "/maps/textures/tex-kessen.png",
    description: "Insediamento costiero sul margine meridionale di Kessen.",
    chats: [],
  },
  citta_kessen_est: {
    id: "citta_kessen_est",
    mapName: "Roccaforte Est",
    mapNameJa: "東砦",
    image: "/maps/textures/tex-kessen.png",
    description: "Avamposto orientale di Kessen, a est della foresta.",
    chats: [],
  },
  citta_kessen_ovest: {
    id: "citta_kessen_ovest",
    mapName: "Valico Ovest",
    mapNameJa: "西峠",
    image: "/maps/textures/tex-kessen.png",
    description: "Punto di transito a ovest del bosco di Kessen.",
    chats: [],
  },
  citta_triplice: {
    id: "citta_triplice",
    mapName: "Crocevia",
    mapNameJa: "三叉路",
    image: "/maps/textures/tex-hamanachi.png",
    description: "Punto d'incontro sul confine tra Kotowari, Edo e Hamanachi.",
    chats: [],
  },
  citta_kotowari_nord: {
    id: "citta_kotowari_nord",
    mapName: "Danchi 404",
    mapNameJa: "団地404",
    image: "/maps/textures/tex-kotowari.png",
    description: "Insediamento costiero a nord di Kotowari, oltre il tempio della costa.",
    chats: [],
  },
};

// Boschi / foreste selvagge — chat dirette
const BOSCHI_DATA: Record<string, CapoluogoData> = {
  bosco_kessen: {
    id: "bosco_kessen",
    mapName: "Foresta di Kessen",
    mapNameJa: "結戦の森",
    image: "/maps/textures/tex-kessen.png",
    description: "Foresta montana selvaggia sulle cime di Kessen. Le nebbie mattutine nascondono creature antiche tra i pini.",
    chats: [],
  },
  bosco_kotowari: {
    id: "bosco_kotowari",
    mapName: "Bosco di Kotowari",
    mapNameJa: "理の森",
    image: "/maps/textures/tex-kotowari.png",
    description: "Fitto bosco sulle montagne di Kotowari. Qui gli spiriti della natura vegliano ancora.",
    chats: [],
  },
};

type Props = {
  onSelectGameMap: (id: GameMapId) => void;
  initialScope?: MapScope;
  onScopeChange?: (scope: MapScope) => void;
  className?: string;
  /** Espone l'istanza Leaflet (es. overlay editor città). */
  onMapReady?: (map: L.Map) => void;
  /** Disabilita select regioni (modalità disegno). */
  suppressRegionSelect?: boolean;
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
  map.setMaxZoom(floor);
  map.scrollWheelZoom.disable();
  map.doubleClickZoom.disable();
  map.touchZoom.disable();
  map.boxZoom.disable();
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
      fillColor: FILL.base,
      fillOpacity: 1,
      color: "rgba(201, 168, 74, 0.92)",
      weight: 2,
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

/** Icona SVG per-prefettura con testo curvo e alone scuro. */
function makePrefLabelIcon(def: { id: string; label: string }): L.DivIcon {
  const text = def.label.toUpperCase();
  const fill = "#c4a95a";
  const halo = "#0d0b14";
  const base = `font-family:var(--jim-font-la,'Cormorant Garamond',serif);font-size:11px;font-weight:700;fill:${fill};stroke:${halo};stroke-width:3.5;paint-order:stroke;`;

  if (def.id === "kessen") {
    const w = 210, h = 90;
    const html = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
      <defs><path id="lp-kessen" d="M 5,65 Q 105,20 205,65"/></defs>
      <g transform="rotate(-70,105,45)">
        <text style="${base}letter-spacing:5px;">
          <textPath href="#lp-kessen" startOffset="50%" text-anchor="middle">${text}</textPath>
        </text>
      </g></svg>`;
    return L.divIcon({ className: "", html, iconSize: [w, h], iconAnchor: [105, 45] });
  }

  if (def.id === "edo") {
    const w = 210, h = 90;
    const html = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
      <defs><path id="lp-edo" d="M 5,65 Q 105,20 205,65"/></defs>
      <g transform="rotate(-30,105,45)">
        <text style="${base}letter-spacing:10px;">
          <textPath href="#lp-edo" startOffset="50%" text-anchor="middle">${text}</textPath>
        </text>
      </g></svg>`;
    // +100px sx → anchorX += 100; +30px su → anchorY -= 30
    return L.divIcon({ className: "", html, iconSize: [w, h], iconAnchor: [205, 15] });
  }

  if (def.id === "hamanachi") {
    const w = 90, h = 230;
    const cx = 45, cy = 115;
    const html = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
      <defs><path id="lp-hamanachi" d="M 42,8 C 72,52 18,90 42,130 C 68,170 20,205 42,222"/></defs>
      <g transform="rotate(-130,${cx},${cy})">
        <text style="${base}letter-spacing:3px;">
          <textPath href="#lp-hamanachi" startOffset="50%" text-anchor="middle">${text}</textPath>
        </text>
      </g></svg>`;
    return L.divIcon({ className: "", html, iconSize: [w, h], iconAnchor: [cx, cy - 15] });
  }

  if (def.id === "kotowari") {
    const w = 90, h = 250;
    const cx = 45, cy = 125;
    const html = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
      <defs><path id="lp-kotowari" d="M 42,8 C 75,60 14,108 44,155 C 74,202 16,228 44,242"/></defs>
      <g transform="rotate(-90,${cx},${cy})">
        <text style="${base}letter-spacing:3px;">
          <textPath href="#lp-kotowari" startOffset="50%" text-anchor="middle">${text}</textPath>
        </text>
      </g></svg>`;
    return L.divIcon({ className: "", html, iconSize: [w, h], iconAnchor: [cx, cy + 10] });
  }

  return L.divIcon({
    className: "jim-ogon-pref-label",
    html: `<span class="jim-ogon-pref-label__la">${def.label}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function formatCoord(lat: number, lng: number): { lat: string; lng: string } {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return {
    lat: `${Math.abs(lat).toFixed(4)}° ${ns}`,
    lng: `${Math.abs(lng).toFixed(4)}° ${ew}`,
  };
}


export function JapanInteractiveMap({
  onSelectGameMap,
  initialScope = "ogon",
  onScopeChange,
  className,
  onMapReady,
  suppressRegionSelect = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ashRef = useRef<HTMLCanvasElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.GeoJSON | null>(null);
  const ogonPrefsLayerRef = useRef<L.LayerGroup | null>(null);
  const cityOverlayRef = useRef<L.LayerGroup | null>(null);
  const cityOverlayDataRef = useRef<CityOverlayPayload | null>(null);
  const layerByRegionRef = useRef<Map<GameMapId, L.Layer>>(new Map());
  const pendingFitRef = useRef<{ scope: MapScope } | null>(null);
  const mutedRef = useRef(false);
  const mountedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCapoluogo, setActiveCapoluogo] = useState<{
    data: CapoluogoData;
    x: number;
    y: number;
  } | null>(null);
  const activeCapoluogoRef = useRef<typeof activeCapoluogo>(null);
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
  const onMapReadyRef = useRef(onMapReady);
  const suppressSelectRef = useRef(suppressRegionSelect);
  const [coords, setCoords] = useState(() => {
    const d = regionDef("ogon")?.coords ?? { lat: 35.6762, lng: 139.6503 };
    return formatCoord(d.lat, d.lng);
  });
  const [muted, setMuted] = useState(false);
  /** Prototipo: overlay città da city-overlay.json (toggle / assente = off). */
  const [cityOverlayOn, setCityOverlayOn] = useState(true);
  const [cityOverlayAvailable, setCityOverlayAvailable] = useState(false);
  const [cityOverlayInfo, setCityOverlayInfo] = useState<string | null>(null);

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
    onMapReadyRef.current = onMapReady;
  }, [onMapReady]);

  useEffect(() => {
    suppressSelectRef.current = suppressRegionSelect;
  }, [suppressRegionSelect]);

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
    onMapReadyRef.current?.(map);

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
      ogonPrefsPane.style.zIndex = "700";
      ogonPrefsPane.style.pointerEvents = "none";
    }

    // Pane maschera oceano (sopra il terrain, sotto le regioni GeoJSON)
    map.createPane("jimOceanMask");
    const oceanMaskPane = map.getPane("jimOceanMask");
    if (oceanMaskPane) {
      oceanMaskPane.style.zIndex = "415";
      oceanMaskPane.style.pointerEvents = "none";
    }

    // Pane terreno fisico — sotto tutto, sopra lo sfondo CSS
    map.createPane("jimTerrain");
    const terrainPane = map.getPane("jimTerrain");
    if (terrainPane) {
      terrainPane.style.zIndex = "410";
      terrainPane.style.pointerEvents = "none";
    }
    // ESRI World Physical Map — terreno naturale, nessuna label
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}",
      {
        pane: "jimTerrain",
        maxZoom: 18,
        maxNativeZoom: 8,
        attribution: "",
        className: "jim-terrain-tiles",
      },
    ).addTo(map);


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
              if (suppressSelectRef.current) return;
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

        // Maschera oceano: mondo intero con buchi sulle isole del Giappone
        // Even-odd fill: 1 ring = pieno (oceano), 2 ring annidati = buco (terra)
        {
          const worldRing: GeoJSON.Position[] = [
            [-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90],
          ];
          const japanRings: GeoJSON.Position[][] = [];
          for (const feat of data.features) {
            const geom = feat.geometry;
            if (geom.type === "Polygon") {
              japanRings.push(geom.coordinates[0]);
            } else if (geom.type === "MultiPolygon") {
              for (const poly of geom.coordinates) {
                japanRings.push(poly[0]);
              }
            }
          }
          const maskFeature: GeoJSON.Feature = {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: [worldRing, ...japanRings],
            } as GeoJSON.Polygon,
          };
          L.geoJSON(maskFeature, {
            pane: "jimOceanMask",
            interactive: false,
            style: {
              fill: true,
              fillColor: "#0d0b16",
              fillOpacity: 1,
              color: "none",
              weight: 0,
              fillRule: "evenodd",
            },
          }).addTo(map);
        }

        // Prefetture interne Ogon (Edo, …) — solo bordo tratteggiato
        if (ogonPrefsRes.ok) {
          const prefsData = (await ogonPrefsRes.json()) as GeoJSON.FeatureCollection;
          if (!cancelled) {
            const prefsGroup = L.layerGroup();

            // Layer bordi tratteggiati
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
              const icon = makePrefLabelIcon(def);
              L.marker(def.labelLatLng, {
                pane: "jimOgonPrefs",
                icon,
                interactive: false,
                keyboard: false,
              }).addTo(prefsGroup);
            }

            // Marker capitali — icona shining-fill (RemixIcon), dimensione fissa
            const capitalIcon = (size = 9) =>
              L.divIcon({
                className: "",
                html: `<i class="ri-shining-fill jim-capital-icon" style="font-size:${size}px"></i>`,
                iconSize: [size, size],
                iconAnchor: [size / 2, size / 2],
              });

            // Marker templi — ancient-gate-fill (RemixIcon), 15px
            const templeIcon = (size = 15) =>
              L.divIcon({
                className: "",
                html: `<i class="ri-ancient-gate-fill jim-temple-icon" style="font-size:${size}px"></i>`,
                iconSize: [size + 4, size + 4],
                iconAnchor: [(size + 4) / 2, (size + 4) / 2],
              });

            // Marker città — shining-line (RemixIcon), 13px
            const cityIcon = (size = 13) =>
              L.divIcon({
                className: "",
                html: `<i class="ri-shining-line jim-city-marker-icon" style="font-size:${size}px"></i>`,
                iconSize: [size + 4, size + 4],
                iconAnchor: [(size + 4) / 2, (size + 4) / 2],
              });

            // Marker boschi — FA tree SVG, 15px
            const forestIcon = (size = 15) =>
              L.divIcon({
                className: "",
                html: `<svg width="${size}" height="${size}" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg" class="jim-forest-icon"><path d="${FA_TREE_PATH}" fill="currentColor"/></svg>`,
                iconSize: [size + 4, size + 4],
                iconAnchor: [(size + 4) / 2, (size + 4) / 2],
              });

            const CAPITALS: { latlng: [number, number]; dataId: string }[] = [
              { latlng: [35.12, 137.535], dataId: "kessen_0" },
              { latlng: [36.33, 139.63], dataId: "edo_0" },
              { latlng: [35.71, 140.10], dataId: "edo_1" },
              { latlng: [37.60, 138.95], dataId: "hamanachi_0" },
              { latlng: [38.87, 140.40], dataId: "kotowari_0" },
            ];

            // Templi — luoghi di culto (3 posizioni)
            const TEMPLI: { latlng: [number, number]; dataId: string }[] = [
              { latlng: [35.59, 137.275], dataId: "tempio_kessen" },  // -30px sx, +15px top
              { latlng: [39.10, 140.40], dataId: "tempio_kotowari" }, // 30px top rispetto Astrolabio [38.87,140.40]
              { latlng: [37.18, 139.10], dataId: "tempio_confine" },  // Confine Edo–Hamanachi
            ];

            // Boschi — foreste selvatiche (cluster)
            const BOSCHI: { latlng: [number, number]; dataId: string }[] = [
              // Kessen montagna (~4 alberi): +25px top
              { latlng: [35.97, 137.10], dataId: "bosco_kessen" },
              { latlng: [36.00, 137.17], dataId: "bosco_kessen" },
              { latlng: [35.94, 137.20], dataId: "bosco_kessen" },
              { latlng: [35.98, 137.25], dataId: "bosco_kessen" },
              // Kotowari montagne
              { latlng: [38.52, 140.10], dataId: "bosco_kotowari" },
              { latlng: [38.55, 140.18], dataId: "bosco_kotowari" },
            ];

            // Città minori — shining-line (5 posizioni)
            // Alberi Kessen centrati circa [35.97, 137.17]
            const CITTA: { latlng: [number, number]; dataId: string }[] = [
              { latlng: [36.75, 136.9375], dataId: "citta_kessen_nord" }, // -35px sx, -20px bottom
              { latlng: [34.65, 138.800], dataId: "citta_kessen_sud" },  // +200px destra totali
              { latlng: [36.42, 137.995], dataId: "citta_kessen_est" },  // +40px top
              { latlng: [35.895, 136.495], dataId: "citta_kessen_ovest" }, // -40px sx
              { latlng: [36.750, 139.00], dataId: "citta_triplice" },    // +50px top
              { latlng: [39.775, 140.40], dataId: "citta_kotowari_nord" }, // +30px top
            ];

            // Helper per aggiungere marker con CapoluogoPanel
            const addPanelMarker = (
              latlng: [number, number],
              icon: L.DivIcon,
              dataRecord: Record<string, CapoluogoData>,
              dataId: string,
            ) => {
              const marker = L.marker(latlng, {
                pane: "jimOgonPrefs",
                icon,
                interactive: true,
                keyboard: false,
              });
              marker.on("click", (e) => {
                L.DomEvent.stopPropagation(e);
                const pt = map.latLngToContainerPoint(L.latLng(latlng));
                setActiveCapoluogo({
                  data: dataRecord[dataId],
                  x: pt.x,
                  y: pt.y,
                });
              });
              marker.addTo(prefsGroup);
            };

            for (const cap of CAPITALS) {
              addPanelMarker(cap.latlng, capitalIcon(9), CAPOLUOGHI, cap.dataId);
            }
            for (const t of TEMPLI) {
              addPanelMarker(t.latlng, templeIcon(15), TEMPLI_DATA, t.dataId);
            }
            for (const b of BOSCHI) {
              addPanelMarker(b.latlng, forestIcon(15), BOSCHI_DATA, b.dataId);
            }
            for (const c of CITTA) {
              addPanelMarker(c.latlng, cityIcon(13), CITTA_DATA, c.dataId);
            }

            prefsGroup.addTo(map);
            ogonPrefsLayerRef.current = prefsGroup;
          }
        }

        byRegion.forEach((p, id) => {
          (p as L.Path).setStyle?.(pathStyle("base", id));
        });

        // Prototipo città (se presente city-overlay.json) — mount via effect/toggle
        const cityData = await fetchCityOverlay();
        if (!cancelled && cityData) {
          cityOverlayDataRef.current = cityData;
          if (mountedRef.current) {
            setCityOverlayAvailable(true);
            const label = cityData.name ?? "Città";
            const nb = cityData.buildings?.length ?? 0;
            setCityOverlayInfo(`${label} · ${nb} edifici`);
          }
        }

        const doInitialFit = () => {
          if (cancelled || !mapRef.current) return;
          fitScopeRef.current("ogon", false);
          // Blocca zoom-out: l'utente non può tornare alla vista mondo
          window.setTimeout(() => {
            if (mapRef.current) lockNoZoomOut(mapRef.current);
          }, 100);
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
      cityOverlayRef.current = null;
      cityOverlayDataRef.current = null;
      layerByRegionRef.current = new Map();
      pendingFitRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Modalità disegno: regioni non catturano i click
  useEffect(() => {
    layerByRegionRef.current.forEach((layer) => {
      const path = layer as L.Path & { _path?: SVGElement };
      path.options.interactive = !suppressRegionSelect;
      if (path._path) {
        path._path.style.pointerEvents = suppressRegionSelect ? "none" : "";
      }
    });
  }, [suppressRegionSelect, ready]);

  useEffect(() => {
    paintAll();
  }, [selectedRegion, paintAll]);

  // Nascondi etichette prefetture quando non si è in vista Ogon
  useEffect(() => {
    const map = mapRef.current;
    const group = ogonPrefsLayerRef.current;
    if (!map || !group || !ready) return;
    if (scope === "ogon") {
      if (!map.hasLayer(group)) group.addTo(map);
    } else {
      group.remove();
    }
  }, [scope, ready]);

  // Toggle overlay città (prototipo)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (!cityOverlayOn || !cityOverlayAvailable) {
      cityOverlayRef.current?.remove();
      cityOverlayRef.current = null;
      return;
    }
    if (cityOverlayRef.current) return;
    const data = cityOverlayDataRef.current;
    if (!data) return;
    cityOverlayRef.current = mountCityOverlay(L, map, data);
  }, [cityOverlayOn, cityOverlayAvailable, ready]);

  const reloadCityOverlay = useCallback(async () => {
    const map = mapRef.current;
    const data = await fetchCityOverlay();
    cityOverlayRef.current?.remove();
    cityOverlayRef.current = null;
    if (!data) {
      cityOverlayDataRef.current = null;
      setCityOverlayAvailable(false);
      setCityOverlayInfo(null);
      return;
    }
    cityOverlayDataRef.current = data;
    setCityOverlayAvailable(true);
    setCityOverlayOn(true);
    const label = data.name ?? "Città";
    const nb = data.buildings?.length ?? 0;
    setCityOverlayInfo(`${label} · ${nb} edifici`);
    if (map) cityOverlayRef.current = mountCityOverlay(L, map, data);
  }, []);

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

      {!ready && !error && (
        <div className="jim__loading" aria-live="polite">
          Sincronizzazione reticolo…
        </div>
      )}
      {error && <div className="jim__error">{error}</div>}

      <div className="jim__topbar">
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

      {/* Panel capoluogo */}
      {activeCapoluogo && (
        <CapoluogoPanel
          data={activeCapoluogo.data}
          onClose={() => setActiveCapoluogo(null)}
          onChatEnter={(chatId) => {
            window.dispatchEvent(new CustomEvent("openChatRoom", { detail: { roomId: chatId } }));
            setActiveCapoluogo(null);
          }}
        />
      )}
    </div>
  );
}
