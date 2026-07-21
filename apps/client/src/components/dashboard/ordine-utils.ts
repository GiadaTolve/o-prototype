import type { StatutiEntry, StatutiState } from "@/hooks/useStatuti";
import type { CatalogWaza } from "./waza-catalog-types";
import { isOrdineCatalogWaza } from "@domain/progression/waza-catalog-family";

export const ORDINE_FACTIONS = [
  { id: "chisen-tai" as const, label: "Chisen-Tai", portrait: "/ordine/chisen.png" },
  { id: "mugen-tai" as const, label: "Mugen-Tai", portrait: "/ordine/mugen.png" },
] as const;

export type OrdineFactionId = (typeof ORDINE_FACTIONS)[number]["id"];

export function normalizeOrdineFactionId(order?: string | null): OrdineFactionId | null {
  const raw = order?.toLowerCase().replace(/_/g, "-") ?? "";
  if (raw === "mugen-tai" || raw === "chisen-tai") return raw;
  return null;
}

export function isOrdineFactionEntry(id: string): boolean {
  return id === "chisen-tai" || id === "mugen-tai";
}

export function findOrdineFactionEntry(
  statuti: StatutiState,
  factionId: OrdineFactionId,
): StatutiEntry | undefined {
  return statuti.ordine.find((e) => e.id === factionId);
}

export function listOrdineCompendi(
  statuti: StatutiState,
  factionId: OrdineFactionId,
): StatutiEntry[] {
  return statuti.ordine.filter(
    (e) =>
      e.id.startsWith(`${factionId}-`) &&
      !isOrdineFactionEntry(e.id) &&
      Boolean(e.statute?.trim() || e.atto?.trim() || e.descrizione_meccanica?.trim()),
  );
}

export function compendioBody(entry: StatutiEntry): string {
  return entry.atto?.trim() || entry.statute?.trim() || entry.descrizione_meccanica?.trim() || "";
}

export function compendioPreview(entry: StatutiEntry): string {
  const raw = compendioBody(entry).replace(/\[[^\]]+\]/g, "").replace(/\s+/g, " ").trim();
  if (!raw) return "";
  return raw.length > 96 ? `${raw.slice(0, 96)}…` : raw;
}

export function filterOrdineWazaForFaction(
  catalog: CatalogWaza[],
  factionId: OrdineFactionId,
): CatalogWaza[] {
  const prefix = `ordine-${factionId}-`;
  return catalog.filter((w) => {
    if (!isOrdineCatalogWaza(w)) return false;
    const pool = (w.poolId ?? "").toLowerCase();
    return pool.startsWith(prefix) || pool === `ordine-${factionId}`;
  });
}
