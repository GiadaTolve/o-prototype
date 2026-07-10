"use client";

import { useMemo } from "react";
import {
  BLOCCO_TIPO_LABELS,
  getBloccoSchemaByTipo,
  getSchemaPropertyKeys,
  type BloccoTipo,
  type SchemaNode,
} from "./effetti-schema";
import { SchemaField, labelForProperty } from "./SchemaField";
import { InfoHint } from "./InfoHint";
import { BLOCCO_INFO_TESTI, FIELD_HELP_TEXT } from "./waza-editor-help";
import { AnteprimaCostrutto } from "./AnteprimaCostrutto";
import {
  EditorMeiCostrutto,
  EditorProprietaCostrutto,
} from "./EditorProprietaCostrutto";
import type { ConstructProprietaId } from "@domain/combat/construct-profile";

const EVOCA_CUSTOM_KEYS = new Set([
  "proprieta",
  "toro_da_arma",
  "mei",
  "conta_mei",
  "resistenza",
  "danno",
]);

const BLOCCO_ACCENT: Record<BloccoTipo, string> = {
  DANNO: "var(--accent-gold)",
  MOD_DANNO: "var(--accent-gold)",
  BUFF_SKIRU: "var(--accent-violet-light)",
  APPLICA_STATUS: "var(--accent-violet)",
  EVOCA_COSTRUTTO: "var(--accent-violet-light)",
  MANUALE: "var(--accent-violet)",
};

type VocabMap = Record<string, string[]>;

type CardBloccoProps = {
  index: number;
  total: number;
  blocco: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  disabled?: boolean;
  tierFlatDamage?: number | null;
  vocabolari: VocabMap;
  wazaTier?: number | null;
  genitore?: string | null;
};

export function CardBlocco({
  index,
  total,
  blocco,
  onChange,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  disabled,
  tierFlatDamage,
  vocabolari,
  wazaTier,
  genitore,
}: CardBloccoProps) {
  const tipo = String(blocco.tipo ?? "") as BloccoTipo;
  const schema = useMemo(() => getBloccoSchemaByTipo(tipo), [tipo]);
  const fieldKeys = useMemo(() => (schema ? getSchemaPropertyKeys(schema) : []), [schema]);
  const accent = BLOCCO_ACCENT[tipo] ?? "var(--accent-gold)";

  const vocabFor = (key: string): string[] | undefined => {
    if (key === "skiru") return vocabolari.skiru;
    if (key === "status") return vocabolari.status;
    if (key === "consistenza") return vocabolari.consistenza;
    return undefined;
  };

  const patchField = (key: string, value: unknown) => {
    const next = { ...blocco, [key]: value };
    if (value === undefined || value === "") {
      if (key === "condizione" || key === "costo_extra" || key === "nota_master") {
        delete next[key];
      }
    }
    onChange(next);
  };

  if (!schema) return null;

  return (
    <article
      className="rounded border border-[var(--border-color)] bg-[var(--panel-bg)]/60 overflow-hidden"
      style={{ boxShadow: `inset 3px 0 0 ${accent}` }}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-black/30 border-b border-[var(--border-color)]/60">
        <div>
          <p className="text-xs font-display text-[var(--accent-gold)]">
            Blocco {index + 1} — {BLOCCO_TIPO_LABELS[tipo] ?? tipo}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          <InfoHint
            title={`${BLOCCO_TIPO_LABELS[tipo] ?? tipo}`}
            text={BLOCCO_INFO_TESTI[tipo]}
            className="-my-2"
          />
          <button
            type="button"
            disabled={disabled || index === 0}
            onClick={onMoveUp}
            className="text-[10px] px-2 py-0.5 rounded border border-[var(--border-color)] text-gray-400 disabled:opacity-40"
          >
            ↑
          </button>
          <button
            type="button"
            disabled={disabled || index >= total - 1}
            onClick={onMoveDown}
            className="text-[10px] px-2 py-0.5 rounded border border-[var(--border-color)] text-gray-400 disabled:opacity-40"
          >
            ↓
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onDuplicate}
            className="text-[10px] px-2 py-0.5 rounded border border-[var(--border-color)] text-gray-400"
          >
            Duplica
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onDelete}
            className="text-[10px] px-2 py-0.5 rounded border border-[var(--border-color)] text-red-400/80"
          >
            Elimina
          </button>
        </div>
      </header>

      <div className="p-3 space-y-3">
        {tipo === "EVOCA_COSTRUTTO" && (
          <>
            <EditorProprietaCostrutto
              value={(Array.isArray(blocco.proprieta) ? blocco.proprieta : []) as ConstructProprietaId[]}
              toroDaArma={blocco.toro_da_arma !== false}
              disabled={disabled}
              onChange={(proprieta) => patchField("proprieta", proprieta)}
              onToroDaArmaChange={(v) => patchField("toro_da_arma", v)}
            />
            {genitore && /genzai/i.test(genitore) && (
              <EditorMeiCostrutto
                value={blocco.mei as { etichetta?: string; inviolabile?: boolean } | undefined}
                disabled={disabled}
                onChange={(mei) => patchField("mei", mei)}
              />
            )}
          </>
        )}
        {fieldKeys
          .filter((key) => !(tipo === "EVOCA_COSTRUTTO" && EVOCA_CUSTOM_KEYS.has(key)))
          .map((key) => {
          const propSchema = (schema.properties as Record<string, SchemaNode>)[key];
          const fieldLabel = labelForProperty(key);
          const fieldHelp = FIELD_HELP_TEXT[key] ?? "Compila questo campo in base all'effetto che vuoi ottenere.";
          return (
            <label key={key} className="block space-y-1">
              <span className="flex items-center justify-between gap-1">
                <span className="text-[10px] uppercase tracking-wider text-gray-500">{fieldLabel}</span>
                <InfoHint title={fieldLabel} text={fieldHelp} className="-my-2" />
              </span>
              <SchemaField
                fieldKey={key}
                propSchema={propSchema}
                value={blocco[key]}
                onChange={(v) => patchField(key, v)}
                disabled={disabled}
                tierFlatDamage={tierFlatDamage}
                statusOptions={vocabolari.status}
                vocabStrings={vocabFor(key)}
              />
            </label>
          );
        })}
        {tipo === "EVOCA_COSTRUTTO" && (
          <AnteprimaCostrutto blocco={blocco} wazaTier={wazaTier ?? null} genitore={genitore ?? null} />
        )}
      </div>
    </article>
  );
}
