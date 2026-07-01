"use client";

/** Barra HP compatta per pannello combattimento chat. */
export function CombatHpInline({
  current,
  max,
  compact = false,
}: {
  current: number;
  max: number;
  compact?: boolean;
}) {
  if (max <= 0) return null;
  const pct = Math.min(100, (current / max) * 100);
  const segments = compact ? 10 : 14;
  const filled = Math.round((current / max) * segments);

  return (
    <div className={compact ? "combat-hp-inline combat-hp-inline--compact" : "combat-hp-inline"}>
      <div className="combat-hp-inline__head">
        <span className="combat-hp-inline__label">HP</span>
        <span className="combat-hp-inline__values">
          <strong>{current}</strong>
          <span className="combat-hp-inline__sep">/</span>
          {max}
        </span>
      </div>
      <div
        className="combat-hp-inline__track"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        {Array.from({ length: segments }, (_, i) => (
          <span
            key={i}
            className={`combat-hp-inline__seg${i < filled ? " combat-hp-inline__seg--on" : ""}`}
            style={{ opacity: i < filled ? 0.35 + (pct / 100) * 0.65 : 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}
