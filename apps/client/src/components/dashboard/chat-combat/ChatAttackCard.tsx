"use client";

export type AttackCardData = {
  weapon: string;
  formula: string;
  total: number;
  kind: "ranged" | "melee";
  ammoNote?: string;
};

const ATTACK_PREFIX = "[ATTACCO]";

export function encodeAttackMessage(data: AttackCardData): string {
  return ATTACK_PREFIX + JSON.stringify(data);
}

export function extractAttackData(content: string): AttackCardData | null {
  if (!content.startsWith(ATTACK_PREFIX)) return null;
  try {
    return JSON.parse(content.slice(ATTACK_PREFIX.length)) as AttackCardData;
  } catch {
    return null;
  }
}

export function ChatAttackCard({ data, characterName }: { data: AttackCardData; characterName: string }) {
  return (
    <article
      className="flex items-stretch rounded overflow-hidden"
      style={{
        border: "1px solid rgba(232,118,58,0.35)",
        background: "rgba(0,0,0,0.40)",
        boxShadow: "inset 0 0 0 1px rgba(232,118,58,0.06)",
        minHeight: 44,
      }}
      aria-label={`Attacco ${data.weapon} · ${characterName}`}
    >
      {/* Barra laterale colorata (senza emoji) */}
      <div
        className="shrink-0 w-1"
        style={{ background: "rgba(232,118,58,0.55)" }}
        aria-hidden
      />

      {/* Corpo */}
      <div className="flex items-center gap-3 flex-1 min-w-0 px-3 py-1.5 flex-wrap">
        <div className="flex items-baseline gap-2 min-w-0">
          <span
            className="font-display text-[11px] tracking-wider truncate"
            style={{ color: "var(--accent-gold)" }}
          >
            {characterName}
          </span>
          <span className="text-gray-500 text-[10px]">·</span>
          <span
            className="font-display text-[11px] font-semibold tracking-wide truncate"
            style={{ color: "#e8763a" }}
          >
            {data.weapon}
          </span>
        </div>

        <div className="flex items-center gap-2 ml-auto shrink-0 flex-wrap">
          <span className="text-[10px] font-mono" style={{ color: "var(--muted-foreground)" }}>
            {data.formula}
          </span>
          <span className="text-gray-500 text-[10px]">=</span>
          <strong
            className="text-[13px] font-display tabular-nums"
            style={{ color: "#e8763a" }}
          >
            {data.total}
          </strong>
          <span className="text-[9px] uppercase tracking-wider" style={{ color: "rgba(232,118,58,0.7)" }}>
            IR
          </span>
          {data.ammoNote && (
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{
                background: "rgba(232,118,58,0.10)",
                border: "1px solid rgba(232,118,58,0.25)",
                color: "rgba(232,118,58,0.8)",
              }}
            >
              {data.ammoNote}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
