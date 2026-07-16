"use client";

import { useEffect, useMemo, useState } from "react";
import { MADOSHO_CATALOG } from "@domain/progression/madosho";
import { ORDER_REQUEST_VALUES } from "@domain/progression/player-requests";
import { STYLE_HEX_ORDER, STYLE_LABELS } from "@domain/progression/style-hexagon";
import { STYLE_STATUTES } from "@domain/progression/do-statutes";

export type TaxonomyKind = "do" | "madosho" | "ordine" | "premio";

export type TaxonomyEntry = {
  id: string;
  name: string;
  statute: string;
  descrizione_meccanica?: string;
};

export type SviluppoTaxonomyState = Record<TaxonomyKind, TaxonomyEntry[]>;

const STORAGE_KEY = "oyasumi.sviluppo.taxonomy.v2";

const DEFAULT_STATE: SviluppoTaxonomyState = {
  do: STYLE_HEX_ORDER.map((styleId) => ({
    id: styleId,
    name: STYLE_LABELS[styleId],
    statute: STYLE_STATUTES[styleId] ?? "",
    descrizione_meccanica: "",
  })),
  madosho: MADOSHO_CATALOG.map((m) => ({ id: m.id, name: m.name, statute: "", descrizione_meccanica: "" })),
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
      const mergedDo = Array.isArray(parsed.do)
        ? DEFAULT_STATE.do.map((def) => {
            const saved = (parsed.do as typeof DEFAULT_STATE.do).find((e) => e.id === def.id);
            return saved ? { ...def, ...saved, statute: saved.statute || def.statute } : def;
          })
        : DEFAULT_STATE.do;
      setState({
        do: mergedDo,
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

