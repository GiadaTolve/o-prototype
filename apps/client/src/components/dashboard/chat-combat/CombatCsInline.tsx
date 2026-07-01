"use client";

/** Barra Chrono Stack — pool CS + indicatore accumulo Tenkan. */
export function CombatCsInline({
  current,
  capacity = 20,
  accumulating = false,
  isOverheated = false,
  compact = false,
}: {
  current: number;
  capacity?: number;
  accumulating?: boolean;
  isOverheated?: boolean;
  compact?: boolean;
}) {
  const cap = Math.max(1, capacity);
  const segments = compact ? 10 : 20;
  const filledInCap = Math.min(segments, Math.round((Math.min(current, cap) / cap) * segments));
  const overflow = Math.max(0, current - cap);

  return (
    <div
      className={`${compact ? "combat-cs-inline combat-cs-inline--compact" : "combat-cs-inline"}${accumulating ? " combat-cs-inline--accumulating" : ""}`}
    >
      <div className="combat-cs-inline__head">
        <span className="combat-cs-inline__label">Chronostack</span>
        <span className="combat-cs-inline__values">
          <strong className={isOverheated ? "combat-cs-inline__values--overheat" : undefined}>
            {current}
          </strong>
          <span className="combat-cs-inline__sep">/</span>
          {cap}
          {overflow > 0 && (
            <span className="combat-cs-inline__overflow" title="Overheat">
              +{overflow}
            </span>
          )}
        </span>
      </div>
      <div
        className={`combat-cs-inline__track${isOverheated ? " combat-cs-inline__track--overheat" : ""}`}
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={cap}
      >
        {Array.from({ length: segments }, (_, i) => (
          <span
            key={i}
            className={`combat-cs-inline__seg${i < filledInCap ? " combat-cs-inline__seg--on" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
