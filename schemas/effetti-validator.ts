import Ajv2020, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020";
import schema from "./effetti.schema.json";
import { normalizeEffettiPayload } from "./effetti-normalize";

const ajv = new Ajv2020({
  strict: true,
  allErrors: true,
  allowUnionTypes: false,
  validateFormats: false,
});

let compiled: ValidateFunction | null = null;

export function getEffettiValidator(): ValidateFunction {
  if (!compiled) {
    compiled = ajv.compile(schema);
  }
  return compiled;
}

export type EffettiSchemaError = {
  instancePath: string;
  schemaPath: string;
  keyword: string;
  message?: string;
  params?: Record<string, unknown>;
};

export function validateEffettiSchema(effetti: unknown): {
  valid: boolean;
  errors: EffettiSchemaError[];
} {
  const normalized = normalizeEffettiPayload(effetti);
  const validate = getEffettiValidator();
  const valid = validate(normalized) === true;
  return {
    valid,
    errors: valid ? [] : formatAjvErrors(validate.errors ?? []),
  };
}

export function formatAjvErrors(errors: ErrorObject[]): EffettiSchemaError[] {
  return errors.map((error) => ({
    instancePath: error.instancePath,
    schemaPath: error.schemaPath,
    keyword: error.keyword,
    message: error.message,
    params: error.params as Record<string, unknown>,
  }));
}
