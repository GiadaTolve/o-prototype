"use client";

import Image from "next/image";
import {
  PIXEL_ICON_SIZE,
  PIXEL_ICON_RUOLI,
  PIXEL_ICON_ORDINI,
  getPixelIconUrlRuolo,
  getPixelIconUrlOrdine,
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

/** Mostra le pixel-icon (20×20) accanto al nome. Ruoli + ordini. Capo-shinigami usa shinigami. */
export function PixelIcons({ pixelIcons, className = "" }: Props) {
  if (!pixelIcons) return null;

  const ruoli = (pixelIcons.ruolo ?? []).filter((r): r is PixelIconRuolo =>
    PIXEL_ICON_RUOLI.includes(r as PixelIconRuolo)
  );
  const ordini = (pixelIcons.ordine ?? []).filter((o): o is PixelIconOrdine =>
    PIXEL_ICON_ORDINI.includes(o as PixelIconOrdine)
  );
  const items: { src: string; alt: string }[] = [];

  for (const r of ruoli) {
    items.push({ src: getPixelIconUrlRuolo(r), alt: r });
  }
  for (const o of ordini) {
    const url = getPixelIconUrlOrdine(o);
    if (url) items.push({ src: url, alt: o });
  }

  if (items.length === 0) return null;

  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-hidden>
      {items.map(({ src, alt }, i) => (
        <Image
          key={`${alt}-${i}`}
          src={src}
          alt=""
          width={PIXEL_ICON_SIZE}
          height={PIXEL_ICON_SIZE}
          className="w-5 h-5 shrink-0"
        />
      ))}
    </span>
  );
}
