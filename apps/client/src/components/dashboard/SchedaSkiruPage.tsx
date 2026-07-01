"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  SKIRU_BRANCHES,
  SKIRU_CATALOG,
  SKIRU_DOMAIN_LABELS,
  SKIRU_MAX_POINTS,
  SOKAIJU_ANCHORS,
  SOKAIJU_ELEMENTALS_INTRO,
  SOKAIJU_GATE_SKIRU_ID,
  SOKAIJU_INTRO_LORE,
  SOKAIJU_PLAYING_TIP,
  getSkiruMaxPoints,
  canAffordSkiruRaise,
  expCostForNextSkiruPoint,
  getSkiruPoints,
  getSkiruParentUnlockMessage,
  isSkiruParentUnlocked,
  totalSkiruPointsInvested,
  calculateSkiruDerivedStats,
  computeSokaijuCombatSummary,
  formatSokaijuAnchorLiveValue,
  type SkiruDef,
  type SkiruDomain,
  type SkiruSheet,
} from "@domain/skiru";
import { api } from "@/lib/api";
import { icons } from "@/lib/icons";
import { isSkiruApiResponse, type SkiruApiResponse } from "@/lib/skiru-api";
import { resolveCharacterComputed, formatMovementMeters } from "./character-computed";
import type { CharacterSummary } from "./types";

const DOMAIN_ORDER: SkiruDomain[] = ["ten", "chi", "jin"];

const DERIVED_LABELS: Record<string, string> = {
  hp: "HP",
  movement: "Movimento",
  mitigation: "Mitigazione",
  constructResistance: "Res. Costrutti",
  cac: "CAC",
  cad: "CAD",
};

const DOMAIN_ACCENT: Record<
  SkiruDomain,
  { border: string; text: string; glow: string }
> = {
  ten: {
    border: "border-[var(--accent-gold)]/40",
    text: "text-[var(--accent-gold)]",
    glow: "shadow-[var(--shadow-gold)]",
  },
  chi: {
    border: "border-[var(--accent-violet)]/40",
    text: "text-[var(--accent-violet-light)]",
    glow: "shadow-[var(--shadow-violet)]",
  },
  jin: {
    border: "border-[var(--accent-violet-light)]/30",
    text: "text-[var(--accent-violet-light)]",
    glow: "shadow-[var(--shadow-violet)]",
  },
};

function SkiruStatWithTooltip({
  label,
  value,
  tooltip,
  valueClass = "text-[var(--accent-violet-light)]",
}: {
  label: string;
  value: string | number;
  tooltip?: string;
  valueClass?: string;
}) {
  return (
    <span className={tooltip ? "relative group" : undefined}>
      <span
        className={`text-[10px] uppercase tracking-widest text-gray-500 block mb-0.5 ${
          tooltip ? "border-b border-dotted border-gray-600/60 cursor-help w-fit" : ""
        }`}
      >
        {label}
      </span>
      <strong className={`font-display tabular-nums ${valueClass}`}>{value}</strong>
      {tooltip ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2.5 py-1.5 rounded-md border border-[var(--border-color)] bg-[var(--panel-bg)] text-[10px] text-[var(--accent-violet-light)] whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-30 shadow-[var(--shadow-violet)]"
        >
          {tooltip}
          <span
            className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-[5px] border-x-transparent border-t-[5px] border-t-[var(--border-color)]"
            aria-hidden
          />
        </span>
      ) : null}
    </span>
  );
}

function SkiruStatsBar({
  totalInvested,
  expSpendable,
  derived,
}: {
  totalInvested: number;
  expSpendable: number;
  derived: {
    hpMax: number;
    hpCurrent: number;
    mitigationPercent: number;
    movementMetersPerQuarter: number;
    cac: number;
    cad: number;
  };
}) {
  return (
    <div className="rounded-lg border border-[var(--border-color)] bg-black/30 px-4 py-3 flex flex-wrap items-center gap-4 text-sm">
      <span>
        <span className="text-[10px] uppercase tracking-widest text-gray-500 block mb-0.5">Punti investiti</span>
        <strong className="font-display text-[var(--accent-gold)] tabular-nums">{totalInvested}</strong>
      </span>
      <span className="h-8 w-px bg-[var(--border-color)] hidden sm:block" aria-hidden />
      <span>
        <span className="text-[10px] uppercase tracking-widest text-gray-500 block mb-0.5">Exp spendibile</span>
        <strong className="font-display text-[var(--accent-violet-light)] tabular-nums">{expSpendable}</strong>
      </span>
      <span className="h-8 w-px bg-[var(--border-color)] hidden sm:block" aria-hidden />
      <SkiruStatWithTooltip
        label="HP"
        value={`${derived.hpCurrent}/${derived.hpMax}`}
        valueClass="text-[var(--accent-gold)]"
      />
      <SkiruStatWithTooltip label="Mitigazione" value={`${derived.mitigationPercent}%`} />
      <SkiruStatWithTooltip
        label="Movimento"
        value={formatMovementMeters(derived.movementMetersPerQuarter)}
      />
      <SkiruStatWithTooltip
        label="CAC"
        value={derived.cac}
        tooltip="Danno corpo a corpo"
        valueClass="text-[var(--accent-gold)]"
      />
      <SkiruStatWithTooltip
        label="CAD"
        value={derived.cad}
        tooltip="Danno colpo a distanza"
        valueClass="text-[var(--accent-gold)]"
      />
    </div>
  );
}

function SkiruDisplayTitle({
  italian,
  romaji,
  kanji,
  className = "",
  accentClass = "text-[var(--accent-violet-light)]",
}: {
  italian: string;
  romaji?: string;
  kanji?: string;
  className?: string;
  accentClass?: string;
}) {
  if (!romaji?.trim()) {
    return <span className={className}>{italian}</span>;
  }
  return (
    <span className={className}>
      <span className={accentClass}>{romaji}</span>
      {kanji?.trim() ? <span className="ml-1.5 text-[var(--accent-violet-light)]/45">{kanji}</span> : null}
      <span className="mx-1.5 text-[var(--accent-violet-light)]/30">—</span>
      <span>{italian}</span>
    </span>
  );
}

function SkiruFormulaBox({ formula }: { formula: string }) {
  return (
    <div className="mt-2 rounded border border-[var(--accent-violet)]/30 bg-[var(--accent-violet)]/8 px-2.5 py-2">
      <p className="text-[8px] uppercase tracking-[0.18em] text-[var(--accent-violet-light)]/55 mb-1">
        Effetto meccanico
      </p>
      <p className="text-[10px] font-display text-[var(--accent-violet-light)] leading-relaxed">{formula}</p>
    </div>
  );
}

function SkiruPointBar({ points, max = SKIRU_MAX_POINTS }: { points: number; max?: number }) {
  const filled = Math.max(0, Math.min(max, points));

  return (
    <div
      className="flex gap-[2px] p-[2px] rounded-sm border border-[var(--border-color)] bg-black/60 w-full max-w-[140px]"
      role="img"
      aria-label={`${points} su ${max} punti`}
    >
      {Array.from({ length: max }, (_, i) => {
        const active = i < filled;
        return (
          <div
            key={i}
            className="relative flex-1 h-2 min-w-0 overflow-hidden"
            style={{
              boxShadow: active
                ? "inset 0 0 0 1px var(--accent-gold)"
                : "inset 0 0 0 1px var(--border-color)",
              background: active ? "var(--accent-violet)" : "transparent",
            }}
          />
        );
      })}
    </div>
  );
}

function SkiruDisclosure({
  italian,
  romaji,
  kanji,
  points,
  accent,
  defaultOpen = false,
  level = "branch",
  intro,
  children,
}: {
  italian: string;
  romaji?: string;
  kanji?: string;
  points?: number;
  accent: { border: string; text: string };
  defaultOpen?: boolean;
  level?: "branch" | "skill";
  intro?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isBranch = level === "branch";

  return (
    <div
      className={`rounded-lg border bg-black/25 overflow-hidden ${
        isBranch ? accent.border : "border-[var(--border-color)]"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-[var(--accent-gold)]/5 ${
          open ? "border-b border-[var(--border-color)]/60" : ""
        }`}
        aria-expanded={open}
      >
        <FontAwesomeIcon
          icon={icons.abbassare}
          className={`w-3 h-3 shrink-0 text-[var(--accent-gold)] transition-transform duration-200 ${
            open ? "" : "-rotate-90"
          }`}
        />
        <span className={`flex-1 min-w-0 font-display tracking-wide ${isBranch ? "text-[11px] tracking-[0.12em]" : "text-sm"}`}>
          <SkiruDisplayTitle
            italian={italian}
            romaji={romaji}
            kanji={kanji}
            accentClass={isBranch ? accent.text : "text-[var(--accent-violet-light)]"}
          />
        </span>
        {points != null && (
          <span className="text-[10px] tabular-nums text-gray-500 shrink-0">{points} pt</span>
        )}
      </button>
      {open && (
        <div
          className={`space-y-2 animate__animated animate__fadeIn ${
            isBranch ? "p-3" : "px-3 pb-3 pt-2"
          }`}
        >
          {intro && (
            <div
              className={`text-[11px] text-[var(--accent-violet-light)]/70 leading-relaxed ${
                isBranch ? "border-b border-[var(--border-color)]/50 pb-3 mb-1" : "mb-2"
              }`}
            >
              {intro}
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

function groupBranchCatalog(branchId: string) {
  const all = SKIRU_CATALOG.filter((s) => s.branchId === branchId);
  let masters = all.filter((s) => !s.parentSkiruId);
  if (branchId === "sokaiju") {
    masters = masters
      .filter((s) => s.sokaijuAnchor != null)
      .sort((a, b) => (a.sokaijuAnchor ?? 0) - (b.sokaijuAnchor ?? 0));
  }
  const byParent = new Map<string, SkiruDef[]>();
  for (const def of all) {
    if (!def.parentSkiruId) continue;
    const list = byParent.get(def.parentSkiruId) ?? [];
    list.push(def);
    byParent.set(def.parentSkiruId, list);
  }
  return { all, masters, byParent };
}

function SkiruSokaijuFaces({
  meiju,
  shiju,
  compact = false,
}: {
  meiju: NonNullable<SkiruDef["sokaijuMeiju"]>;
  shiju: NonNullable<SkiruDef["sokaijuShiju"]>;
  compact?: boolean;
}) {
  return (
    <div className={`space-y-2.5 ${compact ? "mt-1" : "mt-2"}`}>
      <div>
        <p className="text-[8px] uppercase tracking-[0.18em] text-[var(--accent-gold)]/75 mb-1">
          Meiju · Vita · {meiju.treeSphere}
        </p>
        <p className={`${compact ? "text-[10px]" : "text-[11px]"} text-gray-500 leading-relaxed`}>
          <span className="text-[var(--accent-gold)]/90">{meiju.nameRomaji}</span>
          {meiju.nameJa ? (
            <span className="ml-1 text-[var(--accent-violet-light)]/45">{meiju.nameJa}</span>
          ) : null}
          <span className="mx-1.5 text-[var(--accent-violet-light)]/25">—</span>
          {meiju.labelItalian}
          {!compact ? <span className="block mt-1 text-gray-500/90">{meiju.description}</span> : null}
        </p>
      </div>
      <div>
        <p className="text-[8px] uppercase tracking-[0.18em] text-[var(--accent-violet-light)]/65 mb-1">
          Shiju · Morte · {shiju.treeSphere}
        </p>
        <p className={`${compact ? "text-[10px]" : "text-[11px]"} text-gray-500 leading-relaxed`}>
          <span className="text-[var(--accent-violet-light)]/85">{shiju.nameRomaji}</span>
          {shiju.nameJa ? (
            <span className="ml-1 text-[var(--accent-violet-light)]/45">{shiju.nameJa}</span>
          ) : null}
          <span className="mx-1.5 text-[var(--accent-violet-light)]/25">—</span>
          {shiju.labelItalian}
          {!compact ? <span className="block mt-1 text-gray-500/90">{shiju.description}</span> : null}
        </p>
      </div>
    </div>
  );
}

function SkiruNodeRow({
  def,
  sheet,
  canEdit,
  expSpendable,
  expCostNextByNode,
  raisingId,
  onRaise,
  compact = false,
}: {
  def: SkiruDef;
  sheet: SkiruSheet;
  canEdit?: boolean;
  expSpendable: number;
  expCostNextByNode?: Record<string, number | null>;
  raisingId: string | null;
  onRaise?: (skiruId: string) => void;
  compact?: boolean;
}) {
  const points = getSkiruPoints(sheet, def.id);
  const isMilestone = def.kind === "milestone";
  const isSokaijuAcademic = def.id === SOKAIJU_GATE_SKIRU_ID;
  const maxPoints = isMilestone ? 1 : getSkiruMaxPoints(def.id);
  const isPassive = !isMilestone && maxPoints === 1;
  const isDeclarativePassive = isPassive && def.expPurchasable === false;
  const accent = DOMAIN_ACCENT[def.domain];
  const nextCost =
    !isMilestone && points < maxPoints
      ? (expCostNextByNode?.[def.id] ?? expCostForNextSkiruPoint(points))
      : null;
  const canRaise =
    canEdit &&
    !isMilestone &&
    !isDeclarativePassive &&
    nextCost != null &&
    isSkiruParentUnlocked(sheet, def.id) &&
    canAffordSkiruRaise(sheet, def.id, points + 1, expSpendable);
  const unlockMsg = getSkiruParentUnlockMessage(sheet, def.id);
  const isRaising = raisingId === def.id;

  return (
    <div
      className={`rounded-md border bg-black/30 ${compact ? "px-2.5 py-2" : "px-3 py-2.5"} ${accent.border} ${
        points > 0 ? accent.glow : "opacity-70"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
        <div className="min-w-0 flex-1">
          <p
            className={`font-display ${compact ? "text-xs" : "text-sm"} ${
              points > 0 ? accent.text : "text-gray-400"
            }`}
          >
            <SkiruDisplayTitle
              italian={def.name}
              romaji={def.nameRomaji}
              kanji={def.nameJa}
              accentClass={points > 0 ? accent.text : "text-[var(--accent-violet-light)]/70"}
            />
          </p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {isMilestone && (
              <span className="text-[8px] uppercase tracking-[0.2em] text-[var(--accent-gold)]/80 border border-[var(--accent-gold)]/30 rounded px-1.5 py-0.5">
                {isSokaijuAcademic ? "Accademica" : "Milestone"}
              </span>
            )}
            {def.drivesDerived?.map((d) => (
              <span
                key={d}
                className="text-[8px] uppercase tracking-[0.16em] text-[var(--accent-violet-light)]/60 border border-[var(--border-color)] rounded px-1.5 py-0.5"
              >
                {DERIVED_LABELS[d] ?? d}
              </span>
            ))}
            {def.parentSkiruId && (
              <span className="text-[8px] uppercase tracking-[0.16em] text-[var(--accent-violet-light)]/50 border border-[var(--border-color)] rounded px-1.5 py-0.5">
                Sotto-ramo
              </span>
            )}
            {isPassive && (
              <span className="text-[8px] uppercase tracking-[0.16em] text-[var(--accent-gold)]/70 border border-[var(--accent-gold)]/30 rounded px-1.5 py-0.5">
                {isDeclarativePassive ? "Elementale" : "Passiva"}
              </span>
            )}
            {def.sokaijuMeiju && def.sokaijuShiju && (
              <span className="text-[8px] uppercase tracking-[0.16em] text-[var(--accent-gold)]/70 border border-[var(--accent-gold)]/30 rounded px-1.5 py-0.5">
                Meiju · Shiju
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isMilestone && !isPassive && <SkiruPointBar points={points} max={maxPoints} />}
          {!isMilestone && !isPassive && (
            <span className="font-display text-xs tabular-nums text-[var(--accent-gold)] w-10 text-right">
              {`${points}/${maxPoints}`}
            </span>
          )}
          {(isMilestone || isDeclarativePassive) && (
            <span className="font-display text-xs tabular-nums text-[var(--accent-gold)] w-10 text-right">
              {points > 0 ? "✓" : "—"}
            </span>
          )}
          {canEdit && !isMilestone && !isDeclarativePassive && points < maxPoints && (
            <button
              type="button"
              disabled={!canRaise || isRaising}
              onClick={() => onRaise?.(def.id)}
              title={
                nextCost != null
                  ? canRaise
                    ? `Acquista +1 (${nextCost} EXP)`
                    : `Servono ${nextCost} EXP`
                  : undefined
              }
              className="w-7 h-7 rounded border border-[var(--accent-gold)]/50 text-[var(--accent-gold)] text-xs flex items-center justify-center hover:bg-[var(--accent-gold)]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <FontAwesomeIcon icon={icons.plus} className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      {def.sokaijuMeiju && def.sokaijuShiju ? (
        <SkiruSokaijuFaces meiju={def.sokaijuMeiju} shiju={def.sokaijuShiju} compact={compact} />
      ) : (
        <>
          {def.description && !compact && (
            <p className="text-[11px] text-gray-500 leading-relaxed">{def.description}</p>
          )}
          {def.description && compact && (
            <p className="text-[10px] text-gray-500/80 leading-snug line-clamp-2">{def.description}</p>
          )}
        </>
      )}
      {def.derivedFormula && <SkiruFormulaBox formula={def.derivedFormula} />}
      {isDeclarativePassive && points <= 0 && (
        <p className="text-[9px] text-[var(--accent-violet-light)]/45 mt-1.5">
          Inserimento narrativo in scheda — non acquistabile con EXP.
        </p>
      )}
      {isSokaijuAcademic && (
        <p className="text-[9px] text-[var(--accent-violet-light)]/55 mt-1.5 leading-relaxed">
          {points > 0
            ? "Terzo Occhio aperto in scheda — prerequisito soddisfatto per coltivare gli altri ancoraggi Sōkaiju."
            : "Concessa accademicamente (non si potenzia con EXP). Senza Tenkan in scheda non puoi investire negli altri nodi dell'albero."}
        </p>
      )}
      {canEdit && !isMilestone && !isDeclarativePassive && nextCost != null && points < maxPoints && (
        <p className="text-[9px] text-[var(--accent-violet-light)]/50 mt-1.5 tabular-nums">
          {unlockMsg ?? `Prossimo punto: ${nextCost} EXP`}
        </p>
      )}
    </div>
  );
}

function SkiruMasterGroup({
  master,
  passives,
  sheet,
  canEdit,
  expSpendable,
  expCostNextByNode,
  raisingId,
  onRaise,
  accent,
}: {
  master: SkiruDef;
  passives: SkiruDef[];
  sheet: SkiruSheet;
  canEdit?: boolean;
  expSpendable: number;
  expCostNextByNode?: Record<string, number | null>;
  raisingId: string | null;
  onRaise?: (skiruId: string) => void;
  accent: { border: string; text: string; glow: string };
}) {
  const masterPoints = getSkiruPoints(sheet, master.id);
  const childPoints = passives.reduce((sum, c) => sum + getSkiruPoints(sheet, c.id), 0);
  const allDeclarative = passives.length > 0 && passives.every((p) => p.expPurchasable === false);
  const defaultOpen = masterPoints > 0 || childPoints > 0 || allDeclarative;

  const rowProps = {
    sheet,
    canEdit,
    expSpendable,
    expCostNextByNode,
    raisingId,
    onRaise,
  };

  if (passives.length === 0) {
    return <SkiruNodeRow def={master} {...rowProps} />;
  }

  return (
    <SkiruDisclosure
      italian={master.name}
      romaji={master.nameRomaji}
      kanji={master.nameJa}
      points={masterPoints + childPoints}
      accent={accent}
      defaultOpen={defaultOpen}
      level="skill"
    >
      <SkiruNodeRow def={master} {...rowProps} />
      <div className="ml-1 pl-3 border-l border-[var(--accent-gold)]/25 space-y-2">
        <p className="text-[8px] uppercase tracking-[0.2em] text-[var(--accent-violet-light)]/45 px-0.5">
          {allDeclarative ? "Passive elementali" : "Passive acquistabili"}
        </p>
        {passives.map((child) => (
          <SkiruNodeRow key={child.id} def={child} compact {...rowProps} />
        ))}
      </div>
    </SkiruDisclosure>
  );
}

function SokaijuIntroPanel() {
  return (
    <div className="rounded-lg border border-[var(--accent-violet)]/30 bg-black/30 px-4 py-4 space-y-3">
      <p className="font-display text-sm tracking-wide text-[var(--accent-gold)]">
        Il Sōkaiju — Il Doppio Albero dei Mondi
        <span className="ml-2 text-[var(--accent-violet-light)]/60 font-normal">双界樹</span>
      </p>
      {SOKAIJU_INTRO_LORE.map((paragraph) => (
        <p key={paragraph.slice(0, 32)} className="text-[11px] text-[var(--accent-violet-light)]/75 leading-relaxed">
          {paragraph}
        </p>
      ))}
      <p className="text-[11px] text-gray-500 leading-relaxed border-t border-[var(--border-color)]/40 pt-3">
        {SOKAIJU_PLAYING_TIP}
      </p>
    </div>
  );
}

function SokaijuCombatAutomationsPanel({ sheet }: { sheet: SkiruSheet }) {
  const [open, setOpen] = useState(false);
  const summary = useMemo(() => computeSokaijuCombatSummary(sheet), [sheet]);
  const investedCount = useMemo(
    () => SOKAIJU_ANCHORS.filter((a) => getSkiruPoints(sheet, a.id) > 0).length,
    [sheet],
  );
  const highlights = useMemo(() => {
    const parts: string[] = [];
    if (summary.kongenDamageFloor > 0) parts.push(`Kongen +${summary.kongenDamageFloor}`);
    if (summary.maxActiveConstructs > 1) parts.push(`${summary.maxActiveConstructs} costrutti`);
    if (summary.gojuElemental) parts.push(`[${summary.gojuElemental.statusId}]`);
    if (summary.kashinRank > 0) parts.push(`Kashin ${summary.kashinRank}`);
    return parts.slice(0, 4);
  }, [summary]);

  return (
    <div className="rounded-lg border border-[var(--accent-violet)]/30 bg-black/35 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-2.5 px-4 py-3 text-left hover:bg-[var(--accent-violet)]/5 transition-colors"
        aria-expanded={open}
      >
        <FontAwesomeIcon
          icon={icons.abbassare}
          className={`w-3 h-3 shrink-0 mt-0.5 text-[var(--accent-gold)] transition-transform duration-200 ${
            open ? "" : "-rotate-90"
          }`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent-violet-light)]/80 font-display">
            Automatismi in combattimento
          </p>
          <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
            {investedCount > 0
              ? `${investedCount} nodi investiti`
              : "Nessun nodo investito"}
            {highlights.length > 0 ? (
              <span className="text-[var(--accent-gold)]/80"> · {highlights.join(" · ")}</span>
            ) : null}
          </p>
        </div>
        <span className="text-[9px] uppercase tracking-widest text-gray-600 shrink-0 pt-0.5">
          {open ? "Chiudi" : "Apri"}
        </span>
      </button>

      {open && (
        <div className="border-t border-[var(--border-color)]/50 px-4 pb-3 pt-2 animate__animated animate__fadeIn motion-reduce:animate-none">
          <p className="text-[10px] text-gray-500 leading-relaxed mb-2">
            Passivi — non si dichiarano al lancio waza. Formule complete in ogni ancoraggio sotto.
          </p>
          <div className="max-h-44 overflow-y-auto overscroll-contain pr-1 -mr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {SOKAIJU_ANCHORS.map((anchor) => {
                const live = formatSokaijuAnchorLiveValue(anchor.id, sheet, summary);
                const points = getSkiruPoints(sheet, anchor.id);
                return (
                  <div
                    key={anchor.id}
                    className={`flex items-center justify-between gap-2 rounded border px-2 py-1.5 ${
                      points > 0
                        ? "border-[var(--accent-gold)]/20 bg-[var(--accent-gold)]/5"
                        : "border-[var(--border-color)]/50 bg-black/20 opacity-75"
                    }`}
                    title={anchor.derivedFormula}
                  >
                    <span className="text-[9px] font-display uppercase tracking-wide text-[var(--accent-violet-light)] truncate">
                      {anchor.anchor}. {anchor.sectionTitle}
                    </span>
                    <span className="text-[9px] tabular-nums text-[var(--accent-gold)] shrink-0">{live}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SokaijuAnchorLore({ anchor }: { anchor: (typeof SOKAIJU_ANCHORS)[number] }) {
  return (
    <div className="space-y-2 mb-3 pb-3 border-b border-[var(--border-color)]/40">
      <p className="text-[10px] text-[var(--accent-violet-light)]/85 leading-relaxed">
        <span className="text-[var(--accent-gold)]/90">Vita:</span>{" "}
        {anchor.meiju.nameRomaji} ({anchor.meiju.nameJa}), {anchor.meiju.labelItalian}
        <span className="mx-2 text-[var(--border-color)]">·</span>
        <span className="text-[var(--accent-violet-light)]/70">Morte:</span>{" "}
        {anchor.shiju.nameRomaji} ({anchor.shiju.nameJa}), {anchor.shiju.labelItalian}
      </p>
      <p className="text-[11px] text-gray-500 leading-relaxed">{anchor.loreBody}</p>
      <p className="text-[11px] text-[var(--accent-violet-light)]/80 leading-relaxed italic">
        {anchor.gameplayHint}
      </p>
    </div>
  );
}

function SokaijuElementalsPanel({
  passives,
  rowProps,
}: {
  passives: SkiruDef[];
  rowProps: {
    sheet: SkiruSheet;
    canEdit?: boolean;
    expSpendable: number;
    expCostNextByNode?: Record<string, number | null>;
    raisingId: string | null;
    onRaise?: (skiruId: string) => void;
  };
}) {
  return (
    <div className="mt-3 rounded-md border border-[var(--accent-violet)]/25 bg-black/25 px-3 py-3 space-y-2">
      <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--accent-violet-light)] font-display">
        Gli Elementi (sotto la Comprensione — Gojū)
      </p>
      <p className="text-[11px] text-gray-500 leading-relaxed">{SOKAIJU_ELEMENTALS_INTRO}</p>
      <div className="space-y-2 pt-1">
        {passives.map((def) => (
          <SkiruNodeRow key={def.id} def={def} compact {...rowProps} />
        ))}
      </div>
    </div>
  );
}

function SkiruDomainIntro({ domain }: { domain: SkiruDomain }) {
  const meta = SKIRU_DOMAIN_LABELS[domain];
  if (!meta.description) return null;
  const accent = DOMAIN_ACCENT[domain];
  return (
    <div
      className={`rounded-lg border bg-black/30 px-4 py-3 ${accent.border}`}
    >
      <p className="font-display text-sm tracking-wide">
        <SkiruDisplayTitle
          italian={meta.nameItalian ?? meta.label}
          romaji={meta.label}
          kanji={meta.labelJa}
          accentClass={accent.text}
        />
      </p>
      <p className="mt-2 text-[11px] text-[var(--accent-violet-light)]/70 leading-relaxed">
        {meta.description}
      </p>
    </div>
  );
}

function SkiruSokaijuBranchContent({
  sheet,
  canEdit,
  expSpendable,
  expCostNextByNode,
  raisingId,
  onRaise,
  accent,
  byParent,
}: {
  sheet: SkiruSheet;
  canEdit?: boolean;
  expSpendable: number;
  expCostNextByNode?: Record<string, number | null>;
  raisingId: string | null;
  onRaise?: (skiruId: string) => void;
  accent: { border: string; text: string; glow: string };
  byParent: Map<string, SkiruDef[]>;
}) {
  const byId = useMemo(() => new Map(SKIRU_CATALOG.map((s) => [s.id, s])), []);
  const rowProps = {
    sheet,
    canEdit,
    expSpendable,
    expCostNextByNode,
    raisingId,
    onRaise,
  };

  return (
    <div className="space-y-2">
      {SOKAIJU_ANCHORS.map((anchor) => {
        const master = byId.get(anchor.id);
        if (!master) return null;
        const passives = byParent.get(anchor.id) ?? [];
        const anchorPoints =
          getSkiruPoints(sheet, master.id) +
          passives.reduce((sum, p) => sum + getSkiruPoints(sheet, p.id), 0);

        return (
          <SkiruDisclosure
            key={anchor.id}
            italian={`${anchor.anchor} · ${anchor.sectionTitle} — ${anchor.bodyAnchor}`}
            romaji={`${anchor.meiju.nameRomaji} / ${anchor.shiju.nameRomaji}`}
            kanji={`${anchor.meiju.nameJa} / ${anchor.shiju.nameJa}`}
            points={anchorPoints}
            accent={accent}
            defaultOpen={anchorPoints > 0}
            level="skill"
          >
            <SokaijuAnchorLore anchor={anchor} />
            <div className="rounded-md border border-[var(--border-color)]/50 bg-black/20 px-2.5 py-2 mb-3">
              <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-1">Formula · valore attuale</p>
              <p className="text-[10px] text-gray-500 leading-relaxed">{anchor.derivedFormula}</p>
              <p className="text-[11px] text-[var(--accent-gold)] font-display mt-1 tabular-nums">
                {formatSokaijuAnchorLiveValue(anchor.id, sheet)}
              </p>
            </div>
            <SkiruMasterGroup
              master={master}
              passives={anchor.id === "goju" ? [] : passives}
              accent={accent}
              {...rowProps}
            />
            {anchor.id === "goju" && passives.length > 0 ? (
              <SokaijuElementalsPanel passives={passives} rowProps={rowProps} />
            ) : null}
          </SkiruDisclosure>
        );
      })}
    </div>
  );
}

function SkiruBranchSection({
  branchId,
  sheet,
  domainFilter,
  canEdit,
  expSpendable,
  expCostNextByNode,
  raisingId,
  onRaise,
}: {
  branchId: string;
  sheet: SkiruSheet;
  domainFilter: SkiruDomain | "all";
  canEdit?: boolean;
  expSpendable: number;
  expCostNextByNode?: Record<string, number | null>;
  raisingId: string | null;
  onRaise?: (skiruId: string) => void;
}) {
  const branch = SKIRU_BRANCHES.find((b) => b.id === branchId);
  const { all, masters, byParent } = useMemo(() => groupBranchCatalog(branchId), [branchId]);

  if (!branch) return null;
  if (domainFilter !== "all" && branch.domain !== domainFilter) return null;

  const branchPoints = all.reduce((sum, n) => sum + getSkiruPoints(sheet, n.id), 0);
  if (all.length === 0) return null;

  const accent = DOMAIN_ACCENT[branch.domain];
  const rowProps = {
    sheet,
    canEdit,
    expSpendable,
    expCostNextByNode,
    raisingId,
    onRaise,
  };

  return (
    <SkiruDisclosure
      italian={branch.label}
      romaji={branch.labelRomaji}
      kanji={branch.labelJa}
      points={branchPoints}
      accent={accent}
      defaultOpen={branchPoints > 0}
      level="branch"
      intro={branch.description}
    >
      {branchId === "sokaiju" ? (
        <SkiruSokaijuBranchContent
          sheet={sheet}
          canEdit={canEdit}
          expSpendable={expSpendable}
          expCostNextByNode={expCostNextByNode}
          raisingId={raisingId}
          onRaise={onRaise}
          accent={accent}
          byParent={byParent}
        />
      ) : (
        masters.map((master) => (
          <SkiruMasterGroup
            key={master.id}
            master={master}
            passives={byParent.get(master.id) ?? []}
            accent={accent}
            {...rowProps}
          />
        ))
      )}
    </SkiruDisclosure>
  );
}

export type SkiruBranchScope = "standard" | "sokaiju";

export function SchedaSkiruPage({
  char,
  canEdit = false,
  onCharUpdate,
  branchScope = "standard",
}: {
  char: CharacterSummary;
  canEdit?: boolean;
  onCharUpdate?: () => void;
  branchScope?: SkiruBranchScope;
}) {
  const [domainFilter, setDomainFilter] = useState<SkiruDomain | "all">("all");
  const [raisingId, setRaisingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiData, setApiData] = useState<SkiruApiResponse | null>(null);
  const [loadingApi, setLoadingApi] = useState(false);

  const fallbackSheet = (char?.skiruSheet ?? {}) as SkiruSheet;
  const sheet = (canEdit && apiData ? apiData.skiruSheet : fallbackSheet) as SkiruSheet;
  const expSpendable =
    canEdit && apiData ? apiData.expSpendable : (char?.experienceSpendable ?? 0);
  const expCostNextByNode = canEdit ? apiData?.expCostNextByNode : undefined;
  const derivedFromChar = useMemo(() => resolveCharacterComputed(char?.computed), [char?.computed]);
  const derivedFromSheet = useMemo(() => calculateSkiruDerivedStats(sheet), [sheet]);
  const derived = useMemo(() => {
    if (canEdit && apiData) return apiData.derived;

    const hpMax = derivedFromChar.hpMax > 0 ? derivedFromChar.hpMax : derivedFromSheet.hpMax;

    return {
      hpMax,
      hpCurrent: derivedFromChar.hpMax > 0 ? derivedFromChar.hpCurrent : hpMax,
      mitigationPercent:
        derivedFromChar.mitigationPercent > 0
          ? derivedFromChar.mitigationPercent
          : derivedFromSheet.mitigationPercent,
      movementMetersPerQuarter:
        derivedFromChar.movementMeters > 0
          ? derivedFromChar.movementMeters
          : derivedFromSheet.movementMetersPerQuarter,
      cac: derivedFromSheet.cac,
      cad: derivedFromSheet.cad,
    };
  }, [apiData, canEdit, derivedFromChar, derivedFromSheet]);

  const totalInvested = useMemo(() => totalSkiruPointsInvested(sheet), [sheet]);
  const branchIds = useMemo(() => {
    const all = [...new Set(SKIRU_BRANCHES.map((b) => b.id))];
    if (branchScope === "sokaiju") return all.filter((id) => id === "sokaiju");
    return all.filter((id) => id !== "sokaiju");
  }, [branchScope]);

  const sokaijuCatalog = useMemo(
    () => (branchScope === "sokaiju" ? groupBranchCatalog("sokaiju") : null),
    [branchScope],
  );

  const listItems = useMemo(() => {
    const items: Array<
      | { kind: "domain"; domain: SkiruDomain }
      | { kind: "branch"; branchId: string }
    > = [];
    let lastDomain: SkiruDomain | null = null;
    for (const branchId of branchIds) {
      const branch = SKIRU_BRANCHES.find((b) => b.id === branchId);
      if (!branch) continue;
      if (domainFilter !== "all" && branch.domain !== domainFilter) continue;
      if (branch.domain !== lastDomain) {
        if (SKIRU_DOMAIN_LABELS[branch.domain].description) {
          items.push({ kind: "domain", domain: branch.domain });
        }
        lastDomain = branch.domain;
      }
      items.push({ kind: "branch", branchId });
    }
    return items;
  }, [branchIds, domainFilter]);

  const loadSkiruApi = useCallback(async () => {
    if (!canEdit) return;
    setLoadingApi(true);
    setError(null);
    try {
      const data = await api.get("/characters/me/skiru");
      if (isSkiruApiResponse(data)) {
        setApiData(data);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Errore caricamento Skiru");
    } finally {
      setLoadingApi(false);
    }
  }, [canEdit]);

  useEffect(() => {
    loadSkiruApi();
  }, [loadSkiruApi]);

  useEffect(() => {
    const onHp = () => {
      if (canEdit) void loadSkiruApi();
    };
    window.addEventListener("characterHpUpdated", onHp);
    return () => window.removeEventListener("characterHpUpdated", onHp);
  }, [canEdit, loadSkiruApi]);

  const handleRaise = async (skiruId: string): Promise<void> => {
    const current = getSkiruPoints(sheet, skiruId);
    const targetPoints = current + 1;
    setError(null);
    setRaisingId(skiruId);
    try {
      const data = await api.patch("/characters/me/skiru", { skiruId, targetPoints });
      if (!isSkiruApiResponse(data)) {
        throw new Error("Risposta Skiru non valida dal server.");
      }
      setApiData(data);
      onCharUpdate?.();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Errore aggiornamento Skiru";
      setError(message);
      throw e instanceof Error ? e : new Error(message);
    } finally {
      setRaisingId(null);
    }
  };

  if (branchScope === "sokaiju") {
    return (
      <div className="flex flex-col h-full min-h-0 animate__animated animate__fadeIn">
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="px-4 md:px-6 pt-4 md:pt-6 pb-8 space-y-4">
            <div>
              <h2 className="font-display text-xl text-[var(--accent-gold)] mb-1">Sōkaiju</h2>
              <p className="text-[11px] text-[var(--accent-violet-light)]/70 max-w-xl">
                Il Doppio Albero dei Mondi — undici ancoraggi Meiju|Shiju. Nodi passivi: il motore applica gli
                automatismi in combattimento.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] uppercase tracking-widest text-gray-500 mr-1">Dominio</span>
              <span className="px-3 py-1.5 rounded border border-[var(--accent-violet)]/40 text-[10px] font-display uppercase tracking-wider text-[var(--accent-violet-light)] bg-black/40">
                Jin · {SKIRU_DOMAIN_LABELS.jin.labelJa}
              </span>
            </div>

            {loadingApi && canEdit && (
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-display">Sincronizzazione API…</p>
            )}

            {error && (
              <p className="text-[11px] text-red-400/90 border border-red-500/30 rounded-md px-3 py-2">{error}</p>
            )}

            {!canEdit && (
              <p className="text-[10px] text-gray-500 border border-dashed border-[var(--border-color)] rounded-md px-3 py-2 font-display uppercase tracking-[0.14em]">
                Visualizzazione sola lettura
              </p>
            )}

            <SokaijuCombatAutomationsPanel sheet={sheet} />

            {sokaijuCatalog ? (
              <>
                <SokaijuIntroPanel />
                <SkiruSokaijuBranchContent
                  sheet={sheet}
                  canEdit={canEdit}
                  expSpendable={expSpendable}
                  expCostNextByNode={expCostNextByNode}
                  raisingId={raisingId}
                  onRaise={canEdit ? handleRaise : undefined}
                  accent={DOMAIN_ACCENT.jin}
                  byParent={sokaijuCatalog.byParent}
                />
              </>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 animate__animated animate__fadeIn">
      <div className="shrink-0 z-20 border-b border-[var(--border-color)] bg-[var(--background)]/95 backdrop-blur-sm px-4 md:px-6 pt-4 md:pt-6 pb-4 space-y-4">
        <div>
          <h2 className="font-display text-xl text-[var(--accent-gold)] mb-1">Skiru</h2>
          <p className="text-[11px] text-[var(--accent-violet-light)]/70 max-w-xl">
            Albero competenze Ten · Chi · Jin. Max 10 punti per nodo standard; passive a punto unico.
          </p>
        </div>

        <SkiruStatsBar totalInvested={totalInvested} expSpendable={expSpendable} derived={derived} />

        {loadingApi && canEdit && (
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-display">Sincronizzazione API…</p>
        )}

        {error && (
          <p className="text-[11px] text-red-400/90 border border-red-500/30 rounded-md px-3 py-2">{error}</p>
        )}

        {!canEdit && (
          <p className="text-[10px] text-gray-500 border border-dashed border-[var(--border-color)] rounded-md px-3 py-2 font-display uppercase tracking-[0.14em]">
            Visualizzazione sola lettura
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[9px] uppercase tracking-widest text-gray-500 mr-1">Dominio</span>
          <button
            type="button"
            onClick={() => setDomainFilter("all")}
            className={`px-3 py-1.5 rounded border text-[10px] font-display uppercase tracking-wider transition-colors ${
              domainFilter === "all"
                ? "border-[var(--accent-gold)] text-[var(--accent-gold)] bg-[var(--accent-gold)]/10"
                : "border-[var(--border-color)] text-gray-500 hover:border-gray-600"
            }`}
          >
            Tutti
          </button>
          {DOMAIN_ORDER.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDomainFilter(d)}
              className={`px-3 py-1.5 rounded border text-[10px] font-display uppercase tracking-wider transition-colors ${
                domainFilter === d
                  ? `${DOMAIN_ACCENT[d].border} ${DOMAIN_ACCENT[d].text} bg-black/40`
                  : "border-[var(--border-color)] text-gray-500 hover:border-gray-600"
              }`}
            >
              {SKIRU_DOMAIN_LABELS[d].label}
              <span className="ml-1 opacity-50">({SKIRU_DOMAIN_LABELS[d].labelJa})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 md:px-6 py-4 space-y-3 pb-8">
        {listItems.map((item) =>
          item.kind === "domain" ? (
            <SkiruDomainIntro key={`domain-${item.domain}`} domain={item.domain} />
          ) : (
            <SkiruBranchSection
              key={item.branchId}
              branchId={item.branchId}
              sheet={sheet}
              domainFilter={domainFilter}
              canEdit={canEdit}
              expSpendable={expSpendable}
              expCostNextByNode={expCostNextByNode}
              raisingId={raisingId}
              onRaise={canEdit ? handleRaise : undefined}
            />
          ),
        )}
      </div>
    </div>
  );
}
