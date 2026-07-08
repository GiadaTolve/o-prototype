"use client";

import { useMemo } from "react";
import { BLOCCO_TIPO_LABELS, type BloccoTipo } from "./effetti-schema";
import { renderBloccoMeccanico } from "./waza-blocco-render";

type PannelloRenderMeccanicoProps = {
  effetti: Record<string, unknown>[];
  tierFlatDamage?: number | null;
};

/**
 * Anticipo minimo del render meccanico (Sprint 3): traduce in italiano piano
 * ogni blocco compilato, così l'autore verifica di stare codificando ciò che
 * intende. Nessuna esecuzione: pura lettura descrittiva dei blocchi.
 */
export function PannelloRenderMeccanico({
  effetti,
  tierFlatDamage,
}: PannelloRenderMeccanicoProps) {
  const righe = useMemo(
    () =>
      effetti.map((blocco) => ({
        tipo: String((blocco as { tipo?: string }).tipo ?? "") as BloccoTipo,
        frase: renderBloccoMeccanico(blocco, tierFlatDamage),
      })),
    [effetti, tierFlatDamage],
  );

  if (effetti.length === 0) return null;

  return (
    <section className="rounded border border-[var(--accent-violet)]/30 bg-[var(--panel-bg)]/40 p-4 space-y-2 animate__animated animate__fadeIn motion-reduce:animate-none">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-display text-[var(--accent-violet-light)]">
          Come si legge la waza
        </h3>
        <span className="text-[10px] uppercase tracking-wider text-gray-500">
          anteprima meccanica
        </span>
      </div>
      <p className="text-[10px] text-gray-500 leading-relaxed">
        Traduzione automatica dei blocchi in linguaggio piano. Serve a controllare la codifica,
        non è il testo mostrato in gioco.
      </p>
      <ol className="space-y-1.5">
        {righe.map((riga, index) => (
          <li key={index} className="flex gap-2 text-sm leading-snug">
            <span className="text-[10px] font-mono text-[var(--accent-gold)]/70 mt-0.5 shrink-0">
              {index + 1}.
            </span>
            <span className="text-[var(--accent-violet-light)]/90">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 mr-1">
                {BLOCCO_TIPO_LABELS[riga.tipo] ?? riga.tipo}
              </span>
              {riga.frase}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
