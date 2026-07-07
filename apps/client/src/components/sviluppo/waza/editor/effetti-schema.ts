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
  "MANUALE",
] as const;

export type BloccoTipo = (typeof BLOCCO_TIPI)[number];

export const BLOCCO_TIPO_LABELS: Record<BloccoTipo, string> = {
  DANNO: "Danno",
  MOD_DANNO: "Modificatore danno",
  BUFF_SKIRU: "Buff Skiru",
  APPLICA_STATUS: "Applica status",
  EVOCA_COSTRUTTO: "Evoca costrutto",
  MANUALE: "Manuale (Master)",
};

export const VALORE_TIPO_LABELS: Record<string, string> = {
  FISSO: "Valore fisso",
  TIER: "Tier waza",
  TIER_DELTA: "Delta tier",
  TIER_PER_STACK: "Tier per stack status",
  SOMMA_BOOST: "Somma boost",
  TIER_COLPO_SUBITO: "Tier colpo subito",
  FORMULA: "Formula Skiru",
  MOLT: "Moltiplicatore",
  SCALA: "Scala a passi",
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

export function createDefaultBlocco(tipo: BloccoTipo): Record<string, unknown> {
  const schema = getBloccoSchemaByTipo(tipo);
  if (!schema) return { tipo };
  const value = createDefaultFromSchema(schema);
  return typeof value === "object" && value != null ? (value as Record<string, unknown>) : { tipo };
}

export function createDefaultValore(tipo: string): Record<string, unknown> {
  const branch = getValoreBranches().find((b) => getValoreTipoFromBranch(b) === tipo);
  if (!branch) return { tipo };
  const value = createDefaultFromSchema(branch);
  return typeof value === "object" && value != null ? (value as Record<string, unknown>) : { tipo };
}
