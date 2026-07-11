"use client";

import { InfoHint } from "./InfoHint";
import type { ConstructProprietaId } from "@domain/combat/construct-profile";

const PROPRIETA_OPTIONS: Array<{ id: ConstructProprietaId; label: string; help: string }> = [
  {
    id: "BATTERIA",
    label: "Batteria",
    help: "Immagazzina fino a 5 CS, recuperabili al tocco.",
  },
  {
    id: "PERSONALE",
    label: "Personale",
    help: "Solo il creatore lo controlla; si dissolve se l’analista perde i sensi o muore.",
  },
  {
    id: "TORO",
    label: "Tōrō",
    help: "Conserva estetica e danno base dell’arma (valore assoluto); taglia dall’arma; immune a Manipolazione/Trasformazione altrui.",
  },
];

type EditorProprietaCostruttoProps = {
  value: ConstructProprietaId[];
  toroDaArma: boolean;
  onChange: (next: ConstructProprietaId[]) => void;
  onToroDaArmaChange: (v: boolean) => void;
  disabled?: boolean;
};

export function EditorProprietaCostrutto({
  value,
  toroDaArma,
  onChange,
  onToroDaArmaChange,
  disabled,
}: EditorProprietaCostruttoProps) {
  const toggle = (id: ConstructProprietaId) => {
    if (disabled) return;
    if (value.includes(id)) onChange(value.filter((x) => x !== id));
    else onChange([...value, id]);
  };

  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-gray-500">Proprietà speciali</p>
      <div className="flex flex-col gap-2">
        {PROPRIETA_OPTIONS.map((opt) => (
          <label
            key={opt.id}
            className="flex items-center gap-2 min-h-[44px] px-2 rounded border border-[var(--border-color)]/60"
          >
            <input
              type="checkbox"
              checked={value.includes(opt.id)}
              disabled={disabled}
              onChange={() => toggle(opt.id)}
              className="shrink-0"
            />
            <span className="text-sm text-gray-300">{opt.label}</span>
            <InfoHint title={opt.label} text={opt.help} className="ml-auto" />
          </label>
        ))}
      </div>
      {value.includes("TORO") && (
        <label className="flex items-center gap-2 min-h-[44px] text-sm text-gray-400">
          <input
            type="checkbox"
            checked={toroDaArma}
            disabled={disabled}
            onChange={(e) => onToroDaArmaChange(e.target.checked)}
          />
          Danno e taglia dall’arma impugnata
        </label>
      )}
    </div>
  );
}

type EditorMeiCostruttoProps = {
  value: { etichetta?: string; inviolabile?: boolean } | undefined;
  onChange: (next: { etichetta?: string; inviolabile?: boolean } | undefined) => void;
  disabled?: boolean;
};

export function EditorMeiCostrutto({ value, onChange, disabled }: EditorMeiCostruttoProps) {
  return (
    <div className="space-y-2 rounded border border-[var(--accent-violet)]/20 p-2">
      <p className="text-[10px] uppercase tracking-wider text-[var(--accent-violet-light)]">
        Mei (solo Genzai-dō)
      </p>
      <label className="block space-y-1">
        <span className="text-[10px] text-gray-500">Etichetta Mei (opzionale)</span>
        <input
          type="text"
          disabled={disabled}
          value={value?.etichetta ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              etichetta: e.target.value || undefined,
            })
          }
          className="w-full rounded border border-[var(--border-color)] bg-black/30 px-2 py-1.5 text-sm"
          placeholder="es. Lanterna fluttuante"
        />
      </label>
      <label className="flex items-center gap-2 min-h-[44px] text-sm text-gray-400">
        <input
          type="checkbox"
          disabled={disabled}
          checked={value?.inviolabile ?? false}
          onChange={(e) => onChange({ ...value, inviolabile: e.target.checked })}
        />
        Mei inviolabile (non conta nel limite Gosa)
      </label>
    </div>
  );
}
