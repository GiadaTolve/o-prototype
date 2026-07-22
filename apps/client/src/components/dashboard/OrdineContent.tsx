"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { sortWazaByKindAndName } from "@domain/progression";
import type { SkiruSheet } from "@domain/skiru";
import { api } from "@/lib/api";
import { icons } from "@/lib/icons";
import { useDoMechanicsSnapshot } from "@/hooks/useDoMechanicsSnapshot";
import { useStatuti, type StatutiEntry } from "@/hooks/useStatuti";
import { WazaCatalogRow } from "./WazaCatalogRow";
import type { CatalogWaza } from "./waza-catalog-types";
import { OrdineCompendioModal } from "./OrdineCompendioModal";
import { OrdineStatutiEditModal, type OrdineStatutiEditMode } from "./OrdineStatutiEditModal";
import {
  ORDINE_FACTIONS,
  canEditOrdineStatuti,
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

function OrdineEditPencil({
  label,
  onClick,
  className = "",
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--foreground)]/35 hover:text-[var(--accent-gold)] transition-colors ${className}`}
      title={label}
      aria-label={label}
    >
      <FontAwesomeIcon icon={icons.pencil} className="w-3 h-3" />
    </button>
  );
}

export function OrdineContent({ char, onCharUpdate }: Props) {
  const { state: statuti, setState, updateAndSave, loadFromServer } = useStatuti();
  const [factionId, setFactionId] = useState<OrdineFactionId>(() => normalizeOrdineFactionId(char?.order) ?? "chisen-tai");
  const [tab, setTab] = useState<OrdineTab>("statuto");
  const [catalog, setCatalog] = useState<CatalogWaza[]>([]);
  const [loadingWaza, setLoadingWaza] = useState(true);
  const [wazaError, setWazaError] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [compendioOpenId, setCompendioOpenId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<OrdineStatutiEditMode | null>(null);
  const mountedRef = useRef(false);

  const canEdit = canEditOrdineStatuti(char);

  const { extras: resolveExtras } = useDoMechanicsSnapshot(0);

  const faction = useMemo(
    () => ORDINE_FACTIONS.find((f) => f.id === factionId) ?? ORDINE_FACTIONS[0],
    [factionId],
  );

  const compendioOpen = useMemo(
    () => (compendioOpenId ? statuti.ordine.find((e) => e.id === compendioOpenId) ?? null : null),
    [compendioOpenId, statuti.ordine],
  );

  const statutiApi = useMemo(
    () => ({ state: statuti, setState, updateAndSave }),
    [statuti, setState, updateAndSave],
  );

  const handleStatutiSaved = useCallback(() => {
    void loadFromServer({ silent: true });
  }, [loadFromServer]);

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

  const heroSubtitle = useMemo(() => {
    const sub = factionEntry?.sottotitolo?.trim();
    if (sub) return sub;
    const statute = factionEntry?.statute?.trim();
    if (!statute) return null;
    const oneLine = statute.replace(/\s+/g, " ");
    return oneLine.length > 96 ? `${oneLine.slice(0, 96)}…` : oneLine;
  }, [factionEntry]);

  const openStatutoEdit = useCallback(() => {
    setEditMode({ type: "statuto", factionId, factionLabel: faction.label });
  }, [faction.label, factionId]);

  const openCompendioEdit = useCallback(
    (entry: StatutiEntry) => {
      setEditMode({ type: "compendio", entryId: entry.id, factionLabel: faction.label });
    },
    [faction.label],
  );

  const openCompendioCreate = useCallback(() => {
    setEditMode({ type: "compendio-new", factionId, factionLabel: faction.label });
  }, [faction.label, factionId]);

  return (
    <div className="flex flex-col h-full min-h-0 animate__animated animate__fadeIn motion-reduce:animate-none">
      {/* Hero banner — asset statico in /public/ordine (aspect ~2.5:1) */}
      <div className="relative shrink-0 overflow-hidden rounded-lg border border-[var(--border-color)] mx-3 mt-3 sm:mx-4">
        <div
          key={faction.banner}
          className="relative w-full min-h-[148px] sm:min-h-[168px] aspect-[41/16] max-h-[220px] bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${faction.banner}')` }}
          role="img"
          aria-label={`Banner ${faction.label}`}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to top, color-mix(in srgb, var(--background) 78%, transparent) 42%, transparent 72%)",
            }}
          />
          <div className="relative z-10 flex flex-col justify-end h-full min-h-[148px] sm:min-h-[168px] p-3 sm:p-4">
            <div className="ordine-faction-switch" role="tablist" aria-label="Fazione">
              {ORDINE_FACTIONS.map((f, index) => {
                const active = factionId === f.id;
                return (
                  <span key={f.id} className="ordine-faction-switch__item">
                    {index > 0 ? <span className="ordine-faction-switch__sep" aria-hidden /> : null}
                    <button
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setFactionId(f.id)}
                      className={`ordine-faction-switch__btn ordine-faction-switch__btn--${f.accent}${
                        active ? " ordine-faction-switch__btn--active" : ""
                      }`}
                    >
                      {f.label}
                    </button>
                  </span>
                );
              })}
            </div>

            <div className="pt-2.5 relative">
              {canEdit ? (
                <OrdineEditPencil
                  label="Modifica sottotitolo e statuto"
                  onClick={openStatutoEdit}
                  className="absolute top-0 right-0 -mt-1 -mr-1"
                />
              ) : null}
              <p className="ordine-hero-kicker">Ordine</p>
              <h2 className="ordine-hero-title mt-1">{faction.label}</h2>
              {heroSubtitle ? (
                <p className="ordine-hero-subtitle mt-1.5">{heroSubtitle}</p>
              ) : null}
              <div className="ordine-hero-rule" aria-hidden />
            </div>
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
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] font-display uppercase tracking-[0.14em] text-[var(--foreground)]/40">
                Statuto
              </p>
              {canEdit ? (
                <OrdineEditPencil
                  label="Modifica statuto"
                  onClick={openStatutoEdit}
                  className="-mt-2 -mr-2"
                />
              ) : null}
            </div>

            {factionEntry?.statute?.trim() ? (
              <div className="font-accent italic border-l-2 border-[var(--accent-violet)]/50 pl-3 text-sm sm:text-base leading-relaxed whitespace-pre-line text-[color-mix(in_srgb,var(--accent-gold)_72%,var(--accent-violet-light))]">
                {factionEntry.statute.trim()}
              </div>
            ) : (
              <p className="text-sm text-[var(--foreground)]/40 italic">
                Statuto non ancora pubblicato per {faction.label}.
                {canEdit ? (
                  <button
                    type="button"
                    onClick={openStatutoEdit}
                    className="ml-2 text-[var(--accent-violet-light)] hover:text-[var(--accent-gold)] underline-offset-2 hover:underline"
                  >
                    Scrivi ora
                  </button>
                ) : null}
              </p>
            )}
            {factionEntry?.descrizione_meccanica?.trim() || canEdit ? (
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-[9px] font-display uppercase tracking-[0.16em] text-[var(--accent-violet)]">
                    Regole d&apos;ordine
                  </p>
                  {canEdit ? (
                    <OrdineEditPencil
                      label="Modifica regole d'ordine"
                      onClick={openStatutoEdit}
                      className="-mr-2"
                    />
                  ) : null}
                </div>
                {factionEntry?.descrizione_meccanica?.trim() ? (
                  <div className="rounded border border-[var(--border-color)]/50 bg-black/40 px-3 py-2.5">
                    <p className="text-xs text-[var(--foreground)]/60 leading-relaxed whitespace-pre-line">
                      {factionEntry.descrizione_meccanica.trim()}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-[var(--foreground)]/35 italic">
                    Nessuna regola pubblicata.
                    {canEdit ? (
                      <button
                        type="button"
                        onClick={openStatutoEdit}
                        className="ml-2 text-[var(--accent-violet-light)] hover:text-[var(--accent-gold)] underline-offset-2 hover:underline"
                      >
                        Aggiungi
                      </button>
                    ) : null}
                  </p>
                )}
              </div>
            ) : null}
          </section>
        )}

        {tab === "compendi" && (
          <section className="max-w-3xl">
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-[10px] font-display uppercase tracking-[0.14em] text-[var(--foreground)]/40">
                Compendi
              </p>
              {canEdit ? (
                <OrdineEditPencil
                  label="Nuovo compendio"
                  onClick={openCompendioCreate}
                />
              ) : null}
            </div>

            {compendi.length === 0 ? (
              <p className="text-sm text-[var(--foreground)]/40 italic leading-relaxed">
                Nessun compendio pubblicato per {faction.label}.
                {canEdit ? (
                  <button
                    type="button"
                    onClick={openCompendioCreate}
                    className="ml-2 text-[var(--accent-violet-light)] hover:text-[var(--accent-gold)] underline-offset-2 hover:underline"
                  >
                    Aggiungi il primo
                  </button>
                ) : null}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {compendi.map((entry) => (
                  <div key={entry.id} className="relative">
                    <button
                      type="button"
                      onClick={() => setCompendioOpenId(entry.id)}
                      className="w-full min-h-[44px] text-left rounded-lg border border-[var(--border-color)] bg-black/25 px-3 py-3 hover:border-[var(--accent-violet)]/50 hover:bg-[var(--accent-violet)]/5 transition-colors"
                    >
                      <span className="block font-display text-sm text-[var(--accent-violet-light)] mb-1 pr-8">
                        {entry.name}
                      </span>
                      {compendioPreview(entry) ? (
                        <span className="block text-xs text-[var(--foreground)]/50 leading-relaxed">
                          {compendioPreview(entry)}
                        </span>
                      ) : null}
                    </button>
                    {canEdit ? (
                      <OrdineEditPencil
                        label={`Modifica ${entry.name}`}
                        onClick={() => openCompendioEdit(entry)}
                        className="absolute top-1.5 right-1.5"
                      />
                    ) : null}
                  </div>
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
        onClose={() => setCompendioOpenId(null)}
        title={compendioOpen?.name ?? ""}
        factionLabel={faction.label}
        content={compendioOpen ? compendioBody(compendioOpen) : ""}
        onEdit={
          canEdit && compendioOpen
            ? () => {
                const entryId = compendioOpen.id;
                setCompendioOpenId(null);
                setEditMode({ type: "compendio", entryId, factionLabel: faction.label });
              }
            : undefined
        }
      />

      <OrdineStatutiEditModal
        open={!!editMode}
        mode={editMode}
        onClose={() => setEditMode(null)}
        onSaved={handleStatutiSaved}
        statuti={statutiApi}
      />
    </div>
  );
}
