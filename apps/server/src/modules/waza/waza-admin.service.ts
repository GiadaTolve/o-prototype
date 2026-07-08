import {
  and,
  desc,
  eq,
  inArray,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "../../plugins/db";
import { vocabolari, waza, wazaVersioni } from "../../db/schema";
import { validateEffettiSchema } from "../../../../../schemas/effetti-validator";
import {
  computeAtomiUsati,
  computeStatoCodifica,
  slugifyRomaji,
  validateWazaBusinessRules,
  type WazaValidationIssue,
} from "./waza-admin-derive";
import {
  isWazaCategoria,
  VOCABOLARIO_GENITORE_BY_CATEGORIA,
  type WazaCategoria,
} from "./waza-taxonomy";
import {
  loadActiveSkiruSlugs,
  normalizeSkiruIr,
  validateSkiruIrSlugs,
  warnAttivaSenzaSkiruIr,
} from "./waza-skiru-ir";

export class WazaAdminHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly payload?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "WazaAdminHttpError";
  }
}

export type WazaListFilters = {
  categoria?: WazaCategoria;
  genitore?: string;
  tipo?: "passiva" | "attiva";
  tier?: number;
  atomo?: string;
  statoCodifica?: "da_codificare" | "automatica" | "ibrida" | "manuale";
  stato?: "bozza" | "validata" | "pubblicata" | "superata";
  q?: string;
  archiviata?: "true" | "false" | "all";
};

export type WazaVersionDraftInput = {
  nomeRomaji: string;
  nomeItaliano: string;
  kanji?: string | null;
  kanjiVerificato?: boolean;
  descrizione: string;
  cs: number;
  tempoQuarti?: number | null;
  tags?: string[];
  scelteAlLancio?: unknown[];
  effetti?: unknown[];
  skiruIr?: string[];
};

export type WazaAnagraficaInput = {
  categoria: WazaCategoria;
  genitore?: string | null;
  tipo: "passiva" | "attiva";
  tier?: number | null;
};

export type WazaCreateInput = WazaVersionDraftInput & WazaAnagraficaInput;

type WazaRow = typeof waza.$inferSelect;
type WazaVersioneRow = typeof wazaVersioni.$inferSelect;

export type WazaListItem = {
  id: string;
  slug: string;
  categoria: WazaCategoria;
  genitore: string | null;
  tipo: "passiva" | "attiva";
  tier: number | null;
  archiviata: boolean;
  creatoIl: Date;
  versioneId: string;
  versioneNumero: number;
  stato: WazaVersioneRow["stato"];
  statoCodifica: WazaVersioneRow["statoCodifica"];
  nomeRomaji: string;
  nomeItaliano: string;
  kanji: string | null;
  kanjiVerificato: boolean;
  cs: number;
  tempoQuarti: number | null;
  tags: string[];
  atomiUsati: string[];
  salvataIl: Date;
};

function assertDraftEditable(versione: WazaVersioneRow): void {
  if (versione.stato !== "bozza") {
    throw new WazaAdminHttpError("Solo le versioni in bozza sono modificabili.", 409);
  }
}

function deriveFromEffetti(effetti: unknown[]) {
  return {
    atomiUsati: computeAtomiUsati(effetti),
    statoCodifica: computeStatoCodifica(effetti),
  };
}

function validateEffettiOrThrow(effetti: unknown[]): void {
  const result = validateEffettiSchema(effetti);
  if (!result.valid) {
    throw new WazaAdminHttpError("Effetti non conformi allo schema.", 422, {
      errori: result.errors,
    });
  }
}

async function validateSkiruIrOrThrow(skiruIr: string[]): Promise<void> {
  if (skiruIr.length === 0) return;
  const allowed = await loadActiveSkiruSlugs();
  const errori = validateSkiruIrSlugs(skiruIr, allowed);
  if (errori.length > 0) {
    throw new WazaAdminHttpError(errori[0]!.messaggio, 422, { errori });
  }
}

export async function validateCategoriaGenitore(
  categoria: string,
  genitore: string | null | undefined,
): Promise<{ categoria: WazaCategoria; genitore: string | null }> {
  if (!isWazaCategoria(categoria)) {
    throw new WazaAdminHttpError(`Categoria "${categoria}" non valida.`, 422);
  }

  if (categoria === "generica") {
    if (genitore != null && genitore.trim() !== "") {
      throw new WazaAdminHttpError("Le waza generiche non hanno genitore.", 422);
    }
    return { categoria, genitore: null };
  }

  const genitoreNorm = genitore?.trim();
  if (!genitoreNorm) {
    throw new WazaAdminHttpError(
      `Serve un genitore specifico per categoria ${categoria}.`,
      422,
    );
  }

  const vocabCategoria = VOCABOLARIO_GENITORE_BY_CATEGORIA[categoria];
  const hit = await db.query.vocabolari.findFirst({
    where: and(
      eq(vocabolari.categoria, vocabCategoria),
      eq(vocabolari.valore, genitoreNorm),
      eq(vocabolari.attivo, true),
    ),
    columns: { id: true },
  });
  if (!hit) {
    throw new WazaAdminHttpError(
      `Genitore "${genitoreNorm}" non valido per categoria ${categoria}.`,
      422,
    );
  }

  return { categoria, genitore: genitoreNorm };
}

function resolveAnagraficaPatch(
  current: WazaRow,
  input: Partial<WazaAnagraficaInput>,
): { categoria: WazaCategoria; genitore: string | null; tipo: "passiva" | "attiva"; tier: number | null } {
  const categoria = input.categoria ?? current.categoria;
  let genitore: string | null;
  if (categoria === "generica") {
    genitore = null;
  } else if (input.genitore !== undefined) {
    genitore = input.genitore?.trim() || null;
  } else if (input.categoria !== undefined) {
    genitore = null;
  } else {
    genitore = current.genitore;
  }
  return {
    categoria,
    genitore,
    tipo: input.tipo ?? current.tipo,
    tier: input.tier !== undefined ? (input.tier ?? null) : current.tier,
  };
}

async function resolveUniqueSlug(baseInput: string, excludeWazaId?: string): Promise<string> {
  const base = slugifyRomaji(baseInput);
  let candidate = base;
  let suffix = 2;

  while (true) {
    const existing = await db.query.waza.findFirst({
      where: excludeWazaId
        ? and(eq(waza.slug, candidate), sql`${waza.id} <> ${excludeWazaId}`)
        : eq(waza.slug, candidate),
      columns: { id: true },
    });
    if (!existing) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

function latestVersionJoinSql() {
  return sql`INNER JOIN LATERAL (
    SELECT
      ${wazaVersioni.id} AS versione_id,
      ${wazaVersioni.numero} AS versione_numero,
      ${wazaVersioni.stato} AS stato,
      ${wazaVersioni.statoCodifica} AS stato_codifica,
      ${wazaVersioni.nomeRomaji} AS nome_romaji,
      ${wazaVersioni.nomeItaliano} AS nome_italiano,
      ${wazaVersioni.kanji} AS kanji,
      ${wazaVersioni.kanjiVerificato} AS kanji_verificato,
      ${wazaVersioni.cs} AS cs,
      ${wazaVersioni.tempoQuarti} AS tempo_quarti,
      ${wazaVersioni.tags} AS tags,
      ${wazaVersioni.atomiUsati} AS atomi_usati,
      ${wazaVersioni.salvataIl} AS salvata_il
    FROM ${wazaVersioni}
    WHERE ${wazaVersioni.wazaId} = ${waza.id}
    ORDER BY ${wazaVersioni.numero} DESC
    LIMIT 1
  ) latest ON true`;
}

export async function listAdminWazaCatalog(filters: WazaListFilters = {}): Promise<WazaListItem[]> {
  const conditions: SQL[] = [];

  const archiviata = filters.archiviata ?? "false";
  if (archiviata === "true") {
    conditions.push(eq(waza.archiviata, true));
  } else if (archiviata !== "all") {
    conditions.push(eq(waza.archiviata, false));
  }

  if (filters.categoria) conditions.push(eq(waza.categoria, filters.categoria));
  if (filters.genitore?.trim()) conditions.push(eq(waza.genitore, filters.genitore.trim()));
  if (filters.tipo) conditions.push(eq(waza.tipo, filters.tipo));
  if (filters.tier != null) conditions.push(eq(waza.tier, filters.tier));
  if (filters.stato) conditions.push(sql`latest.stato = ${filters.stato}`);
  if (filters.statoCodifica) conditions.push(sql`latest.stato_codifica = ${filters.statoCodifica}`);
  if (filters.atomo?.trim()) {
    conditions.push(sql`latest.atomi_usati @> ${JSON.stringify([filters.atomo.trim()])}::jsonb`);
  }
  if (filters.q?.trim()) {
    const q = `%${filters.q.trim()}%`;
    conditions.push(
      or(
        sql`latest.nome_romaji ILIKE ${q}`,
        sql`latest.nome_italiano ILIKE ${q}`,
        sql`latest.kanji ILIKE ${q}`,
      )!,
    );
  }

  const whereClause =
    conditions.length > 0 ? sql`WHERE ${sql.join(conditions, sql` AND `)}` : sql``;

  const result = await db.execute(sql`
    SELECT
      ${waza.id} AS id,
      ${waza.slug} AS slug,
      ${waza.categoria} AS categoria,
      ${waza.genitore} AS genitore,
      ${waza.tipo} AS tipo,
      ${waza.tier} AS tier,
      ${waza.archiviata} AS archiviata,
      ${waza.creatoIl} AS creato_il,
      latest.versione_id AS versione_id,
      latest.versione_numero AS versione_numero,
      latest.stato AS stato,
      latest.stato_codifica AS stato_codifica,
      latest.nome_romaji AS nome_romaji,
      latest.nome_italiano AS nome_italiano,
      latest.kanji AS kanji,
      latest.kanji_verificato AS kanji_verificato,
      latest.cs AS cs,
      latest.tempo_quarti AS tempo_quarti,
      latest.tags AS tags,
      latest.atomi_usati AS atomi_usati,
      latest.salvata_il AS salvata_il
    FROM ${waza}
    ${latestVersionJoinSql()}
    ${whereClause}
    ORDER BY latest.nome_italiano ASC
  `);

  return result.rows.map((row) => {
    const record = row as Record<string, unknown>;
    return {
      id: String(record.id),
      slug: String(record.slug),
      categoria: record.categoria as WazaCategoria,
      genitore: record.genitore == null ? null : String(record.genitore),
      tipo: record.tipo as "passiva" | "attiva",
      tier: record.tier == null ? null : Number(record.tier),
      archiviata: Boolean(record.archiviata),
      creatoIl: new Date(String(record.creato_il)),
      versioneId: String(record.versione_id),
      versioneNumero: Number(record.versione_numero),
      stato: record.stato as WazaVersioneRow["stato"],
      statoCodifica: record.stato_codifica as WazaVersioneRow["statoCodifica"],
      nomeRomaji: String(record.nome_romaji),
      nomeItaliano: String(record.nome_italiano),
      kanji: record.kanji == null ? null : String(record.kanji),
      kanjiVerificato: Boolean(record.kanji_verificato),
      cs: Number(record.cs),
      tempoQuarti: record.tempo_quarti == null ? null : Number(record.tempo_quarti),
      tags: Array.isArray(record.tags) ? (record.tags as string[]) : [],
      atomiUsati: Array.isArray(record.atomi_usati) ? (record.atomi_usati as string[]) : [],
      salvataIl: new Date(String(record.salvata_il)),
    };
  });
}

export async function getAdminWazaDetail(wazaId: string) {
  const row = await db.query.waza.findFirst({
    where: eq(waza.id, wazaId),
  });
  if (!row) throw new WazaAdminHttpError("Waza non trovata.", 404);

  const versioni = await db.query.wazaVersioni.findMany({
    where: eq(wazaVersioni.wazaId, wazaId),
    orderBy: [desc(wazaVersioni.numero)],
    columns: {
      id: true,
      numero: true,
      stato: true,
      changelog: true,
      salvataIl: true,
      nomeRomaji: true,
      nomeItaliano: true,
      statoCodifica: true,
    },
  });

  const versionePubblicata = row.versionePubblicataId
    ? await db.query.wazaVersioni.findFirst({
        where: eq(wazaVersioni.id, row.versionePubblicataId),
      })
    : null;

  return {
    waza: row,
    versionePubblicata,
    versioni,
  };
}

export async function getAdminWazaVersione(wazaId: string, numero: number) {
  const versione = await db.query.wazaVersioni.findFirst({
    where: and(eq(wazaVersioni.wazaId, wazaId), eq(wazaVersioni.numero, numero)),
  });
  if (!versione) throw new WazaAdminHttpError("Versione non trovata.", 404);

  const anagrafica = await db.query.waza.findFirst({
    where: eq(waza.id, wazaId),
    columns: {
      id: true,
      slug: true,
      categoria: true,
      genitore: true,
      tipo: true,
      tier: true,
      archiviata: true,
      versionePubblicataId: true,
    },
  });
  if (!anagrafica) throw new WazaAdminHttpError("Waza non trovata.", 404);

  return { waza: anagrafica, versione };
}

export async function createAdminWaza(input: WazaCreateInput, userId: string) {
  const effetti = input.effetti ?? [];
  validateEffettiOrThrow(effetti);
  const skiruIr = normalizeSkiruIr(input.skiruIr);
  await validateSkiruIrOrThrow(skiruIr);
  const derivate = deriveFromEffetti(effetti);
  const anagrafica = await validateCategoriaGenitore(input.categoria, input.genitore ?? null);
  const slug = await resolveUniqueSlug(input.nomeRomaji);

  return db.transaction(async (tx) => {
    const [createdWaza] = await tx
      .insert(waza)
      .values({
        slug,
        categoria: anagrafica.categoria,
        genitore: anagrafica.genitore,
        tipo: input.tipo,
        tier: input.tier ?? null,
      })
      .returning();

    const [versione] = await tx
      .insert(wazaVersioni)
      .values({
        wazaId: createdWaza.id,
        numero: 1,
        stato: "bozza",
        nomeRomaji: input.nomeRomaji.trim(),
        nomeItaliano: input.nomeItaliano.trim(),
        kanji: input.kanji?.trim() || null,
        kanjiVerificato: input.kanjiVerificato ?? false,
        descrizione: input.descrizione,
        cs: input.cs,
        tempoQuarti: input.tipo === "attiva" ? (input.tempoQuarti ?? null) : null,
        tags: input.tags ?? [],
        scelteAlLancio: input.scelteAlLancio ?? [],
        effetti,
        skiruIr,
        atomiUsati: derivate.atomiUsati,
        statoCodifica: derivate.statoCodifica,
        salvataDa: userId,
      })
      .returning();

    return { waza: createdWaza, versione };
  });
}

export async function saveAdminWazaDraft(
  wazaId: string,
  numero: number,
  input: WazaVersionDraftInput & Partial<WazaAnagraficaInput>,
  userId: string,
) {
  const versione = await db.query.wazaVersioni.findFirst({
    where: and(eq(wazaVersioni.wazaId, wazaId), eq(wazaVersioni.numero, numero)),
  });
  if (!versione) throw new WazaAdminHttpError("Versione non trovata.", 404);
  assertDraftEditable(versione);

  const anagrafica = await db.query.waza.findFirst({ where: eq(waza.id, wazaId) });
  if (!anagrafica) throw new WazaAdminHttpError("Waza non trovata.", 404);

  const effetti = input.effetti ?? [];
  validateEffettiOrThrow(effetti);
  const skiruIr = normalizeSkiruIr(input.skiruIr ?? versione.skiruIr);
  await validateSkiruIrOrThrow(skiruIr);
  const derivate = deriveFromEffetti(effetti);
  const tipo = input.tipo ?? anagrafica.tipo;

  const [updatedVersione] = await db
    .update(wazaVersioni)
    .set({
      nomeRomaji: input.nomeRomaji.trim(),
      nomeItaliano: input.nomeItaliano.trim(),
      kanji: input.kanji?.trim() || null,
      kanjiVerificato: input.kanjiVerificato ?? versione.kanjiVerificato,
      descrizione: input.descrizione,
      cs: input.cs,
      tempoQuarti: tipo === "attiva" ? (input.tempoQuarti ?? null) : null,
      tags: input.tags ?? [],
      scelteAlLancio: input.scelteAlLancio ?? [],
      effetti,
      skiruIr,
      atomiUsati: derivate.atomiUsati,
      statoCodifica: derivate.statoCodifica,
      salvataIl: new Date(),
      salvataDa: userId,
    })
    .where(eq(wazaVersioni.id, versione.id))
    .returning();

  let updatedWaza: WazaRow = anagrafica;
  if (
    input.categoria !== undefined ||
    input.genitore !== undefined ||
    input.tipo !== undefined ||
    input.tier !== undefined
  ) {
    const patch = resolveAnagraficaPatch(anagrafica, input);
    const validated = await validateCategoriaGenitore(patch.categoria, patch.genitore);
    [updatedWaza] = await db
      .update(waza)
      .set({
        categoria: validated.categoria,
        genitore: validated.genitore,
        tipo: patch.tipo,
        tier: patch.tier,
      })
      .where(eq(waza.id, wazaId))
      .returning();
  }

  return { waza: updatedWaza, versione: updatedVersione };
}

export async function validateAdminWazaVersion(wazaId: string, numero: number) {
  const { waza: anagrafica, versione } = await getAdminWazaVersione(wazaId, numero);
  if (versione.stato !== "bozza") {
    throw new WazaAdminHttpError("Solo le versioni in bozza possono essere validate.", 409);
  }

  const effetti = Array.isArray(versione.effetti) ? versione.effetti : [];
  const schemaResult = validateEffettiSchema(effetti);
  const errori: WazaValidationIssue[] = [];

  if (!schemaResult.valid) {
    for (const err of schemaResult.errors) {
      errori.push({
        codice: "SCHEMA_EFFETTI",
        messaggio: err.message ?? "Errore schema effetti.",
        percorso: err.instancePath || undefined,
      });
    }
  }

  errori.push(
    ...validateWazaBusinessRules({
      tipo: anagrafica.tipo,
      tier: anagrafica.tier,
      tempoQuarti: versione.tempoQuarti,
      effetti,
      scelteAlLancio: Array.isArray(versione.scelteAlLancio) ? versione.scelteAlLancio : [],
    }),
  );

  const avvisi: WazaValidationIssue[] = [];
  const skiruIr = normalizeSkiruIr(versione.skiruIr);
  avvisi.push(...warnAttivaSenzaSkiruIr(anagrafica.tipo, skiruIr));
  if (effetti.length === 0) {
    avvisi.push({
      codice: "NESSUN_BLOCCO",
      messaggio: "Nessun blocco: la waza resterà da_codificare.",
    });
  }

  if (errori.length === 0) {
    const [validata] = await db
      .update(wazaVersioni)
      .set({ stato: "validata", salvataIl: new Date() })
      .where(eq(wazaVersioni.id, versione.id))
      .returning();
    return { errori, avvisi, versione: validata };
  }

  return { errori, avvisi, versione };
}

export async function duplicateAdminWaza(wazaId: string, userId: string) {
  const source = await db.query.waza.findFirst({ where: eq(waza.id, wazaId) });
  if (!source) throw new WazaAdminHttpError("Waza non trovata.", 404);

  const latest = await db.query.wazaVersioni.findFirst({
    where: eq(wazaVersioni.wazaId, wazaId),
    orderBy: [desc(wazaVersioni.numero)],
  });
  if (!latest) throw new WazaAdminHttpError("Nessuna versione da duplicare.", 404);

  const slug = await resolveUniqueSlug(latest.nomeRomaji);

  return db.transaction(async (tx) => {
    const [createdWaza] = await tx
      .insert(waza)
      .values({
        slug,
        categoria: source.categoria,
        genitore: source.genitore,
        tipo: source.tipo,
        tier: source.tier,
      })
      .returning();

    const effetti = Array.isArray(latest.effetti) ? latest.effetti : [];
    const derivate = deriveFromEffetti(effetti);

    const [versione] = await tx
      .insert(wazaVersioni)
      .values({
        wazaId: createdWaza.id,
        numero: 1,
        stato: "bozza",
        nomeRomaji: latest.nomeRomaji,
        nomeItaliano: latest.nomeItaliano,
        kanji: latest.kanji,
        kanjiVerificato: latest.kanjiVerificato,
        descrizione: latest.descrizione,
        cs: latest.cs,
        tempoQuarti: latest.tempoQuarti,
        tags: latest.tags,
        scelteAlLancio: latest.scelteAlLancio,
        effetti,
        skiruIr: normalizeSkiruIr(latest.skiruIr),
        atomiUsati: derivate.atomiUsati,
        statoCodifica: derivate.statoCodifica,
        salvataDa: userId,
      })
      .returning();

    return { waza: createdWaza, versione };
  });
}

export async function archiveAdminWaza(wazaId: string) {
  const [row] = await db
    .update(waza)
    .set({ archiviata: true })
    .where(eq(waza.id, wazaId))
    .returning();
  if (!row) throw new WazaAdminHttpError("Waza non trovata.", 404);
  return row;
}

export async function restoreAdminWaza(wazaId: string) {
  const [row] = await db
    .update(waza)
    .set({ archiviata: false })
    .where(eq(waza.id, wazaId))
    .returning();
  if (!row) throw new WazaAdminHttpError("Waza non trovata.", 404);
  return row;
}

export async function deleteAdminWazaRecords(wazaIds: string[]) {
  if (wazaIds.length === 0) return;
  await db.delete(waza).where(inArray(waza.id, wazaIds));
}

export type VocabolarioItem = {
  id: string;
  categoria: string;
  valore: string;
  extra: Record<string, unknown> | null;
};

export async function listAdminWazaVocabolari(): Promise<VocabolarioItem[]> {
  const rows = await db.query.vocabolari.findMany({
    where: eq(vocabolari.attivo, true),
    columns: {
      id: true,
      categoria: true,
      valore: true,
      extra: true,
    },
    orderBy: (v, { asc }) => [asc(v.categoria), asc(v.valore)],
  });
  return rows.map((row) => ({
    ...row,
    extra: (row.extra as Record<string, unknown> | null) ?? null,
  }));
}
