"use client";

import { useEffect, useMemo, useState } from "react";
import { MADOSHO_CATALOG } from "@domain/progression/madosho";
import { ORDER_REQUEST_VALUES } from "@domain/progression/player-requests";

export type TaxonomyKind = "do" | "madosho" | "ordine" | "premio";

export type TaxonomyEntry = {
  id: string;
  name: string;
  statute: string;
  descrizione_meccanica?: string;
};

export type SviluppoTaxonomyState = Record<TaxonomyKind, TaxonomyEntry[]>;

const STORAGE_KEY = "oyasumi.sviluppo.taxonomy.v2";

const DO_NOMI = [
  "Tōka-dō",
  "Genzai-dō",
  "Itō-dō",
  "Naikan-dō",
  "Hensei-dō",
  "Hadō-dō",
] as const;

const DEFAULT_STATE: SviluppoTaxonomyState = {
  do: DO_NOMI.map((n) => ({ id: n.toLowerCase().replace(/[^a-z]/g, "-"), name: n, statute: "", descrizione_meccanica: "" })),
  madosho: MADOSHO_CATALOG.map((m) => ({ id: m.id, name: m.name, statute: m.statute, descrizione_meccanica: "" })),
  ordine: ORDER_REQUEST_VALUES.map((id) => ({ id: id.toLowerCase(), name: id, statute: "", descrizione_meccanica: "" })),
  premio: [],
};

export function useSviluppoTaxonomy() {
  const [state, setState] = useState<SviluppoTaxonomyState>(DEFAULT_STATE);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<SviluppoTaxonomyState>;
      setState({
        do: Array.isArray(parsed.do) ? parsed.do : DEFAULT_STATE.do,
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

