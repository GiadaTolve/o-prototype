"use client";

import {
  createDefaultFromSchema,
  getEnumOptions,
  getSchemaPropertyKeys,
  resolveSchemaNode,
  type SchemaNode,
} from "./effetti-schema";
import { CampoValore } from "./CampoValore";
import { EditorCondizione } from "./EditorCondizione";

const VALORE_KEYS = new Set(["valore", "resistenza", "danno"]);

function labelForProperty(key: string): string {
  const labels: Record<string, string> = {
    trigger: "Quando scatta",
    bersaglio: "Su chi/dove",
    durata: "Per quanto dura",
    condizione: "Solo se… (condizione)",
    costo_extra: "Costo extra",
    nota_master: "Nota per il master",
    consistenza: "Consistenza",
    area: "Forma e misure area",
    ripetizioni: "Quante volte colpisce",
    skiru: "Skiru",
    conta_junkan: "Conta nel pool Junkan",
    status: "Status applicato",
    stack: "Stack",
    taglia: "Taglia costrutto",
    gittata_controllo_m: "Gittata controllo (m)",
    movimento_m: "Movimento (m)",
    attacchi_per_turno: "Attacchi per turno",
    n_copie: "N. copie",
    comportamento: "Comportamento",
    conta_mei: "Conta nei Mei",
    testo: "Testo effetto",
    mostra_a: "Visibile a",
    filtro_waza: "Filtro waza (tag)",
  };
  return labels[key] ?? key;
}

const PLACEHOLDER_ESEMPI: Record<string, string> = {
  testo: "es. Il Tōrō può disintegrarsi in mille lucciole di cenere.",
  nota_master: "es. Ricorda al giocatore di dichiarare la Skiru al lancio.",
  condizione_fine: "es. il bersaglio esce dall'area",
};

function DurataEditor({
  value,
  onChange,
  disabled,
}: {
  value: Record<string, unknown> | undefined;
  onChange: (v: Record<string, unknown>) => void;
  disabled?: boolean;
}) {
  const durataSchema = resolveSchemaNode({ $ref: "#/$defs/durata" });
  const tipoProp = (durataSchema.properties as Record<string, SchemaNode>).tipo;
  const enumOpts = getEnumOptions(tipoProp) ?? [];
  const current = value ?? (createDefaultFromSchema(durataSchema) as Record<string, unknown>);
  const tipo = String(current.tipo ?? "ISTANTANEA");
  const inputClass =
    "w-full px-2 py-1.5 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
      <select
        disabled={disabled}
        value={tipo}
        onChange={(e) => onChange({ ...current, tipo: e.target.value })}
        className={inputClass}
      >
        {enumOpts.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {tipo === "TURNI" && (
        <select
          disabled={disabled}
          value={current.n == null ? "" : String(current.n)}
          onChange={(e) => onChange({ ...current, n: Number(e.target.value) })}
          className={inputClass}
        >
          {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
            <option key={n} value={n}>
              {n} turni
            </option>
          ))}
        </select>
      )}
      {tipo === "FINO_A_CONDIZIONE" && (
        <input
          type="text"
          disabled={disabled}
          value={String(current.condizione_fine ?? "")}
          onChange={(e) => onChange({ ...current, condizione_fine: e.target.value })}
          placeholder="es. il bersaglio esce dall'area"
          className={inputClass}
        />
      )}
    </div>
  );
}

function CostoExtraEditor({
  value,
  onChange,
  disabled,
}: {
  value: Record<string, unknown> | undefined;
  onChange: (v: Record<string, unknown> | undefined) => void;
  disabled?: boolean;
}) {
  const hasCs = value && "cs" in value;
  const hasHp = value && "hp" in value;
  const mode = hasHp ? "hp" : hasCs ? "cs" : "none";
  const inputClass =
    "w-full px-2 py-1.5 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      <select
        disabled={disabled}
        value={mode}
        onChange={(e) => {
          if (e.target.value === "none") onChange(undefined);
          else if (e.target.value === "cs") onChange({ cs: 1 });
          else onChange({ hp: 1 });
        }}
        className={inputClass}
      >
        <option value="none">Nessuno</option>
        <option value="cs">CS extra</option>
        <option value="hp">HP extra</option>
      </select>
      {mode !== "none" && (
        <select
          disabled={disabled}
          value={String(value?.[mode] ?? 1)}
          onChange={(e) => onChange({ [mode]: Number(e.target.value) })}
          className={inputClass}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function AreaEditor({
  value,
  onChange,
  disabled,
}: {
  value: Record<string, unknown> | undefined;
  onChange: (v: Record<string, unknown>) => void;
  disabled?: boolean;
}) {
  const areaSchema = resolveSchemaNode({ $ref: "#/$defs/areaSpec" });
  const current = value ?? (createDefaultFromSchema(areaSchema) as Record<string, unknown>);
  const formaProp = (areaSchema.properties as Record<string, SchemaNode>).forma;
  const forme = getEnumOptions(formaProp) ?? [];
  const inputClass =
    "w-full px-2 py-1.5 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
      <select
        disabled={disabled}
        value={String(current.forma ?? "")}
        onChange={(e) => onChange({ ...current, forma: e.target.value })}
        className={inputClass}
      >
        {forme.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
      <select
        disabled={disabled}
        value={current.raggio_m == null ? "" : String(current.raggio_m)}
        onChange={(e) =>
          onChange({ ...current, raggio_m: e.target.value === "" ? undefined : Number(e.target.value) })
        }
        className={inputClass}
      >
        <option value="">Raggio (m)</option>
        {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 30].map((n) => (
          <option key={n} value={n}>
            {n} m
          </option>
        ))}
      </select>
      <select
        disabled={disabled}
        value={current.profondita_m == null ? "" : String(current.profondita_m)}
        onChange={(e) =>
          onChange({
            ...current,
            profondita_m: e.target.value === "" ? undefined : Number(e.target.value),
          })
        }
        className={inputClass}
      >
        <option value="">Profondità (m)</option>
        {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map((n) => (
          <option key={n} value={n}>
            {n} m
          </option>
        ))}
      </select>
    </div>
  );
}

type SchemaFieldProps = {
  fieldKey: string;
  propSchema: SchemaNode;
  value: unknown;
  onChange: (next: unknown) => void;
  disabled?: boolean;
  tierFlatDamage?: number | null;
  statusOptions?: string[];
  vocabStrings?: string[];
};

export function SchemaField({
  fieldKey,
  propSchema,
  value,
  onChange,
  disabled,
  tierFlatDamage,
  statusOptions,
  vocabStrings,
}: SchemaFieldProps) {
  const resolved = resolveSchemaNode(propSchema);
  const inputClass =
    "w-full px-2 py-1.5 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm";

  if (fieldKey === "condizione") {
    return (
      <EditorCondizione
        value={typeof value === "string" ? value : ""}
        onChange={(s) => onChange(s || undefined)}
        disabled={disabled}
        statusOptions={statusOptions}
      />
    );
  }

  if (VALORE_KEYS.has(fieldKey)) {
    return (
      <CampoValore
        value={(value as Record<string, unknown>) ?? undefined}
        onChange={(v) => onChange(v)}
        disabled={disabled}
        tierFlatDamage={tierFlatDamage}
      />
    );
  }

  if (fieldKey === "durata") {
    return (
      <DurataEditor
        value={(value as Record<string, unknown>) ?? undefined}
        onChange={(v) => onChange(v)}
        disabled={disabled}
      />
    );
  }

  if (fieldKey === "costo_extra") {
    return (
      <CostoExtraEditor
        value={(value as Record<string, unknown>) ?? undefined}
        onChange={(v) => onChange(v)}
        disabled={disabled}
      />
    );
  }

  if (fieldKey === "area") {
    return (
      <AreaEditor
        value={(value as Record<string, unknown>) ?? undefined}
        onChange={(v) => onChange(v)}
        disabled={disabled}
      />
    );
  }

  const enumOpts = getEnumOptions(resolved);
  if (enumOpts) {
    return (
      <select
        disabled={disabled}
        value={String(value ?? "")}
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

  if (resolved.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm text-[var(--accent-violet-light)]">
        <input
          type="checkbox"
          checked={Boolean(value)}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="rounded border-[var(--border-color)]"
        />
        Attivo
      </label>
    );
  }

  if (resolved.type === "integer" || resolved.type === "number") {
    return (
      <select
        disabled={disabled}
        value={value == null ? "" : String(value)}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        className={inputClass}
      >
        <option value="">—</option>
        {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    );
  }

  if (fieldKey === "skiru" || fieldKey === "status" || fieldKey === "consistenza") {
    const options = vocabStrings ?? [];
    if (options.length > 0) {
      return (
        <select
          disabled={disabled}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        >
          <option value="">—</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }
  }

  if (fieldKey === "testo" || fieldKey === "nota_master" || fieldKey === "descrizione") {
    return (
      <textarea
        disabled={disabled}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        rows={fieldKey === "testo" ? 4 : 2}
        placeholder={PLACEHOLDER_ESEMPI[fieldKey]}
        className={`${inputClass} min-h-[4rem]`}
      />
    );
  }

  if (resolved.type === "array") {
    const arr = Array.isArray(value) ? (value as string[]) : [];
    return (
      <input
        type="text"
        disabled={disabled}
        value={arr.join(", ")}
        onChange={(e) =>
          onChange(
            e.target.value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          )
        }
        placeholder="Separati da virgola"
        className={inputClass}
      />
    );
  }

  if (resolved.type === "object") {
    const nestedSchema = resolved;
    const keys = getSchemaPropertyKeys(nestedSchema);
    const obj = (value as Record<string, unknown>) ?? {};
    return (
      <div className="space-y-2 pl-2 border-l border-[var(--border-color)]/50">
        {keys.map((k) => {
          const child = (nestedSchema.properties as Record<string, SchemaNode>)[k];
          return (
            <label key={k} className="block space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-gray-500">
                {labelForProperty(k)}
              </span>
              <SchemaField
                fieldKey={k}
                propSchema={child}
                value={obj[k]}
                onChange={(v) => onChange({ ...obj, [k]: v })}
                disabled={disabled}
                tierFlatDamage={tierFlatDamage}
                statusOptions={statusOptions}
              />
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <input
      type="text"
      disabled={disabled}
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
      placeholder={PLACEHOLDER_ESEMPI[fieldKey] ?? "es. …"}
      className={inputClass}
    />
  );
}

export { labelForProperty };
