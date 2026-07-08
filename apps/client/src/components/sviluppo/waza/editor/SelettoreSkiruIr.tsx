"use client";

import { useMemo } from "react";
import {
  getSkiruDef,
  SKIRU_BRANCHES,
  SKIRU_CATALOG,
  type SkiruDef,
} from "@domain/skiru/catalog";

type SkiruGroup =
  | { kind: "branch"; branchId: string; label: string; domain: string }
  | { kind: "parent"; parentId: string; label: string }
  | { kind: "skiru"; skiru: SkiruDef };

function labelForSkiru(skiru: SkiruDef): string {
  if (skiru.nameRomaji) return `${skiru.name} (${skiru.nameRomaji})`;
  return skiru.name;
}

function buildSkiruGroups(allowed: Set<string>): SkiruGroup[] {
  const groups: SkiruGroup[] = [];

  for (const branch of SKIRU_BRANCHES) {
    const inBranch = SKIRU_CATALOG.filter(
      (s) => s.branchId === branch.id && allowed.has(s.id),
    );
    if (inBranch.length === 0) continue;

    groups.push({
      kind: "branch",
      branchId: branch.id,
      label: `${branch.labelRomaji ?? branch.label} · ${branch.label}`,
      domain: branch.domain,
    });

    if (branch.id === "toso") {
      const parents = inBranch.filter((s) => !s.parentSkiruId);
      const children = inBranch.filter((s) => s.parentSkiruId);

      for (const parent of parents) {
        groups.push({
          kind: "parent",
          parentId: parent.id,
          label: parent.nameRomaji ?? parent.name,
        });
        groups.push({ kind: "skiru", skiru: parent });
        for (const child of children.filter((c) => c.parentSkiruId === parent.id)) {
          groups.push({ kind: "skiru", skiru: child });
        }
      }

      const orphans = children.filter(
        (c) => c.parentSkiruId && !parents.some((p) => p.id === c.parentSkiruId),
      );
      for (const skiru of orphans) {
        groups.push({ kind: "skiru", skiru });
      }
    } else {
      for (const skiru of inBranch) {
        groups.push({ kind: "skiru", skiru });
      }
    }
  }

  return groups;
}

export function SelettoreSkiruIr({
  value,
  onChange,
  disabled,
  required,
  allowedSlugs,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  required?: boolean;
  allowedSlugs: string[];
}) {
  const allowed = useMemo(() => new Set(allowedSlugs), [allowedSlugs]);
  const groups = useMemo(() => buildSkiruGroups(allowed), [allowed]);

  const toggle = (slug: string) => {
    if (disabled) return;
    const has = value.includes(slug);
    onChange(has ? value.filter((s) => s !== slug) : [...value, slug].sort());
  };

  if (allowedSlugs.length === 0) {
    return (
      <p className="text-xs text-[var(--accent-violet-light)]/70">
        Vocabolario Skiru non disponibile — esegui{" "}
        <code className="text-[10px]">bun run seed-vocabolari-skiru</code> sul server.
      </p>
    );
  }
  let currentBranch = "";
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-[10px] uppercase tracking-wider text-[var(--accent-violet-light)]/70">
          Skiru papabili per l&apos;IR
          {required && <span className="text-[var(--accent-gold)]"> *</span>}
        </span>
        {value.length > 0 && (
          <span className="text-[10px] text-gray-500">
            {value.length} selezionat{value.length === 1 ? "a" : "e"}
          </span>
        )}
      </div>
      <p className="text-[10px] text-gray-500 leading-relaxed">
        Skiru ammissibili per il calcolo dell&apos;Indice di Riuscita al lancio. Il giocatore
        ne sceglierà una in combattimento (media con incanalamento — modulo combattimento).
      </p>

      <div className="rounded border border-[var(--border-color)] bg-black/20 p-3 max-h-72 overflow-y-auto space-y-1">
        {groups.map((group, index) => {
          if (group.kind === "branch") {
            const domainLabel =
              group.domain === "ten" ? "Ten" : group.domain === "chi" ? "Chi" : "Jin";
            return (
              <p
                key={`branch-${group.branchId}`}
                className={`text-[10px] uppercase tracking-wider font-display text-[var(--accent-gold)] ${
                  index > 0 ? "pt-2 mt-2 border-t border-[var(--border-color)]/40" : ""
                }`}
              >
                {domainLabel} · {group.label}
              </p>
            );
          }

          if (group.kind === "parent") {
            return (
              <p
                key={`parent-${group.parentId}`}
                className="text-[10px] font-display text-[var(--accent-violet-light)] pl-2 pt-1"
              >
                {group.label}
              </p>
            );
          }

          const skiru = group.skiru;
          const active = value.includes(skiru.id);
          const isChild = Boolean(skiru.parentSkiruId);
          const def = getSkiruDef(skiru.id);

          return (
            <label
              key={skiru.id}
              className={`flex items-start gap-2 py-1 cursor-pointer ${isChild ? "pl-5" : "pl-2"} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <input
                type="checkbox"
                checked={active}
                disabled={disabled}
                onChange={() => toggle(skiru.id)}
                className="mt-0.5 rounded border-[var(--border-color)]"
              />
              <span className="text-xs leading-snug">
                <span
                  className={
                    active ? "text-[var(--accent-gold)]" : "text-[var(--accent-violet-light)]"
                  }
                >
                  {labelForSkiru(def ?? skiru)}
                </span>
                <span className="text-[10px] text-gray-500 font-mono ml-1">{skiru.id}</span>
              </span>
            </label>
          );
        })}
      </div>

      {required && value.length === 0 && (
        <p className="text-[10px] text-[var(--accent-gold)]/80">
          Le waza attive richiedono almeno una Skiru papabile (avviso in validazione se assente).
        </p>
      )}
    </div>
  );
}
