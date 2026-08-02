/**
 * Dati overlay in coordinate IMMAGINE (pixel, origine top-left Photoshop).
 * La mappa li converte in CRS.Simple (y verso l’alto).
 */

import type { GameMapId } from "@/config/map-config";

export type ImagePoint = { x: number; y: number };

export type ImageRegionDef = {
  id: Exclude<GameMapId, "altrove">;
  label: string;
  labelJa: string;
  ring: ImagePoint[];
  glow: "gold" | "violet";
};

export type ImageRouteDef = {
  id: string;
  label: string;
  kind: "river" | "rail" | "road";
  points: ImagePoint[];
};

export type ImagePoiDef = {
  id: string;
  label: string;
  kind: "temple" | "urban" | "academy" | "landmark";
  x: number;
  y: number;
  region?: Exclude<GameMapId, "altrove">;
};

/** Placeholder ~2048×1120 — ricalibra dopo mappa_giappone.jpg */
export const IMAGE_REGIONS: ImageRegionDef[] = [
  {
    id: "ezochi",
    label: "Ezochi",
    labelJa: "蝦夷地",
    glow: "gold",
    ring: [
      { x: 1280, y: 40 },
      { x: 1680, y: 60 },
      { x: 1780, y: 220 },
      { x: 1620, y: 320 },
      { x: 1380, y: 280 },
      { x: 1240, y: 140 },
    ],
  },
  {
    id: "ogon",
    label: "Ogon",
    labelJa: "黄金",
    glow: "gold",
    ring: [
      { x: 1180, y: 300 },
      { x: 1580, y: 320 },
      { x: 1680, y: 520 },
      { x: 1520, y: 700 },
      { x: 1280, y: 720 },
      { x: 1120, y: 560 },
      { x: 1100, y: 400 },
    ],
  },
  {
    id: "izayoi",
    label: "Izayoi",
    labelJa: "十六夜",
    glow: "violet",
    ring: [
      { x: 980, y: 560 },
      { x: 1180, y: 540 },
      { x: 1240, y: 720 },
      { x: 1100, y: 860 },
      { x: 900, y: 840 },
      { x: 860, y: 680 },
    ],
  },
  {
    id: "onimori",
    label: "Onimori",
    labelJa: "鬼の森",
    glow: "violet",
    ring: [
      { x: 520, y: 480 },
      { x: 900, y: 500 },
      { x: 980, y: 720 },
      { x: 860, y: 980 },
      { x: 480, y: 960 },
      { x: 400, y: 700 },
    ],
  },
];

export const IMAGE_ROUTES: ImageRouteDef[] = [
  {
    id: "sumida-stylized",
    label: "Corso d’acqua",
    kind: "river",
    points: [
      { x: 1420, y: 380 },
      { x: 1460, y: 460 },
      { x: 1500, y: 560 },
      { x: 1540, y: 640 },
    ],
  },
  {
    id: "moonlink-rail",
    label: "Moonlink",
    kind: "rail",
    points: [
      { x: 1380, y: 520 },
      { x: 1260, y: 540 },
      { x: 1140, y: 580 },
      { x: 1020, y: 620 },
    ],
  },
  {
    id: "via-oro",
    label: "Via dell’Oro",
    kind: "road",
    points: [
      { x: 1360, y: 500 },
      { x: 1380, y: 420 },
      { x: 1420, y: 340 },
      { x: 1480, y: 260 },
    ],
  },
];

export const IMAGE_POIS: ImagePoiDef[] = [
  { id: "poi-edo", label: "Edo · Capitale", kind: "urban", x: 1400, y: 540, region: "ogon" },
  { id: "poi-paradise", label: "Paradise", kind: "landmark", x: 1460, y: 580, region: "ogon" },
  { id: "poi-temple-izayoi", label: "Santuario Izayoi", kind: "temple", x: 1040, y: 700, region: "izayoi" },
  { id: "poi-academy", label: "Accademia", kind: "academy", x: 1320, y: 480, region: "ogon" },
];

export const POI_META: Record<ImagePoiDef["kind"], { icon: string; label: string }> = {
  temple: { icon: "⛩", label: "Tempio" },
  urban: { icon: "▣", label: "Nodo urbano" },
  academy: { icon: "✧", label: "Accademia" },
  landmark: { icon: "◆", label: "Landmark" },
};
