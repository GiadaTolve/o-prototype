import { eq, sql } from "drizzle-orm";
import { db } from "../../plugins/db";
import { skills, vocabolari, waza, wazaVersioni } from "../../db/schema";
import { listAdminWaza, reloadWazaCatalog, type AdminWazaListItem } from "./waza-catalog.service";
import { resolveDefaultWazaCostExp } from "@domain/progression/waza-cost-exp";
import {
  resolveWazaLabPoolId,
  uniqueWazaPoolId,
  type WazaLabFamily,
} from "@domain/progression/waza-lab-pool-id";

export type WazaLabItem = {
  poolId: string;
  skillId: string | null;
  wazaId: string | null;
  name: string;
  description: string | null;
  effect: string | null;
  rank: string | null;
  isPassive: boolean;
  isNarrativa: boolean;
  styleId: string | null;
  madoshoId: string | null;
  costExp: number;
  cs: number | null;
  tier: number | null;
  categoria: string | null;
  genitore: string | null;
  versioneId: string | null;
  versioneNumero: number | null;
  versioneStato: string | null;
  effetti: unknown[];
  skiruIr: string[];
  launchSkiruIds: string[];
  damageSkiruIds: string[];
  damageIndexKind: "CAC" | "CAD" | null;
  hasDbRow: boolean;
  hasAuthoring: boolean;
  chatName: string;
};

export type WazaLabPatchInput = {
  name?: string;
  description?: string | null;
  effect?: string | null;
  rank?: string | null;
  isPassive?: boolean;
  isNarrativa?: boolean;
  styleId?: string | null;
  madoshoId?: string | null;
  costExp?: number;
  cs?: number;
  launchSkiruIds?: string[];
  damageSkiruIds?: string[];
  damageIndexKind?: "CAC" | "CAD" | null;
};

export type WazaLabCreateInput = {
  poolId?: string;
  name: string;
  family?: WazaLabFamily;
  ordineSubgroup?: string | null;
  description?: string | null;
  effect?: string | null;
  rank?: string | null;
  isPassive?: boolean;
  isNarrativa?: boolean;
  styleId?: string | null;
  madoshoId?: string | null;
  costExp?: number;
  cs?: number | null;
};

export type WazaLabTaxonomyInput = {
  categoria: "genitore_do" | "genitore_madosho" | "lab_categoria_macro" | "lab_categoria_micro";
  valore: string;
};

type AuthoringJoinRow = {
  waza_id: string;
  legacy_id: string | null;
  slug: string;
  categoria: string;
  genitore: string | null;
  tier: number | null;
  versione_id: string;
  versione_numero: number;
  versione_stato: string;
  cs: number;
  effetti: unknown;
  skiru_ir: unknown;
  nome_romaji: string;
  nome_italiano: string;
  descrizione: string | null;
};

async function loadAuthoringByLegacyId(): Promise<Map<string, AuthoringJoinRow>> {
  const result = await db.execute(sql`
    SELECT
      w.id AS waza_id,
      w.legacy_id,
      w.slug,
      w.categoria,
      w.genitore,
      w.tier,
      v.id AS versione_id,
      v.numero AS versione_numero,
      v.stato AS versione_stato,
      v.cs,
      v.effetti,
      v.skiru_ir,
      v.nome_romaji,
      v.nome_italiano,
      v.descrizione
    FROM ${waza} w
    INNER JOIN LATERAL (
      SELECT *
      FROM ${wazaVersioni}
      WHERE ${wazaVersioni.wazaId} = w.id
      ORDER BY
        CASE WHEN ${wazaVersioni.stato} = 'pubblicata' THEN 0 ELSE 1 END,
        ${wazaVersioni.numero} DESC
      LIMIT 1
    ) v ON true
    WHERE w.legacy_id IS NOT NULL
  `);

  const map = new Map<string, AuthoringJoinRow>();
  for (const row of result.rows) {
    const record = row as Record<string, unknown>;
    const legacyId = record.legacy_id == null ? null : String(record.legacy_id);
    if (!legacyId) continue;
    map.set(legacyId, {
      waza_id: String(record.waza_id),
      legacy_id: legacyId,
      slug: String(record.slug),
      categoria: String(record.categoria),
      genitore: record.genitore == null ? null : String(record.genitore),
      tier: record.tier == null ? null : Number(record.tier),
      versione_id: String(record.versione_id),
      versione_numero: Number(record.versione_numero),
      versione_stato: String(record.versione_stato),
      cs: Number(record.cs),
      effetti: record.effetti,
      skiru_ir: record.skiru_ir,
      nome_romaji: String(record.nome_romaji),
      nome_italiano: String(record.nome_italiano),
      descrizione: record.descrizione == null ? null : String(record.descrizione),
    });
  }
  return map;
}

function buildChatName(
  admin: AdminWazaListItem,
  authoring: AuthoringJoinRow | undefined,
): string {
  if (authoring?.nome_romaji && authoring?.nome_italiano) {
    const kanji = "";
    return `${authoring.nome_romaji} — ${authoring.nome_italiano}${kanji}`;
  }
  return admin.name;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\r/g, "").trim();
}

/**
 * Nel Lab l'utente non deve scrivere tag di sistema:
 * - "Passiva · CS 0" / "Attiva · ..."
 * - "[Tōka-dō · Dō passiva]" / simili
 */
function sanitizeUserDescription(input: string | null | undefined): string | null {
  if (!input) return null;
  const lines = normalizeWhitespace(input)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const cleaned = lines.filter((line, index) => {
    if (/^\[req_grade:/i.test(line)) return true;
    if (index <= 2) {
      if (/^(passiva|attiva)\b/i.test(line)) return false;
      if (/^\[.*\]$/.test(line)) return false;
    }
    return true;
  });

  if (cleaned.length === 0) return null;
  return cleaned.join("\n\n");
}

function mergeLabItem(
  admin: AdminWazaListItem,
  skillExtras: {
    madoshoId: string | null;
  } | null,
  authoring: AuthoringJoinRow | undefined,
): WazaLabItem {
  const effetti = Array.isArray(authoring?.effetti) ? (authoring!.effetti as unknown[]) : [];
  const skiruIr = Array.isArray(authoring?.skiru_ir) ? (authoring!.skiru_ir as string[]) : [];

  return {
    poolId: admin.poolId,
    skillId: admin.skillId,
    wazaId: authoring?.waza_id ?? null,
    name: admin.name,
    description: admin.description ?? authoring?.descrizione ?? null,
    effect: admin.effect,
    rank: admin.rank,
    isPassive: admin.isPassive,
    isNarrativa: admin.isNarrativa,
    styleId: admin.styleId,
    madoshoId: skillExtras?.madoshoId ?? null,
    costExp: admin.costExp,
    cs: authoring?.cs ?? null,
    tier: authoring?.tier ?? (admin.rank ? Number(admin.rank.replace(/^T/i, "")) || null : null),
    categoria: authoring?.categoria ?? null,
    genitore: authoring?.genitore ?? null,
    versioneId: authoring?.versione_id ?? null,
    versioneNumero: authoring?.versione_numero ?? null,
    versioneStato: authoring?.versione_stato ?? null,
    effetti,
    skiruIr,
    launchSkiruIds: admin.launchSkiruIds,
    damageSkiruIds: admin.damageSkiruIds,
    damageIndexKind: admin.damageIndexKind,
    hasDbRow: admin.hasDbRow,
    hasAuthoring: Boolean(authoring),
    chatName: buildChatName(admin, authoring),
  };
}

export async function listWazaLabItems(): Promise<WazaLabItem[]> {
  const [adminRows, dbSkills, authoringByLegacy] = await Promise.all([
    listAdminWaza(),
    db.query.skills.findMany({
      where: eq(skills.type, "WAZA"),
      columns: {
        id: true,
        poolId: true,
        madoshoId: true,
      },
    }),
    loadAuthoringByLegacyId(),
  ]);

  const skillByPool = new Map(
    dbSkills
      .filter((s) => s.poolId?.trim())
      .map((s) => [
        s.poolId!.trim(),
        {
          skillId: s.id,
          madoshoId: s.madoshoId,
        },
      ]),
  );

  const skillById = new Map(dbSkills.map((s) => [s.id, s]));

  return adminRows.map((admin) => {
    const poolExtras = skillByPool.get(admin.poolId);
    const skillId = admin.skillId ?? poolExtras?.skillId ?? null;
    const authoring = skillId ? authoringByLegacy.get(skillId) : undefined;
    const skillRow = skillId ? skillById.get(skillId) : undefined;

    return mergeLabItem(
      admin,
      skillRow
        ? {
            madoshoId: skillRow.madoshoId,
          }
        : poolExtras
          ? {
              madoshoId: poolExtras.madoshoId,
            }
          : null,
      authoring,
    );
  });
}

export async function patchWazaLabItem(
  poolId: string,
  input: WazaLabPatchInput,
): Promise<WazaLabItem> {
  const pid = poolId.trim();
  if (!pid) throw new Error("poolId obbligatorio");

  const skill = await db.query.skills.findFirst({
    where: eq(skills.poolId, pid),
  });

  if (skill) {
    const launchSkiruIds =
      input.launchSkiruIds !== undefined
        ? [...new Set(input.launchSkiruIds.map((id) => id.trim().toLowerCase()).filter(Boolean))]
        : Array.isArray(skill.launchSkiruIds)
          ? skill.launchSkiruIds
          : [];
    const damageSkiruIds =
      input.damageSkiruIds !== undefined
        ? [...new Set(input.damageSkiruIds.map((id) => id.trim().toLowerCase()).filter(Boolean))]
        : Array.isArray(skill.damageSkiruIds)
          ? skill.damageSkiruIds
          : [];
    const isPassive = input.isPassive ?? skill.isPassive ?? false;
    const isNarrativa = !isPassive && (input.isNarrativa ?? skill.isNarrativa ?? false);
    const damageIndexKind =
      input.damageIndexKind === "CAC" || input.damageIndexKind === "CAD"
        ? input.damageIndexKind
        : skill.damageIndexKind === "CAC" || skill.damageIndexKind === "CAD"
          ? skill.damageIndexKind
          : null;

    await db
      .update(skills)
      .set({
        name: input.name?.trim() ?? skill.name,
        description:
          input.description !== undefined
            ? sanitizeUserDescription(input.description)
            : skill.description,
        effect: input.effect !== undefined ? input.effect?.trim() || null : skill.effect,
        rank:
          isPassive
            ? null
            : input.rank !== undefined
              ? input.rank?.trim() || null
              : skill.rank,
        isPassive,
        isNarrativa,
        styleId:
          input.styleId !== undefined ? input.styleId?.trim() || null : skill.styleId,
        madoshoId:
          input.madoshoId !== undefined ? input.madoshoId?.trim() || null : skill.madoshoId,
        costExp: input.costExp ?? skill.costExp ?? resolveDefaultWazaCostExp({ isPassive, rank: isPassive ? null : (input.rank !== undefined ? input.rank?.trim() || null : skill.rank) }),
        launchSkiruIds: launchSkiruIds.length > 0 ? launchSkiruIds : null,
        damageSkiruIds: damageSkiruIds.length > 0 ? damageSkiruIds : null,
        damageIndexKind: isPassive || isNarrativa ? null : damageIndexKind,
      })
      .where(eq(skills.id, skill.id));

    const authoring = await db.query.waza.findFirst({
      where: eq(waza.legacyId, skill.id),
    });
    if (authoring) {
      const nextRank = isPassive
        ? null
        : input.rank !== undefined
          ? input.rank?.trim() || null
          : skill.rank;
      const nextTier =
        isPassive || !nextRank
          ? null
          : Number(String(nextRank).replace(/^T/i, "")) || null;

      if (input.rank !== undefined || input.isPassive !== undefined) {
        await db
          .update(waza)
          .set({
            tipo: isPassive ? "passiva" : "attiva",
            tier: nextTier != null && nextTier >= 1 && nextTier <= 5 ? nextTier : null,
          })
          .where(eq(waza.id, authoring.id));
      }

      if (input.cs !== undefined) {
        const versione = await db.query.wazaVersioni.findFirst({
          where: eq(wazaVersioni.wazaId, authoring.id),
          orderBy: (v, { desc: d }) => [d(v.numero)],
        });
        if (versione) {
          await db
            .update(wazaVersioni)
            .set({ cs: input.cs })
            .where(eq(wazaVersioni.id, versione.id));
        }
      }
    }
  }

  await reloadWazaCatalog();
  const items = await listWazaLabItems();
  const hit = items.find((w) => w.poolId === pid);
  if (!hit) throw new Error("Waza non trovata dopo salvataggio");
  return hit;
}

export async function createWazaLabItem(input: WazaLabCreateInput): Promise<WazaLabItem> {
  const name = input.name.trim();
  if (!name) throw new Error("Nome obbligatorio");

  const family: WazaLabFamily =
    input.family ??
    (input.madoshoId ? "madosho" : input.styleId ? "do" : "generiche");

  const poolIdBase =
    input.poolId?.trim().toLowerCase() ||
    resolveWazaLabPoolId({
      name,
      family,
      styleId: input.styleId,
      madoshoId: input.madoshoId,
      ordineSubgroup: input.ordineSubgroup,
    });

  const poolId = await uniqueWazaPoolId(poolIdBase, async (candidate) => {
    const hit = await db.query.skills.findFirst({
      where: eq(skills.poolId, candidate),
      columns: { id: true },
    });
    return Boolean(hit);
  });

  const isPassive = input.isPassive ?? false;
  const isNarrativa = !isPassive && Boolean(input.isNarrativa);
  const rank = isPassive ? null : (input.rank?.trim() || "T1");

  await db.insert(skills).values({
    poolId,
    name,
    description: sanitizeUserDescription(input.description) ?? "",
    effect: input.effect?.trim() || null,
    type: "WAZA",
    rank,
    isPassive,
    isNarrativa,
    styleId: input.styleId?.trim() || null,
    madoshoId: input.madoshoId?.trim() || null,
    costExp:
      input.costExp ??
      resolveDefaultWazaCostExp({
        isPassive,
        rank,
      }),
    costKeys: 0,
    costJigoka: 0,
  });

  if (input.cs != null) {
    const created = await db.query.skills.findFirst({
      where: eq(skills.poolId, poolId),
      columns: { id: true },
    });
    if (created?.id) {
      const authoring = await db.query.waza.findFirst({
        where: eq(waza.legacyId, created.id),
      });
      if (authoring) {
        const versione = await db.query.wazaVersioni.findFirst({
          where: eq(wazaVersioni.wazaId, authoring.id),
          orderBy: (v, { desc: d }) => [d(v.numero)],
        });
        if (versione) {
          await db.update(wazaVersioni).set({ cs: input.cs }).where(eq(wazaVersioni.id, versione.id));
        }
      }
    }
  }

  await reloadWazaCatalog();
  const list = await listWazaLabItems();
  const hit = list.find((w) => w.poolId === poolId);
  if (!hit) throw new Error("Waza non trovata dopo creazione");
  return hit;
}

export async function listWazaLabTaxonomy() {
  const rows = await db.query.vocabolari.findMany({
    where: sql`${vocabolari.categoria} IN ('genitore_do','genitore_madosho','lab_categoria_macro','lab_categoria_micro')`,
    columns: {
      id: true,
      categoria: true,
      valore: true,
      attivo: true,
    },
    orderBy: (v, { asc }) => [asc(v.categoria), asc(v.valore)],
  });
  return rows;
}

export async function createWazaLabTaxonomy(input: WazaLabTaxonomyInput) {
  const valore = input.valore.trim();
  if (!valore) throw new Error("Valore obbligatorio");
  const categoria = input.categoria;

  const existing = await db.query.vocabolari.findFirst({
    where: sql`${vocabolari.categoria} = ${categoria} AND ${vocabolari.valore} = ${valore}`,
    columns: { id: true },
  });
  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(vocabolari)
    .values({
      categoria,
      valore,
      attivo: true,
    })
    .returning({
      id: vocabolari.id,
      categoria: vocabolari.categoria,
      valore: vocabolari.valore,
      attivo: vocabolari.attivo,
    });

  return created;
}
