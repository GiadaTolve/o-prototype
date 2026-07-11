const ZONA_HOOK_KEYS = ["quando_entra", "a_inizio_turno"] as const;

const EVOCA_DERIVATA_KEYS = ["resistenza", "danno", "movimento_m"] as const;

function stripEvocaDerivataPlaceholders(blocco: Record<string, unknown>): Record<string, unknown> {
  if (blocco.tipo !== "EVOCA_COSTRUTTO") return blocco;
  const next = { ...blocco };
  for (const key of EVOCA_DERIVATA_KEYS) {
    if (next[key] === "DERIVATA") delete next[key];
  }
  return next;
}

/** Rimuove hook zona incompleti (senza `tipo`) prima di validare o persistere. */
export function normalizeEffettiPayload(effetti: unknown): unknown[] {
  if (!Array.isArray(effetti)) return [];
  return effetti.map((raw) => {
    if (!raw || typeof raw !== "object") return raw;
    const blocco = stripEvocaDerivataPlaceholders(raw as Record<string, unknown>);
    if (blocco.tipo !== "ZONA") return blocco;
    if (!("effetti_zona" in blocco)) return blocco;

    const ez = blocco.effetti_zona;
    if (!ez || typeof ez !== "object") {
      return { ...blocco, effetti_zona: {} };
    }

    const cleaned: Record<string, unknown> = {};
    for (const key of ZONA_HOOK_KEYS) {
      const hook = (ez as Record<string, unknown>)[key];
      if (hook && typeof hook === "object" && typeof (hook as Record<string, unknown>).tipo === "string") {
        cleaned[key] = hook;
      }
    }
    return { ...blocco, effetti_zona: cleaned };
  });
}
