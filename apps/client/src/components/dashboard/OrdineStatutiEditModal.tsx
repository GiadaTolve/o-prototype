"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";
import { useStatuti, type StatutiEntry } from "@/hooks/useStatuti";
import {
  findOrdineFactionEntry,
  slugifyOrdineEntryId,
  type OrdineFactionId,
} from "./ordine-utils";

export type OrdineStatutiEditMode =
  | { type: "statuto"; factionId: OrdineFactionId; factionLabel: string }
  | { type: "compendio"; entry: StatutiEntry; factionLabel: string }
  | { type: "compendio-new"; factionId: OrdineFactionId; factionLabel: string };

type Props = {
  open: boolean;
  mode: OrdineStatutiEditMode | null;
  onClose: () => void;
};

type Draft = {
  name: string;
  sottotitolo: string;
  statute: string;
  atto: string;
  descrizione_meccanica: string;
};

const EMPTY_DRAFT: Draft = {
  name: "",
  sottotitolo: "",
  statute: "",
  atto: "",
  descrizione_meccanica: "",
};

export function OrdineStatutiEditModal({ open, mode, onClose }: Props) {
  const { state, setState, updateAndSave } = useStatuti();
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entryId = useMemo(() => {
    if (!mode) return null;
    if (mode.type === "statuto") return mode.factionId;
    if (mode.type === "compendio") return mode.entry.id;
    return null;
  }, [mode]);

  useEffect(() => {
    if (!open || !mode) {
      setDraft(EMPTY_DRAFT);
      setError(null);
      return;
    }

    if (mode.type === "statuto") {
      const entry = findOrdineFactionEntry(state, mode.factionId);
      setDraft({
        name: entry?.name ?? mode.factionLabel,
        sottotitolo: entry?.sottotitolo ?? "",
        statute: entry?.statute ?? "",
        atto: entry?.atto ?? "",
        descrizione_meccanica: entry?.descrizione_meccanica ?? "",
      });
      return;
    }

    if (mode.type === "compendio") {
      setDraft({
        name: mode.entry.name,
        sottotitolo: mode.entry.sottotitolo ?? "",
        statute: mode.entry.statute ?? "",
        atto: mode.entry.atto?.trim() || mode.entry.statute?.trim() || "",
        descrizione_meccanica: mode.entry.descrizione_meccanica ?? "",
      });
      return;
    }

    setDraft(EMPTY_DRAFT);
  }, [open, mode, state]);

  const title = useMemo(() => {
    if (!mode) return "";
    if (mode.type === "statuto") return `Statuto · ${mode.factionLabel}`;
    if (mode.type === "compendio") return `Compendio · ${mode.entry.name}`;
    return `Nuovo compendio · ${mode.factionLabel}`;
  }, [mode]);

  const handleSave = useCallback(async () => {
    if (!mode) return;
    setSaving(true);
    setError(null);

    try {
      if (mode.type === "statuto") {
        await updateAndSave("ordine", mode.factionId, {
          sottotitolo: draft.sottotitolo,
          statute: draft.statute,
          descrizione_meccanica: draft.descrizione_meccanica,
        });
        onClose();
        return;
      }

      if (mode.type === "compendio") {
        const name = draft.name.trim() || mode.entry.name;
        setState((prev) => ({
          ...prev,
          ordine: prev.ordine.map((e) => (e.id === mode.entry.id ? { ...e, name } : e)),
        }));
        await updateAndSave("ordine", mode.entry.id, {
          atto: draft.atto,
          sottotitolo: draft.sottotitolo,
          descrizione_meccanica: draft.descrizione_meccanica,
        });
        onClose();
        return;
      }

      const name = draft.name.trim();
      if (!name) {
        setError("Inserisci un titolo per il compendio.");
        return;
      }

      const slug = slugifyOrdineEntryId(name);
      if (!slug) {
        setError("Titolo non valido.");
        return;
      }

      let id = `${mode.factionId}-${slug}`;
      let n = 2;
      while (state.ordine.some((e) => e.id === id)) {
        id = `${mode.factionId}-${slug}-${n}`;
        n += 1;
      }

      const entry: StatutiEntry = {
        id,
        name,
        statute: draft.statute,
        atto: draft.atto,
        sottotitolo: draft.sottotitolo,
        descrizione_meccanica: draft.descrizione_meccanica,
      };

      setState((prev) => ({
        ...prev,
        ordine: [...prev.ordine, entry],
      }));

      await updateAndSave("ordine", id, {
        atto: draft.atto,
        sottotitolo: draft.sottotitolo,
        descrizione_meccanica: draft.descrizione_meccanica,
      });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Salvataggio non riuscito.");
    } finally {
      setSaving(false);
    }
  }, [draft, mode, onClose, setState, state.ordine, updateAndSave]);

  if (!open || !mode) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ordine-statuti-edit-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 border-0 cursor-default"
        aria-label="Chiudi"
        onClick={onClose}
      />

      <div className="relative z-10 flex flex-col w-full sm:max-w-lg max-h-[min(92vh,640px)] bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-t-xl sm:rounded-xl shadow-2xl animate__animated animate__slideInUp sm:animate__fadeIn motion-reduce:animate-none">
        <header className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--border-color)] bg-black/40">
          <div className="min-w-0">
            <p className="text-[9px] font-display uppercase tracking-[0.16em] text-[var(--accent-violet-light)] truncate">
              Ordine · Modifica
            </p>
            <h3
              id="ordine-statuti-edit-title"
              className="font-display text-sm text-[var(--accent-gold)] tracking-wide truncate"
            >
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--foreground)]/45 hover:text-[var(--accent-gold)] transition-colors shrink-0"
            aria-label="Chiudi"
          >
            <FontAwesomeIcon icon={icons.close} className="w-3.5 h-3.5" />
          </button>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
          {mode.type !== "statuto" && (
            <label className="block space-y-1">
              <span className="text-[10px] font-display uppercase tracking-widest text-[var(--accent-violet-light)]/70">
                Titolo
              </span>
              <input
                value={draft.name}
                onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                className="w-full min-h-[44px] px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm"
                placeholder="Nome del compendio"
              />
            </label>
          )}

          {mode.type === "statuto" && (
            <label className="block space-y-1">
              <span className="text-[10px] font-display uppercase tracking-widest text-[var(--accent-violet-light)]/70">
                Sottotitolo
              </span>
              <input
                value={draft.sottotitolo}
                onChange={(e) => setDraft((p) => ({ ...p, sottotitolo: e.target.value }))}
                className="w-full min-h-[44px] px-3 py-2 rounded border border-[var(--border-color)] bg-[var(--background)] font-accent italic text-sm text-[var(--accent-violet-light)]"
                placeholder="Breve epiteto dell'ordine"
              />
            </label>
          )}

          <label className="block space-y-1">
            <span className="text-[10px] font-display uppercase tracking-widest text-[var(--accent-violet-light)]/70">
              {mode.type === "statuto" ? "Statuto" : "Testo compendio"}
            </span>
            <textarea
              value={mode.type === "statuto" ? draft.statute : draft.atto}
              onChange={(e) => {
                const value = e.target.value;
                setDraft((p) =>
                  mode.type === "statuto" ? { ...p, statute: value } : { ...p, atto: value },
                );
              }}
              rows={8}
              className="w-full px-3 py-2.5 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm leading-relaxed resize-y"
              placeholder={
                mode.type === "statuto"
                  ? "Testo dello statuto narrativo…"
                  : "Contenuto del compendio (supporta BBCode wiki)…"
              }
            />
          </label>

          {mode.type === "statuto" && (
            <label className="block space-y-1">
              <span className="text-[10px] font-display uppercase tracking-widest text-[var(--accent-violet-light)]/70">
                Regole d&apos;ordine <span className="normal-case text-[var(--foreground)]/35">(opzionale)</span>
              </span>
              <textarea
                value={draft.descrizione_meccanica}
                onChange={(e) => setDraft((p) => ({ ...p, descrizione_meccanica: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 rounded border border-[var(--border-color)]/60 bg-[var(--background)] text-xs leading-relaxed text-[var(--foreground)]/70 resize-y"
                placeholder="Note meccaniche…"
              />
            </label>
          )}

          {error ? (
            <p
              role="alert"
              className="text-xs text-[var(--accent-gold)] border border-[var(--accent-gold)]/35 rounded px-3 py-2 bg-[var(--accent-gold)]/8"
            >
              {error}
            </p>
          ) : null}

          {entryId ? (
            <p className="text-[9px] text-[var(--foreground)]/30 font-mono truncate">id: {entryId}</p>
          ) : null}
        </div>

        <footer className="shrink-0 flex gap-2 px-4 py-3 border-t border-[var(--border-color)] bg-black/50">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 min-h-[44px] px-3 rounded border border-[var(--border-color)] text-xs uppercase tracking-wider text-[var(--foreground)]/55 hover:text-[var(--accent-violet-light)] transition-colors disabled:opacity-40"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex-1 min-h-[44px] px-3 rounded border border-[var(--accent-gold)]/55 bg-[var(--accent-gold)]/12 text-xs uppercase tracking-wider text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/20 transition-colors disabled:opacity-40 shadow-[var(--shadow-gold)]"
          >
            {saving ? "Salvataggio…" : "Salva"}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
