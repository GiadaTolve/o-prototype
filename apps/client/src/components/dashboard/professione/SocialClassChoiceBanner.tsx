"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import type { SocialClassDef } from "@domain/shakai-kaikyu/types";
import { SocialClassChoiceModal } from "./SocialClassChoiceModal";

type Props = {
  catalog: SocialClassDef[];
  onChosen: () => void;
};

export function SocialClassChoiceBanner({ catalog, onChosen }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4 p-4 rounded-lg border border-[var(--accent-gold)]/30 bg-[var(--accent-gold)]/5 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <FontAwesomeIcon icon={icons.bell} className="w-4 h-4 text-[var(--accent-gold)] shrink-0" />
        <p className="text-sm text-gray-300">
          Non hai ancora scelto una <span className="text-[var(--accent-gold)]">classe sociale</span> —
          scoprile per sbloccare uno strumento dedicato.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 px-3 py-1.5 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs uppercase tracking-wider hover:bg-[var(--accent-gold)]/10 transition-colors"
      >
        Scopri le classi
      </button>

      {open && (
        <SocialClassChoiceModal catalog={catalog} onClose={() => setOpen(false)} onChosen={onChosen} />
      )}
    </div>
  );
}
