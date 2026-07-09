"use client";

import { useEffect, useId, useRef, useState } from "react";
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
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (ev: MouseEvent | TouchEvent) => {
      const root = rootRef.current;
      const target = ev.target as Node | null;
      if (!root || !target) return;
      if (!root.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        aria-label={`Info: ${title}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex shrink-0 items-center justify-center w-11 h-11 md:w-8 md:h-8 rounded-md border border-[var(--accent-violet)]/40 text-[var(--accent-violet-light)] hover:border-[var(--accent-gold)]/60 hover:text-[var(--accent-gold)] bg-black/20 align-middle"
      >
        <FontAwesomeIcon icon={icons.info} className="w-2.5 h-2.5 md:w-2 md:h-2" />
      </button>
      {open && (
        <div
          id={panelId}
          className="absolute right-0 z-20 mt-1 w-[min(90vw,360px)] rounded border border-[var(--border-color)] bg-[var(--panel-bg)] p-2.5 shadow-[var(--shadow-violet)]"
        >
          <p className="text-[11px] uppercase tracking-wider text-[var(--accent-gold)] mb-1">{title}</p>
          <p className="text-xs leading-relaxed text-[var(--accent-violet-light)]">{text}</p>
        </div>
      )}
    </div>
  );
}

