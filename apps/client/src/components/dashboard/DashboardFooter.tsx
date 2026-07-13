"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import type { WindowId } from "./types";
import { WINDOW_LABELS } from "./types";

const DOCK_ICONS: Record<WindowId, (typeof icons)[keyof typeof icons]> = {
  scheda: icons.user,
  presenti: icons.presenti,
  sms: icons.message,
  fetch: icons.trophy,
  banca: icons.banca,
  mercato: icons.mercato,
  housing: icons.home,
  profilo: icons.user,
  waza: icons.waza,
  ordine: icons.ordine,
  bestiario: icons.trophy,
  notifiche: icons.bell,
  spazioEventi: icons.gamepad,
  combattimento: icons.waza,
};

type Props = {
  loweredWindows: WindowId[];
  onRaiseFromDock: (id: WindowId) => void;
};

export function DashboardFooter({ loweredWindows, onRaiseFromDock }: Props) {
  if (loweredWindows.length === 0) {
    return (
      <footer className="border-t border-[var(--border-color)] bg-[var(--panel-bg)]/90 backdrop-blur-sm sticky bottom-0 z-10 min-h-[52px]" />
    );
  }

  return (
    <footer className="border-t border-[var(--border-color)] bg-[var(--panel-bg)]/90 backdrop-blur-sm sticky bottom-0 z-10">
      <div className="flex items-center justify-center gap-2 px-4 py-2 max-w-[1800px] mx-auto flex-wrap">
        {loweredWindows.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onRaiseFromDock(id)}
            className="px-4 py-2 text-xs uppercase tracking-wider rounded border border-[var(--border-color)] hover:border-[var(--accent-gold)] text-gray-400 hover:text-[var(--accent-gold)] transition-all bg-black/30 flex items-center gap-2"
          >
            <FontAwesomeIcon icon={DOCK_ICONS[id]} className="w-3.5 h-3.5" />
            {WINDOW_LABELS[id]}
          </button>
        ))}
      </div>
    </footer>
  );
}
