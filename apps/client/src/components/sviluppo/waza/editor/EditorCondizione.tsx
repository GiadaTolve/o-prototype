"use client";

import { useMemo } from "react";
import {
  buildCondizioneCanonica,
  CONDIZIONE_SOGGETTI,
  operatoriPerSoggetto,
  parseCondizioneCanonica,
  valoriPerSoggetto,
  type CondizioneSoggettoId,
} from "./condizione-constants";

type EditorCondizioneProps = {
  value: string | undefined;
  onChange: (next: string) => void;
  disabled?: boolean;
  statusOptions?: string[];
};

export function EditorCondizione({
  value,
  onChange,
  disabled,
  statusOptions = [],
}: EditorCondizioneProps) {
  const parsed = useMemo(() => parseCondizioneCanonica(value), [value]);
  const soggetto =
    CONDIZIONE_SOGGETTI.find((s) => s.id === parsed.soggettoId) ?? CONDIZIONE_SOGGETTI[0];
  const operatori = operatoriPerSoggetto(soggetto);
  const valori = valoriPerSoggetto(soggetto);

  const emit = (
    soggettoId: CondizioneSoggettoId,
    operatore: string,
    val: string,
    statusNome: string,
  ) => {
    onChange(buildCondizioneCanonica(soggettoId, operatore, val, statusNome));
  };

  const selectClass =
    "w-full px-2 py-1.5 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm";

  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-gray-500">Condizione (opzionale)</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <select
          disabled={disabled}
          value={parsed.soggettoId || soggetto.id}
          onChange={(e) => {
            const nextSoggetto = CONDIZIONE_SOGGETTI.find((s) => s.id === e.target.value)!;
            const ops = operatoriPerSoggetto(nextSoggetto);
            const vals = valoriPerSoggetto(nextSoggetto);
            emit(nextSoggetto.id, ops[0], vals[0], "");
          }}
          className={selectClass}
        >
          {CONDIZIONE_SOGGETTI.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          disabled={disabled}
          value={parsed.operatore || operatori[0]}
          onChange={(e) =>
            emit(
              (parsed.soggettoId || soggetto.id) as CondizioneSoggettoId,
              e.target.value,
              parsed.valore || valori[0],
              parsed.statusNome,
            )
          }
          className={selectClass}
        >
          {operatori.map((op) => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
        </select>

        <select
          disabled={disabled}
          value={parsed.valore || valori[0]}
          onChange={(e) =>
            emit(
              (parsed.soggettoId || soggetto.id) as CondizioneSoggettoId,
              parsed.operatore || operatori[0],
              e.target.value,
              parsed.statusNome,
            )
          }
          className={selectClass}
        >
          {valori.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {(parsed.soggettoId === "stack(status)" || soggetto.id === "stack(status)") && (
        <label className="block space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-gray-500">Status</span>
          <select
            disabled={disabled}
            value={parsed.statusNome}
            onChange={(e) =>
              emit(
                "stack(status)",
                parsed.operatore || operatori[0],
                parsed.valore || valori[0],
                e.target.value,
              )
            }
            className={selectClass}
          >
            <option value="">— scegli —</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      )}

      {value?.trim() && (
        <p className="text-[10px] text-gray-500 font-mono break-all">Canonico: {value}</p>
      )}
    </div>
  );
}
