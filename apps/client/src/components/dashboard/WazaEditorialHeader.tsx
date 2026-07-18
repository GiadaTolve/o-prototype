"use client";

import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string | null;
  statute?: string | null;
  mechanics?: string | null;
  statuteLabel?: string;
  mechanicsLabel?: string;
  titleUppercase?: boolean;
  titleAction?: ReactNode;
  badges?: ReactNode;
  footer?: ReactNode;
};

/**
 * Layout B · split editorial — titolo + sottotitolo, colonna meccaniche (visor violet), statuto scrollabile.
 */
export function WazaEditorialHeader({
  title,
  subtitle,
  statute,
  mechanics,
  statuteLabel = "Statuto",
  mechanicsLabel = "Meccaniche",
  titleUppercase = false,
  titleAction,
  badges,
  footer,
}: Props) {
  return (
    <header className="shrink-0 sticky top-0 z-10 border-b border-[var(--border-color)]/70 bg-black/85 backdrop-blur-md px-4 py-4">
      <div className="flex flex-col lg:flex-row lg:flex-wrap gap-4 lg:gap-6 mb-3">
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 flex-wrap">
            <h2
              className={`font-display text-xl md:text-2xl text-[var(--accent-gold)] tracking-wide leading-tight ${
                titleUppercase ? "uppercase" : ""
              }`}
            >
              {title}
            </h2>
            {titleAction}
          </div>
          {subtitle ? (
            <p className="font-accent italic text-sm md:text-base text-[var(--accent-violet-light)]/85 mt-1.5 leading-snug">
              {subtitle}
            </p>
          ) : null}
          {badges ? <div className="flex flex-wrap gap-1.5 mt-2.5">{badges}</div> : null}
        </div>

        {mechanics?.trim() ? (
          <div className="shrink-0 w-full sm:w-64 lg:w-72">
            <p className="text-[9px] font-display uppercase tracking-[0.16em] mb-1 text-[var(--accent-violet)]">
              {mechanicsLabel}
            </p>
            <div
              className="h-[4.2rem] md:h-[4.9rem] w-full overflow-y-auto rounded-md border-l-2 border-[var(--accent-violet)]/40 px-3 py-2"
              style={{ background: "color-mix(in srgb, var(--panel-bg) 80%, black)" }}
            >
              <p className="text-xs text-[var(--accent-violet-light)]/90 leading-relaxed whitespace-pre-line">
                {mechanics.trim()}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {statute?.trim() ? (
        <div className="space-y-1">
          <p className="text-[8px] font-display uppercase tracking-[0.18em] text-[var(--foreground)]/35">
            {statuteLabel}
          </p>
          <div className="h-24 md:h-28 overflow-y-auto rounded border border-[var(--border-color)]/50 bg-black/90 px-3 py-2">
            <p className="text-xs text-[var(--foreground)]/55 leading-relaxed whitespace-pre-line">
              {statute.trim()}
            </p>
          </div>
        </div>
      ) : null}

      {footer ? <div className="mt-3">{footer}</div> : null}
    </header>
  );
}
