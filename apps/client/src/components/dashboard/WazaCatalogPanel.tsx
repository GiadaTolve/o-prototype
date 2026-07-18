"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import {
  WAZA_CATALOG_FAMILIES,
  WAZA_CATALOG_FAMILY_LABELS,
  countCatalogByFamily,
  resolveWazaCatalogFamily,
  type WazaCatalogFamily,
} from "@domain/progression/waza-catalog-family";
import type { SkiruSheet } from "@domain/skiru";
import { useDoMechanicsSnapshot } from "@/hooks/useDoMechanicsSnapshot";
import { WazaDoBrowser } from "./WazaDoBrowser";
import { WazaMadoshoBrowser } from "./WazaMadoshoBrowser";
import { WazaFamilyBrowser } from "./WazaFamilyBrowser";
import type { CatalogWaza, StyleHexState } from "./waza-catalog-types";

export function WazaCatalogPanel({
  expSpendable,
  charKeys = 0,
  skiruSheet,
  charMadoshoId,
  onCharUpdate,
}: {
  expSpendable: number;
  charKeys?: number;
  skiruSheet?: SkiruSheet | Record<string, number> | null;
  charMadoshoId?: string | null;
  onCharUpdate?: () => void;
}) {
  const [family, setFamily] = useState<WazaCatalogFamily>("do");
  const [catalog, setCatalog] = useState<CatalogWaza[]>([]);
  const [hex, setHex] = useState<StyleHexState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [csPreview, setCsPreview] = useState(0);
  const mountedRef = useRef(false);

  const { extras: resolveExtras } = useDoMechanicsSnapshot(csPreview);

  const load = useCallback(async () => {
    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }
    try {
      const [hexData, avail] = await Promise.all([
        api.get("/characters/me/style-hexagon") as Promise<StyleHexState>,
        api.get("/characters/me/skills/available") as Promise<CatalogWaza[]>,
      ]);
      if (!mountedRef.current) return;
      setHex(hexData);
      setCatalog(Array.isArray(avail) ? avail.filter((s) => s.type === "WAZA") : []);
    } catch (e: unknown) {
      if (!mountedRef.current) return;
      setError(e instanceof Error ? e.message : "Errore caricamento catalogo");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void load();
    return () => {
      mountedRef.current = false;
    };
  }, [load, charKeys, expSpendable]);

  const counts = useMemo(
    () => countCatalogByFamily(catalog, (w) => resolveWazaCatalogFamily(w)),
    [catalog],
  );

  const tabClass = (id: WazaCatalogFamily) =>
    `shrink-0 px-3 py-2 text-[10px] uppercase tracking-[0.12em] font-display border-b-2 transition-colors whitespace-nowrap ${
      family === id
        ? "border-[var(--accent-gold)] text-[var(--accent-gold)] bg-[var(--accent-gold)]/5"
        : "border-transparent text-gray-500 hover:text-[var(--accent-violet-light)]"
    }`;

  return (
    <div className="flex flex-col h-full min-h-0 gap-0">
      <nav
        className="shrink-0 flex border-b border-[var(--border-color)] bg-black/30 rounded-t-lg overflow-x-auto"
        aria-label="Famiglie waza"
      >
        {WAZA_CATALOG_FAMILIES.map((id) => (
          <button key={id} type="button" className={tabClass(id)} onClick={() => setFamily(id)}>
            {WAZA_CATALOG_FAMILY_LABELS[id]}
            <span className="ml-1.5 text-[8px] tabular-nums opacity-60">({counts[id]})</span>
          </button>
        ))}
      </nav>

      {error && (
        <p className="text-[11px] text-[var(--accent-violet-light)] border border-[var(--border-color)] rounded px-3 py-2 bg-black/30">
          {error}
        </p>
      )}

      <div className="flex-1 min-h-0 overflow-hidden">
        {loading && catalog.length === 0 ? (
          <p className="text-sm text-gray-500 p-8 text-center animate-pulse">Caricamento catalogo…</p>
        ) : family === "do" ? (
          <WazaDoBrowser
            expSpendable={expSpendable}
            charKeys={charKeys}
            skiruSheet={skiruSheet}
            resolveExtras={resolveExtras}
            onCharUpdate={onCharUpdate}
            fullHeight
            compactHeader
            catalogSource={catalog}
            hexSource={hex}
            loadingSource={loading}
            errorSource={error}
            onReload={load}
            csPreview={csPreview}
            setCsPreview={setCsPreview}
          />
        ) : family === "madosho" ? (
          <WazaMadoshoBrowser
            catalog={catalog}
            charMadoshoId={charMadoshoId}
            skiruSheet={skiruSheet}
            onCharUpdate={onCharUpdate}
            onReload={load}
            fullHeight
            csPreview={csPreview}
            resolveExtras={resolveExtras}
          />
        ) : (
          <WazaFamilyBrowser
            family={family}
            catalog={catalog}
            skiruSheet={skiruSheet}
            onCharUpdate={onCharUpdate}
            onReload={load}
            fullHeight
            csPreview={csPreview}
            resolveExtras={resolveExtras}
          />
        )}
      </div>
    </div>
  );
}
