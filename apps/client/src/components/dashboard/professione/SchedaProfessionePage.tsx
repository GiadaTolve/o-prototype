"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { api } from "@/lib/api";
import type { CharacterSummary } from "../types";
import { ArtigianoToolSection } from "./ArtigianoToolSection";
import { CacciatoreToolSection } from "./CacciatoreToolSection";
import { MedicoToolSection } from "./MedicoToolSection";
import { PoliticoToolSection } from "./PoliticoToolSection";
import { SacerdoteToolSection } from "./SacerdoteToolSection";
import { SOCIAL_CLASS_ICON, ROLE_LABEL } from "./social-class-ui";
import type { SocialBudgetMetric, SocialClassState, SocialSubclassEntry } from "./types";

type Props = {
  state: SocialClassState;
  char?: CharacterSummary;
  roomId?: string | null;
  onUpdate: () => void;
};

const BUDGET_LABELS: Record<string, string> = {
  healHp: "Cura (HP/giorno)",
  integrity: "Integrità/giorno",
  gather: "Raccolta/giorno",
  pactWeight: "Peso Patti",
  pactActive: "Patti attivi",
  ofudaPower: "Potere Ofuda",
  ofudaActive: "Ofuda attivi",
};

function BudgetBar({ label, metric }: { label: string; metric: SocialBudgetMetric }) {
  if (!metric.max) return null;
  const pct = Math.max(0, Math.min(100, Math.round((metric.remaining / metric.max) * 100)));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] uppercase tracking-wider text-gray-500 font-display">
        <span>{label}</span>
        <span className="text-[var(--accent-gold)]">
          {metric.remaining}/{metric.max} residui
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-black/60 border border-[var(--border-color)] overflow-hidden">
        <div
          className="h-full bg-[var(--accent-gold)] transition-all duration-300 motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SubclassCard({
  entry,
  onUnlock,
  busy,
}: {
  entry: SocialSubclassEntry;
  onUnlock: (id: string) => void;
  busy: boolean;
}) {
  return (
    <div
      className={`p-3 rounded-lg border ${
        entry.unlocked
          ? "border-[var(--accent-gold)]/50 bg-[var(--accent-gold)]/5"
          : "border-[var(--border-color)] bg-black/25"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[9px] uppercase tracking-widest text-[var(--accent-violet-light)]/70 font-display">
          {ROLE_LABEL[entry.role]}
        </span>
        <span className="text-[10px] text-gray-500 tabular-nums">{entry.xpCost} XP</span>
      </div>
      <p className="font-display text-sm text-white">{entry.labelItalian}</p>
      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">
        {entry.nameRomaji}
        {entry.nameJa ? ` (${entry.nameJa})` : ""}
      </p>
      <p className="text-xs text-gray-400 leading-relaxed mb-2">{entry.description}</p>
      {entry.tradeoffs && (
        <p className="text-[11px] text-[var(--accent-violet-light)]/80 leading-relaxed mb-2">
          {entry.tradeoffs}
        </p>
      )}
      {entry.unlocked ? (
        <span className="text-[10px] uppercase tracking-wider text-[var(--accent-gold)]">Sbloccata</span>
      ) : (
        <>
          <button
            type="button"
            onClick={() => onUnlock(entry.id)}
            disabled={!entry.canUnlock || busy}
            className="px-3 py-1 rounded border border-[var(--accent-gold)]/60 text-[var(--accent-gold)] text-[10px] uppercase tracking-wider hover:bg-[var(--accent-gold)]/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Sblocca
          </button>
          {!entry.canUnlock && entry.unlockErrors.length > 0 && (
            <p className="text-[10px] text-gray-600 mt-1">{entry.unlockErrors.join(" ")}</p>
          )}
        </>
      )}
    </div>
  );
}

export function SchedaProfessionePage({ state, char, roomId, onUpdate }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!state.socialClass || !state.classDef) return null;

  const unlock = async (subclassId: string) => {
    setBusyId(subclassId);
    setError(null);
    try {
      await api.patch("/characters/me/social-subclass", { subclassId });
      onUpdate();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Errore sblocco sottoclasse");
    } finally {
      setBusyId(null);
    }
  };

  const keystone = state.subclasses.find((s) => s.role === "keystone");
  const paths = state.subclasses.filter((s) => s.role === "path");
  const capstone = state.subclasses.find((s) => s.role === "capstone");

  const budget = state.dailyBudget;

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 shrink-0 rounded-lg border border-[var(--accent-gold)]/50 bg-black/30 flex items-center justify-center">
          <FontAwesomeIcon icon={SOCIAL_CLASS_ICON[state.classDef.id]} className="w-5 h-5 text-[var(--accent-gold)]" />
        </div>
        <div className="min-w-0">
          <p className="font-display text-lg text-white">{state.classDef.nameItalian}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">
            {state.classDef.nameRomaji}
            {state.classDef.nameJa ? ` (${state.classDef.nameJa})` : ""}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-400 leading-relaxed">{state.classDef.toolSummary}</p>

      {budget && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg border border-[var(--border-color)] bg-black/20">
          {Object.entries(budget).map(([key, metric]) => (
            <BudgetBar key={key} label={BUDGET_LABELS[key] ?? key} metric={metric} />
          ))}
        </div>
      )}

      <div>
        <h3 className="text-[10px] uppercase tracking-widest text-[var(--accent-violet-light)]/80 font-display mb-3">
          Albero sottoclassi
        </h3>

        {error && (
          <p className="text-xs text-red-400 border border-red-900/50 bg-red-950/30 rounded px-3 py-2 mb-3">
            {error}
          </p>
        )}

        <div className="space-y-3">
          {keystone && <SubclassCard entry={keystone} onUnlock={unlock} busy={busyId === keystone.id} />}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {paths.map((p) => (
              <SubclassCard key={p.id} entry={p} onUnlock={unlock} busy={busyId === p.id} />
            ))}
          </div>
          {capstone && <SubclassCard entry={capstone} onUnlock={unlock} busy={busyId === capstone.id} />}
        </div>
      </div>

      <div>
        <h3 className="text-[10px] uppercase tracking-widest text-[var(--accent-violet-light)]/80 font-display mb-3">
          Strumento
        </h3>
        {state.classDef.id === "shokunin" ? (
          <ArtigianoToolSection char={char} roomId={roomId} onUpdate={onUpdate} />
        ) : state.classDef.id === "ishi" ? (
          <MedicoToolSection char={char} roomId={roomId} onUpdate={onUpdate} />
        ) : state.classDef.id === "ryoshi" ? (
          <CacciatoreToolSection char={char} roomId={roomId} onUpdate={onUpdate} />
        ) : state.classDef.id === "seijika" ? (
          <PoliticoToolSection char={char} roomId={roomId} onUpdate={onUpdate} />
        ) : state.classDef.id === "shisai" ? (
          <SacerdoteToolSection char={char} roomId={roomId} onUpdate={onUpdate} />
        ) : (
          <div className="p-4 rounded-lg border border-[var(--border-color)] bg-black/20">
            <p className="text-sm text-gray-400 leading-relaxed">
              {state.toolUx?.summary ?? "Strumento in arrivo."}
            </p>
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mt-2">
              {[state.toolUx?.panelA, state.toolUx?.panelB].filter(Boolean).join(" · ")} — prossimamente
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
