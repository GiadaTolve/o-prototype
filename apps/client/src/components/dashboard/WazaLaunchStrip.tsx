"use client";

import type { WazaTagPreview } from "@domain/combat/waza-tag-preview";

export function WazaLaunchStrip({
  preview,
  ir,
  skiruName,
  targetName,
  riderLabel,
  hitDeclared,
  damageGross,
}: {
  preview: WazaTagPreview;
  ir?: number | null;
  skiruName?: string | null;
  targetName?: string | null;
  riderLabel?: string | null;
  hitDeclared?: boolean;
  damageGross?: number | null;
}) {
  const parts: string[] = [preview.name];
  if (preview.styleLabel) parts.push(preview.styleLabel);
  parts.push(preview.isPassive ? "Passiva" : "Attiva");
  if (!preview.isPassive && preview.tier != null) {
    parts.push(`T${preview.tier}`);
    if (preview.damage != null) parts.push(`${preview.damage} dmg`);
    if (preview.csCost != null) parts.push(`${preview.csCost} CS`);
    if (ir != null) parts.push(`IR ${ir}`);
  }
  if (skiruName) parts.push(`via ${skiruName}`);
  if (riderLabel) parts.push(riderLabel);
  if (targetName) parts.push(`→ ${targetName}`);
  if (hitDeclared) parts.push("colpito");
  if (damageGross != null && damageGross > 0) parts.push(`~${damageGross} dmg`);
  if (!preview.found) parts.push("non in catalogo");

  const line = parts.join(" · ");
  const tooltip = preview.description?.trim() || undefined;

  return (
    <div
      className={`waza-launch-strip animate__animated animate__fadeIn${preview.found ? "" : " waza-launch-strip--unknown"}`}
      role="note"
      title={tooltip}
      aria-label={tooltip ? `${preview.name}. ${tooltip}` : `Lancio waza: ${preview.name}`}
    >
      <span className="waza-launch-strip__line">{line}</span>
    </div>
  );
}
