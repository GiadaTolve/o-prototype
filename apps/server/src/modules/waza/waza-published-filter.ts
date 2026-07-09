import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "../../plugins/db";
import { waza, wazaVersioni } from "../../db/schema";

export type AuthoringPublishByLegacyId = ReadonlyMap<string, boolean>;

export type WazaVersionStatoSummary = { stato: string };

/** True se esiste almeno una versione con stato effettivo «pubblicata». */
export function wazaHasPublishedVersion(
  versioni: ReadonlyArray<WazaVersionStatoSummary>,
): boolean {
  return versioni.some((v) => v.stato === "pubblicata");
}

/** Lookup DB: ignora versione_pubblicata_id se punta a bozza/validata. */
export async function wazaHasPublishedVersionByWazaId(wazaId: string): Promise<boolean> {
  const row = await db.query.wazaVersioni.findFirst({
    where: and(eq(wazaVersioni.wazaId, wazaId), eq(wazaVersioni.stato, "pubblicata")),
    columns: { id: true },
  });
  return row != null;
}

/**
 * Per ogni skills.id collegato a waza.legacy_id, indica se esiste almeno una
 * waza_versioni con stato = 'pubblicata' (non basta versione_pubblicata_id valorizzato).
 */
export async function loadAuthoringPublishByLegacyId(): Promise<AuthoringPublishByLegacyId> {
  const rows = await db
    .select({
      legacyId: waza.legacyId,
      publishedVersionId: wazaVersioni.id,
    })
    .from(waza)
    .leftJoin(
      wazaVersioni,
      and(eq(wazaVersioni.wazaId, waza.id), eq(wazaVersioni.stato, "pubblicata")),
    )
    .where(isNotNull(waza.legacyId));

  const map = new Map<string, boolean>();
  for (const row of rows) {
    if (!row.legacyId) continue;
    const published = row.publishedVersionId != null;
    map.set(row.legacyId, (map.get(row.legacyId) ?? false) || published);
  }
  return map;
}

/** Waza acquistabile in catalogo PG: solo se authoring con versione effettivamente pubblicata. */
export function isSkillVisibleInPlayerCatalog(
  skillId: string,
  skillType: string,
  publishByLegacyId: AuthoringPublishByLegacyId,
): boolean {
  if (skillType !== "WAZA") return true;
  return publishByLegacyId.get(skillId) === true;
}
