"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { api } from "@/lib/api";
import { icons } from "@/lib/icons";
import type { SocialClassDef, SocialClassId } from "@domain/shakai-kaikyu/types";
import { SOCIAL_CLASS_ICON } from "./social-class-ui";

type Props = {
  catalog: SocialClassDef[];
  onClose: () => void;
  onChosen: () => void;
};

export function SocialClassChoiceModal({ catalog, onClose, onChosen }: Props) {
  const [pendingId, setPendingId] = useState<SocialClassId | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const pendingDef = catalog.find((c) => c.id === pendingId) ?? null;

  const confirm = async () => {
    if (!pendingId) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/characters/me/social-class", { classId: pendingId });
      onChosen();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Errore scelta classe sociale");
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 animate__animated animate__fadeIn motion-reduce:animate-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="social-class-choice-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg border border-[var(--border-color)] bg-[var(--panel-bg)] p-5 shadow-[0_0_30px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 id="social-class-choice-title" className="font-display text-lg text-[var(--accent-gold)]">
              Scegli la tua Classe Sociale
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Scelta una tantum — dopo potrai cambiarla solo contattando la moderazione.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded border border-[var(--border-color)] text-gray-500 hover:text-[var(--accent-gold)] hover:border-[var(--accent-gold)] transition-colors"
            aria-label="Chiudi"
          >
            <FontAwesomeIcon icon={icons.close} className="w-3.5 h-3.5" />
          </button>
        </div>

        {!pendingDef ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {catalog.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setPendingId(c.id)}
                className="text-left p-4 rounded-lg border border-[var(--border-color)] bg-black/30 hover:border-[var(--accent-gold)]/60 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <FontAwesomeIcon icon={SOCIAL_CLASS_ICON[c.id]} className="w-4 h-4 text-[var(--accent-gold)]" />
                  <span className="font-display text-sm text-white">{c.nameItalian}</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                    {c.nameRomaji}
                    {c.nameJa ? ` (${c.nameJa})` : ""}
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{c.toolSummary}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-[var(--accent-gold)]/40 bg-black/30">
              <div className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon
                  icon={SOCIAL_CLASS_ICON[pendingDef.id]}
                  className="w-4 h-4 text-[var(--accent-gold)]"
                />
                <span className="font-display text-sm text-white">{pendingDef.nameItalian}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">{pendingDef.nameRomaji}</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{pendingDef.toolSummary}</p>
            </div>

            {error && (
              <p className="text-xs text-red-400 border border-red-900/50 bg-red-950/30 rounded px-3 py-2">
                {error}
              </p>
            )}

            <p className="text-xs text-[var(--accent-violet-light)]/90">
              Confermi <strong>{pendingDef.nameItalian}</strong> come tua classe sociale? La scelta non è
              reversibile dal giocatore.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={confirm}
                disabled={submitting}
                className="px-4 py-2 rounded border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs uppercase tracking-wider hover:bg-[var(--accent-gold)]/10 disabled:opacity-50"
              >
                {submitting ? "Conferma…" : "Conferma scelta"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingId(null);
                  setError(null);
                }}
                disabled={submitting}
                className="px-4 py-2 rounded border border-[var(--border-color)] text-gray-400 text-xs uppercase tracking-wider hover:text-gray-300"
              >
                Indietro
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
