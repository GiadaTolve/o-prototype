"use client";

import type { ReactNode } from "react";

export type YumeLinkHandlers = {
  onOpenPrivacy: () => void;
  onOpenPrincipia: () => void;
  onOpenGuida: () => void;
  onOpenLore: () => void;
  onOpenLogin: () => void;
};

const LINK_MARKERS: Record<string, { label: string; action: keyof YumeLinkHandlers }> = {
  "@privacy": { label: "informativa privacy", action: "onOpenPrivacy" },
  "@principia": { label: "Principia Satirica", action: "onOpenPrincipia" },
  "@guida": { label: "guida", action: "onOpenGuida" },
  "@ambientazione": { label: "ambientazione", action: "onOpenLore" },
  "@login": { label: "login", action: "onOpenLogin" },
};

const STYLE_MARKERS = new Set(["@chiami", "@email", "@password", "@conferma"]);

export function YumeMessageText({ text, handlers }: { text: string; handlers: YumeLinkHandlers }) {
  const parts = text.split(/(@\w+)/g);
  const nodes: ReactNode[] = [];

  parts.forEach((part, index) => {
    if (!part) return;
    const link = LINK_MARKERS[part];
    if (link) {
      nodes.push(
        <button
          key={`${index}-${part}`}
          type="button"
          className="chat-link"
          onClick={handlers[link.action]}
        >
          {link.label}
        </button>,
      );
      return;
    }
    if (STYLE_MARKERS.has(part)) {
      nodes.push(
        <span key={`${index}-${part}`} className="chat-marker">
          {part.slice(1)}
        </span>,
      );
      return;
    }
    nodes.push(<span key={index}>{part}</span>);
  });

  return <>{nodes}</>;
}
