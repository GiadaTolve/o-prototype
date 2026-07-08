"use client";

import { useId, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";

type InfoHintProps = {
  title: string;
  text: string;
  className?: string;
};

export function InfoHint({ title, text, className }: InfoHintProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className={`relative ${className ?? ""}`}>
      <button
        type="button"
        aria-label={`Info: ${title}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full border border-[var(--accent-violet)]/40 text-[var(--accent-violet-light)] hover:border-[var(--accent-gold)]/60 hover:text-[var(--accent-gold)] bg-black/20"
      >
        <FontAwesomeIcon icon={icons.info} className="w-3 h-3" />
      </button>
      {open && (
        <div
          id={panelId}
          className="absolute right-0 z-20 mt-1 w-[min(92vw,420px)] rounded border border-[var(--border-color)] bg-[var(--panel-bg)] p-3 shadow-[var(--shadow-violet)]"
        >
          <p className="text-[11px] uppercase tracking-wider text-[var(--accent-gold)] mb-1">{title}</p>
          <p className="text-xs leading-relaxed text-[var(--accent-violet-light)]">{text}</p>
        </div>
      )}
    </div>
  );
}

