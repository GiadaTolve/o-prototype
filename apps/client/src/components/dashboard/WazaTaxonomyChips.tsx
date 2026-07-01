"use client";

import { useMemo } from "react";
import { extractWazaTaxonomyFromText } from "@domain/combat/waza-taxonomy";

export function stripWazaBranchHeader(description: string): string {
  return description.replace(/^\[[^\]]+\]\s*\n\n?/, "");
}

export function WazaTaxonomyChips({ description }: { description?: string | null }) {
  const { consistencies, categories } = useMemo(
    () => extractWazaTaxonomyFromText(description ?? ""),
    [description],
  );

  if (consistencies.length === 0 && categories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {consistencies.map((c) => (
        <span
          key={`c-${c.id}`}
          className="consistency-tag"
          title={c.role ? `${c.description} ${c.role}` : c.description}
        >
          {c.tag}
        </span>
      ))}
      {categories.map((c) => (
        <span key={`cat-${c.id}`} className="category-tag" title={c.description}>
          {c.tag}
        </span>
      ))}
    </div>
  );
}
