"use client";

import { useEffect } from "react";

/**
 * Deterrente leggero: blocca menu contestuale, F12 e scorciatoie DevTools / view-source.
 * Non è sicurezza reale (il bundle resta leggibile) — richiesto come attrito per utenti casuali.
 */
export function ClientViewGuard() {
  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const rawKey = typeof e.key === "string" ? e.key : "";
      const key = rawKey.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      // F12
      if (rawKey === "F12") {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      // Ctrl/Cmd+Shift+I / J / C
      if (ctrl && e.shiftKey && (key === "i" || key === "j" || key === "c")) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      // Ctrl/Cmd+U (view-source)
      if (ctrl && key === "u") {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      // Ctrl/Cmd+S (save page)
      if (ctrl && key === "s") {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, []);

  return null;
}
