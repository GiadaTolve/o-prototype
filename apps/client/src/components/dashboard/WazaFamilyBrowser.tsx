"use client";

import { useCallback, useMemo, useState } from "react";
import {
  WAZA_CATALOG_FAMILY_BLURBS,
  WAZA_CATALOG_FAMILY_LABELS,
  type WazaCatalogFamily,
} from "@domain/progression/waza-catalog-family";
import { sortWazaByKindAndName } from "@domain/progression";
import type { SkiruSheet } from "@domain/skiru";
import { useDoMechanicsSnapshot } from "@/hooks/useDoMechanicsSnapshot";
import { useStatuti } from "@/hooks/useStatuti";
import { WazaEditorialHeader } from "./WazaEditorialHeader";
import { WazaCatalogRow } from "./WazaCatalogRow";
import { filterCatalogByFamily, type CatalogWaza } from "./waza-catalog-types";
import { api } from "@/lib/api";

const EMPTY_HINTS: Partial<Record<WazaCatalogFamily, string>> = {
  ordine:
    "Waza d'arsenale Mugen-Tai / Chisen-Tai — in preparazione (milestone Sentō Senshi).",
  "oni-no-mori":
    "Contenuti regionali Onimori — catalogo in preparazione.",
};

export function WazaFamilyBrowser({
  family,
  catalog,
  skiruSheet,
  onCharUpdate,
  onReload,
  fullHeight = false,
  csPreview,
  resolveExtras: resolveExtrasProp,
}: {
  family: Exclude<WazaCatalogFamily, "do" | "madosho">;
  catalog: CatalogWaza[];
  skiruSheet?: SkiruSheet | Record<string, number> | null;
  onCharUpdate?: () => void;
  onReload: () => Promise<void>;
  fullHeight?: boolean;
  csPreview: number;
  resolveExtras?: import("@/hooks/useDoMechanicsSnapshot").WazaResolveExtras;
}) {
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const normalizedSkiruSheet = useMemo(
    () => (skiruSheet && Object.keys(skiruSheet).length > 0 ? (skiruSheet as SkiruSheet) : null),
    [skiruSheet],
  );

  const { extras: resolveExtrasFromHook } = useDoMechanicsSnapshot(csPreview, !resolveExtrasProp);
  const resolveExtras = resolveExtrasProp ?? resolveExtrasFromHook;

  const items = useMemo(() => {
    const filtered = filterCatalogByFamily(catalog, family);
    return sortWazaByKindAndName(filtered, {
      isPassive: (w) => !!w.isPassive,
      getName: (w) => w.name,
    });
  }, [catalog, family]);

  const handlePurchase = useCallback(
    async (skillId: string) => {
      setPurchasingId(skillId);
      try {
        await api.post("/characters/me/skills", { skillId });
        await onReload();
        onCharUpdate?.();
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : "Errore acquisto.");
      } finally {
        setPurchasingId(null);
      }
    },
    [onCharUpdate, onReload],
  );

  const { state: statuti } = useStatuti();

  const familyStatuti = useMemo(() => {
    if (family === "ordine") {
      const withContent = statuti.ordine.find(
        (e) => e.statute?.trim() || e.descrizione_meccanica?.trim() || e.sottotitolo?.trim(),
      );
      return withContent ?? statuti.ordine[0] ?? null;
    }
    return null;
  }, [family, statuti.ordine]);

  const sectionLabel =
    family === "ordine" ? "Arsenale" : family === "oni-no-mori" ? "Regione" : "Catalogo";

  const owned = items.filter((w) => w.owned).length;

  return (
    <section
      className={`waza-do-panel rounded-lg border border-[var(--border-color)] bg-[var(--panel-bg)]/90 overflow-hidden animate__animated animate__fadeIn motion-reduce:animate-none ${
        fullHeight ? "flex flex-col flex-1 min-h-0 h-full" : ""
      }`}
    >
      <WazaEditorialHeader
        title={WAZA_CATALOG_FAMILY_LABELS[family]}
        subtitle={familyStatuti?.sottotitolo ?? WAZA_CATALOG_FAMILY_BLURBS[family]}
        statute={familyStatuti?.statute}
        mechanics={familyStatuti?.descrizione_meccanica}
        statuteLabel={sectionLabel}
      />

      <div className="shrink-0 px-4 py-2 border-b border-[var(--border-color)]/40 bg-black/30 text-xs font-display uppercase tracking-[0.14em] text-[var(--foreground)]/60">
        Tecniche · {items.length}
        {items.length > 0 && (
          <span className="text-[9px] normal-case tracking-normal text-[var(--foreground)]/40 ml-2">
            · <span className="text-[var(--accent-gold)]">{owned}</span> apprese
          </span>
        )}
      </div>

      <div
        className={`overflow-y-auto p-4 space-y-2.5 ${
          fullHeight ? "flex-1 min-h-[280px]" : "min-h-[420px] max-h-[min(72vh,720px)]"
        }`}
      >
        {items.length === 0 ? (
          <p className="text-sm text-[var(--accent-violet-light)]/80 text-center py-12 max-w-md mx-auto leading-relaxed">
            {EMPTY_HINTS[family] ?? "Nessuna waza in catalogo per questa categoria."}
          </p>
        ) : (
          items.map((w, index) => (
            <WazaCatalogRow
              key={w.id}
              waza={w}
              branchUnlocked={w.branchUnlocked !== false}
              isKeystone={false}
              index={index}
              onPurchase={handlePurchase}
              purchasing={purchasingId === w.id}
              skiruSheet={normalizedSkiruSheet}
              resolveExtras={resolveExtras}
            />
          ))
        )}
      </div>
    </section>
  );
}
