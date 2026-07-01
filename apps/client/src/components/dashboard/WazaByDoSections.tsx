"use client";

import { useMemo, type ReactNode } from "react";
import {
  groupWazaByStyle,
  sortWazaByKindAndName,
  resolveWazaStyleId,
  type StyleId,
} from "@domain/progression/waza-grouping";

type Props<T> = {
  items: T[];
  getStyleId?: (item: T) => StyleId | null;
  getKey: (item: T) => string;
  getName: (item: T) => string;
  isPassive?: (item: T) => boolean;
  renderItem: (item: T) => ReactNode;
  /** Griglia card (registro) vs lista compatta (shop) */
  variant?: "grid" | "list";
  emptyMessage?: string;
};

export function WazaByDoSections<T>({
  items,
  getStyleId,
  getKey,
  getName,
  isPassive,
  renderItem,
  variant = "grid",
  emptyMessage = "Nessuna Waza in questa sezione.",
}: Props<T>) {
  const groups = useMemo(() => {
    const resolve = getStyleId ?? ((item: T) => resolveWazaStyleId(item as { styleId?: string | null; description?: string | null }));
    const grouped = groupWazaByStyle(items, resolve);
    if (!isPassive) return grouped;
    return grouped.map((g) => ({
      ...g,
      items: sortWazaByKindAndName(g.items, { isPassive, getName }),
    }));
  }, [items, getStyleId, getName, isPassive]);

  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic text-center py-6 px-4">{emptyMessage}</p>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.styleId} className="animate__animated animate__fadeIn motion-reduce:animate-none">
          <header className="flex items-center gap-2 mb-3 pb-1.5 border-b border-[var(--accent-violet)]/25">
            <h3 className="font-display text-sm uppercase tracking-[0.16em] text-[var(--accent-gold)]">
              {group.label}
            </h3>
            <span className="text-[9px] font-display uppercase tracking-wider text-gray-500 tabular-nums">
              {group.items.length}
            </span>
          </header>
          {variant === "grid" ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {group.items.map((item) => (
                <div key={getKey(item)}>{renderItem(item)}</div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {group.items.map((item) => (
                <div key={getKey(item)}>{renderItem(item)}</div>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
