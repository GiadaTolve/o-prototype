export type WindowId = "scheda" | "presenti" | "shop" | "sms" | "fetch" | "banca" | "housing" | "profilo" | "waza" | "ordine" | "bestiario";

export type CharacterSummary = {
  id?: string;
  name?: string;
  surname?: string | null;
  avatar?: string | null;
  avatarUrl?: string;
  miniAvatar?: string | null;
  /** Pixel-icon (20×20) per ruolo/ordine/premio — vedi GAME_LAYOUT_SPEC §4, pixel-icons.ts */
  pixelIcons?: { ruolo?: string[]; ordine?: string[]; premioSpeciale?: string[] };
  stats?: { f: number; c: number; d: number; m: number; e: number };
  rem?: number;
  experienceTotal?: number;
  experienceSpendable?: number;
  keys?: number;
  gems?: number;
  computed?: Record<string, number>;
  /** Solo Shinigami / Capo: vedere link Shinigami, Registra Quest in chat. */
  canAccessShinigami?: boolean;
  /** Solo Admin/Mod/Capo: vedere link Gestione. */
  canAccessGestione?: boolean;
} | null;

export const WINDOW_LABELS: Record<WindowId, string> = {
  scheda: "Scheda",
  presenti: "Presenti Estesi",
  shop: "Shop",
  sms: "SMS",
  fetch: "Fetch (Missioni)",
  banca: "Banca",
  housing: "Housing",
  profilo: "Profilo Personaggio",
  waza: "Waza",
  ordine: "Ordine",
  bestiario: "Bestiario",
};

export type Presente = {
  id: string;
  name: string;
  /** Dove si trova (es. "Kessen · Junk Town" o roomId). Per Lista presenti / Presenti estesi. */
  zone?: string;
  /** Room ID chat corrente (per "presenti in chat"). */
  room?: string;
  isMe?: boolean;
  /** Pixel-icon (20×20) accanto al nome — GAME_LAYOUT_SPEC §4 */
  pixelIcons?: { ruolo?: string[]; ordine?: string[]; premioSpeciale?: string[] };
};

/** Messaggio chat (WebSocket + GET /chat/:room). `zone` = roomId. `locationTag` = posizione compilata dal giocatore. */
export type ChatMessage = {
  id: string;
  zone: string;
  characterId: string;
  name: string;
  surname?: string | null;
  miniAvatar?: string | null;
  pixelIcons?: { ruolo?: string[]; ordine?: string[]; premioSpeciale?: string[] };
  content: string;
  locationTag?: string | null;
  createdAt: string;
};

export function getMockPresenti(currentName?: string): Presente[] {
  const me: Presente[] = currentName
    ? [{ id: "me", name: currentName, zone: "Ogon · Edo", isMe: true }]
    : [];
  return [
    ...me,
    { id: "a", name: "Alice", zone: "Ogon · Kessen", pixelIcons: { ruolo: ["moderatore"] } },
    { id: "b", name: "Bob", zone: "Limbo" },
    { id: "c", name: "Carol", zone: "Ogon · Edo", pixelIcons: { ruolo: ["shinigami"] } },
  ];
}

/** Regione Ogon — Giappone inventato. Prefetture modificabili in fase di creazione mappe (admin). */
export type PrefetturaId = "edo" | "kessen" | "kotowari";

export type Prefettura = {
  id: PrefetturaId;
  name: string;
  cityLabel: string;
  region: string;
};

export const PREFETTURE_OGON: Prefettura[] = [
  { id: "edo", name: "Edo", cityLabel: "Tokyo", region: "Ogon" },
  { id: "kessen", name: "Kessen", cityLabel: "Fuji", region: "Ogon" },
  { id: "kotowari", name: "Kotowari", cityLabel: "Sendai", region: "Ogon" },
];

export type MeteoPrefettura = {
  temp: number;
  condition: string;
  icon: "sun" | "cloud" | "cloud-sun" | "rain";
};

/** Meteo per prefettura (mock). In creazione mappe: modificabile da admin. */
export const MOCK_METEO: Record<PrefetturaId, MeteoPrefettura> = {
  edo: { temp: 18, condition: "Sereno", icon: "sun" },
  kessen: { temp: 8, condition: "Nuvoloso", icon: "cloud-sun" },
  kotowari: { temp: 12, condition: "Pioggia leggera", icon: "rain" },
};

/** Evento calendario. Gestione da pannello moderatori/admin. Box sotto meteo popolato solo se in corso. */
export type CalendarEvent = {
  id: string;
  title: string;
  inProgress: boolean;
};

/** Mock: evento in corso (da API/admin in seguito). */
export function getMockEventInProgress(): CalendarEvent | null {
  return { id: "1", title: "Quest: La Notte del Kitsune", inProgress: true };
}
