"use client";

import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import { api } from "@/lib/api";
import { parseWazaTierFromRank, wazaTierMeta } from "./waza-display";
import { WazaTaxonomyChips, stripWazaBranchHeader } from "./WazaTaxonomyChips";
import { WazaBracketProse } from "./WazaBracketProse";
import {
  formatWazaGradeRequirementLabel,
  resolveWazaRequiredGrade,
} from "@domain/progression/waza-grade-req";
import { WazaByFamilySections } from "./WazaByFamilySections";

export type CharacterWaza = {
  id: string;
  name: string;
  description?: string | null;
  effect?: string | null;
  type?: string | null;
  costJigoka?: number | null;
  level?: number | null;
  rank?: string | null;
  isPassive?: boolean | null;
  styleId?: string | null;
  madoshoId?: string | null;
  poolId?: string | null;
};

function wazaEndpoint(characterId: string | undefined, isOwnCharacter: boolean): string | null {
  if (isOwnCharacter) return "/characters/me/waza";
  if (characterId) return `/characters/${characterId}/waza`;
  return null;
}

function WazaRegistroSkeleton() {
  return (
    <div className="p-4 space-y-4" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-20 rounded-md waza-do-skeleton opacity-75" />
      ))}
    </div>
  );
}

function WazaCard({ waza }: { waza: CharacterWaza }) {
  const tier = parseWazaTierFromRank(waza.rank);
  const tierInfo = tier != null ? wazaTierMeta(tier) : null;
  const flavor = waza.description?.trim() ? stripWazaBranchHeader(waza.description) : "";
  const effect = waza.effect?.trim() || "";
  const requiredGrade = resolveWazaRequiredGrade({
    poolId: waza.poolId,
    description: waza.description,
    effect: waza.effect,
  });

  return (
    <article className="waza-do-card waza-do-card--owned rounded-md border border-[var(--accent-gold)]/30 bg-[var(--accent-gold)]/5 pl-3.5 pr-3 py-3 shadow-[var(--shadow-gold)] hover:border-[var(--accent-gold)]/45 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-display text-sm text-[var(--foreground)] leading-snug">{waza.name}</h3>
        <div className="flex shrink-0 flex-wrap items-center gap-1 justify-end">
          {waza.isPassive && (
            <span className="text-[8px] uppercase tracking-wider text-[var(--accent-violet-light)] border border-[var(--accent-violet)]/30 rounded px-1.5 py-0.5 font-display">
              Dō
            </span>
          )}
          <span className="text-[8px] uppercase tracking-[0.16em] text-[var(--accent-gold)] font-display border border-[var(--accent-gold)]/35 rounded px-1.5 py-0.5 tabular-nums">
            Lv {waza.level ?? 1}
          </span>
        </div>
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
              className="mt-2 waza-description whitespace-pre-line text-[var(--accent-violet-light)]/90"
            />
          ) : null}
        </>
      )}
      {requiredGrade && (
        <p className="mt-2 text-[9px] font-display uppercase tracking-wider text-[var(--accent-gold)]/80">
          {formatWazaGradeRequirementLabel(requiredGrade)}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[9px] font-display uppercase tracking-wider">
        {tierInfo && (
          <>
            <span className="text-[var(--accent-gold)] border border-[var(--accent-gold)]/30 bg-[var(--accent-gold)]/10 rounded px-2 py-0.5">
              T{tierInfo.tier}
            </span>
            <span className="text-[var(--accent-violet-light)] tabular-nums">{tierInfo.csCost} CS</span>
            <span className="text-[var(--foreground)]/40 tabular-nums">{tierInfo.damage} danno</span>
          </>
        )}
        {waza.type && (
          <span className="text-[var(--accent-violet-light)] border border-[var(--accent-violet)]/25 bg-[var(--accent-violet)]/10 rounded px-2 py-0.5">
            {waza.type}
          </span>
        )}
        {waza.rank && !tierInfo && (
          <span className="text-[var(--foreground)]/45 border border-[var(--border-color)] rounded px-2 py-0.5">
            {waza.rank}
          </span>
        )}
        {waza.costJigoka != null && waza.costJigoka > 0 && (
          <span className="text-[var(--foreground)]/40 tabular-nums" title="Costo legacy pre-v3">
            {waza.costJigoka} JIG
          </span>
        )}
      </div>
    </article>
  );
}

export function SchedaWazaPage({
  characterId,
  isOwnCharacter = false,
  activeOnly = false,
  embedded = false,
}: {
  characterId?: string;
  isOwnCharacter?: boolean;
  /** Esclude Waza passive (loadout in PassiveSlotsPanel). */
  activeOnly?: boolean;
  /** Blocco compatto nel pannello Skiru & Waza */
  embedded?: boolean;
}) {
  const [skills, setSkills] = useState<CharacterWaza[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const endpoint = useMemo(
    () => wazaEndpoint(characterId, isOwnCharacter),
    [characterId, isOwnCharacter],
  );

  useEffect(() => {
    if (!endpoint) {
      setLoading(false);
      setSkills([]);
      return;
    }
    setLoading(true);
    setError(null);
    api
      .get(endpoint)
      .then((d) => {
        let list = Array.isArray(d) ? (d as CharacterWaza[]) : [];
        if (activeOnly) list = list.filter((w) => !w.isPassive);
        setSkills(list);
      })
      .catch((e: unknown) => {
        setSkills([]);
        setError(e instanceof Error ? e.message : "Errore caricamento Waza");
      })
      .finally(() => setLoading(false));
  }, [endpoint, activeOnly]);

  return (
    <div
      className={
        embedded
          ? "px-4 md:px-5 pt-3 pb-2 animate__animated animate__fadeIn motion-reduce:animate-none"
          : "p-4 md:p-6 space-y-5 min-h-full box-border animate__animated animate__fadeIn motion-reduce:animate-none"
      }
    >
      <div className={`border-b border-[var(--border-color)]/70 ${embedded ? "pb-2 mb-2" : "pb-3"}`}>
        <h2
          className={`font-display text-[var(--accent-gold)] flex items-center gap-2 tracking-wide ${
            embedded ? "text-sm uppercase tracking-[0.18em]" : "text-xl"
          }`}
        >
          <FontAwesomeIcon
            icon={icons.waza}
            className={embedded ? "w-3.5 h-3.5 text-[var(--accent-violet-light)]" : "w-4 h-4 text-[var(--accent-violet-light)]"}
          />
          {embedded ? "Waza apprese" : "Waza"}
        </h2>
        <p className={`text-[var(--accent-violet-light)]/80 mt-1 ${embedded ? "text-xs" : "text-sm"}`}>
          {embedded
            ? "Le tecniche che possiedi · per famiglia (Generiche, Dō, Madoshō, Ordine, Oni no Mori)"
            : "Tecniche apprese · tier T1–T5 · raggruppate per famiglia"}
        </p>
      </div>

      {error && (
        <p className="text-sm text-[var(--accent-red)]/90 border border-[var(--accent-red)]/35 rounded-md px-3 py-2 bg-black/30">
          {error}
        </p>
      )}

      <div
        className={`waza-do-panel rounded-lg border border-[var(--border-color)] bg-[var(--panel-bg)]/90 overflow-hidden ${
          embedded ? "max-h-[34vh] overflow-y-auto" : ""
        }`}
      >
        <header className="px-4 py-2.5 border-b border-[var(--border-color)]/70 bg-gradient-to-r from-black/70 to-[var(--accent-violet)]/5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent-violet-light)]/70 font-display">
            Registro Waza
          </p>
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--accent-gold)] font-display tabular-nums">
            {loading ? "…" : `${skills.length} ${skills.length === 1 ? "tecnica" : "tecniche"}`}
          </p>
        </header>

        <div className={embedded ? "p-3" : "p-4"}>
          {loading ? (
            <WazaRegistroSkeleton />
          ) : (
            <WazaByFamilySections
              items={skills}
              getKey={(s) => s.id}
              getName={(s) => s.name}
              isPassive={(s) => !!s.isPassive}
              resolveSkill={(s) => s}
              renderItem={(s) => <WazaCard waza={s} />}
              emptyMessage="Nessuna Waza registrata. Le tecniche apprese compariranno qui con livello e costi."
            />
          )}
        </div>
      </div>
    </div>
  );
}
