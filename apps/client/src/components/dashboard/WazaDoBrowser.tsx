"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import { api } from "@/lib/api";
import {
  STYLE_HEX_ORDER,
  STYLE_LABELS,
  getStyleKeystone,
  layoutCatalogWazaList,
  type StyleId,
} from "@domain/progression";
import { WazaCatalogRow } from "./WazaCatalogRow";
import type { CatalogWaza, StyleHexState } from "./waza-catalog-types";
import { filterCatalogByFamily } from "./waza-catalog-types";
import type { SkiruSheet } from "@domain/skiru";
import { useDoMechanicsSnapshot, type WazaResolveExtras } from "@/hooks/useDoMechanicsSnapshot";
import { findStatutiEntry, useStatuti } from "@/hooks/useStatuti";
import { WazaEditorialHeader } from "./WazaEditorialHeader";

const STYLE_SHORT: Record<StyleId, string> = {
  toka: "Tōka",
  genzai: "Genzai",
  ito: "Itō",
  naikan: "Naikan",
  hensei: "Hensei",
  hado: "Hadō",
};

function WazaDoSkeleton() {
  return (
    <div className="flex flex-col md:flex-row min-h-[440px] max-h-[min(70vh,640px)]" aria-hidden>
      <div className="shrink-0 md:w-40 border-b md:border-b-0 md:border-r border-[var(--border-color)]/50 bg-black/40 p-2 space-y-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 rounded waza-do-skeleton opacity-70" />
        ))}
      </div>
      <div className="flex-1 flex flex-col min-w-0 p-4 gap-4">
        <div className="space-y-2">
          <div className="h-3 w-32 rounded waza-do-skeleton" />
          <div className="h-20 rounded waza-do-skeleton" />
        </div>
        <div className="space-y-2 flex-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-md waza-do-skeleton opacity-80" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function WazaDoBrowser({
  expSpendable,
  charKeys = 0,
  skiruSheet,
  resolveExtras: resolveExtrasProp,
  onCharUpdate,
  fullHeight = false,
  catalogSource,
  hexSource,
  loadingSource,
  errorSource,
  onReload,
  csPreview: csPreviewProp,
  setCsPreview: setCsPreviewProp,
  compactHeader = false,
}: {
  expSpendable: number;
  charKeys?: number;
  skiruSheet?: SkiruSheet | Record<string, number> | null;
  resolveExtras?: WazaResolveExtras;
  onCharUpdate?: () => void;
  fullHeight?: boolean;
  catalogSource?: CatalogWaza[];
  hexSource?: StyleHexState | null;
  loadingSource?: boolean;
  errorSource?: string | null;
  onReload?: () => Promise<void>;
  csPreview?: number;
  setCsPreview?: (n: number) => void;
  compactHeader?: boolean;
}) {
  const embedded = catalogSource != null;
  const [hex, setHex] = useState<StyleHexState | null>(hexSource ?? null);
  const [catalog, setCatalog] = useState<CatalogWaza[]>(
    embedded ? filterCatalogByFamily(catalogSource, "do") : [],
  );
  const [selected, setSelected] = useState<StyleId>("toka");
  const [loading, setLoading] = useState(!embedded);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(errorSource ?? null);
  const [selectedTouched, setSelectedTouched] = useState(false);
  const [csPreviewLocal, setCsPreviewLocal] = useState(0);
  const csPreview = csPreviewProp ?? csPreviewLocal;
  const setCsPreview = setCsPreviewProp ?? setCsPreviewLocal;
  const listRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (embedded && onReload) {
      await onReload();
      return;
    }
    if (embedded) return;
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
      setCatalog(
        Array.isArray(avail)
          ? filterCatalogByFamily(
              avail.filter((s) => s.type === "WAZA"),
              "do",
            )
          : [],
      );
    } catch (e: unknown) {
      if (!mountedRef.current) return;
      setError(e instanceof Error ? e.message : "Errore caricamento Waza");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [embedded, onReload]);

  useEffect(() => {
    if (embedded) {
      setCatalog(filterCatalogByFamily(catalogSource ?? [], "do"));
      setHex(hexSource ?? null);
      setLoading(loadingSource ?? false);
      setError(errorSource ?? null);
      return;
    }
    void load();
  }, [embedded, catalogSource, hexSource, loadingSource, errorSource, load, charKeys, expSpendable]);

  useEffect(() => {
    if (selectedTouched) return;
    const primary = hex?.primaryStyleId;
    if (primary && STYLE_HEX_ORDER.includes(primary as StyleId)) {
      setSelected(primary as StyleId);
    }
  }, [hex?.primaryStyleId, selectedTouched]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [selected]);

  const styleRow = hex?.styles.find((s) => s.id === selected);
  const branchUnlocked = styleRow?.unlocked ?? false;
  const keystoneDef = getStyleKeystone(selected);

  const normalizedSkiruSheet = useMemo(
    () => (skiruSheet && Object.keys(skiruSheet).length > 0 ? (skiruSheet as SkiruSheet) : null),
    [skiruSheet],
  );

  const { extras: resolveExtrasFromHook } = useDoMechanicsSnapshot(csPreview, !resolveExtrasProp);
  const resolveExtras = resolveExtrasProp ?? resolveExtrasFromHook;

  const { state: statuti } = useStatuti();
  const doEntry = findStatutiEntry(statuti, "do", selected);

  const { keystoneWaza, catalogWaza, wazaForStyle } = useMemo(() => {
    const items = catalog.filter((w) => w.styleId === selected);
    const { keystone, list } = layoutCatalogWazaList(items, {
      isPassive: (w) => !!w.isPassive,
      getName: (w) => w.name,
      getPoolId: (w) => w.poolId,
      keystonePoolId: keystoneDef?.poolId ?? null,
    });
    return {
      keystoneWaza: keystone,
      catalogWaza: list,
      wazaForStyle: keystone ? [keystone, ...list] : list,
    };
  }, [catalog, selected, keystoneDef?.poolId]);

  const keystoneOwned = useMemo(() => {
    if (!keystoneDef) return true;
    const sample = catalog.find((w) => w.styleId === selected);
    return sample?.keystoneOwned ?? true;
  }, [catalog, selected, keystoneDef]);

  const wazaStats = useMemo(() => {
    const owned = wazaForStyle.filter((w) => w.owned).length;
    const purchasable = wazaForStyle.filter((w) => w.canPurchase && !w.owned).length;
    return { owned, purchasable, total: wazaForStyle.length };
  }, [wazaForStyle]);

  const handlePurchase = useCallback(
    async (skillId: string) => {
      setPurchasingId(skillId);
      try {
        await api.post("/characters/me/skills", { skillId });
        await load();
        onCharUpdate?.();
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : "Errore acquisto.");
      } finally {
        if (mountedRef.current) setPurchasingId(null);
      }
    },
    [load, onCharUpdate],
  );

  const selectStyle = useCallback((styleId: StyleId) => {
    setSelectedTouched(true);
    setSelected(styleId);
  }, []);

  return (
    <section
      className={`waza-do-panel rounded-lg border border-[var(--border-color)] bg-[var(--panel-bg)]/90 overflow-hidden animate__animated animate__fadeIn motion-reduce:animate-none ${
        fullHeight ? "flex flex-col flex-1 min-h-0 h-full" : ""
      }`}
    >
      {!compactHeader && (
      <header className="px-4 py-3.5 border-b border-[var(--border-color)]/70 bg-gradient-to-r from-black/70 via-black/55 to-[var(--accent-violet)]/5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-sm text-[var(--accent-gold)] flex items-center gap-2 tracking-wide">
            <FontAwesomeIcon icon={icons.waza} className="w-3.5 h-3.5 text-[var(--accent-violet-light)]" />
            Catalogo del Dō
          </h3>
          <p className="text-sm text-[var(--accent-violet-light)]/80 mt-1 max-w-xl leading-relaxed">
            Statuto dal manuale · waza consultabili sempre · acquisto solo con ramo sbloccato in Esagono
          </p>
        </div>
        <div className="flex items-center gap-4 text-right shrink-0">
          <label className="text-right">
            <p className="text-[8px] uppercase tracking-[0.2em] text-[var(--foreground)]/40 font-display">
              CS anteprima
            </p>
            <input
              type="number"
              min={0}
              max={30}
              value={csPreview}
              onChange={(e) => setCsPreview(Math.max(0, Number(e.target.value) || 0))}
              className="mt-0.5 w-14 rounded border border-[var(--border-color)] bg-black/40 px-1.5 py-0.5 text-sm font-display text-[var(--accent-gold)] tabular-nums text-right"
              title="CS per Pressione Hadō e valori «Valori per te»"
            />
          </label>
          <div className="w-px h-8 bg-[var(--border-color)]/80" aria-hidden />
          <div>
            <p className="text-[8px] uppercase tracking-[0.2em] text-[var(--foreground)]/40 font-display">
              EXP
            </p>
            <p className="font-display text-lg text-[var(--accent-gold)] tabular-nums leading-none">
              {expSpendable}
            </p>
          </div>
          <div className="w-px h-8 bg-[var(--border-color)]/80" aria-hidden />
          <div>
            <p className="text-[8px] uppercase tracking-[0.2em] text-[var(--foreground)]/40 font-display">
              Keys
            </p>
            <p className="font-display text-lg text-[var(--accent-violet-light)] tabular-nums leading-none">
              {charKeys}
            </p>
          </div>
        </div>
      </header>
      )}

      {error && (
        <p className="mx-4 mt-3 text-[11px] text-[var(--accent-red)]/90 border border-[var(--accent-red)]/35 rounded-md px-3 py-2 bg-black/30">
          {error}
        </p>
      )}

      <div
        className={`flex flex-col md:flex-row ${
          fullHeight ? "flex-1 min-h-[320px]" : "min-h-[480px] max-h-[min(78vh,780px)]"
        }`}
      >
        {loading && catalog.length === 0 ? (
          <WazaDoSkeleton />
        ) : (
          <>
            <nav
              className="shrink-0 md:w-40 border-b md:border-b-0 md:border-r border-[var(--border-color)]/70 bg-black/50 flex md:flex-col gap-0 overflow-x-auto md:overflow-y-auto"
              aria-label="Vie del Dō"
            >
              {STYLE_HEX_ORDER.map((styleId) => {
                const row = hex?.styles.find((s) => s.id === styleId);
                const isSelected = selected === styleId;
                const unlocked = row?.unlocked ?? false;
                const owned = row?.ownedWaza ?? 0;

                return (
                  <button
                    key={styleId}
                    type="button"
                    onClick={() => selectStyle(styleId)}
                    className={`waza-do-nav-btn shrink-0 md:shrink w-full px-3 py-3 md:py-3.5 text-left border-b border-[var(--border-color)]/25 ${
                      isSelected ? "waza-do-nav-btn--active" : "hover:bg-[var(--accent-violet)]/6"
                    } ${!unlocked ? "opacity-45" : ""}`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span
                        className={`waza-do-nav-label block text-[10px] font-display uppercase tracking-[0.12em] leading-tight transition-colors ${
                          isSelected
                            ? "text-[var(--accent-gold)]"
                            : "text-[var(--accent-violet-light)]"
                        }`}
                      >
                        {STYLE_SHORT[styleId]}
                      </span>
                      {!unlocked && (
                        <FontAwesomeIcon
                          icon={icons.lock}
                          className="w-2.5 h-2.5 text-[var(--foreground)]/35 shrink-0"
                        />
                      )}
                      {row?.isPrimary && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-[var(--accent-gold)] shadow-[0_0_6px_var(--glow-gold)] shrink-0"
                          title="Stile principale"
                        />
                      )}
                    </span>
                    <span className="block text-[8px] text-[var(--foreground)]/40 tabular-nums mt-1.5 font-display">
                      {owned} waza
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="flex-1 flex flex-col min-w-0 min-h-0">
              <WazaEditorialHeader
                title={STYLE_LABELS[selected]}
                titleUppercase
                subtitle={doEntry?.sottotitolo}
                statute={doEntry?.statute ?? ""}
                mechanics={doEntry?.descrizione_meccanica}
                badges={
                  <>
                    {!branchUnlocked && (
                      <span className="text-[8px] font-display uppercase px-2 py-0.5 rounded border border-[var(--border-color)] text-[var(--foreground)]/45 flex items-center gap-1">
                        <FontAwesomeIcon icon={icons.lock} className="w-2 h-2" />
                        Chiuso
                      </span>
                    )}
                    {branchUnlocked && (
                      <span className="text-[8px] font-display uppercase px-2 py-0.5 rounded border border-[var(--accent-violet)]/35 text-[var(--accent-violet-light)] flex items-center gap-1">
                        <FontAwesomeIcon icon={icons.unlock} className="w-2 h-2" />
                        Sbloccato
                      </span>
                    )}
                    {keystoneDef && !keystoneOwned && branchUnlocked && (
                      <span className="text-[8px] font-display uppercase px-2 py-0.5 rounded border border-[var(--accent-gold)]/40 text-[var(--accent-gold)]">
                        Richiede {keystoneDef.label}
                      </span>
                    )}
                    {styleRow?.isPrimary && (
                      <span className="text-[8px] font-display uppercase px-2 py-0.5 rounded border border-[var(--accent-gold)]/40 text-[var(--accent-gold)]">
                        Principale
                      </span>
                    )}
                  </>
                }
                footer={
                  !branchUnlocked ? (
                    <p className="text-xs text-[var(--accent-violet-light)]/75 italic">
                      Puoi leggere le waza di questa Via; per acquistarle sblocca il ramo dall&apos;Esagono con Key.
                    </p>
                  ) : undefined
                }
              />

              <div className="shrink-0 px-4 py-2 border-b border-[var(--border-color)]/40 bg-black/30 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-display uppercase tracking-[0.14em] text-[var(--foreground)]/60">
                  Tecniche · {wazaStats.total}
                </p>
                <p className="text-[9px] tabular-nums text-[var(--foreground)]/40">
                  <span className="text-[var(--accent-gold)]">{wazaStats.owned}</span> appresa
                  {wazaStats.purchasable > 0 && (
                    <>
                      <span className="mx-1.5 opacity-30">·</span>
                      <span className="text-[var(--accent-violet-light)]">{wazaStats.purchasable}</span>{" "}
                      acquistabili
                    </>
                  )}
                </p>
              </div>

              <div
                ref={listRef}
                key={selected}
                className="flex-1 overflow-y-auto p-4 space-y-2.5 scroll-smooth"
              >
                {!loading && catalog.length === 0 ? (
                  <p className="text-sm text-[var(--accent-violet-light)]/80 text-center py-10 max-w-md mx-auto leading-relaxed">
                    Il catalogo Dō non è ancora popolato. Ricarica la pagina tra poco; se resta vuoto, segnala
                    allo staff.
                  </p>
                ) : wazaForStyle.length === 0 ? (
                  <p className="text-sm text-[var(--foreground)]/45 italic text-center py-10">
                    Nessuna waza in catalogo per questa Via.
                  </p>
                ) : (
                  <>
                    {keystoneWaza && (
                      <div className="mb-4 pb-4 border-b border-[var(--accent-gold)]/20 space-y-2">
                        <p className="text-xs font-display uppercase tracking-[0.16em] text-[var(--accent-gold)] px-0.5">
                          Keystone · Dō passiva
                        </p>
                        <WazaCatalogRow
                          waza={keystoneWaza}
                          branchUnlocked={branchUnlocked}
                          isKeystone
                          keystoneLabel={keystoneDef?.label}
                          index={0}
                          onPurchase={handlePurchase}
                          purchasing={purchasingId === keystoneWaza.id}
                          skiruSheet={normalizedSkiruSheet}
                          resolveExtras={resolveExtras}
                        />
                      </div>
                    )}
                    {catalogWaza.length > 0 && (
                      <div className="space-y-2.5">
                        {catalogWaza.map((w, index) => (
                          <WazaCatalogRow
                            key={w.id}
                            waza={w}
                            branchUnlocked={branchUnlocked}
                            isKeystone={false}
                            index={index + 1}
                            onPurchase={handlePurchase}
                            purchasing={purchasingId === w.id}
                            skiruSheet={normalizedSkiruSheet}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
