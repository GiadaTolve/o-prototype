"use client";

import {
  createDefaultFromSchema,
  getEnumOptions,
  getSchemaPropertyKeys,
  resolveSchemaNode,
  resolveSchemaRef,
  type SchemaNode,
} from "./effetti-schema";
import { CampoValore } from "./CampoValore";
import { EditorCondizione } from "./EditorCondizione";
import { InfoHint } from "./InfoHint";
import { FIELD_HELP_TEXT } from "./waza-editor-help";

const VALORE_KEYS = new Set(["valore", "resistenza", "danno", "quantita"]);

function labelForProperty(key: string): string {
  const labels: Record<string, string> = {
    trigger: "Quando scatta",
    bersaglio: "Su chi o dove",
    valore: "Quanto",
    durata: "Per quanto",
    condizione: "Solo se",
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
    delta_cs: "Delta CS",
    minimo_cs: "Minimo CS",
    famiglia: "Famiglia waza",
    operazione: "Operazione",
    chiave: "Chiave",
    scadenza_turni: "Scadenza (turni)",
    consuma: "Consuma alla lettura",
    delta_resistenza: "Delta resistenza",
    filtro_consistenza: "Filtro consistenza",
    dimensione: "Dimensione",
    da_tag: "Da",
    a_tag: "A",
    oggetto: "Oggetto",
    effetti_collaterali: "Effetti collaterali",
    resistenza_scudo: "Resistenza scudo",
    mitigazione_extra: "Mitigazione extra",
    forma_zona: "Forma zona",
    raggio_zona_m: "Raggio zona (m)",
    ancoraggio: "Ancoraggio",
    effetti_zona: "Effetti zona",
    quando_entra: "Quando entra",
    a_inizio_turno: "A inizio turno",
    immunita: "Immunità",
    quantita: "Quantità",
    durata_blocco_turni: "Durata blocco rigenerazione (turni)",
    direzione: "Direzione",
    status_da: "Status da",
    status_a: "Status a",
    finestra_turni: "Finestra (turni)",
    rilasci: "Rilasci",
    modo: "Modo rilascio",
    blocchi: "Blocchi",
    impatto: "Rilascio a impatto",
    a_comando: "Rilascio a comando",
    scadenza: "Rilascio a scadenza",
    waza_slug: "Waza riferimento",
    tipo: "Tipo",
    n: "Numero turni",
    condizione_fine: "Condizione di fine",
    forma: "Forma",
    raggio_m: "Raggio (m)",
    profondita_m: "Profondità (m)",
  };
  return labels[key] ?? key;
}

const PLACEHOLDER_ESEMPI: Record<string, string> = {
  testo: "es. Il Tōrō può disintegrarsi in mille lucciole di cenere.",
  nota_master: "es. Ricorda al giocatore di dichiarare la Skiru al lancio.",
  condizione_fine: "es. il bersaglio esce dall'area",
};

function optionLabel(fieldKey: string, value: string): string {
  const maps: Record<string, Record<string, string>> = {
    trigger: {
      AL_LANCIO: "Al lancio",
      ALL_IMPATTO: "All'impatto",
      QUANDO_SUBISCI_DANNO: "Quando subisci danno",
      INIZIO_TURNO: "A inizio turno",
      FINE_TURNO: "A fine turno",
      A_COMANDO: "A comando",
      PRE_COSTO: "Prima del costo",
      PRE_LANCIO: "Prima del lancio",
      QUANDO_SUBISCI_STATUS: "Quando subisci status",
      A_SCADENZA: "A scadenza",
      ENTRA_IN_ZONA: "Quando entra in zona",
      SU_DISTRUZIONE: "Alla distruzione",
      SU_MOVIMENTO: "Su movimento",
    },
    bersaglio: {
      SE_STESSO: "Sé stesso",
      BERSAGLIO_SINGOLO: "Un bersaglio",
      AREA: "Area",
      CONO: "Cono",
      LINEA: "Linea",
      PROPRIO_COSTRUTTO: "Proprio costrutto",
      COSTRUTTO_NEMICO: "Costrutto nemico",
      TORO: "Tōrō",
      ZONA_TERRENO: "Zona terreno",
      TUTTI_IN_AREA: "Tutti nell'area",
    },
    tipo: {
      ISTANTANEA: "Istantanea",
      TURNI: "Per turni",
      PERSISTENTE: "Persistente",
      FINO_A_CONDIZIONE: "Fino a condizione",
      COMBATTIMENTO: "Per il combattimento",
    },
    forma: {
      cerchio: "Cerchio",
      cono: "Cono",
      linea: "Linea",
      sfera: "Sfera",
      zona: "Zona",
    },
    operazione: {
      SCRIVI: "Scrivi",
      LEGGI: "Leggi",
      DRENA: "Drena",
      RECUPERA: "Recupera",
      DEPOSITA: "Deposita",
      BLOCCA_RIGEN: "Blocca rigenerazione",
      DEVIA: "Devia",
      RIMBALZA: "Rimbalza",
      SOSPENDI: "Sospendi",
      SDOPPIA: "Sdoppia",
      PENETRA: "Penetra",
      ANCORA: "Àncora",
      SPINGI: "Spingi",
      TRASFERISCI: "Trasferisci",
      TRASMUTA: "Trasmuta",
      CONSUMA: "Consuma",
      RIMUOVI: "Rimuovi",
    },
    dimensione: {
      categoria: "Categoria",
      consistenza: "Consistenza",
    },
    oggetto: {
      WAZA_PROPRIA: "Waza propria",
      COSTRUTTO: "Costrutto",
    },
    ancoraggio: {
      FISSA: "Fissa",
      SEGUE_ANALISTA: "Segue l'analista",
      SEGUE_COSTRUTTO: "Segue un costrutto",
    },
    modo: {
      IMPATTO: "Impatto",
      A_COMANDO: "A comando",
      SCADENZA: "Scadenza",
    },
  };
  return maps[fieldKey]?.[value] ?? value;
}

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
    "w-full px-2 py-1.5 min-h-[44px] md:min-h-0 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm";

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
            {optionLabel("tipo", opt)}
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
    "w-full px-2 py-1.5 min-h-[44px] md:min-h-0 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm";

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
    "w-full px-2 py-1.5 min-h-[44px] md:min-h-0 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm";

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
            {optionLabel("forma", f)}
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

function EffettiCollateraliEditor({
  value,
  onChange,
  disabled,
  tierFlatDamage,
}: {
  value: unknown;
  onChange: (next: unknown) => void;
  disabled?: boolean;
  tierFlatDamage?: number | null;
}) {
  const rows = Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];
  const tipi = [
    { id: "MOD_GITTATA", label: "Modifica gittata" },
    { id: "MOD_RAGGIO", label: "Modifica raggio" },
    { id: "MOD_DURATA", label: "Modifica durata" },
  ];
  const inputClass =
    "w-full px-2 py-1.5 min-h-[44px] md:min-h-0 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm";

  const patchRow = (index: number, next: Record<string, unknown>) => {
    const copy = [...rows];
    copy[index] = next;
    onChange(copy);
  };

  return (
    <div className="space-y-2">
      {rows.map((row, idx) => (
        <div key={idx} className="rounded border border-[var(--border-color)]/70 p-2 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-center">
            <select
              disabled={disabled}
              value={String(row.tipo ?? "MOD_GITTATA")}
              onChange={(e) => patchRow(idx, { ...row, tipo: e.target.value })}
              className={inputClass}
            >
              {tipi.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(rows.filter((_, i) => i !== idx))}
              className="text-xs px-3 py-1.5 rounded border border-[var(--border-color)] text-red-300 disabled:opacity-50"
            >
              Rimuovi
            </button>
          </div>
          <CampoValore
            value={(row.valore as Record<string, unknown>) ?? { tipo: "TIER" }}
            onChange={(v) => patchRow(idx, { ...row, valore: v })}
            disabled={disabled}
            tierFlatDamage={tierFlatDamage}
          />
        </div>
      ))}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange([...rows, { tipo: "MOD_GITTATA", valore: { tipo: "TIER" } }])}
        className="text-xs px-3 py-1.5 rounded border border-[var(--accent-violet)]/40 text-[var(--accent-violet-light)] disabled:opacity-50"
      >
        + Aggiungi effetto collaterale
      </button>
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
    "w-full px-2 py-1.5 min-h-[44px] md:min-h-0 rounded border border-[var(--border-color)] bg-[var(--background)] text-sm";

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

  if (resolved.oneOf && Array.isArray(resolved.oneOf)) {
    const branches = (resolved.oneOf as SchemaNode[]).map((b) =>
      b.$ref ? resolveSchemaRef(String(b.$ref)) : b,
    );
    const currentObj = (value as Record<string, unknown>) ?? {};
    const selectedTipo = String(currentObj.tipo ?? "");
    const selectedBranch =
      branches.find((b) => {
        const tipoConst = (b.properties as Record<string, SchemaNode> | undefined)?.tipo?.const;
        return tipoConst === selectedTipo;
      }) ?? branches[0];
    const selectedBranchProps = (selectedBranch.properties as Record<string, SchemaNode>) ?? {};
    const selectedBranchKeys = getSchemaPropertyKeys(selectedBranch);
    const selectedBranchTipo = String(selectedBranchProps.tipo?.const ?? "");

    return (
      <div className="space-y-2 pl-2 border-l border-[var(--border-color)]/50">
        <label className="block space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-gray-500">Tipo</span>
          <select
            disabled={disabled}
            value={selectedTipo || selectedBranchTipo}
            onChange={(e) => {
              const next = branches.find((b) => {
                const tipoConst = (b.properties as Record<string, SchemaNode> | undefined)?.tipo?.const;
                return String(tipoConst ?? "") === e.target.value;
              });
              onChange(
                next ? (createDefaultFromSchema(next) as Record<string, unknown>) : { tipo: e.target.value },
              );
            }}
            className={inputClass}
          >
            {branches.map((b) => {
              const tipoConst = String(
                ((b.properties as Record<string, SchemaNode> | undefined)?.tipo?.const ?? ""),
              );
              return (
                <option key={tipoConst} value={tipoConst}>
                  {tipoConst}
                </option>
              );
            })}
          </select>
        </label>
        {selectedBranchKeys.map((k) => {
          const child = selectedBranchProps[k];
          return (
            <label key={k} className="block space-y-1">
              <span className="flex items-center justify-between gap-1">
                <span className="text-[10px] uppercase tracking-wider text-gray-500">
                  {labelForProperty(k)}
                </span>
                <InfoHint
                  title={labelForProperty(k)}
                  text={
                    FIELD_HELP_TEXT[k] ?? "Compila questo campo solo se è rilevante per il blocco corrente."
                  }
                  className="-my-2"
                />
              </span>
              <SchemaField
                fieldKey={k}
                propSchema={child}
                value={currentObj[k]}
                onChange={(v) => onChange({ ...currentObj, tipo: selectedBranchTipo, [k]: v })}
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

  if (fieldKey === "effetti_collaterali") {
    return (
      <EffettiCollateraliEditor
        value={value}
        onChange={onChange}
        disabled={disabled}
        tierFlatDamage={tierFlatDamage}
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
            {optionLabel(fieldKey, opt)}
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
    if (fieldKey === "delta_cs" || fieldKey === "delta_resistenza") {
      return (
        <select
          disabled={disabled}
          value={value == null ? "" : String(value)}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
          className={inputClass}
        >
          <option value="">—</option>
          {[-10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <option key={n} value={n}>
              {n > 0 ? `+${n}` : n}
            </option>
          ))}
        </select>
      );
    }
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
              <span className="flex items-center justify-between gap-1">
                <span className="text-[10px] uppercase tracking-wider text-gray-500">
                  {labelForProperty(k)}
                </span>
                <InfoHint
                  title={labelForProperty(k)}
                  text={
                    FIELD_HELP_TEXT[k] ?? "Compila questo campo solo se è rilevante per il blocco corrente."
                  }
                  className="-my-2"
                />
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
