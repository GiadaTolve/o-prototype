"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { sortWazaByKindAndName } from "@domain/progression";
import type { SkiruSheet } from "@domain/skiru";
import { api } from "@/lib/api";
import { useDoMechanicsSnapshot } from "@/hooks/useDoMechanicsSnapshot";
import { useStatuti, type StatutiEntry } from "@/hooks/useStatuti";
import { WazaCatalogRow } from "./WazaCatalogRow";
import type { CatalogWaza } from "./waza-catalog-types";
import { OrdineCompendioModal } from "./OrdineCompendioModal";
import {
  ORDINE_FACTIONS,
  compendioBody,
  compendioPreview,
  filterOrdineWazaForFaction,
  findOrdineFactionEntry,
  listOrdineCompendi,
  normalizeOrdineFactionId,
  type OrdineFactionId,
} from "./ordine-utils";
import type { CharacterSummary } from "./types";

type OrdineTab = "statuto" | "compendi" | "waza";

type Props = {
  char?: CharacterSummary;
  onCharUpdate?: () => void;
};

export function OrdineContent({ char, onCharUpdate }: Props) {
  const { state: statuti } = useStatuti();
  const [factionId, setFactionId] = useState<OrdineFactionId>(() => normalizeOrdineFactionId(char?.order) ?? "chisen-tai");
  const [tab, setTab] = useState<OrdineTab>("statuto");
  const [catalog, setCatalog] = useState<CatalogWaza[]>([]);
  const [loadingWaza, setLoadingWaza] = useState(true);
  const [wazaError, setWazaError] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [compendioOpen, setCompendioOpen] = useState<StatutiEntry | null>(null);
  const mountedRef = useRef(false);

  const { extras: resolveExtras } = useDoMechanicsSnapshot(0);

  const faction = useMemo(
    () => ORDINE_FACTIONS.find((f) => f.id === factionId) ?? ORDINE_FACTIONS[0],
    [factionId],
  );

  const factionEntry = useMemo(() => findOrdineFactionEntry(statuti, factionId), [statuti, factionId]);
  const compendi = useMemo(() => listOrdineCompendi(statuti, factionId), [statuti, factionId]);

  const wazaItems = useMemo(() => {
    const filtered = filterOrdineWazaForFaction(catalog, factionId);
    return sortWazaByKindAndName(filtered, {
      isPassive: (w) => !!w.isPassive,
      getName: (w) => w.name,
    });
  }, [catalog, factionId]);

  const skiruSheet = useMemo(() => {
    const sheet = char?.skiruSheetEffective ?? char?.skiruSheet;
    return sheet && Object.keys(sheet).length > 0 ? (sheet as SkiruSheet) : null;
  }, [char?.skiruSheet, char?.skiruSheetEffective]);

  const loadWaza = useCallback(async () => {
    setLoadingWaza(true);
    setWazaError(null);
    try {
      const avail = (await api.get("/characters/me/skills/available")) as CatalogWaza[];
      if (!mountedRef.current) return;
      setCatalog(Array.isArray(avail) ? avail.filter((s) => s.type === "WAZA") : []);
    } catch (e: unknown) {
      if (!mountedRef.current) return;
      setWazaError(e instanceof Error ? e.message : "Errore caricamento waza");
    } finally {
      if (mountedRef.current) setLoadingWaza(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void loadWaza();
    return () => {
      mountedRef.current = false;
    };
  }, [loadWaza]);

  useEffect(() => {
    const normalized = normalizeOrdineFactionId(char?.order);
    if (normalized) setFactionId(normalized);
  }, [char?.order]);

  const handlePurchase = useCallback(
    async (skillId: string) => {
      setPurchasingId(skillId);
      try {
        await api.post("/characters/me/skills", { skillId });
        await loadWaza();
        onCharUpdate?.();
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : "Errore acquisto.");
      } finally {
        setPurchasingId(null);
      }
    },
    [loadWaza, onCharUpdate],
  );

  const tabClass = (id: OrdineTab) =>
    `min-h-[44px] px-3 py-2 text-[10px] uppercase tracking-[0.12em] font-display border-b-2 transition-colors whitespace-nowrap ${
      tab === id
        ? "border-[var(--accent-violet)] text-[var(--accent-violet-light)] bg-[var(--accent-violet)]/10"
        : "border-transparent text-[var(--foreground)]/45 hover:text-[var(--accent-violet-light)]"
    }`;

  const ownedWaza = wazaItems.filter((w) => w.owned).length;

  return (
    <div className="flex flex-col h-full min-h-0 animate__animated animate__fadeIn motion-reduce:animate-none">
      {/* Hero banner */}
      <div className="relative shrink-0 overflow-hidden rounded-lg border border-[var(--border-color)] mx-3 mt-3 sm:mx-4">
        <div className="relative min-h-[148px] sm:min-h-[168px]">
          <Image
            src={faction.portrait}
            alt={faction.label}
            fill
            className="object-cover object-top opacity-55"
            sizes="(max-width: 768px) 100vw, 960px"
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, color-mix(in srgb, var(--background) 92%, transparent) 38%, transparent)",
            }}
          />
          <div className="relative z-10 flex flex-col justify-end min-h-[148px] sm:min-h-[168px] p-4 gap-3">
            <div
              className="inline-flex self-start rounded-md border border-[var(--border-color)] overflow-hidden"
              role="tablist"
              aria-label="Fazione"
            >
              {ORDINE_FACTIONS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={factionId === f.id}
                  onClick={() => setFactionId(f.id)}
                  className={`min-h-[44px] px-3 sm:px-4 text-[10px] uppercase tracking-[0.1em] font-display border-r border-[var(--border-color)] last:border-r-0 transition-colors ${
                    factionId === f.id
                      ? "bg-[var(--accent-gold)]/12 text-[var(--accent-gold)]"
                      : "bg-black/35 text-[var(--foreground)]/55 hover:text-[var(--accent-violet-light)]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <h3 className="font-display text-xl sm:text-2xl text-[var(--accent-gold)] tracking-wide leading-tight">
              {faction.label}
            </h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <nav
        className="shrink-0 flex border-b border-[var(--border-color)] bg-black/30 mx-3 sm:mx-4 mt-3 overflow-x-auto"
        aria-label="Sezioni ordine"
      >
        <button type="button" className={tabClass("statuto")} onClick={() => setTab("statuto")}>
          Statuto
        </button>
        <button type="button" className={tabClass("compendi")} onClick={() => setTab("compendi")}>
          Compendi
          {compendi.length > 0 && (
            <span className="ml-1.5 text-[8px] tabular-nums opacity-60">({compendi.length})</span>
          )}
        </button>
        <button type="button" className={tabClass("waza")} onClick={() => setTab("waza")}>
          Waza d&apos;ordine
          {wazaItems.length > 0 && (
            <span className="ml-1.5 text-[8px] tabular-nums opacity-60">({wazaItems.length})</span>
          )}
        </button>
      </nav>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-4">
        {tab === "statuto" && (
          <section className="space-y-4 max-w-3xl">
            {factionEntry?.statute?.trim() ? (
              <div className="font-accent italic border-l-2 border-[var(--accent-violet)]/50 pl-3 text-sm sm:text-base leading-relaxed whitespace-pre-line text-[color-mix(in_srgb,var(--accent-gold)_72%,var(--accent-violet-light))]">
                {factionEntry.statute.trim()}
              </div>
            ) : (
              <p className="text-sm text-[var(--foreground)]/40 italic">
                Statuto non ancora pubblicato per {faction.label}.
              </p>
            )}
            {factionEntry?.descrizione_meccanica?.trim() ? (
              <div>
                <p className="text-[9px] font-display uppercase tracking-[0.16em] text-[var(--accent-violet)] mb-2">
                  Regole d&apos;ordine
                </p>
                <div className="rounded border border-[var(--border-color)]/50 bg-black/40 px-3 py-2.5">
                  <p className="text-xs text-[var(--foreground)]/60 leading-relaxed whitespace-pre-line">
                    {factionEntry.descrizione_meccanica.trim()}
                  </p>
                </div>
              </div>
            ) : null}
          </section>
        )}

        {tab === "compendi" && (
          <section className="max-w-3xl">
            {compendi.length === 0 ? (
              <p className="text-sm text-[var(--foreground)]/40 italic leading-relaxed">
                Nessun compendio pubblicato per {faction.label}. Lo staff può aggiungerli in Gestione → Statuti
                (voci <code className="text-[var(--accent-violet-light)]">ordine</code> con id{" "}
                <code className="text-[var(--accent-violet-light)]">{factionId}-nome</code>).
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {compendi.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setCompendioOpen(entry)}
                    className="min-h-[44px] text-left rounded-lg border border-[var(--border-color)] bg-black/25 px-3 py-3 hover:border-[var(--accent-violet)]/50 hover:bg-[var(--accent-violet)]/5 transition-colors"
                  >
                    <span className="block font-display text-sm text-[var(--accent-violet-light)] mb-1">
                      {entry.name}
                    </span>
                    {compendioPreview(entry) ? (
                      <span className="block text-xs text-[var(--foreground)]/50 leading-relaxed">
                        {compendioPreview(entry)}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "waza" && (
          <section className="max-w-3xl space-y-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--foreground)]/45 font-display">
              Arsenale · {wazaItems.length}
              {wazaItems.length > 0 && (
                <span className="normal-case tracking-normal ml-2">
                  · <span className="text-[var(--accent-gold)]">{ownedWaza}</span> apprese
                </span>
              )}
            </p>

            {wazaError && (
              <p className="text-[11px] text-[var(--accent-violet-light)] border border-[var(--border-color)] rounded px-3 py-2 bg-black/30">
                {wazaError}
              </p>
            )}

            {loadingWaza && wazaItems.length === 0 ? (
              <p className="text-sm text-[var(--foreground)]/40 py-8 text-center animate-pulse">Caricamento…</p>
            ) : wazaItems.length === 0 ? (
              <p className="text-sm text-[var(--foreground)]/40 italic leading-relaxed py-6">
                Nessuna waza d&apos;ordine per {faction.label}. Le waza si creano dal pannello Sviluppo (genitore{" "}
                <code className="text-[var(--accent-violet-light)]">{factionId}</code>) e compaiono qui per
                l&apos;acquisto.
              </p>
            ) : (
              <div className="space-y-2.5">
                {wazaItems.map((w, index) => (
                  <WazaCatalogRow
                    key={w.id}
                    waza={w}
                    branchUnlocked={w.branchUnlocked !== false}
                    isKeystone={false}
                    index={index}
                    onPurchase={handlePurchase}
                    purchasing={purchasingId === w.id}
                    skiruSheet={skiruSheet}
                    resolveExtras={resolveExtras}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      <OrdineCompendioModal
        open={!!compendioOpen}
        onClose={() => setCompendioOpen(null)}
        title={compendioOpen?.name ?? ""}
        factionLabel={faction.label}
        content={compendioOpen ? compendioBody(compendioOpen) : ""}
      />
    </div>
  );
}
