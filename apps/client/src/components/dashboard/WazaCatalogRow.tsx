"use client";

import { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import { WazaTaxonomyChips, stripWazaBranchHeader } from "./WazaTaxonomyChips";
import { WazaBracketProse } from "./WazaBracketProse";
import { parseWazaTierFromRank, wazaTierMeta } from "./waza-display";
import { resolveWazaPersonalValues, type WazaPersonalValues } from "@domain/combat/waza-resolve";
import {
  formatWazaGradeRequirementLabel,
  resolveWazaRequiredGrade,
} from "@domain/progression/waza-grade-req";
import type { SkiruSheet } from "@domain/skiru";
import type { WazaResolveExtras } from "@/hooks/useDoMechanicsSnapshot";
import type { CatalogWaza } from "./waza-catalog-types";

function WazaPersonalValuesBlock({ values }: { values: WazaPersonalValues }) {
  return (
    <div
      className="mt-3 rounded border border-[var(--accent-violet)]/25 bg-[var(--accent-violet)]/5 px-3 py-2.5"
      aria-label="Valori calcolati dalla tua scheda Skiru"
    >
      <p className="text-[9px] font-display uppercase tracking-[0.18em] text-[var(--accent-violet-light)] mb-2">
        Valori per te
      </p>
      <ul className="space-y-1.5">
        {values.lines.map((line) => (
          <li key={line.label} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-[11px]">
            <span className="text-[var(--foreground)]/65">{line.label}</span>
            <span
              className="font-display tabular-nums text-[var(--accent-gold)]"
              title={line.hint}
            >
              {line.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WazaCatalogRow({
  waza,
  branchUnlocked,
  isKeystone,
  keystoneLabel,
  index,
  onPurchase,
  purchasing,
  skiruSheet,
  resolveExtras: resolveExtrasProp,
  lockedHint,
}: {
  waza: CatalogWaza;
  branchUnlocked: boolean;
  isKeystone: boolean;
  keystoneLabel?: string;
  index: number;
  onPurchase: (id: string) => void;
  purchasing: boolean;
  skiruSheet?: SkiruSheet | null;
  resolveExtras?: WazaResolveExtras;
  lockedHint?: string;
}) {
  const tier = parseWazaTierFromRank(waza.rank ?? null);
  const tierInfo = tier != null ? wazaTierMeta(tier) : null;
  const flavor = waza.description?.trim() ? stripWazaBranchHeader(waza.description) : "";
  const effect = waza.effect?.trim() || "";
  const requiredGrade = resolveWazaRequiredGrade({
    poolId: waza.poolId,
    description: waza.description,
    effect: waza.effect,
  });
  const personalValues = useMemo(() => {
    if (!skiruSheet || !waza.poolId) return null;
    return resolveWazaPersonalValues(waza.poolId, {
      sheet: skiruSheet,
      wazaTier: tier,
      isConstructWaza:
        (waza.description?.includes("[Costrutto]") ?? false) ||
        (waza.effect?.includes("[Costrutto]") ?? false),
      styleId: waza.styleId,
      description: waza.description,
      ...resolveExtrasProp,
    });
  }, [skiruSheet, waza.poolId, waza.description, waza.effect, waza.styleId, tier, resolveExtrasProp]);
  const dimmed = !waza.owned && !branchUnlocked;
  const canBuy = branchUnlocked && !!waza.canPurchase && !waza.owned;
  const cardTone = waza.owned
    ? "waza-do-card--owned border-[var(--accent-gold)]/35 bg-[var(--accent-gold)]/5"
    : dimmed
    ? "border-[var(--border-color)]/35 bg-black/10 opacity-55"
    : "waza-do-card--available border-[var(--border-color)] bg-black/25 hover:border-[var(--accent-violet)]/40 hover:shadow-[var(--shadow-violet)]";
  const btnClass =
    "shrink-0 px-3 py-1.5 rounded border text-[10px] font-display uppercase tracking-wide transition-colors disabled:opacity-50";

  return (
    <article
      className={`waza-do-card rounded-md border pl-3.5 pr-3 py-3 ${cardTone} ${
        isKeystone ? "waza-do-card--keystone" : ""
      } waza-do-list-enter motion-reduce:animate-none`}
      style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h4
              className={`text-sm font-display leading-snug ${
                dimmed && !waza.owned
                  ? "text-[var(--foreground)]/45"
                  : "text-[var(--foreground)]"
              }`}
            >
              {waza.name}
            </h4>
            {isKeystone && (
              <span className="text-[8px] uppercase tracking-wider text-[var(--accent-gold)] border border-[var(--accent-gold)]/45 rounded px-1.5 py-0.5 font-display shadow-[var(--shadow-gold)]">
                Keystone
              </span>
            )}
            {waza.isPassive && !isKeystone && (
              <span className="text-[8px] uppercase tracking-wider text-[var(--accent-violet-light)] border border-[var(--accent-violet)]/30 rounded px-1.5 py-0.5 font-display">
                Passiva
              </span>
            )}
            {waza.owned && (
              <span className="text-[8px] uppercase tracking-wider text-[var(--accent-gold)] border border-[var(--accent-gold)]/40 rounded px-1.5 py-0.5 font-display">
                Appresa
              </span>
            )}
            {requiredGrade && (
              <span className="text-[8px] uppercase tracking-wider text-[var(--accent-gold)]/90 border border-[var(--accent-gold)]/35 rounded px-1.5 py-0.5 font-display">
                {formatWazaGradeRequirementLabel(requiredGrade)}
              </span>
            )}
            {waza.costExp != null && waza.costExp > 0 && !waza.owned && (
              <span
                className={`text-[10px] tabular-nums font-display ${
                  dimmed ? "text-[var(--foreground)]/35" : "text-[var(--accent-gold)]"
                }`}
              >
                {waza.costExp} EXP
              </span>
            )}
          </div>

          {(flavor || effect) && (
            <>
              <WazaTaxonomyChips description={waza.description} effect={waza.effect} />
              {flavor ? (
                <WazaBracketProse text={flavor} className="mt-2 waza-description whitespace-pre-line" />
              ) : null}
              {effect ? (
                <WazaBracketProse
                  text={effect}
                  className="mt-2 waza-description whitespace-pre-line text-[var(--foreground)]/75"
                />
              ) : null}
            </>
          )}

          {personalValues && <WazaPersonalValuesBlock values={personalValues} />}

          {tierInfo && (
            <p className="mt-2 text-[9px] font-display uppercase tracking-wider text-[var(--foreground)]/45">
              <span className="text-[var(--accent-gold)]">T{tierInfo.tier}</span>
              <span className="mx-1.5 opacity-40">·</span>
              {tierInfo.csCost} CS
            </p>
          )}

          {isKeystone && !waza.owned && keystoneLabel && (
            <p className="mt-2 text-[9px] text-[var(--accent-gold)]/85 font-display uppercase tracking-wider">
              Passiva fondamentale · {keystoneLabel}
            </p>
          )}

          {dimmed && !waza.owned && (
            <p className="mt-2 text-[10px] text-[var(--accent-violet-light)]/70 italic flex items-center gap-1.5">
              <FontAwesomeIcon icon={icons.lock} className="w-2.5 h-2.5 shrink-0 opacity-70" />
              {lockedHint ?? "Ramo non sbloccato — solo consultazione."}
            </p>
          )}
          {!dimmed && !waza.owned && !waza.canPurchase && waza.hexagonBlockedReason && (
            <p className="mt-2 text-[10px] text-[var(--accent-violet-light)]/75 italic">
              {waza.hexagonBlockedReason}
            </p>
          )}
        </div>

        {canBuy && (
          <button
            type="button"
            disabled={purchasing}
            onClick={() => onPurchase(waza.id)}
            className={`${btnClass} border-[var(--accent-gold)] text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/10 hover:shadow-[var(--shadow-gold)]`}
          >
            {purchasing ? "…" : "Acquista"}
          </button>
        )}
      </div>
    </article>
  );
}
