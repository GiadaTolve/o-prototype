"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import { parseWikiContent } from "@/lib/bbcode-parser";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  factionLabel: string;
  content: string;
};

const WINDOW_W = 1024;
const WINDOW_H = 560;

function CompendioRichContent({ text }: { text: string }) {
  if (!text.trim()) {
    return <p className="text-xs text-[var(--foreground)]/35 italic">Nessun contenuto ancora.</p>;
  }
  const html = parseWikiContent(text);
  return (
    <div
      className="wiki-prose flow-root text-sm text-[var(--foreground)]/70 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function OrdineCompendioModal({ open, onClose, title, factionLabel, content }: Props) {
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setDragPos(null);
      return;
    }
    const width = Math.min(WINDOW_W, window.innerWidth - 16);
    setDragPos({
      x: Math.max(8, Math.round((window.innerWidth - width) / 2)),
      y: Math.max(8, Math.round((window.innerHeight - WINDOW_H) / 2)),
    });
  }, [open]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !dragRef.current) return;
      setDragPos({
        x: dragRef.current.initX + (e.clientX - dragRef.current.startX),
        y: dragRef.current.initY + (e.clientY - dragRef.current.startY),
      });
    };
    const onUp = () => {
      isDraggingRef.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const handleHeaderMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".ordine-compendio-drag-handle")) return;
      isDraggingRef.current = true;
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initX: dragPos?.x ?? 0,
        initY: dragPos?.y ?? 0,
      };
      e.preventDefault();
    },
    [dragPos],
  );

  if (!open || !dragPos) return null;

  const panelWidth = Math.min(WINDOW_W, window.innerWidth - 16);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] pointer-events-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ordine-compendio-title"
    >
      <div
        className="absolute flex flex-col overflow-hidden pointer-events-auto bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-xl shadow-2xl shadow-[0_0_32px_rgba(165,131,224,0.18)] animate__animated animate__fadeIn motion-reduce:animate-none"
        style={{ left: dragPos.x, top: dragPos.y, width: panelWidth, height: WINDOW_H }}
        onMouseDown={handleHeaderMouseDown}
      >
        <div className="ordine-compendio-drag-handle flex items-center justify-between shrink-0 px-4 py-2.5 border-b border-[var(--border-color)] bg-black/40 select-none cursor-grab active:cursor-grabbing">
          <div className="min-w-0 pointer-events-none">
            <p className="text-[9px] font-display uppercase tracking-[0.16em] text-[var(--accent-violet-light)] truncate">
              {factionLabel} · Compendio
            </p>
            <h3
              id="ordine-compendio-title"
              className="font-display text-xs uppercase tracking-widest text-[var(--accent-gold)] flex items-center gap-2 truncate"
            >
              <FontAwesomeIcon icon={icons.ordine} className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{title}</span>
            </h3>
          </div>
          <div className="flex items-center gap-1 pointer-events-auto" onMouseDown={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={onClose}
              className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-white/10 rounded transition-colors"
              title="Chiudi"
              aria-label="Chiudi"
            >
              <FontAwesomeIcon icon={icons.close} className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          <CompendioRichContent text={content} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
