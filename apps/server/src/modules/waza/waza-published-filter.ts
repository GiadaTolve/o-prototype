import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "../../plugins/db";
import { waza, wazaVersioni } from "../../db/schema";

export type AuthoringPublishByLegacyId = ReadonlyMap<string, boolean>;

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
