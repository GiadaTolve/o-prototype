"use client";

import { parseQuarterFromText } from "@/lib/quarter-tracker";

/** Mini HUD 4/4 — legge [N/4] nel draft del messaggio. */
export function QuarterTurnHud({ draft }: { draft: string }) {
  const quarter = parseQuarterFromText(draft);

  return (
    <div
      className="flex items-center gap-2 text-[10px] font-display uppercase tracking-widest text-[var(--accent-violet-light)]/70"
      title="Quarti turno — inserisci [1/4] … [4/4] nel testo azione"
    >
      <span className="text-gray-500 shrink-0">Turno</span>
      <div className="flex gap-1" role="img" aria-label={quarter ? `Quarto ${quarter} di 4` : "Quarto non dichiarato"}>
        {[1, 2, 3, 4].map((q) => {
          const active = quarter === q;
          const spent = quarter != null && q < quarter;
          return (
            <span
              key={q}
              className={`w-5 h-5 rounded border flex items-center justify-center tabular-nums transition-colors ${
                active
                  ? "border-[var(--accent-gold)] text-[var(--accent-gold)] bg-[var(--accent-gold)]/15 shadow-[var(--shadow-gold)]"
                  : spent
                    ? "border-[var(--accent-violet)]/40 text-[var(--accent-violet-light)]/50 bg-[var(--accent-violet)]/10"
                    : "border-[var(--border-color)] text-gray-600 bg-black/30"
              }`}
            >
              {q}
            </span>
          );
        })}
      </div>
      <span className="text-gray-600 hidden sm:inline">/ 4</span>
    </div>
  );
}
