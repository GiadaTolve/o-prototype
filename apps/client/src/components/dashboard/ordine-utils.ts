import type { StatutiEntry, StatutiState } from "@/hooks/useStatuti";
import type { CatalogWaza } from "./waza-catalog-types";
import type { CharacterSummary } from "./types";
import { isOrdineCatalogWaza } from "@domain/progression/waza-catalog-family";

export const ORDINE_FACTIONS = [
  {
    id: "chisen-tai" as const,
    label: "Chisen-Tai",
    portrait: "/ordine/chisen.png",
    banner: "/ordine/banner-chisen.png",
    accent: "violet" as const,
  },
  {
    id: "mugen-tai" as const,
    label: "Mugen-Tai",
    portrait: "/ordine/mugen.png",
    banner: "/ordine/banner-mugen.png",
    accent: "gold" as const,
  },
] as const;

export type OrdineFactionId = (typeof ORDINE_FACTIONS)[number]["id"];

/** Proprietario (pixel-icon admin o account ADMIN). */
export function canEditOrdineStatuti(char?: CharacterSummary | null): boolean {
  if (!char) return false;
  if (char.userRole === "ADMIN") return true;
  return char.pixelIcons?.ruolo?.includes("admin") === true;
}

export function slugifyOrdineEntryId(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function ordineEntryDisplayName(entryId: string): string {
  const slug = entryId.replace(/^(chisen-tai|mugen-tai)-/, "");
  if (slug === entryId) return entryId;
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

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
