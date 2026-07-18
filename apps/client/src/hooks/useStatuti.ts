"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MADOSHO_CATALOG } from "@domain/progression/madosho";
import { ORDER_REQUEST_VALUES } from "@domain/progression/player-requests";
import { STYLE_HEX_ORDER, STYLE_LABELS } from "@domain/progression/style-hexagon";
import { STYLE_STATUTES } from "@domain/progression/do-statutes";

export type StatutiKind = "do" | "madosho" | "ordine" | "premio";

export type StatutiEntry = {
  id: string;
  name: string;
  statute: string;
  atto?: string;
  sottotitolo?: string;
  descrizione_meccanica?: string;
};

export type StatutiState = Record<StatutiKind, StatutiEntry[]>;

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const STORAGE_KEY = "oyasumi.sviluppo.statuti.v1";
const LEGACY_STORAGE_KEY = "oyasumi.sviluppo.taxonomy.v2";

const DEFAULT_STATE: StatutiState = {
  do: STYLE_HEX_ORDER.map((styleId) => ({
    id: styleId,
    name: STYLE_LABELS[styleId],
    statute: STYLE_STATUTES[styleId] ?? "",
    descrizione_meccanica: "",
  })),
  madosho: MADOSHO_CATALOG.map((m) => ({
    id: m.id,
    name: m.name,
    statute: "",
    atto: "",
    sottotitolo: m.tagline,
    descrizione_meccanica: "",
  })),
  ordine: ORDER_REQUEST_VALUES.map((id) => ({
    id: id.toLowerCase(),
    name: id,
    statute: "",
    descrizione_meccanica: "",
  })),
  premio: [],
};

type DbRow = {
  kind: string;
  entryId: string;
  statute: string;
  atto: string;
  sottotitolo: string;
  descrizione_meccanica: string;
};

function mergeDbRows(base: StatutiState, rows: DbRow[]): StatutiState {
  const result: StatutiState = {
    do: base.do.map((e) => ({ ...e })),
    madosho: base.madosho.map((e) => ({ ...e })),
    ordine: base.ordine.map((e) => ({ ...e })),
    premio: [...base.premio],
  };
  for (const row of rows) {
    const kind = row.kind as StatutiKind;
    if (!result[kind]) continue;
    const idx = result[kind].findIndex((e) => e.id === row.entryId);
    if (idx !== -1) {
      if (row.statute) result[kind][idx].statute = row.statute;
      if (row.atto) result[kind][idx].atto = row.atto;
      if (row.sottotitolo) result[kind][idx].sottotitolo = row.sottotitolo;
      if (row.descrizione_meccanica) result[kind][idx].descrizione_meccanica = row.descrizione_meccanica;
    } else if (kind === "premio" && row.entryId) {
      result.premio.push({
        id: row.entryId,
        name: row.entryId,
        statute: row.statute,
        atto: row.atto,
        descrizione_meccanica: row.descrizione_meccanica,
      });
    }
  }
  return result;
}

export function findStatutiEntry(
  state: StatutiState,
  kind: StatutiKind,
  id: string,
): StatutiEntry | undefined {
  return state[kind].find((e) => e.id === id);
}

export function useStatuti() {
  const [state, setState] = useState<StatutiState>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StatutiState>;
        const mergedDo = Array.isArray(parsed.do)
          ? DEFAULT_STATE.do.map((def) => {
              const saved = (parsed.do as typeof DEFAULT_STATE.do).find((e) => e.id === def.id);
              return saved ? { ...def, ...saved, statute: saved.statute || def.statute } : def;
            })
          : DEFAULT_STATE.do;
        setState({
          do: mergedDo,
          madosho: Array.isArray(parsed.madosho)
            ? DEFAULT_STATE.madosho.map((def) => {
                const saved = parsed.madosho!.find((e) => e.id === def.id);
                return saved ? { ...def, ...saved, sottotitolo: saved.sottotitolo || def.sottotitolo } : def;
              })
            : DEFAULT_STATE.madosho,
          ordine: Array.isArray(parsed.ordine) ? parsed.ordine : DEFAULT_STATE.ordine,
          premio: Array.isArray(parsed.premio) ? parsed.premio : DEFAULT_STATE.premio,
        });
      }
    } catch {
      // ignora
    }

    fetch(`${API_BASE}/statuti`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((rows: DbRow[] | null) => {
        if (!Array.isArray(rows)) return;
        setState((prev) => mergeDbRows(prev, rows));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignora
    }
  }, [state, loaded]);

  const updateAndSave = useCallback(
    async (
      kind: StatutiKind,
      id: string,
      patch: {
        name?: string;
        statute?: string;
        atto?: string;
        sottotitolo?: string;
        descrizione_meccanica?: string;
      },
    ) => {
      setState((prev) => ({
        ...prev,
        [kind]: prev[kind].map((e) => (e.id === id ? { ...e, ...patch } : e)),
      }));
      try {
        await fetch(`${API_BASE}/statuti/${kind}/${id}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            statute: patch.statute,
            atto: patch.atto,
            sottotitolo: patch.sottotitolo,
            descrizione_meccanica: patch.descrizione_meccanica,
          }),
        });
      } catch {
        // ignora — cache locale aggiornata
      }
    },
    [],
  );

  return useMemo(
    () => ({ state, setState, updateAndSave, loaded }),
    [state, updateAndSave, loaded],
  );
}

/** @deprecated use useStatuti */
export const useSviluppoTaxonomy = useStatuti;
export type TaxonomyKind = StatutiKind;
export type TaxonomyEntry = StatutiEntry;
export type SviluppoTaxonomyState = StatutiState;
