import { isNotNull } from "drizzle-orm";
import { db } from "../../plugins/db";
import { waza } from "../../db/schema";

export type AuthoringPublishByLegacyId = ReadonlyMap<string, boolean>;

/**
 * Per ogni skills.id collegato a waza.legacy_id, indica se esiste una versione pubblicata.
 * Skill senza voce in mappa = nessun authoring (catalogo legacy) → visibile ai PG.
 */
export async function loadAuthoringPublishByLegacyId(): Promise<AuthoringPublishByLegacyId> {
  const rows = await db.query.waza.findMany({
    where: isNotNull(waza.legacyId),
    columns: { legacyId: true, versionePubblicataId: true },
  });
  const map = new Map<string, boolean>();
  for (const row of rows) {
    if (!row.legacyId) continue;
    map.set(row.legacyId, row.versionePubblicataId != null);
  }
  return map;
}

/** Waza acquistabile in catalogo PG: legacy libero oppure authoring pubblicato. */
export function isSkillVisibleInPlayerCatalog(
  skillId: string,
  skillType: string,
  publishByLegacyId: AuthoringPublishByLegacyId,
): boolean {
  if (skillType !== "WAZA") return true;
  if (!publishByLegacyId.has(skillId)) return true;
  return publishByLegacyId.get(skillId) === true;
}
