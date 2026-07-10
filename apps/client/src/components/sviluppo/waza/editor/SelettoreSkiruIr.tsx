"use client";

import { useMemo, useState } from "react";
import {
  getSkiruDef,
  mergeCatalogWithSkiruVocab,
  SKIRU_BRANCHES,
  type SkiruDef,
} from "@domain/skiru/catalog";
import { BottomSheet } from "./BottomSheet";

type SkiruGroup =
  | { kind: "branch"; branchId: string; label: string; domain: string }
  | { kind: "parent"; parentId: string; label: string }
  | { kind: "skiru"; skiru: SkiruDef };

type SkiruTreeItem = { skiru: SkiruDef; isChild: boolean; parentLabel?: string };
type SkiruBranchNode = {
  branchId: string;
  domainLabel: string;
  label: string;
  items: SkiruTreeItem[];
};

function labelForSkiru(skiru: SkiruDef): string {
  if (skiru.nameRomaji) return `${skiru.name} (${skiru.nameRomaji})`;
  return skiru.name;
}

function domainLabelFor(domain: string): string {
  return domain === "ten" ? "Ten" : domain === "chi" ? "Chi" : "Jin";
}

/** Albero per-branch (mantiene la nidificazione Tōsō) usato dal bottom-sheet mobile. */
function buildSkiruTree(allowed: Set<string>, catalog: SkiruDef[]): SkiruBranchNode[] {
  const nodes: SkiruBranchNode[] = [];
  for (const branch of SKIRU_BRANCHES) {
    const inBranch = catalog.filter((s) => s.branchId === branch.id && allowed.has(s.id));
    if (inBranch.length === 0) continue;

    const items: SkiruTreeItem[] = [];
    if (branch.id === "toso") {
      const parents = inBranch.filter((s) => !s.parentSkiruId);
      const children = inBranch.filter((s) => s.parentSkiruId);
      for (const parent of parents) {
        const parentLabel = parent.nameRomaji ?? parent.name;
        items.push({ skiru: parent, isChild: false });
        for (const child of children.filter((c) => c.parentSkiruId === parent.id)) {
          items.push({ skiru: child, isChild: true, parentLabel });
        }
      }
      const orphans = children.filter(
        (c) => c.parentSkiruId && !parents.some((p) => p.id === c.parentSkiruId),
      );
      for (const skiru of orphans) items.push({ skiru, isChild: true });
    } else {
      for (const skiru of inBranch) items.push({ skiru, isChild: false });
    }

    nodes.push({
      branchId: branch.id,
      domainLabel: domainLabelFor(branch.domain),
      label: `${branch.labelRomaji ?? branch.label} · ${branch.label}`,
      items,
    });
  }
  return nodes;
}

function matchesQuery(skiru: SkiruDef, q: string): boolean {
  if (!q) return true;
  const hay = `${skiru.name} ${skiru.nameRomaji ?? ""} ${skiru.id}`.toLowerCase();
  return hay.includes(q);
}

function buildSkiruGroups(allowed: Set<string>, catalog: SkiruDef[]): SkiruGroup[] {
  const groups: SkiruGroup[] = [];

  for (const branch of SKIRU_BRANCHES) {
    const inBranch = catalog.filter(
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
  skiruVocab = [],
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  required?: boolean;
  allowedSlugs: string[];
  skiruVocab?: Array<{ valore: string; extra?: Record<string, unknown> | null }>;
}) {
  const allowed = useMemo(() => new Set(allowedSlugs), [allowedSlugs]);
  const effectiveCatalog = useMemo(
    () => mergeCatalogWithSkiruVocab(allowedSlugs, skiruVocab),
    [allowedSlugs, skiruVocab],
  );
  const catalogById = useMemo(
    () => new Map(effectiveCatalog.map((s) => [s.id, s])),
    [effectiveCatalog],
  );
  const resolveSkiru = (slug: string) => catalogById.get(slug) ?? getSkiruDef(slug);
  const groups = useMemo(() => buildSkiruGroups(allowed, effectiveCatalog), [allowed, effectiveCatalog]);
  const tree = useMemo(() => buildSkiruTree(allowed, effectiveCatalog), [allowed, effectiveCatalog]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const q = query.trim().toLowerCase();

  const toggle = (slug: string) => {
    if (disabled) return;
    const has = value.includes(slug);
    onChange(has ? value.filter((s) => s !== slug) : [...value, slug].sort());
  };

  const toggleCollapse = (branchId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(branchId)) next.delete(branchId);
      else next.add(branchId);
      return next;
    });
  };

  if (allowedSlugs.length === 0) {
    return (
      <p className="text-xs text-[var(--accent-violet-light)]/70">
        Vocabolario Skiru non disponibile — esegui{" "}
        <code className="text-[10px]">bun run seed-vocabolari-skiru</code> sul server.
      </p>
    );
  }
  const selezione = (
    <>
      {value.length > 0 && (
        <span className="text-[10px] text-gray-500">
          {value.length} selezionat{value.length === 1 ? "a" : "e"}
        </span>
      )}
    </>
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-[10px] uppercase tracking-wider text-[var(--accent-violet-light)]/70">
          Skiru papabili per l&apos;IR
          {required && <span className="text-[var(--accent-gold)]"> *</span>}
        </span>
        {selezione}
      </div>
      <p className="text-[10px] text-gray-500 leading-relaxed">
        Skiru ammissibili per il calcolo dell&apos;Indice di Riuscita al lancio. Il giocatore
        ne sceglierà una in combattimento (media con incanalamento — modulo combattimento).
      </p>

      {/* Mobile: trigger + bottom-sheet con ricerca e gruppi collassabili */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setSheetOpen(true)}
        className="md:hidden w-full flex items-center justify-between px-3 min-h-[44px] rounded border border-[var(--border-color)] bg-black/20 text-sm text-left disabled:opacity-60"
      >
        <span className="text-[var(--accent-violet-light)]">
          {value.length > 0 ? `${value.length} Skiru selezionate` : "Scegli le Skiru papabili"}
        </span>
        <span className="text-[var(--accent-gold)]">Apri</span>
      </button>

      {value.length > 0 && (
        <div className="md:hidden flex flex-wrap gap-1">
          {value.map((slug) => {
            const def = resolveSkiru(slug);
            return (
              <span
                key={slug}
                className="text-[10px] px-2 py-0.5 rounded border border-[var(--accent-gold)]/40 text-[var(--accent-gold)]"
              >
                {def?.nameRomaji ?? def?.name ?? slug}
              </span>
            );
          })}
        </div>
      )}

      <BottomSheet
        open={sheetOpen && !disabled}
        onClose={() => setSheetOpen(false)}
        title="Skiru papabili per l'IR"
        header={
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca Skiru…"
            className="w-full px-3 min-h-[44px] rounded border border-[var(--border-color)] bg-[var(--background)] text-sm"
          />
        }
      >
        <div className="space-y-2">
          {tree.map((branch) => {
            const visibleItems = branch.items.filter((it) => matchesQuery(it.skiru, q));
            if (visibleItems.length === 0) return null;
            const isCollapsed = q === "" && collapsed.has(branch.branchId);
            const selInBranch = branch.items.filter((it) => value.includes(it.skiru.id)).length;
            return (
              <div key={branch.branchId} className="border-t border-[var(--border-color)]/40 pt-2">
                <button
                  type="button"
                  onClick={() => toggleCollapse(branch.branchId)}
                  className="w-full flex items-center justify-between gap-2 min-h-[44px] text-left"
                >
                  <span className="text-[10px] uppercase tracking-wider font-display text-[var(--accent-gold)]">
                    {branch.domainLabel} · {branch.label}
                    {selInBranch > 0 && (
                      <span className="ml-2 text-[var(--accent-violet-light)]">({selInBranch})</span>
                    )}
                  </span>
                  <span className="text-gray-500 text-xs">{isCollapsed ? "▸" : "▾"}</span>
                </button>
                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {visibleItems.map((it) => {
                      const active = value.includes(it.skiru.id);
                      const def = getSkiruDef(it.skiru.id);
                      return (
                        <label
                          key={it.skiru.id}
                          className={`flex items-start gap-3 py-2 min-h-[44px] ${it.isChild ? "pl-5" : "pl-1"}`}
                        >
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => toggle(it.skiru.id)}
                            className="mt-0.5 rounded border-[var(--border-color)] w-5 h-5"
                          />
                          <span className="text-sm leading-snug">
                            <span
                              className={
                                active ? "text-[var(--accent-gold)]" : "text-[var(--accent-violet-light)]"
                              }
                            >
                              {labelForSkiru(def ?? it.skiru)}
                            </span>
                            <span className="block text-[10px] text-gray-500 font-mono">
                              {it.skiru.id}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </BottomSheet>

      {/* Desktop: lista inline */}
      <div className="hidden md:block rounded border border-[var(--border-color)] bg-black/20 p-3 max-h-72 overflow-y-auto space-y-1">
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
