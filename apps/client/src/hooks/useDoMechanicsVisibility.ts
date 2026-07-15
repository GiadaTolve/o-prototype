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
  const [showGokaon, setShowGokaon] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setUnlockedIds([]);
      setShowGokaon(false);
      return;
    }
    let cancelled = false;
    api
      .get("/characters/me/style-hexagon")
      .then((data) => {
        if (cancelled) return;
        const d = data as { unlockedStyleIds?: string[]; gokaonActive?: boolean };
        setUnlockedIds(d.unlockedStyleIds ?? []);
        setShowGokaon(d.gokaonActive === true);
      })
      .catch(() => {
        if (!cancelled) {
          setUnlockedIds([]);
          setShowGokaon(false);
        }
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
  const visible = visibleStyles.length > 0 || showHitTier || showGokaon;
  const loading = unlockedIds === null;

  return { unlockedIds, visibleStyles, showHitTier, showGokaon, visible, loading };
}
