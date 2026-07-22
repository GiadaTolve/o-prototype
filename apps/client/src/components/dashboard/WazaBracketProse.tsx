"use client";

import type { ReactNode } from "react";

/**
 * Evidenzia ogni segmento `[tag]` nel testo waza (Dark Arcane).
 */
export function WazaBracketProse({
  text,
  className,
  as: Tag = "p",
}: {
  text: string | null | undefined;
  className?: string;
  as?: "p" | "div" | "span";
}): ReactNode {
  if (text == null || !String(text).trim()) return null;
  const s = String(text);
  return (
    <Tag className={className}>
      {s.split(/(\[[^\]]+\])/g).map((part, i) =>
        part.startsWith("[") && part.endsWith("]") ? (
          <strong key={i} className="wit-bracket-tag">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </Tag>
  );
}
