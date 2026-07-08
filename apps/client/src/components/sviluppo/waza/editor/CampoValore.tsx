"use client";

import {
  createDefaultValore,
  getValoreBranches,
  getValoreTipoFromBranch,
  VALORE_TIPO_LABELS,
  type SchemaNode,
} from "./effetti-schema";

type CampoValoreProps = {
  value: Record<string, unknown> | undefined;
  onChange: (next: Record<string, unknown>) => void;
  disabled?: boolean;
  tierFlatDamage?: number | null;
};

function labelForKey(key: string): string {
  const labels: Record<string, string> = {
    n: "Valore",
    x: "Moltiplicatore (×)",
    base: "Base di partenza",
    skiru: "Skiru di riferimento",
    per_punto: "Aggiunta per punto Skiru",
    status: "Status di riferimento",
    passi: "Passi (separati da virgola)",
    cap: "Tetto massimo (cap)",
  };
  return labels[key] ?? key;
}

const VALORE_PLACEHOLDER: Record<string, string> = {
  skiru: "es. kensei",
  status: "es. Incendiato",
};

function ValoreScalarField({
  schemaKey,
  propSchema,
  value,
  onChange,
  disabled,
}: {
  schemaKey: string;
  propSchema: SchemaNode;
  value: unknown;
  onChange: (v: unknown) => void;
  disabled?: boolean;
}) {
  const enumOpts =
    Array.isArray(propSchema.enum) ? (propSchema.enum as string[]) : null;
  const inputClass =
    "w-full px-2 py-1.5 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm";

  if (enumOpts) {
    return (
      <select
        value={String(value ?? "")}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      >
        <option value="">—</option>
        {enumOpts.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  if (propSchema.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm text-[var(--accent-violet-light)]">
        <input
          type="checkbox"
          checked={Boolean(value)}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="rounded border-[var(--border-color)]"
        />
        Sì
      </label>
    );
  }

  if (propSchema.type === "array") {
    const arr = Array.isArray(value) ? value : [];
    return (
      <input
        type="text"
        disabled={disabled}
        value={arr.join(", ")}
        onChange={(e) => {
          const passi = e.target.value
            .split(",")
            .map((s) => Number(s.trim()))
            .filter((n) => !Number.isNaN(n));
          onChange(passi);
        }}
        placeholder="es. 1, 2, 4"
        className={inputClass}
      />
    );
  }

  if (propSchema.type === "integer" || propSchema.type === "number") {
    return (
      <select
        value={value == null ? "" : String(value)}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        className={inputClass}
      >
        <option value="">—</option>
        {[-5, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 23, 30, 50, 100].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type="text"
      disabled={disabled}
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
      placeholder={VALORE_PLACEHOLDER[schemaKey] ?? "es. …"}
      className={inputClass}
    />
  );
}

export function CampoValore({ value, onChange, disabled, tierFlatDamage }: CampoValoreProps) {
  const current = value ?? { tipo: "TIER" };
  const tipo = String(current.tipo ?? "");
  const branches = getValoreBranches();

  const branch = branches.find((b) => getValoreTipoFromBranch(b) === tipo) ?? branches[0];
  const props = (branch.properties as Record<string, SchemaNode> | undefined) ?? {};
  const keys = Object.keys(props).filter((k) => k !== "tipo");

  const setTipo = (nextTipo: string) => {
    onChange(createDefaultValore(nextTipo));
  };

  const patch = (key: string, val: unknown) => {
    onChange({ ...current, [key]: val });
  };

  return (
    <div className="space-y-2 rounded border border-[var(--border-color)]/70 bg-black/20 p-3">
      <label className="block space-y-1">
        <span className="text-[10px] uppercase tracking-wider text-gray-500">Tipo valore</span>
        <select
          value={tipo}
          disabled={disabled}
          onChange={(e) => setTipo(e.target.value)}
          className="w-full px-2 py-1.5 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm"
        >
          {branches.map((b) => {
            const t = getValoreTipoFromBranch(b);
            return (
              <option key={t} value={t}>
                {VALORE_TIPO_LABELS[t] ?? t}
              </option>
            );
          })}
        </select>
      </label>

      {tipo === "TIER" && tierFlatDamage != null && (
        <p className="text-xs text-[var(--accent-violet-light)]">
          Danno piatto tier: <span className="text-[var(--accent-gold)]">{tierFlatDamage}</span>
        </p>
      )}

      {keys.map((key) => (
        <label key={key} className="block space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-gray-500">
            {labelForKey(key)}
          </span>
          <ValoreScalarField
            schemaKey={key}
            propSchema={props[key]}
            value={current[key]}
            onChange={(v) => patch(key, v)}
            disabled={disabled}
          />
        </label>
      ))}
    </div>
  );
}
