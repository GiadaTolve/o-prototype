"use client";

import { useCallback, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import {
  MADOSHO_CATALOG,
  MADOSHO_IDS,
  getMadoshoDef,
  type MadoshoId,
} from "@domain/progression/madosho";
import type { SkiruSheet } from "@domain/skiru";
import { sortWazaByKindAndName } from "@domain/progression";
import { useDoMechanicsSnapshot } from "@/hooks/useDoMechanicsSnapshot";
import { findStatutiEntry, useStatuti } from "@/hooks/useStatuti";
import { WazaEditorialHeader } from "./WazaEditorialHeader";
import { WazaCatalogRow } from "./WazaCatalogRow";
import type { CatalogWaza, StyleHexState } from "./waza-catalog-types";
import { api } from "@/lib/api";

export function WazaMadoshoBrowser({
  catalog,
  charMadoshoId,
  skiruSheet,
  onCharUpdate,
  onReload,
  fullHeight = false,
  csPreview,
  resolveExtras: resolveExtrasProp,
}: {
  catalog: CatalogWaza[];
  charMadoshoId?: string | null;
  skiruSheet?: SkiruSheet | Record<string, number> | null;
  onCharUpdate?: () => void;
  onReload: () => Promise<void>;
  fullHeight?: boolean;
  csPreview: number;
  resolveExtras?: import("@/hooks/useDoMechanicsSnapshot").WazaResolveExtras;
}) {
  const playerMadosho = getMadoshoDef(charMadoshoId);
  const [selected, setSelected] = useState<MadoshoId>(
    playerMadosho?.id ?? MADOSHO_IDS[0],
  );
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const normalizedSkiruSheet = useMemo(
    () => (skiruSheet && Object.keys(skiruSheet).length > 0 ? (skiruSheet as SkiruSheet) : null),
    [skiruSheet],
  );

  const { extras: resolveExtrasFromHook } = useDoMechanicsSnapshot(csPreview, !resolveExtrasProp);
  const resolveExtras = resolveExtrasProp ?? resolveExtrasFromHook;

  const wazaForRamo = useMemo(() => {
    const items = catalog.filter((w) => w.madoshoId === selected);
    return sortWazaByKindAndName(items, {
      isPassive: (w) => !!w.isPassive,
      getName: (w) => w.name,
    });
  }, [catalog, selected]);

  const branchUnlocked = !charMadoshoId || charMadoshoId === selected;

  const handlePurchase = useCallback(
    async (skillId: string) => {
      setPurchasingId(skillId);
      try {
        await api.post("/characters/me/skills", { skillId });
        await onReload();
        onCharUpdate?.();
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : "Errore acquisto.");
      } finally {
        setPurchasingId(null);
      }
    },
    [onCharUpdate, onReload],
  );

  const { state: statuti } = useStatuti();
  const madoshoDef = MADOSHO_CATALOG.find((m) => m.id === selected);
  const madoshoEntry = findStatutiEntry(statuti, "madosho", selected);

  const owned = wazaForRamo.filter((w) => w.owned).length;

  return (
    <section
      className={`waza-do-panel rounded-lg border border-[var(--border-color)] bg-[var(--panel-bg)]/90 overflow-hidden animate__animated animate__fadeIn motion-reduce:animate-none ${
        fullHeight ? "flex flex-col flex-1 min-h-0 h-full" : ""
      }`}
    >
      <div
        className={`flex flex-col md:flex-row ${
          fullHeight ? "flex-1 min-h-[320px]" : "min-h-[480px] max-h-[min(78vh,780px)]"
        }`}
      >
        <nav
          className="shrink-0 md:w-44 border-b md:border-b-0 md:border-r border-[var(--border-color)]/70 bg-black/50 flex md:flex-col gap-0 overflow-x-auto md:overflow-y-auto"
          aria-label="Lignaggi Madoshō"
        >
          {MADOSHO_CATALOG.map((m) => {
            const isSelected = selected === m.id;
            const count = catalog.filter((w) => w.madoshoId === m.id).length;
            const isPlayer = charMadoshoId === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelected(m.id)}
                className={`waza-do-nav-btn shrink-0 md:shrink w-full px-3 py-3 text-left border-b border-[var(--border-color)]/25 ${
                  isSelected ? "waza-do-nav-btn--active" : "hover:bg-[var(--accent-violet)]/6"
                } ${!isPlayer && charMadoshoId ? "opacity-50" : ""}`}
              >
                <span className="block text-[10px] font-display uppercase tracking-[0.1em] text-[var(--accent-violet-light)] leading-tight">
                  {m.name}
                </span>
                <span className="block text-[8px] text-[var(--foreground)]/40 mt-1 tabular-nums">
                  {count} waza
                </span>
                {isPlayer && (
                  <span className="text-[7px] uppercase text-[var(--accent-gold)] mt-1 block font-display">
                    Tuo lignaggio
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <WazaEditorialHeader
            title={madoshoDef?.name ?? selected}
            subtitle={madoshoEntry?.sottotitolo ?? madoshoDef?.tagline}
            statute={madoshoEntry?.statute}
            mechanics={madoshoEntry?.descrizione_meccanica}
            statuteLabel="Lignaggio"
            footer={
              <>
                {!charMadoshoId && (
                  <p className="text-[10px] text-[var(--accent-violet-light)]/80 italic">
                    Richiedi una Madoshō dallo staff (Scheda → Richieste) per acquistare le waza del lignaggio.
                  </p>
                )}
                {charMadoshoId && charMadoshoId !== selected && (
                  <p className="text-[10px] text-[var(--foreground)]/50 italic flex items-center gap-1.5">
                    <FontAwesomeIcon icon={icons.lock} className="w-2.5 h-2.5" />
                    Solo consultazione — waza di un altro lignaggio.
                  </p>
                )}
              </>
            }
          />

          <div className="shrink-0 px-4 py-2 border-b border-[var(--border-color)]/40 bg-black/30 text-xs font-display uppercase tracking-[0.14em] text-[var(--foreground)]/60">
            Tecniche · {wazaForRamo.length}
            <span className="text-[9px] normal-case tracking-normal text-[var(--foreground)]/40 ml-2">
              · <span className="text-[var(--accent-gold)]">{owned}</span> apprese
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {selected === "komonoire" && wazaForRamo.length === 0 ? (
              <p className="text-sm text-[var(--accent-violet-light)]/80 text-center py-10 max-w-md mx-auto leading-relaxed">
                Komonoire: elenco waza assente nel manuale PDF. Meccanica dado + Debitore in roadmap.
              </p>
            ) : wazaForRamo.length === 0 ? (
              <p className="text-sm text-[var(--foreground)]/45 italic text-center py-10">
                Nessuna waza in catalogo per questo lignaggio.
              </p>
            ) : (
              wazaForRamo.map((w, index) => (
                <WazaCatalogRow
                  key={w.id}
                  waza={w}
                  branchUnlocked={branchUnlocked}
                  isKeystone={false}
                  index={index}
                  onPurchase={handlePurchase}
                  purchasing={purchasingId === w.id}
                  skiruSheet={normalizedSkiruSheet}
                  resolveExtras={resolveExtras}
                  lockedHint={
                    !branchUnlocked
                      ? "Madoshō diversa — solo consultazione."
                      : w.hexagonBlockedReason ?? undefined
                  }
                />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
