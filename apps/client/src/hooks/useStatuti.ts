"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MADOSHO_CATALOG } from "@domain/progression/madosho";
import { ORDER_REQUEST_VALUES } from "@domain/progression/player-requests";
import { STYLE_HEX_ORDER, STYLE_LABELS } from "@domain/progression/style-hexagon";
import { getAccessToken } from "@/lib/auth-session";

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
/** Solo cache di emergenza se il server non risponde — non è più la fonte di verità. */
const STORAGE_KEY = "oyasumi.sviluppo.statuti.v1";
const LEGACY_STORAGE_KEY = "oyasumi.sviluppo.taxonomy.v2";

const DEFAULT_STATE: StatutiState = {
  do: STYLE_HEX_ORDER.map((styleId) => ({
    id: styleId,
    name: STYLE_LABELS[styleId],
    // Vuoto finché non arriva il DB — non riusare i testi hardcoded del package
    // (altrimenti desktop sembra «aggiornato» con contenuti vecchi di codice).
    statute: "",
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

function readLocalFallback(): StatutiState | null {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StatutiState>;
    // Non preferire i default hardcoded: la copia locale deve riflettere ciò che era sul server.
    const mergedDo = Array.isArray(parsed.do)
      ? DEFAULT_STATE.do.map((def) => {
          const saved = (parsed.do as typeof DEFAULT_STATE.do).find((e) => e.id === def.id);
          return saved ? { ...def, ...saved } : def;
        })
      : DEFAULT_STATE.do;
    return {
      do: mergedDo,
      madosho: Array.isArray(parsed.madosho)
        ? DEFAULT_STATE.madosho.map((def) => {
            const saved = parsed.madosho!.find((e) => e.id === def.id);
            return saved ? { ...def, ...saved } : def;
          })
        : DEFAULT_STATE.madosho,
      ordine: Array.isArray(parsed.ordine) ? parsed.ordine : DEFAULT_STATE.ordine,
      premio: Array.isArray(parsed.premio) ? parsed.premio : DEFAULT_STATE.premio,
    };
  } catch {
    return null;
  }
}

/** Applica sempre i campi DB (anche stringhe vuote): il server è autorevole. */
export function mergeDbRows(base: StatutiState, rows: DbRow[]): StatutiState {
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
      result[kind][idx] = {
        ...result[kind][idx],
        statute: row.statute ?? "",
        atto: row.atto ?? "",
        sottotitolo: row.sottotitolo ?? "",
        descrizione_meccanica: row.descrizione_meccanica ?? "",
      };
    } else if (kind === "premio" && row.entryId) {
      result.premio.push({
        id: row.entryId,
        name: row.entryId,
        statute: row.statute ?? "",
        atto: row.atto ?? "",
        descrizione_meccanica: row.descrizione_meccanica ?? "",
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadFromServer = useCallback(async (opts?: { silent?: boolean }) => {
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_BASE}/statuti`, {
        credentials: "include",
        cache: "no-store",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) {
        throw new Error(
          res.status === 401 || res.status === 403
            ? "Sessione scaduta o senza permesso."
            : `Caricamento statuti fallito (${res.status}).`,
        );
      }
      const rows = (await res.json()) as DbRow[];
      const merged = mergeDbRows(DEFAULT_STATE, Array.isArray(rows) ? rows : []);
      setState(merged);
      setLoadError(null);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // ignora
      }
      return true;
    } catch (err) {
      if (!opts?.silent) {
        const fallback = readLocalFallback();
        if (fallback) setState(fallback);
        setLoadError(
          err instanceof Error
            ? `${err.message} Mostro una copia locale di emergenza (può non essere aggiornata su altri dispositivi).`
            : "Impossibile caricare dal server.",
        );
      }
      return false;
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await loadFromServer();
    })();
    return () => {
      cancelled = true;
    };
  }, [loadFromServer]);

  // Dopo modifiche da un altro device (es. telefono), il desktop deve riprendere dal server.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void loadFromServer({ silent: true });
      }
    };
    const onFocus = () => {
      void loadFromServer({ silent: true });
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadFromServer]);

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
        const token = getAccessToken();
        const res = await fetch(`${API_BASE}/statuti/${kind}/${id}`, {
          method: "PUT",
          credentials: "include",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            statute: patch.statute,
            atto: patch.atto,
            sottotitolo: patch.sottotitolo,
            descrizione_meccanica: patch.descrizione_meccanica,
          }),
        });
        if (!res.ok) {
          let message = `Salvataggio non riuscito (${res.status}).`;
          try {
            const data = (await res.json()) as { error?: string };
            if (data.error) message = data.error;
          } catch {
            // ignora
          }
          throw new Error(message);
        }

        setSaveError(null);
        setState((prev) => {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(prev));
          } catch {
            // ignora
          }
          return prev;
        });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Salvataggio non riuscito: il server non ha confermato la modifica.";
        setSaveError(message);
        throw new Error(message);
      }
    },
    [],
  );

  return useMemo(
    () => ({ state, setState, updateAndSave, loaded, loadError, saveError }),
    [state, updateAndSave, loaded, loadError, saveError],
  );
}

/** @deprecated use useStatuti */
export const useSviluppoTaxonomy = useStatuti;
export type TaxonomyKind = StatutiKind;
export type TaxonomyEntry = StatutiEntry;
export type SviluppoTaxonomyState = StatutiState;
