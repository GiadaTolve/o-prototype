/**
 * Config mappe: root → game maps → zone → locations (chat).
 * Pin root: x,y in % (0–100) su map.png. Modificabile in fase admin.
 */

export type GameMapId = "ogon" | "izayoi" | "onimori" | "ezochi" | "altrove";

export type ZoneId = "kessen" | "edo" | "kotowari" | "hamanachi";

/** Slug univoco per room chat. Formato zone__location o zone__container__location. */
export type RoomId = string;

export type RootPin = {
  gameMapId: GameMapId;
  label: string;
  /** Posizione su map.png, in percentuale (0–100). */
  x: number;
  y: number;
};

export type ChatLocation = {
  id: string;
  label: string;
  /** Room ID per WS/API chat. */
  roomId: RoomId;
  /** Immagine luogo (interfaccia chat). Opzionale. */
  image?: string;
  /** Descrizione ambientale. Opzionale. */
  description?: string;
};

export type LocationContainer = {
  id: string;
  label: string;
  children: ChatLocation[];
};

export type ZoneConfig = {
  id: ZoneId;
  label: string;
  /** Luoghi diretti (con chat) o contenitori (con figli chat). */
  locations: (ChatLocation | LocationContainer)[];
};

export type GameMapConfig = {
  id: GameMapId;
  label: string;
  /** Path immagine opzionale (es. /maps/ogon.png). Se assente, UI a lista. */
  image?: string;
  zones: ZoneConfig[];
};

/** Prefetture con meteo. Solo Edo, Kessen, Kotowari. */
export type PrefetturaId = "edo" | "kessen" | "kotowari";

export function zoneToPrefettura(zone: ZoneId): PrefetturaId | null {
  if (zone === "edo" || zone === "kessen" || zone === "kotowari") return zone;
  return null;
}

/** Estrae la zone da un roomId (primo segmento). */
export function roomIdToZone(roomId: RoomId): ZoneId | null {
  const z = roomId.split("__")[0] as ZoneId;
  const valid: ZoneId[] = ["kessen", "edo", "kotowari", "hamanachi"];
  return valid.includes(z) ? z : null;
}

/** Prefettura per un room (da zona). Hamanachi → null. */
export function roomToPrefettura(roomId: RoomId): PrefetturaId | null {
  const zone = roomIdToZone(roomId);
  return zone ? zoneToPrefettura(zone) : null;
}

/** Room IDs validi (per validazione backend). */
export function getAllRoomIds(): RoomId[] {
  const out: RoomId[] = [];
  for (const z of OGON.zones) {
    for (const loc of z.locations) {
      if ("roomId" in loc) {
        out.push(loc.roomId);
      } else {
        for (const c of loc.children) out.push(c.roomId);
      }
    }
  }
  return out;
}

/** Lista piatta di { roomId, label } per una zone (per UI lista chat). */
export function getChatListForZone(zone: ZoneConfig): { roomId: RoomId; label: string; containerLabel?: string }[] {
  const out: { roomId: RoomId; label: string; containerLabel?: string }[] = [];
  for (const loc of zone.locations) {
    if ("roomId" in loc) {
      out.push({ roomId: loc.roomId, label: loc.label });
    } else {
      for (const c of loc.children) {
        out.push({ roomId: c.roomId, label: c.label, containerLabel: loc.label });
      }
    }
  }
  return out;
}

export function getChatLocationByRoomId(roomId: RoomId): ChatLocation | null {
  for (const z of OGON.zones) {
    for (const loc of z.locations) {
      if ("roomId" in loc && loc.roomId === roomId) return loc;
      if ("children" in loc) {
        const found = loc.children.find((c) => c.roomId === roomId);
        if (found) return found;
      }
    }
  }
  return null;
}

// ─── Root pins (map.png). Modificabile in creazione mappe. ───
export const ROOT_PINS: RootPin[] = [
  { gameMapId: "ogon", label: "Ogon", x: 30, y: 45 },
  { gameMapId: "izayoi", label: "Izayoi", x: 50, y: 35 },
  { gameMapId: "onimori", label: "Onimori", x: 70, y: 40 },
  { gameMapId: "ezochi", label: "Ezochi", x: 55, y: 60 },
  { gameMapId: "altrove", label: "Altrove", x: 80, y: 70 },
];

// ─── Ogon: zone e location (chat) ───
const OGON: GameMapConfig = {
  id: "ogon",
  label: "Ogon",
  image: "/maps/ogon.png",
  zones: [
    {
      id: "kessen",
      label: "Kessen",
      locations: [
        {
          id: "cosmicon-complex",
          label: "Cosmicon Complex",
          children: [
            { id: "junk_town", label: "Junk Town", roomId: "kessen__cosmicon__junk_town" },
            { id: "arcade_palace", label: "Arcade Palace", roomId: "kessen__cosmicon__arcade_palace" },
            { id: "milky_way", label: "Milky Way", roomId: "kessen__cosmicon__milky_way" },
          ],
        },
      ],
    },
    {
      id: "edo",
      label: "Edo",
      locations: [
        { id: "paradise", label: "Paradise", roomId: "edo__paradise" },
        { id: "ginza_o_clock", label: "Ginza o' Clock", roomId: "edo__ginza_o_clock" },
      ],
    },
    {
      id: "kotowari",
      label: "Kotowari",
      locations: [
        { id: "astrolabio", label: "Astrolabio", roomId: "kotowari__astrolabio" },
        { id: "osservatorio", label: "Osservatorio", roomId: "kotowari__osservatorio" },
      ],
    },
    {
      id: "hamanachi",
      label: "Hamanachi",
      locations: [
        { id: "casa_da_te", label: "Casa da tè", roomId: "hamanachi__casa_da_te" },
        { id: "ospedale", label: "Ospedale", roomId: "hamanachi__ospedale" },
      ],
    },
  ],
};

/** Mappe di gioco. Per ora solo Ogon definita. */
export const GAME_MAPS: Record<GameMapId, GameMapConfig> = {
  ogon: OGON,
  izayoi: { id: "izayoi", label: "Izayoi", zones: [] },
  onimori: { id: "onimori", label: "Onimori", zones: [] },
  ezochi: { id: "ezochi", label: "Ezochi", zones: [] },
  altrove: { id: "altrove", label: "Altrove", zones: [] },
};

export const ROOT_MAP_IMAGE = "/maps/map.png";
