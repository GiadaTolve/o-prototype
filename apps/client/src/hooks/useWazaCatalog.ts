"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import {
  buildWazaTagIndex,
  type WazaTagCatalogEntry,
} from "@domain/combat/waza-tag-preview";
import { WAZA_TAG_INDEX as STATIC_WAZA_TAG_INDEX } from "@domain/combat/waza-tag-index";

let cachedEntries: WazaTagCatalogEntry[] | null = null;
let cachedIndex: ReadonlyMap<string, WazaTagCatalogEntry> | null = null;
let inflight: Promise<void> | null = null;

async function fetchWazaCatalog(): Promise<void> {
  const data = (await api.get("/waza/catalog")) as { entries?: WazaTagCatalogEntry[] };
  const entries = Array.isArray(data.entries) ? data.entries : [];
  cachedEntries = entries;
  cachedIndex = buildWazaTagIndex(entries);
}

export function useWazaCatalog() {
  const [index, setIndex] = useState<ReadonlyMap<string, WazaTagCatalogEntry>>(
    cachedIndex ?? STATIC_WAZA_TAG_INDEX,
  );
  const [entries, setEntries] = useState<readonly WazaTagCatalogEntry[]>(
    cachedEntries ?? [],
  );
  const [loading, setLoading] = useState(!cachedIndex);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!inflight) {
        inflight = fetchWazaCatalog().finally(() => {
          inflight = null;
        });
      }
      await inflight;
      if (cachedIndex) setIndex(cachedIndex);
      if (cachedEntries) setEntries(cachedEntries);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore catalogo waza");
      setIndex(STATIC_WAZA_TAG_INDEX);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return useMemo(
    () => ({ index, entries, loading, error, refresh }),
    [index, entries, loading, error, refresh],
  );
}

/** Invalida cache client dopo edit admin. */
export function invalidateWazaCatalogCache() {
  cachedEntries = null;
  cachedIndex = null;
  inflight = null;
}
