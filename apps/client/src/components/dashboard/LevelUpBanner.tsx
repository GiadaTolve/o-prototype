/**
 * Banner vettoriale Level Up — Dark Arcane (Skiru v3).
 * Premi: Key + EXP spendibile (Skiru/skill).
 */

type Props = {
  levelLabel: string
  grade?: string
  expCurrent?: number
  expNeeded?: number | null
  keys?: number
  expSpendableNote?: string
  width?: number
  height?: number
  onInvestSkiru?: () => void
  onSalta?: () => void
}

export function LevelUpBanner({
  levelLabel,
  grade,
  expCurrent = 0,
  expNeeded = 50,
  keys = 1,
  expSpendableNote = "EXP da investire in Skiru o skill",
  width = 340,
  height = 420,
  onInvestSkiru,
  onSalta,
}: Props) {
  const expText =
    expNeeded != null && expNeeded > 0 ? `${expCurrent} / ${expNeeded} EXP` : "MAX";
  const labelSize = levelLabel.length > 4 ? 32 : 46;

  return (
    <div
      className="flex flex-col items-center gap-3 animate__animated animate__fadeIn"
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}
    >
      <svg viewBox="0 0 200 360" width={width} height={height} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={`Level up ${levelLabel}`}>
        <defs>
          <linearGradient id="levelUpBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--panel-bg)" />
            <stop offset="50%" stopColor="var(--background)" />
            <stop offset="100%" stopColor="var(--background)" />
          </linearGradient>
          <linearGradient id="levelUpBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-gold)" stopOpacity="0.7" />
            <stop offset="50%" stopColor="var(--accent-gold)" />
            <stop offset="100%" stopColor="var(--accent-gold)" stopOpacity="0.55" />
          </linearGradient>
          <radialGradient id="levelUpShine" cx="50%" cy="15%" r="70%">
            <stop offset="0%" stopColor="var(--accent-gold)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="goldGlow">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <path
            id="star"
            d="M 0 -3.5 L 1 0 L 3.5 0.5 L 1.4 2.4 L 2 4.5 L 0 3.2 L -2 4.5 L -1.4 2.4 L -3.5 0.5 L -1 0 Z"
            fill="none"
            stroke="var(--accent-gold)"
            strokeWidth={0.9}
            opacity={0.75}
          />
        </defs>
        <path
          d="M 20 340 L 20 65 Q 20 15 100 15 Q 180 15 180 65 L 180 340 Z"
          fill="url(#levelUpBg)"
          stroke="url(#levelUpBorder)"
          strokeWidth={2}
        />
        <path
          d="M 28 330 L 28 70 Q 28 28 100 25 Q 172 28 172 70 L 172 330 L 28 330 Z"
          fill="url(#levelUpShine)"
          stroke="none"
        />

        <text
          x="100"
          y="115"
          textAnchor="middle"
          fill="var(--accent-gold)"
          fontFamily="Cinzel, Georgia, serif"
          fontSize={labelSize}
          fontWeight="700"
          filter="url(#goldGlow)"
        >
          {levelLabel}
        </text>
        <text
          x="100"
          y="135"
          textAnchor="middle"
          fill="var(--accent-gold)"
          fontFamily="Cinzel, Georgia, serif"
          fontSize="9"
          letterSpacing="2"
          opacity={0.85}
        >
          LEVEL UP
        </text>
        {grade && (
          <text
            x="100"
            y="150"
            textAnchor="middle"
            fill="var(--accent-violet-light)"
            fontFamily="Cinzel, Georgia, serif"
            fontSize="7"
            letterSpacing="1"
          >
            {grade.toUpperCase()}
          </text>
        )}

        <text
          x="100"
          y="168"
          textAnchor="middle"
          fill="var(--accent-gold)"
          fontFamily="Cinzel, Georgia, serif"
          fontSize="10"
          opacity={0.9}
        >
          {expText}
        </text>

        <line x1={45} y1={182} x2={155} y2={182} stroke="var(--border-color)" strokeWidth={1} />
        <text
          x="100"
          y="200"
          textAnchor="middle"
          fill="var(--accent-gold)"
          fontFamily="Cinzel, Georgia, serif"
          fontSize="8"
          fontWeight="600"
          letterSpacing="1"
        >
          HAI OTTENUTO
        </text>
        <g fill="none">
          {keys > 0 && (
            <>
              <use href="#star" transform="translate(55, 216) scale(0.6)" />
              <text x="68" y="220" fill="var(--accent-gold)" fontFamily="Cinzel, Georgia, serif" fontSize="10">
                +{keys} Key
              </text>
            </>
          )}
          <use href="#star" transform={`translate(55, ${keys > 0 ? 230 : 216}) scale(0.6)`} />
          <text x="68" y={keys > 0 ? 234 : 220} fill="var(--accent-gold)" fontFamily="Cinzel, Georgia, serif" fontSize="9">
            {expSpendableNote.length > 28 ? "EXP spendibile ↑" : expSpendableNote}
          </text>
        </g>

        {(onInvestSkiru || onSalta) && (
          <foreignObject x="40" y="262" width="120" height="56" style={{ overflow: "visible" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, height: "100%" }}>
              {onInvestSkiru && (
                <button type="button" onClick={onInvestSkiru} style={bannerBtnStyle}>
                  Skiru
                </button>
              )}
              {onSalta && (
                <button type="button" onClick={onSalta} style={bannerBtnStyle}>
                  Salta
                </button>
              )}
            </div>
          </foreignObject>
        )}
      </svg>
    </div>
  );
}

const bannerBtnStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 20,
  padding: "0 0.5rem",
  background: "var(--button-bg)",
  border: "1px solid var(--accent-gold)",
  borderRadius: 3,
  color: "var(--accent-gold)",
  cursor: "pointer",
  fontSize: "0.72rem",
  fontFamily: "Cinzel, Georgia, serif",
  fontWeight: 600,
  boxShadow: "var(--shadow-gold)",
};
