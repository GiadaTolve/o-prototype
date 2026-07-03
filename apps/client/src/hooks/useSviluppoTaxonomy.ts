"use client";

import { useEffect, useMemo, useState } from "react";
import { MADOSHO_CATALOG } from "@domain/progression/madosho";
import { ORDER_REQUEST_VALUES, PREMIO_REQUEST_OPTIONS } from "@domain/progression/player-requests";

export type TaxonomyKind = "madosho" | "ordine" | "premio";

export type TaxonomyEntry = {
  id: string;
  name: string;
  statute: string;
};

export type SviluppoTaxonomyState = Record<TaxonomyKind, TaxonomyEntry[]>;

const STORAGE_KEY = "oyasumi.sviluppo.taxonomy.v1";

const DEFAULT_STATE: SviluppoTaxonomyState = {
  madosho: MADOSHO_CATALOG.map((m) => ({ id: m.id, name: m.name, statute: m.statute })),
  ordine: ORDER_REQUEST_VALUES.map((id) => ({ id: id.toLowerCase(), name: id, statute: "" })),
  premio: PREMIO_REQUEST_OPTIONS.map((p) => ({ id: p.id, name: p.label, statute: "" })),
};

export function useSviluppoTaxonomy() {
  const [state, setState] = useState<SviluppoTaxonomyState>(DEFAULT_STATE);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<SviluppoTaxonomyState>;
      setState({
        madosho: Array.isArray(parsed.madosho) ? parsed.madosho : DEFAULT_STATE.madosho,
        ordine: Array.isArray(parsed.ordine) ? parsed.ordine : DEFAULT_STATE.ordine,
        premio: Array.isArray(parsed.premio) ? parsed.premio : DEFAULT_STATE.premio,
      });
    } catch {
      setState(DEFAULT_STATE);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  const api = useMemo(
    () => ({
      state,
      setState,
    }),
    [state],
  );

  return api;
}

