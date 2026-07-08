const FALLBACK_TIPI = new Set([
  "DANNO",
  "MOD_DANNO",
  "BUFF_SKIRU",
  "APPLICA_STATUS",
  "EVOCA_COSTRUTTO",
  "MANUALE",
]);

type EffettiSchemaError = {
  instancePath: string;
  schemaPath: string;
  keyword: string;
  message?: string;
  params?: Record<string, unknown>;
};

function validateFallback(effetti: unknown): { valid: boolean; errors: EffettiSchemaError[] } {
  if (!Array.isArray(effetti)) {
    return {
      valid: false,
      errors: [
        {
          instancePath: "",
          schemaPath: "fallback/array",
          keyword: "type",
          message: "Effetti deve essere un array.",
        },
      ],
    };
  }

  const errors: EffettiSchemaError[] = [];
  effetti.forEach((item, index) => {
    if (!item || typeof item !== "object") {
      errors.push({
        instancePath: `/${index}`,
        schemaPath: "fallback/blocco-object",
        keyword: "type",
        message: "Ogni blocco deve essere un oggetto.",
      });
      return;
    }
    const tipo = (item as Record<string, unknown>).tipo;
    if (typeof tipo !== "string" || !FALLBACK_TIPI.has(tipo)) {
      errors.push({
        instancePath: `/${index}/tipo`,
        schemaPath: "fallback/blocco-tipo",
        keyword: "enum",
        message: "Tipo blocco non valido.",
      });
    }
  });

  return { valid: errors.length === 0, errors };
}

export function validateEffettiSchema(effetti: unknown): {
  valid: boolean;
  errors: EffettiSchemaError[];
} {
  return validateFallback(effetti);
}

