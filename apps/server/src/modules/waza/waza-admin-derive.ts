export type StatoCodifica = "da_codificare" | "automatica" | "ibrida" | "manuale";

type BloccoEffetto = {
  tipo?: string;
  bersaglio?: string;
  area?: { forma?: string; raggio_m?: number; profondita_m?: number };
  valore?: { tipo?: string };
  [key: string]: unknown;
};

export function computeAtomiUsati(effetti: unknown[]): string[] {
  const atomi = new Set<string>();
  for (const blocco of effetti) {
    if (blocco && typeof blocco === "object" && typeof (blocco as BloccoEffetto).tipo === "string") {
      atomi.add((blocco as BloccoEffetto).tipo!);
    }
  }
  return [...atomi].sort();
}

export function computeStatoCodifica(effetti: unknown[]): StatoCodifica {
  const atomi = computeAtomiUsati(effetti);
  if (atomi.length === 0) return "da_codificare";
  const hasManuale = atomi.includes("MANUALE");
  const hasAutomatico = atomi.some((a) => a !== "MANUALE");
  if (hasManuale && !hasAutomatico) return "manuale";
  if (hasManuale && hasAutomatico) return "ibrida";
  return "automatica";
}

export function slugifyRomaji(nomeRomaji: string): string {
  const base = nomeRomaji
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return base || "waza";
}

export type WazaValidationIssue = {
  codice: string;
  messaggio: string;
  percorso?: string;
};

type SceltaAlLancio = { id?: string };

export function validateWazaBusinessRules(input: {
  tipo: "passiva" | "attiva";
  tier: number | null | undefined;
  tempoQuarti: number | null | undefined;
  effetti: unknown[];
  scelteAlLancio: unknown[];
}): WazaValidationIssue[] {
  const errori: WazaValidationIssue[] = [];
  const effetti = input.effetti.filter((b) => b && typeof b === "object") as BloccoEffetto[];
  const sceltaIds = new Set(
    (input.scelteAlLancio as SceltaAlLancio[])
      .map((s) => s.id?.trim())
      .filter((id): id is string => Boolean(id)),
  );

  if (input.tipo === "attiva" && (input.tempoQuarti == null || input.tempoQuarti < 0)) {
    errori.push({
      codice: "ATTIVA_SENZA_TEMPO",
      messaggio: "Una waza attiva richiede tempo_quarti.",
    });
  }

  const hasDannoTier = effetti.some(
    (b) => b.tipo === "DANNO" && b.valore && typeof b.valore === "object" && b.valore.tipo === "TIER",
  );
  if (hasDannoTier && (input.tier == null || input.tier < 1)) {
    errori.push({
      codice: "TIER_RICHIESTO_PER_DANNO_TIER",
      messaggio: "Serve un tier valido quando un blocco DANNO usa valore TIER.",
    });
  }

  effetti.forEach((blocco, index) => {
    if (blocco.tipo === "DANNO") {
      if (!blocco.bersaglio) {
        errori.push({
          codice: "DANNO_SENZA_BERSAGLIO",
          messaggio: "Il blocco DANNO richiede un bersaglio.",
          percorso: `effetti[${index}]`,
        });
      }
      if (blocco.bersaglio === "AREA" || blocco.bersaglio === "CONO") {
        const area = blocco.area;
        if (!area) {
          errori.push({
            codice: "DANNO_AREA_MANCANTE",
            messaggio: `Il bersaglio ${blocco.bersaglio} richiede le dimensioni area.`,
            percorso: `effetti[${index}].area`,
          });
        } else if (blocco.bersaglio === "AREA" && area.raggio_m == null) {
          errori.push({
            codice: "DANNO_AREA_RAGGIO",
            messaggio: "AREA richiede raggio_m.",
            percorso: `effetti[${index}].area.raggio_m`,
          });
        } else if (blocco.bersaglio === "CONO" && area.profondita_m == null) {
          errori.push({
            codice: "DANNO_CONO_PROFONDITA",
            messaggio: "CONO richiede profondita_m.",
            percorso: `effetti[${index}].area.profondita_m`,
          });
        }
      }
    }

    collectReferenceIssues(blocco, sceltaIds, `effetti[${index}]`, errori);
  });

  return errori;
}

function collectReferenceIssues(
  value: unknown,
  sceltaIds: Set<string>,
  path: string,
  errori: WazaValidationIssue[],
): void {
  if (value == null) return;

  if (typeof value === "string") {
    const refs = value.match(/@[a-zA-Z0-9_-]+/g) ?? [];
    for (const ref of refs) {
      const id = ref.slice(1);
      if (!sceltaIds.has(id)) {
        errori.push({
          codice: "RIFERIMENTO_SCELTA_INESISTENTE",
          messaggio: `Riferimento ${ref} non trovato in scelte_al_lancio.`,
          percorso: path,
        });
      }
    }
    if (value.includes("RIFERIMENTO") || looksLikeRiferimentoWaza(value)) {
      errori.push({
        codice: "RIFERIMENTO_WAZA_NON_SUPPORTATO",
        messaggio: "Riferimenti waza (RIFERIMENTO) non supportati nello Sprint 1.",
        percorso: path,
      });
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, i) => collectReferenceIssues(item, sceltaIds, `${path}[${i}]`, errori));
    return;
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (obj.tipo === "RIFERIMENTO") {
      errori.push({
        codice: "RIFERIMENTO_WAZA_NON_SUPPORTATO",
        messaggio: "Valore RIFERIMENTO non supportato nello Sprint 1.",
        percorso: path,
      });
    }
    for (const [key, child] of Object.entries(obj)) {
      collectReferenceIssues(child, sceltaIds, `${path}.${key}`, errori);
    }
  }
}

function looksLikeRiferimentoWaza(value: string): boolean {
  return /\bwaza\b/i.test(value) && value.includes("@");
}
