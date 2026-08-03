/**
 * Memoria «ultimo luogo» — ripristina mappa/chat dopo logout/login (stesso browser).
 * Chiave per personaggio quando disponibile.
 */
import type { GameMapId } from "@/config/map-config";

export type MapScope = "ogon" | "mondo";

export type LastPlaceMemory = {
  view: "root" | "game-map" | "zone-list" | "chat";
  /** Scope della mappa interattiva (solo se view === root). */
  mapScope?: MapScope;
  gameMapId?: GameMapId | null;
  zoneId?: string | null;
  roomId?: string | null;
  updatedAt: number;
};

const KEY_PREFIX = "oyasumi-last-place";

function storageKey(characterId?: string | null): string {
  return characterId?.trim() ? `${KEY_PREFIX}:${characterId.trim()}` : `${KEY_PREFIX}:anon`;
}

export function readLastPlace(characterId?: string | null): LastPlaceMemory | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(characterId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastPlaceMemory;
    if (!parsed || typeof parsed !== "object" || !parsed.view) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeLastPlace(
  characterId: string | null | undefined,
  patch: Omit<LastPlaceMemory, "updatedAt">,
): void {
  if (typeof window === "undefined") return;
  try {
    const next: LastPlaceMemory = { ...patch, updatedAt: Date.now() };
    localStorage.setItem(storageKey(characterId), JSON.stringify(next));
  } catch {
    // quota / private mode
  }
}
