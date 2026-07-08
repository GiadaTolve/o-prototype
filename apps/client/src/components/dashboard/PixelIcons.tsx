"use client";

import {
  PIXEL_ICON_SIZE,
  PIXEL_ICON_BASE,
  PIXEL_ICON_DISPLAY_CLASS,
  PIXEL_ICON_RUOLI,
  PIXEL_ICON_ORDINI,
  getPixelIconUrlRuolo,
  getPixelIconUrlOrdine,
  labelForRuoloPixelIcon,
  labelForPremioPixelIcon,
  type PixelIconRuolo,
  type PixelIconOrdine,
} from "./pixel-icons";

/** Compatibile con CharacterSummary / Presente (ruolo/ordine come string[]). */
type PixelIconsInput = {
  ruolo?: string[];
  ordine?: string[];
  premioSpeciale?: string[];
} | null | undefined;

type Props = {
  pixelIcons?: PixelIconsInput;
  className?: string;
};

/** Mostra le pixel-icon (25×25) accanto al nome. Ruoli + ordini. Capo-shinigami usa shinigami. */
export function PixelIcons({ pixelIcons, className = "" }: Props) {
  if (!pixelIcons) return null;

  const ruoli = (pixelIcons.ruolo ?? []).filter((r): r is PixelIconRuolo =>
    PIXEL_ICON_RUOLI.includes(r as PixelIconRuolo)
  );
  const ordini = (pixelIcons.ordine ?? []).filter((o): o is PixelIconOrdine =>
    PIXEL_ICON_ORDINI.includes(o as PixelIconOrdine)
  );
  const items: { src: string; alt: string; premioFallback?: boolean }[] = [];

  for (const r of ruoli) {
    items.push({ src: getPixelIconUrlRuolo(r), alt: labelForRuoloPixelIcon(r) });
  }
  for (const o of ordini) {
    const url = getPixelIconUrlOrdine(o);
    if (url) items.push({ src: url, alt: o });
  }
  for (const premio of pixelIcons.premioSpeciale ?? []) {
    items.push({
      src: `${PIXEL_ICON_BASE}/premio.webp`,
      alt: labelForPremioPixelIcon(premio),
      premioFallback: true,
    });
  }

  if (items.length === 0) return null;

  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-hidden>
      {items.map(({ src, alt, premioFallback }, i) =>
        premioFallback ? (
          <span
            key={`premio-${alt}-${i}`}
            title={alt}
            className={`inline-flex ${PIXEL_ICON_DISPLAY_CLASS} items-center justify-center border border-[var(--accent-gold)]/50 bg-[var(--accent-gold)]/10 rotate-45`}
          >
            <span className="-rotate-45 text-[9px] leading-none text-[var(--accent-gold)] font-display">
              ◆
            </span>
          </span>
        ) : (
          <img
            key={`${alt}-${i}`}
            src={src}
            alt=""
            title={alt}
            width={PIXEL_ICON_SIZE}
            height={PIXEL_ICON_SIZE}
            className={PIXEL_ICON_DISPLAY_CLASS}
          />
        ),
      )}
    </span>
  );
}
