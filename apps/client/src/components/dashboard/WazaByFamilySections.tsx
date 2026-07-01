"use client";

import { useMemo, type ReactNode } from "react";
import {
  layoutOwnedWazaSections,
  type WazaCatalogFamily,
} from "@domain/progression/waza-catalog-family";
import { sortWazaByKindAndName } from "@domain/progression";

type Props<T> = {
  items: T[];
  getKey: (item: T) => string;
  getName: (item: T) => string;
  resolveSkill: (item: T) => {
    styleId?: string | null;
    madoshoId?: string | null;
    description?: string | null;
    name?: string | null;
    poolId?: string | null;
  };
  isPassive?: (item: T) => boolean;
  renderItem: (item: T) => ReactNode;
  variant?: "grid" | "list";
  emptyMessage?: string;
};

export function WazaByFamilySections<T>({
  items,
  getKey,
  getName,
  resolveSkill,
  isPassive,
  renderItem,
  variant = "grid",
  emptyMessage = "Nessuna Waza in registro.",
}: Props<T>) {
  const sections = useMemo(
    () =>
      layoutOwnedWazaSections(items, (item) => ({
        ...resolveSkill(item),
        name: resolveSkill(item).name ?? getName(item),
      })),
    [items, resolveSkill, getName],
  );

  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic text-center py-6 px-4">{emptyMessage}</p>
    );
  }

  const renderGroup = (groupItems: T[]) => {
    const sorted = isPassive
      ? sortWazaByKindAndName(groupItems, { isPassive, getName })
      : groupItems;
    if (variant === "grid") {
      return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((item) => (
            <div key={getKey(item)}>{renderItem(item)}</div>
          ))}
        </div>
      );
    }
    return (
      <div className="space-y-2">
        {sorted.map((item) => (
          <div key={getKey(item)}>{renderItem(item)}</div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <section
          key={section.family}
          className="animate__animated animate__fadeIn motion-reduce:animate-none"
        >
          <header className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--accent-gold)]/25">
            <h2 className="font-display text-base uppercase tracking-[0.14em] text-[var(--accent-gold)]">
              {section.label}
            </h2>
          </header>

          {section.kind === "do" && (
            <div className="space-y-6">
              {section.styleGroups.map((g) => (
                <div key={g.styleId}>
                  <h3 className="font-display text-xs uppercase tracking-[0.16em] text-[var(--accent-violet-light)] mb-3">
                    {g.label}
                    <span className="ml-2 text-gray-500 tabular-nums">{g.items.length}</span>
                  </h3>
                  {renderGroup(g.items)}
                </div>
              ))}
            </div>
          )}

          {section.kind === "madosho" && (
            <div className="space-y-6">
              {section.ramoGroups.map((g) => (
                <div key={g.madoshoId}>
                  <h3 className="font-display text-xs uppercase tracking-[0.16em] text-[var(--accent-violet-light)] mb-3">
                    {g.label}
                    <span className="ml-2 text-gray-500 tabular-nums">{g.items.length}</span>
                  </h3>
                  {renderGroup(g.items)}
                </div>
              ))}
            </div>
          )}

          {section.kind === "flat" && renderGroup(section.items)}
        </section>
      ))}
    </div>
  );
}

export type { WazaCatalogFamily };
