"use client";

import { useEffect } from "react";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Elemento opzionale ancorato sotto l'header (es. campo ricerca). */
  header?: React.ReactNode;
};

/**
 * Foglio a comparsa dal basso, pensato per il touch (target ampi, ricerca).
 * Reso solo su viewport mobile: i trigger che lo aprono sono `md:hidden`.
 */
export function BottomSheet({ open, onClose, title, children, header }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Chiudi"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className="relative rounded-t-2xl border-t border-[var(--border-color)] bg-[var(--panel-bg)] max-h-[85vh] flex flex-col animate__animated animate__slideInUp motion-reduce:animate-none">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]/60">
          <h3 className="text-sm font-display text-[var(--accent-gold)]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 -mr-2 flex items-center justify-center text-gray-400"
          >
            ✕
          </button>
        </div>
        {header && (
          <div className="px-4 py-3 border-b border-[var(--border-color)]/40">{header}</div>
        )}
        <div className="overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
