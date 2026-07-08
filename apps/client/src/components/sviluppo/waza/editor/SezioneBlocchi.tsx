"use client";

import { useState } from "react";
import {
  BLOCCO_MODELLI,
  BLOCCO_TIPI,
  BLOCCO_TIPO_LABELS,
  createBloccoDaModello,
  createDefaultBlocco,
  type BloccoModello,
  type BloccoTipo,
} from "./effetti-schema";
import { ATOMO_DESCRIZIONI } from "./waza-blocco-render";
import { CardBlocco } from "./CardBlocco";
import { BottomSheet } from "./BottomSheet";
import { ATOMI_IN_ARRIVO } from "./waza-editor-help";

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
  const [sheetOpen, setSheetOpen] = useState(false);

  const addBlocco = (tipo: BloccoTipo) => {
    onChange([...effetti, createDefaultBlocco(tipo)]);
    setMenuOpen(false);
    setSheetOpen(false);
  };

  const addModello = (modello: BloccoModello) => {
    onChange([...effetti, createBloccoDaModello(modello)]);
    setMenuOpen(false);
    setSheetOpen(false);
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-display text-[var(--accent-gold)]">Blocchi effetto</h2>

        {/* Desktop: modelli inline + dropdown atomi */}
        <div className="hidden md:flex flex-wrap items-center gap-2">
          {BLOCCO_MODELLI.map((modello) => (
            <button
              key={modello.id}
              type="button"
              disabled={disabled}
              title={modello.descrizione}
              onClick={() => addModello(modello.id)}
              className="text-[11px] px-2.5 py-1.5 rounded border border-[var(--accent-violet)]/40 text-[var(--accent-violet-light)] hover:border-[var(--accent-gold)]/60 hover:text-[var(--accent-gold)] disabled:opacity-50"
            >
              {modello.label}
            </button>
          ))}
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
              <div className="absolute right-0 z-20 mt-1 w-[300px] rounded border border-[var(--border-color)] bg-[var(--panel-bg)] shadow-lg py-1">
                {BLOCCO_TIPI.map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => addBlocco(tipo)}
                    className="block w-full text-left px-3 py-2 hover:bg-black/30 group"
                  >
                    <span className="block text-xs text-[var(--accent-violet-light)] group-hover:text-[var(--accent-gold)]">
                      {BLOCCO_TIPO_LABELS[tipo]}
                    </span>
                    <span className="block text-[10px] text-gray-500 leading-snug">
                      {ATOMO_DESCRIZIONI[tipo]}
                    </span>
                  </button>
                ))}
                <div className="my-1 border-t border-[var(--border-color)]/60" />
                {ATOMI_IN_ARRIVO.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    disabled
                    className="block w-full text-left px-3 py-2 opacity-50 cursor-not-allowed"
                  >
                    <span className="block text-xs text-gray-400">{item.label}</span>
                    <span className="block text-[10px] text-gray-500 leading-snug">{item.text}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile: un unico bottone che apre il bottom-sheet (modelli + atomi) */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setSheetOpen(true)}
          className="md:hidden text-sm px-3 min-h-[44px] rounded border border-[var(--accent-gold)]/50 text-[var(--accent-gold)] disabled:opacity-50"
        >
          + Aggiungi effetto
        </button>
      </div>

      <BottomSheet
        open={sheetOpen && !disabled}
        onClose={() => setSheetOpen(false)}
        title="Aggiungi blocco"
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-gray-500">Modelli rapidi</p>
            {BLOCCO_MODELLI.map((modello) => (
              <button
                key={modello.id}
                type="button"
                onClick={() => addModello(modello.id)}
                className="block w-full text-left px-3 py-3 rounded border border-[var(--accent-violet)]/40 hover:border-[var(--accent-gold)]/60"
              >
                <span className="block text-sm text-[var(--accent-violet-light)]">
                  {modello.label}
                </span>
                <span className="block text-[11px] text-gray-500 leading-snug mt-0.5">
                  {modello.descrizione}
                </span>
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-gray-500">Atomi</p>
            {BLOCCO_TIPI.map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => addBlocco(tipo)}
                className="block w-full text-left px-3 py-3 rounded border border-[var(--border-color)] hover:bg-black/30"
              >
                <span className="block text-sm text-[var(--accent-violet-light)]">
                  {BLOCCO_TIPO_LABELS[tipo]}
                </span>
                <span className="block text-[11px] text-gray-500 leading-snug mt-0.5">
                  {ATOMO_DESCRIZIONI[tipo]}
                </span>
              </button>
            ))}
            <div className="pt-1">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">In arrivo</p>
              {ATOMI_IN_ARRIVO.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  disabled
                  className="block w-full text-left px-3 py-3 rounded border border-[var(--border-color)]/60 opacity-50 cursor-not-allowed mb-2"
                >
                  <span className="block text-sm text-gray-300">{item.label}</span>
                  <span className="block text-[11px] text-gray-500 leading-snug mt-0.5">{item.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>

      {effetti.length === 0 ? (
        <p className="text-xs text-gray-500 border border-dashed border-[var(--border-color)] rounded px-3 py-6 text-center">
          Nessun blocco. Usa un modello rapido qui sopra o «+ Aggiungi effetto» per iniziare la
          codifica.
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
