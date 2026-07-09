import {
  validateEffettiSchema as validateEffettiSchemaShared,
  type EffettiSchemaError,
} from "../../../../../schemas/effetti-validator";

/**
 * Usa lo stesso validatore Ajv condiviso tra client/server per evitare drift
 * fra tipi atomo selezionabili in editor e validazione API.
 */
export function validateEffettiSchema(effetti: unknown): {
  valid: boolean;
  errors: EffettiSchemaError[];
} {
  return validateEffettiSchemaShared(effetti);
}

