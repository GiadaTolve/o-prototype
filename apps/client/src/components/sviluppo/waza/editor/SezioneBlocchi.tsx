"use client";

import { useState } from "react";
import {
  BLOCCO_TIPI,
  BLOCCO_TIPO_LABELS,
  createDefaultBlocco,
  type BloccoTipo,
} from "./effetti-schema";
import { CardBlocco } from "./CardBlocco";

type VocabMap = Record<string, string[]>;

type SezioneBlocchiProps = {
  effetti: Record<string, unknown>[];
  onChange: (next: Record<string, unknown>[]) => void;
  disabled?: boolean;
  tierFlatDamage?: number | null;
  vocabolari: VocabMap;
};

export function SezioneBlocchi({
  effetti,
  onChange,
  disabled,
  tierFlatDamage,
  vocabolari,
}: SezioneBlocchiProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const addBlocco = (tipo: BloccoTipo) => {
    onChange([...effetti, createDefaultBlocco(tipo)]);
    setMenuOpen(false);
  };

  const updateAt = (index: number, next: Record<string, unknown>) => {
    const copy = [...effetti];
    copy[index] = next;
    onChange(copy);
  };

  const removeAt = (index: number) => {
    onChange(effetti.filter((_, i) => i !== index));
  };

  const duplicateAt = (index: number) => {
    const copy = [...effetti];
    copy.splice(index + 1, 0, structuredClone(effetti[index]));
    onChange(copy);
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= effetti.length) return;
    const copy = [...effetti];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    onChange(copy);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-display text-[var(--accent-gold)]">Blocchi effetto</h2>
        <div className="relative">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setMenuOpen((o) => !o)}
            className="text-xs px-3 py-1.5 rounded border border-[var(--accent-gold)]/50 text-[var(--accent-gold)] disabled:opacity-50"
          >
            + Aggiungi effetto
          </button>
          {menuOpen && !disabled && (
            <div className="absolute right-0 z-20 mt-1 min-w-[220px] rounded border border-[var(--border-color)] bg-[var(--panel-bg)] shadow-lg py-1">
              {BLOCCO_TIPI.map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => addBlocco(tipo)}
                  className="block w-full text-left px-3 py-2 text-xs text-[var(--accent-violet-light)] hover:bg-black/30 hover:text-[var(--accent-gold)]"
                >
                  {BLOCCO_TIPO_LABELS[tipo]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {effetti.length === 0 ? (
        <p className="text-xs text-gray-500 border border-dashed border-[var(--border-color)] rounded px-3 py-6 text-center">
          Nessun blocco. Aggiungi un effetto per iniziare la codifica.
        </p>
      ) : (
        <div className="space-y-3">
          {effetti.map((blocco, index) => (
            <CardBlocco
              key={index}
              index={index}
              total={effetti.length}
              blocco={blocco}
              onChange={(next) => updateAt(index, next)}
              onDelete={() => removeAt(index)}
              onDuplicate={() => duplicateAt(index)}
              onMoveUp={() => move(index, -1)}
              onMoveDown={() => move(index, 1)}
              disabled={disabled}
              tierFlatDamage={tierFlatDamage}
              vocabolari={vocabolari}
            />
          ))}
        </div>
      )}
    </section>
  );
}
