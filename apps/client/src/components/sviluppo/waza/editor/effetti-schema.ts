import rawSchema from "../../../../../../../schemas/effetti.schema.json";

export type SchemaNode = Record<string, unknown>;

export const EFFETTI_SCHEMA = rawSchema as {
  $defs: Record<string, SchemaNode>;
};

export const BLOCCO_TIPI = [
  "DANNO",
  "MOD_DANNO",
  "BUFF_SKIRU",
  "APPLICA_STATUS",
  "EVOCA_COSTRUTTO",
  "MOD_COSTO",
  "STATO_PERSONALE",
  "MOD_RESISTENZA",
  "TRASFORMA_TAG",
  "SCUDO",
  "ZONA",
  "MOD_CS",
  "MOD_TRAIETTORIA",
  "MANIPOLA_STATUS",
  "DIFFERITO",
  "MANUALE",
] as const;

export type BloccoTipo = (typeof BLOCCO_TIPI)[number];

export const BLOCCO_TIPO_LABELS: Record<BloccoTipo, string> = {
  DANNO: "Danno",
  MOD_DANNO: "Modificatore danno",
  BUFF_SKIRU: "Buff Skiru",
  APPLICA_STATUS: "Applica status",
  EVOCA_COSTRUTTO: "Evoca costrutto",
  MOD_COSTO: "Modifica costo CS",
  STATO_PERSONALE: "Stato personale",
  MOD_RESISTENZA: "Modifica resistenza",
  TRASFORMA_TAG: "Trasforma tag",
  SCUDO: "Scudo",
  ZONA: "Zona",
  MOD_CS: "Modifica CS",
  MOD_TRAIETTORIA: "Modifica traiettoria",
  MANIPOLA_STATUS: "Manipola status",
  DIFFERITO: "Differito",
  MANUALE: "Manuale (Master)",
};

export const VALORE_TIPO_LABELS: Record<string, string> = {
  FISSO: "Numero fisso",
  TIER: "Usa la forza della waza (tier)",
  TIER_DELTA: "Un gradino più forte/debole (tier ±1)",
  TIER_PER_STACK: "Tier per stack di status",
  SOMMA_BOOST: "Somma dei bonus attivi",
  TIER_COLPO_SUBITO: "Tier del colpo subito",
  FORMULA: "Formula su Skiru",
  MOLT: "Moltiplicatore",
  SCALA: "Scala a gradini",
  RIFERIMENTO: "Riferimento a un'altra waza",
};

export function resolveSchemaRef(ref: string): SchemaNode {
  const name = ref.replace("#/$defs/", "");
  const node = EFFETTI_SCHEMA.$defs[name];
  if (!node) throw new Error(`Schema ref non risolto: ${ref}`);
  return node;
}

export function resolveSchemaNode(node: SchemaNode): SchemaNode {
  if (typeof node.$ref === "string") return resolveSchemaRef(node.$ref);
  return node;
}

export function getBloccoSchemas(): { tipo: BloccoTipo; schema: SchemaNode }[] {
  const bloccoEffetto = EFFETTI_SCHEMA.$defs.bloccoEffetto;
  const oneOf = (bloccoEffetto.oneOf ?? []) as Array<{ $ref?: string }>;
  return oneOf
    .map((entry) => {
      if (!entry.$ref) return null;
      const schema = resolveSchemaRef(entry.$ref);
      const tipoProp = (schema.properties as Record<string, SchemaNode> | undefined)?.tipo;
      const tipo = tipoProp?.const as BloccoTipo | undefined;
      if (!tipo) return null;
      return { tipo, schema };
    })
    .filter((x): x is { tipo: BloccoTipo; schema: SchemaNode } => x != null);
}

export function getBloccoSchemaByTipo(tipo: string): SchemaNode | undefined {
  return getBloccoSchemas().find((b) => b.tipo === tipo)?.schema;
}

export function getValoreBranches(): SchemaNode[] {
  const valore = resolveSchemaRef("#/$defs/valore");
  const oneOf = (valore.oneOf ?? []) as Array<{ $ref?: string }>;
  return oneOf.map((entry) => resolveSchemaRef(entry.$ref!));
}

export function getValoreTipoFromBranch(branch: SchemaNode): string {
  const tipo = (branch.properties as Record<string, SchemaNode> | undefined)?.tipo;
  return String(tipo?.const ?? "");
}

export function getEnumOptions(node: SchemaNode): string[] | null {
  const resolved = resolveSchemaNode(node);
  if (Array.isArray(resolved.enum)) return resolved.enum as string[];
  return null;
}

export function getSchemaPropertyKeys(schema: SchemaNode): string[] {
  const props = schema.properties as Record<string, SchemaNode> | undefined;
  if (!props) return [];
  const required = new Set((schema.required as string[]) ?? []);
  const keys = Object.keys(props).filter((k) => k !== "tipo");
  const requiredKeys = keys.filter((k) => required.has(k));
  const optionalKeys = keys.filter((k) => !required.has(k));
  return [...requiredKeys, ...optionalKeys];
}

export function createDefaultFromSchema(schema: SchemaNode): unknown {
  const resolved = resolveSchemaNode(schema);
  if (resolved.const !== undefined) return resolved.const;
  if (resolved.default !== undefined) return resolved.default;

  const enumOpts = getEnumOptions(resolved);
  if (enumOpts && enumOpts.length > 0) return enumOpts[0];

  if (resolved.oneOf) {
    const branches = resolved.oneOf as SchemaNode[];
    const first = branches[0];
    return createDefaultFromSchema(first.$ref ? resolveSchemaRef(first.$ref) : first);
  }

  if (resolved.type === "object") {
    const props = resolved.properties as Record<string, SchemaNode> | undefined;
    const required = (resolved.required as string[]) ?? [];
    const out: Record<string, unknown> = {};
    for (const key of required) {
      const prop = props?.[key];
      if (!prop) continue;
      out[key] = createDefaultFromSchema(prop);
    }
    return out;
  }

  if (resolved.type === "array") return [];
  if (resolved.type === "boolean") return false;
  if (resolved.type === "integer" || resolved.type === "number") return 1;
  if (resolved.type === "string") return "testo";
  return "";
}

/** Bersaglio precompilato per tipo di atomo (default sensato alla creazione). */
const BERSAGLIO_DEFAULT_PER_TIPO: Partial<Record<BloccoTipo, string>> = {
  DANNO: "BERSAGLIO_SINGOLO",
  MOD_DANNO: "SE_STESSO",
  BUFF_SKIRU: "SE_STESSO",
  APPLICA_STATUS: "BERSAGLIO_SINGOLO",
  EVOCA_COSTRUTTO: "SE_STESSO",
  MOD_COSTO: "SE_STESSO",
  STATO_PERSONALE: "SE_STESSO",
  MOD_RESISTENZA: "SE_STESSO",
  TRASFORMA_TAG: "SE_STESSO",
  SCUDO: "SE_STESSO",
  ZONA: "ZONA_TERRENO",
  MOD_CS: "BERSAGLIO_SINGOLO",
  MOD_TRAIETTORIA: "BERSAGLIO_SINGOLO",
  MANIPOLA_STATUS: "BERSAGLIO_SINGOLO",
  DIFFERITO: "BERSAGLIO_SINGOLO",
};

export function createDefaultBlocco(tipo: BloccoTipo): Record<string, unknown> {
  const schema = getBloccoSchemaByTipo(tipo);
  if (!schema) return { tipo };
  const value = createDefaultFromSchema(schema);
  const blocco =
    typeof value === "object" && value != null
      ? (value as Record<string, unknown>)
      : { tipo };

  // Default sensati: trigger al lancio, durata istantanea, bersaglio per tipo.
  if ("trigger" in blocco) blocco.trigger = "AL_LANCIO";
  if ("durata" in blocco) blocco.durata = { tipo: "ISTANTANEA" };
  const bersaglio = BERSAGLIO_DEFAULT_PER_TIPO[tipo];
  if (bersaglio && "bersaglio" in blocco) blocco.bersaglio = bersaglio;

  if (tipo === "ZONA" && "durata" in blocco) {
    blocco.durata = { tipo: "TURNI", n: 3 };
  }

  return blocco;
}

/** Effetto annidato in effetti_zona (quando_entra / a_inizio_turno). */
export function createDefaultZonaInternoHook(
  hook: "quando_entra" | "a_inizio_turno",
): Record<string, unknown> {
  const blocco = createDefaultBlocco("APPLICA_STATUS");
  blocco.trigger = hook === "quando_entra" ? "ENTRA_IN_ZONA" : "INIZIO_TURNO";
  blocco.bersaglio = "BERSAGLIO_SINGOLO";
  blocco.durata = { tipo: "TURNI", n: 1 };
  return blocco;
}

export type BloccoModello = "danno-semplice" | "potenziamento-durata" | "effetto-master";

export const BLOCCO_MODELLI: {
  id: BloccoModello;
  label: string;
  descrizione: string;
}[] = [
  {
    id: "danno-semplice",
    label: "Danno semplice",
    descrizione: "Danno pari al tier, a un bersaglio singolo",
  },
  {
    id: "potenziamento-durata",
    label: "Potenziamento con durata",
    descrizione: "Buff +2 di una Skiru su di te per 2 turni",
  },
  {
    id: "effetto-master",
    label: "Effetto per il master",
    descrizione: "Testo libero, non eseguito dal motore",
  },
];

/** Crea un blocco già precompilato col caso d'uso più comune. */
export function createBloccoDaModello(modello: BloccoModello): Record<string, unknown> {
  switch (modello) {
    case "danno-semplice": {
      const b = createDefaultBlocco("DANNO");
      b.valore = { tipo: "TIER" };
      return b;
    }
    case "potenziamento-durata": {
      // I potenziamenti Skiru sono valori FISSI (boost base canonico +2), mai tier-delta.
      const b = createDefaultBlocco("BUFF_SKIRU");
      b.durata = { tipo: "TURNI", n: 2 };
      b.valore = { tipo: "FISSO", n: 2 };
      return b;
    }
    case "effetto-master":
      return createDefaultBlocco("MANUALE");
    default:
      return createDefaultBlocco("MANUALE");
  }
}

export function createDefaultValore(tipo: string): Record<string, unknown> {
  const branch = getValoreBranches().find((b) => getValoreTipoFromBranch(b) === tipo);
  if (!branch) return { tipo };
  const value = createDefaultFromSchema(branch);
  return typeof value === "object" && value != null ? (value as Record<string, unknown>) : { tipo };
}
