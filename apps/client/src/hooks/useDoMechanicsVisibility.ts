"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

/** Stili con tracker meccaniche in combattimento (Esagono del Dō). */
export const DO_MECHANICS_STYLE_IDS = ["ito", "naikan", "hensei", "hado"] as const;

export type DoMechanicsStyleId = (typeof DO_MECHANICS_STYLE_IDS)[number];

export const DO_MECHANICS_STYLE_LABELS: Record<DoMechanicsStyleId, string> = {
  ito: "Itō",
  naikan: "Naikan",
  hensei: "Hensei",
  hado: "Hadō",
};

export function buildDoMechanicsSectionTitle(visibleStyles: readonly DoMechanicsStyleId[]): string {
  if (visibleStyles.length === 0) return "Meccaniche Dō";
  return `Meccaniche Dō · ${visibleStyles.map((id) => DO_MECHANICS_STYLE_LABELS[id]).join(" · ")}`;
}

export function useDoMechanicsVisibility(enabled = true) {
  const [unlockedIds, setUnlockedIds] = useState<string[] | null>(null);

  useEffect(() => {
    if (!enabled) {
      setUnlockedIds([]);
      return;
    }
    let cancelled = false;
    api
      .get("/characters/me/style-hexagon")
      .then((data) => {
        if (cancelled) return;
        const ids = (data as { unlockedStyleIds?: string[] }).unlockedStyleIds ?? [];
        setUnlockedIds(ids);
      })
      .catch(() => {
        if (!cancelled) setUnlockedIds([]);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const visibleStyles = useMemo(
    () => DO_MECHANICS_STYLE_IDS.filter((id) => unlockedIds?.includes(id)),
    [unlockedIds],
  );

  const showHitTier = unlockedIds?.includes("naikan") ?? false;
  const visible = visibleStyles.length > 0 || showHitTier;
  const loading = unlockedIds === null;

  return { unlockedIds, visibleStyles, showHitTier, visible, loading };
}
