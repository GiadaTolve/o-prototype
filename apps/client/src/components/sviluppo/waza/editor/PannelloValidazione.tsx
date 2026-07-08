"use client";

import type { ValidationIssue } from "./waza-editor-utils";

type PannelloValidazioneProps = {
  errori: ValidationIssue[];
  avvisi: ValidationIssue[];
  info?: string | null;
};

export function PannelloValidazione({ errori, avvisi, info }: PannelloValidazioneProps) {
  const hasContent = errori.length > 0 || avvisi.length > 0 || Boolean(info);

  return (
    <aside className="md:sticky md:bottom-0 z-10 rounded border border-[var(--border-color)] bg-[var(--background)]/95 backdrop-blur-sm p-3 space-y-2 shadow-[var(--shadow-violet)]">
      <h3 className="text-xs font-display uppercase tracking-wider text-[var(--accent-violet-light)]">
        Validazione
      </h3>

      {!hasContent && (
        <p className="text-xs text-gray-500">
          Salva per vedere errori di schema (422) o Valida per le regole di business.
        </p>
      )}

      {info && <p className="text-xs text-[var(--accent-violet-light)]">{info}</p>}

      {errori.length > 0 && (
        <ul className="space-y-1">
          {errori.map((e, i) => (
            <li key={`e-${i}`} className="text-xs text-red-300/90">
              {e.percorso ? (
                <span className="text-red-400/70 font-mono text-[10px] mr-1">[{e.percorso}]</span>
              ) : null}
              {e.messaggio}
            </li>
          ))}
        </ul>
      )}

      {avvisi.length > 0 && (
        <ul className="space-y-1">
          {avvisi.map((a, i) => (
            <li key={`a-${i}`} className="text-xs text-[var(--accent-gold)]/80">
              {a.messaggio}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
