/**
 * Prefetture interne a Ogon (zone di gioco).
 * Geometrie: /maps/geo/ogon-prefectures.geojson
 *
 * Edo (capitale) = intero Kanto
 *   Tokyo, Kanagawa, Saitama, Chiba, Ibaraki, Tochigi, Gunma
 *   + Yamanashi (Kofu)
 *
 * Kotowari = Tohoku senza Aomori, Iwate, e il ~1/4 nord di Akita
 *   Miyagi, Yamagata, Fukushima + ~3/4 sud di Akita (taglio ondulato)
 *   Il quarto nord di Akita è in Onimori (non nel profilo Ogon).
 *
 * Hamanachi = Niigata
 *
 * Kessen = Chubu senza Niigata e Yamanashi, con Mie intera
 *   Toyama, Ishikawa, Fukui, Nagano, Gifu, Shizuoka, Aichi, Mie
 *   (Ishikawa/Fukui/Aichi/Mie/Gifu intera portate nel fill Ogon)
 *
 * (isole remote di Tokyo escluse dai poligoni).
 */
export type OgonPrefectureId = "edo" | "kotowari" | "hamanachi" | "kessen";

export type OgonPrefectureDef = {
  id: OgonPrefectureId;
  label: string;
  labelJa: string;
  /** Prefetture reali fuse nel poligono. */
  sourcePrefs: string[];
  /** Centro etichetta [lat, lng] */
  labelLatLng: [number, number];
};

export const OGON_PREFECTURES_GEOJSON_URL = "/maps/geo/ogon-prefectures.geojson";

export const OGON_PREFECTURES: OgonPrefectureDef[] = [
  {
    id: "edo",
    label: "Edo",
    labelJa: "江戸",
    sourcePrefs: [
      "Tokyo",
      "Kanagawa",
      "Saitama",
      "Chiba",
      "Ibaraki",
      "Tochigi",
      "Gunma",
      "Yamanashi",
    ],
    labelLatLng: [35.9, 139.5],
  },
  {
    id: "kotowari",
    label: "Kotowari",
    labelJa: "理",
    sourcePrefs: [
      "Miyagi",
      "Yamagata",
      "Fukushima",
      "Akita (3/4 sud)",
    ],
    labelLatLng: [38.35, 140.45],
  },
  {
    id: "hamanachi",
    label: "Hamanachi",
    labelJa: "浜町",
    sourcePrefs: ["Niigata"],
    labelLatLng: [37.55, 138.95],
  },
  {
    id: "kessen",
    label: "Kessen",
    labelJa: "決戦",
    sourcePrefs: [
      "Toyama",
      "Ishikawa",
      "Fukui",
      "Nagano",
      "Gifu",
      "Shizuoka",
      "Aichi",
      "Mie",
    ],
    labelLatLng: [35.55, 137.15],
  },
];

export function ogonPrefectureDef(id: string): OgonPrefectureDef | undefined {
  return OGON_PREFECTURES.find((p) => p.id === id);
}
