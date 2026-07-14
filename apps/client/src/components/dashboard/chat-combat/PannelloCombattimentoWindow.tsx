"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import { api } from "@/lib/api";
import { buildDoMechanicsSectionTitle, useDoMechanicsVisibility } from "@/hooks/useDoMechanicsVisibility";
import { DoMechanicsPanel } from "../DoMechanicsPanel";
import { StatusEffectsPanel } from "../StatusEffectsPanel";
import { CombatHpInline } from "./CombatHpInline";
import { CombatCsInline } from "./CombatCsInline";
import { CombatConstructsSection } from "./CombatConstructsSection";
import { CombatWeaponsSection } from "./CombatWeaponsSection";
import { LancioWazaPanel } from "./LancioWazaPanel";
import { resolveCharacterComputed, formatMovementMeters } from "../character-computed";
import { computeIndicativeActionIr } from "@domain/combat/resolution";
import type { CharacterSummary, Presente } from "../types";

type ChronoVitals = {
  csCurrent: number;
  csCapacity: number;
  accumulating: boolean;
  isOverheated: boolean;
};

/** Chip parametri combattimento (IR, CAC, CAD, Mov, Schivata, Parata). */
function StatChip({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] border"
      style={{
        background: accent ? "color-mix(in srgb, var(--accent-violet) 12%, transparent)" : "rgba(0,0,0,0.35)",
        borderColor: accent ? "color-mix(in srgb, var(--accent-violet) 50%, transparent)" : "var(--border-color)",
        color: accent ? "var(--accent-violet-light)" : "var(--foreground)",
      }}
    >
      <span style={{ color: "var(--muted-foreground)", fontSize: 10 }}>{label}</span>
      <strong style={{ fontFamily: "var(--font-data, ui-monospace, monospace)", color: accent ? "var(--accent-violet-light)" : "var(--accent-gold)" }}>
        {value}
      </strong>
    </span>
  );
}

/** Separatore di sezione con titolo. */
function ZoneHeader({ label, dot }: { label: string; dot?: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      {dot && (
        <span
          className="shrink-0 w-1.5 h-1.5 rounded-full"
          style={{ background: dot, boxShadow: `0 0 6px ${dot}` }}
        />
      )}
      <span
        className="text-[9.5px] uppercase tracking-[0.2em] font-display"
        style={{ color: "var(--muted-foreground)" }}
      >
        {label}
      </span>
      <span className="flex-1 h-px" style={{ background: "var(--border-color)" }} />
    </div>
  );
}

export function PannelloCombattimentoWindow({
  char,
  usersInRoom,
  chatConnected = true,
}: {
  char?: CharacterSummary;
  usersInRoom?: Presente[];
  chatConnected?: boolean;
}) {
  const characterId = char?.id;
  const skiruSheet = char?.skiruSheet;
  const mountedRef = useRef(true);
  const [showCampo, setShowCampo] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── HP / CS ──────────────────────────────────────────────────────────────
  const vitals = useMemo(() => resolveCharacterComputed(char?.computed), [char?.computed]);
  const [ownHp, setOwnHp] = useState<{ current: number; max: number } | null>(null);
  const [ownCs, setOwnCs] = useState<ChronoVitals | null>(null);

  useEffect(() => {
    if (vitals.hpMax > 0) setOwnHp({ current: vitals.hpCurrent, max: vitals.hpMax });
    else setOwnHp(null);
  }, [vitals.hpCurrent, vitals.hpMax]);

  useEffect(() => {
    const c = char?.computed as { csCurrent?: number; csCapacity?: number; csAccumulating?: boolean } | undefined;
    if (c?.csCapacity != null && c.csCurrent != null) {
      setOwnCs({
        csCurrent: c.csCurrent,
        csCapacity: c.csCapacity,
        accumulating: Boolean(c.csAccumulating),
        isOverheated: c.csCurrent > (c.csCapacity ?? 20),
      });
    }
  }, [char?.computed]);

  useEffect(() => {
    if (!characterId) return;
    let cancelled = false;
    api.get(`/characters/${characterId}/status-effects`).then((data) => {
      if (cancelled || !mountedRef.current) return;
      const chrono = (data as { vitals?: { chronoStack?: ChronoVitals } }).vitals?.chronoStack;
      if (chrono) setOwnCs(chrono);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [characterId]);

  useEffect(() => {
    const onHp = (e: Event) => {
      const d = (e as CustomEvent<{ characterId: string; hpCurrent: number; hpMax: number }>).detail;
      if (!d?.characterId || d.characterId !== characterId) return;
      setOwnHp({ current: d.hpCurrent, max: d.hpMax });
    };
    const onCs = (e: Event) => {
      const d = (e as CustomEvent<{ characterId: string } & ChronoVitals>).detail;
      if (!d?.characterId || d.characterId !== characterId) return;
      setOwnCs({ csCurrent: d.csCurrent, csCapacity: d.csCapacity, accumulating: d.accumulating, isOverheated: d.isOverheated });
    };
    window.addEventListener("characterHpUpdated", onHp);
    window.addEventListener("characterChronoUpdated", onCs);
    return () => {
      window.removeEventListener("characterHpUpdated", onHp);
      window.removeEventListener("characterChronoUpdated", onCs);
    };
  }, [characterId]);

  // ── Do-Mechanics ─────────────────────────────────────────────────────────
  const { visibleStyles: doVisibleStyles, showHitTier: doShowHitTier, visible: doMechanicsVisible, loading: doMechanicsLoading } =
    useDoMechanicsVisibility(!!characterId);

  // ── IR base indicativo ────────────────────────────────────────────────────
  const irBase = useMemo(() => {
    if (!skiruSheet) return null;
    return computeIndicativeActionIr(skiruSheet);
  }, [skiruSheet]);

  // ── Callbacks → evento DOM (DashboardCenter ascolta e agisce sul textarea) ─
  const onInsertText = useCallback((text: string) => {
    window.dispatchEvent(new CustomEvent("oyasumi:chatInsert", { detail: text }));
  }, []);

  const onSendMessage = useCallback((text: string) => {
    window.dispatchEvent(new CustomEvent("oyasumi:chatSend", { detail: text }));
  }, []);

  const charName = char?.name ?? "Personaggio";

  return (
    <div
      className="flex flex-col gap-3 p-3 overflow-y-auto h-full"
      style={{ background: "var(--panel-bg)" }}
    >
      {/* ── Z1 · CRUSCOTTO ─────────────────────────────────────────────── */}
      <section
        className="rounded-xl border p-3"
        style={{ background: "color-mix(in srgb, var(--panel-bg) 80%, black)", borderColor: "var(--border-color)" }}
      >
        {/* Nome + pulsante Campo */}
        <div className="flex items-center justify-between mb-3">
          <span className="font-display text-base text-white">{charName}</span>
          <button
            type="button"
            className="text-[11px] px-2.5 py-1 rounded border transition-colors hover:bg-[var(--accent-violet)]/10"
            style={{
              color: showCampo ? "var(--accent-gold)" : "var(--accent-violet-light)",
              borderColor: showCampo
                ? "color-mix(in srgb, var(--accent-gold) 50%, transparent)"
                : "color-mix(in srgb, var(--accent-violet) 40%, transparent)",
            }}
            onClick={() => setShowCampo((v) => !v)}
          >
            Campo {showCampo ? "▾" : "▸"}
          </button>
        </div>

        {/* HP + CS bars */}
        <div className="flex gap-3 mb-3">
          <div className="flex-1 min-w-0">
            {ownHp && ownHp.max > 0 ? (
              <CombatHpInline current={ownHp.current} max={ownHp.max} />
            ) : (
              <p className="text-[9px] text-gray-600 italic">HP non disponibili</p>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {ownCs ? (
              <CombatCsInline
                current={ownCs.csCurrent}
                capacity={ownCs.csCapacity}
                accumulating={ownCs.accumulating}
                isOverheated={ownCs.isOverheated}
              />
            ) : (
              <p className="text-[9px] text-gray-600 italic">CS non disponibili</p>
            )}
          </div>
        </div>

        {/* Chips IR / CAC / CAD / Mov / Schivata / Parata */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {irBase != null && <StatChip label="IR" value={irBase} />}
          {vitals.cac > 0 && <StatChip label="CAC" value={vitals.cac} />}
          {vitals.cad > 0 && <StatChip label="CAD" value={vitals.cad} />}
          {vitals.movementMeters > 0 && <StatChip label="Mov" value={formatMovementMeters(vitals.movementMeters)} />}
          {vitals.dodgeIr > 0 && <StatChip label="Schivata" value={vitals.dodgeIr} accent />}
          {vitals.parryIr > 0 && <StatChip label="Parata" value={vitals.parryIr} accent />}
        </div>

        {/* Meccaniche di stile (DoMechanicsPanel) */}
        {!doMechanicsLoading && doMechanicsVisible && (
          <div className="mb-3">
            <p className="text-[9px] uppercase tracking-widest text-gray-500 font-display mb-1.5">
              {buildDoMechanicsSectionTitle(doVisibleStyles)}
            </p>
            <DoMechanicsPanel
              embedded
              currentCs={ownCs?.csCurrent ?? null}
              visibleStyles={doVisibleStyles}
              showHitTier={doShowHitTier}
            />
          </div>
        )}

        {/* Status attivi */}
        <StatusEffectsPanel characterId={characterId} isOwnCharacter embedded />
      </section>

      {/* ── Z5 · CAMPO (costrutti attivi) — collassabile da "Campo ▸" ── */}
      {showCampo && (
        <section
          className="rounded-xl border p-3"
          style={{ background: "color-mix(in srgb, var(--panel-bg) 80%, black)", borderColor: "color-mix(in srgb, var(--accent-gold) 25%, var(--border-color))" }}
        >
          <ZoneHeader label="Campo · Costrutti attivi" dot="var(--accent-gold)" />
          <CombatConstructsSection
            characterId={characterId}
            onInsertText={onInsertText}
          />
        </section>
      )}

      {/* ── Z2 · IN USO ORA — cosa impugni e cos'è Tōrō (equipaggi in scheda) ── */}
      <section
        className="rounded-xl border p-3"
        style={{ background: "color-mix(in srgb, var(--panel-bg) 80%, black)", borderColor: "var(--border-color)" }}
      >
        <ZoneHeader label="Equipaggiamento" />
        <CombatWeaponsSection />
      </section>

      {/* ── Z3 · LANCIO WAZA ───────────────────────────────────────────── */}
      <section
        className="rounded-xl border p-3"
        style={{ background: "color-mix(in srgb, var(--panel-bg) 80%, black)", borderColor: "var(--border-color)" }}
      >
        <LancioWazaPanel
          characterId={characterId}
          skiruSheet={skiruSheet}
          grade={char?.grade ?? null}
          usersInRoom={usersInRoom ?? []}
          currentCs={ownCs?.csCurrent ?? null}
          onInsertText={onInsertText}
          onSendMessage={onSendMessage}
          chatConnected={chatConnected}
        />
      </section>
    </div>
  );
}
