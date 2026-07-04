"use client";

import {
  formatMovementMeters,
  MITIGATION_BAR_CAP,
  MOVEMENT_BAR_CAP,
  type ResolvedSkiruStats,
} from "./character-computed";

type StatRowProps = {
  label: string;
  valueLabel: string;
  fillPercent: number;
  variant: "hp" | "mitigation" | "movement";
};

function StatRow({ label, valueLabel, fillPercent, variant }: StatRowProps) {
  const pct = Math.min(100, Math.max(0, fillPercent));

  const fillStyle =
    variant === "hp"
      ? {
          background:
            "linear-gradient(180deg, var(--accent-violet-light) 0%, var(--accent-violet) 100%)",
          boxShadow: "0 0 6px var(--shadow-violet)",
        }
      : variant === "mitigation"
        ? {
            background:
              "linear-gradient(90deg, color-mix(in srgb, var(--accent-violet) 70%, black) 0%, var(--accent-violet-light) 100%)",
            boxShadow: "0 0 4px var(--shadow-violet)",
          }
        : {
            background:
              "linear-gradient(90deg, color-mix(in srgb, var(--accent-gold) 50%, black) 0%, var(--accent-gold) 100%)",
            boxShadow: "0 0 4px var(--shadow-gold)",
          };

  return (
    <div className="flex items-center gap-2">
      <span className="w-7 shrink-0 text-[8px] uppercase tracking-[0.14em] text-[var(--accent-violet-light)]/70 font-display">
        {label}
      </span>
      <div
        className="flex-1 h-2 rounded-sm border border-[var(--border-color)] bg-black/70 overflow-hidden"
        role="presentation"
      >
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${pct}%`, ...fillStyle }}
        />
      </div>
      <span className="w-9 shrink-0 text-right text-[9px] font-display tabular-nums text-[var(--accent-gold)]">
        {valueLabel}
      </span>
    </div>
  );
}

/** HUD compatto derivati Skiru — sidebar dashboard. */
export function MiniSkiruStatsHud({ stats }: { stats: ResolvedSkiruStats }) {
  const { hpMax, hpCurrent, mitigationPercent, movementMeters } = stats;
  const hasAny = hpMax > 0 || mitigationPercent > 0 || movementMeters > 0;

  if (!hasAny) return null;

  const hpPct = hpMax > 0 ? (hpCurrent / hpMax) * 100 : 0;

  return (
    <div className="mini-skiru-hud mt-2 space-y-1.5 pt-2 border-t border-[var(--border-color)]/60">
      {hpMax > 0 && (
        <StatRow
          label="HP"
          valueLabel={`${hpCurrent}/${hpMax}`}
          fillPercent={hpPct}
          variant="hp"
        />
      )}
      {mitigationPercent > 0 && (
        <StatRow
          label="MIT"
          valueLabel={`${mitigationPercent}%`}
          fillPercent={(mitigationPercent / MITIGATION_BAR_CAP) * 100}
          variant="mitigation"
        />
      )}
      {movementMeters > 0 && (
        <StatRow
          label="MOV"
          valueLabel={formatMovementMeters(movementMeters)}
          fillPercent={(movementMeters / MOVEMENT_BAR_CAP) * 100}
          variant="movement"
        />
      )}
    </div>
  );
}
