"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  mapDoMechanicsToWazaResolveFields,
  type DoMechanicsSnapshot,
} from "@domain/styles/do-mechanics";
import type { WazaResolveContext } from "@domain/combat/waza-resolve";

export type { DoMechanicsSnapshot };

export type WazaResolveExtras = Pick<
  WazaResolveContext,
  | 'currentCs'
  | 'atsuryokuPressure'
  | 'lastReceivedHitTier'
  | 'yuragiParityNext'
  | 'itoIrBonus'
  | 'nagoriCollateralFrom'
>;

export function wazaResolveExtrasFromSnapshot(
  snapshot: DoMechanicsSnapshot | null | undefined,
): WazaResolveExtras {
  return mapDoMechanicsToWazaResolveFields(snapshot);
}

export function useDoMechanicsSnapshot(currentCs?: number | null, enabled = true) {
  const [snapshot, setSnapshot] = useState<DoMechanicsSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const qs =
        typeof currentCs === "number" && Number.isFinite(currentCs)
          ? `?currentCs=${Math.max(0, Math.floor(currentCs))}`
          : "";
      const data = (await api.get(`/characters/me/do-mechanics${qs}`)) as DoMechanicsSnapshot;
      setSnapshot(data);
    } catch (e: unknown) {
      setSnapshot(null);
      setError(e instanceof Error ? e.message : "Errore meccaniche Dō");
    } finally {
      setLoading(false);
    }
  }, [currentCs, enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  const extras = wazaResolveExtrasFromSnapshot(snapshot);

  return { snapshot, extras, loading, error, reload: load, setSnapshot };
}
