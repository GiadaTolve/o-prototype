import { eq, and, desc, gte, sql } from "drizzle-orm";
import { db } from "../../plugins/db";
import { fetches, fetchAssignments, levels, grades, characters } from "../../db/schema";
import { characterService } from "../characters/characters.service";

export type FetchStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export type FetchRequirements = {
  levelMin?: number;
  levelMax?: number;
  gradeIds?: string[];
  order?: ("MUGEN-TAI" | "CHISEN-TAI")[];
  plotIds?: string[];
  limitPerDay?: number;
  limitPerWeek?: number;
};

export type FetchRewardConfig = {
  minActions?: number; // Default: 4
  remReward?: number; // REM per partecipante con >= minActions (default: 50)
  expReward?: number; // EXP per partecipante con >= minActions (default: 0)
};

export type Fetch = {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  description: string | null;
  status: FetchStatus;
  requirements: FetchRequirements;
  rewardConfig: FetchRewardConfig | null;
  approvedById: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  assignedTo: string | null;
  completionStatus: 'AWAITING_REWARD' | 'COMPLETED' | null;
  completedAt: Date | null;
};

/**
 * Livello da EXP totale (lookup tabella levels).
 */
export async function characterLevelFromExp(expTotal: number): Promise<number> {
  const all = await db.select().from(levels).orderBy(levels.level);
  let level = 1;
  for (const row of all) {
    if (row.expTotal <= expTotal) level = row.level;
    else break;
  }
  return level;
}

/**
 * Verifica se il personaggio soddisfa i requisiti della fetch.
 */
export async function meetsRequirements(characterId: string, req: FetchRequirements): Promise<boolean> {
  const char = await characterService.getCharacterById(characterId);
  if (!char) return false;

  const level = await characterLevelFromExp(char.experienceTotal);
  if (req.levelMin != null && level < req.levelMin) return false;
  if (req.levelMax != null && level > req.levelMax) return false;

  const order = char.order ?? "NONE";
  if (req.order?.length && order !== "NONE") {
    if (!req.order.includes(order)) return false;
  }

  if (req.gradeIds?.length) {
    const charGrade = (char.grade ?? "").trim();
    const gradeIdMap = await db.select({ id: grades.id, name: grades.name }).from(grades);
    const idByName = new Map(gradeIdMap.map((r) => [r.name, r.id]));
    const charGradeId = idByName.get(charGrade);
    if (!charGradeId || !req.gradeIds.includes(charGradeId)) return false;
  }

  return true;
}

async function listFetchesByStatus(status: FetchStatus | null = null): Promise<Fetch[]> {
  const query = db
    .select({
      id: fetches.id,
      creatorId: fetches.creatorId,
      creatorName: characters.name,
      title: fetches.title,
      description: fetches.description,
      status: fetches.status,
      requirements: fetches.requirements,
      rewardConfig: fetches.rewardConfig,
      approvedById: fetches.approvedById,
      approvedAt: fetches.approvedAt,
      createdAt: fetches.createdAt,
      completionStatus: fetches.completionStatus,
      completedAt: fetches.completedAt,
    })
    .from(fetches)
    .innerJoin(characters, eq(fetches.creatorId, characters.id));
  
  const rows = status 
    ? await query.where(eq(fetches.status, status)).orderBy(desc(fetches.createdAt))
    : await query.orderBy(desc(fetches.createdAt));

  const assignMap = new Map<string, string>();
  for (const r of rows) {
    const [a] = await db
      .select({ characterId: fetchAssignments.characterId })
      .from(fetchAssignments)
      .where(eq(fetchAssignments.fetchId, r.id))
      .limit(1);
    if (a) assignMap.set(r.id, a.characterId);
  }

  return rows.map((r) => ({
    id: r.id,
    creatorId: r.creatorId,
    creatorName: r.creatorName,
    title: r.title,
    description: r.description,
    status: r.status as FetchStatus,
    requirements: (r.requirements ?? {}) as FetchRequirements,
    rewardConfig: (r.rewardConfig as FetchRewardConfig | null) ?? null,
    approvedById: r.approvedById,
    approvedAt: r.approvedAt,
    createdAt: r.createdAt,
    assignedTo: assignMap.get(r.id) ?? null,
    completionStatus: (r.completionStatus as 'AWAITING_REWARD' | 'COMPLETED' | null) ?? null,
    completedAt: r.completedAt,
  }));
}

export async function listApprovedFetches(): Promise<Fetch[]> {
  return listFetchesByStatus("APPROVED");
}

export async function listPendingFetches(): Promise<Fetch[]> {
  return listFetchesByStatus("PENDING_APPROVAL");
}

export async function getFetch(fetchId: string): Promise<Fetch | null> {
  const [row] = await db
    .select({
      id: fetches.id,
      creatorId: fetches.creatorId,
      creatorName: characters.name,
      title: fetches.title,
      description: fetches.description,
      status: fetches.status,
      requirements: fetches.requirements,
      approvedById: fetches.approvedById,
      approvedAt: fetches.approvedAt,
      createdAt: fetches.createdAt,
    })
    .from(fetches)
    .innerJoin(characters, eq(fetches.creatorId, characters.id))
    .where(eq(fetches.id, fetchId))
    .limit(1);

  if (!row) return null;

  const [a] = await db
    .select({ characterId: fetchAssignments.characterId })
    .from(fetchAssignments)
    .where(eq(fetchAssignments.fetchId, fetchId))
    .limit(1);

  const fetchRow = await db.query.fetches.findFirst({
    where: eq(fetches.id, fetchId),
  });

  return {
    id: row.id,
    creatorId: row.creatorId,
    creatorName: row.creatorName,
    title: row.title,
    description: row.description,
    status: row.status as FetchStatus,
    requirements: (row.requirements ?? {}) as FetchRequirements,
    rewardConfig: (fetchRow?.rewardConfig as FetchRewardConfig | null) ?? null,
    approvedById: row.approvedById,
    approvedAt: row.approvedAt,
    createdAt: row.createdAt,
    assignedTo: a?.characterId ?? null,
    completionStatus: (fetchRow?.completionStatus as 'AWAITING_REWARD' | 'COMPLETED' | null) ?? null,
    completedAt: fetchRow?.completedAt ?? null,
  };
}

export async function createFetch(
  creatorId: string,
  title: string,
  opts?: { description?: string; requirements?: FetchRequirements; rewardConfig?: FetchRewardConfig }
) {
  const [row] = await db
    .insert(fetches)
    .values({
      creatorId,
      title: title.trim().slice(0, 200),
      description: opts?.description?.trim().slice(0, 2000) || null,
      requirements: opts?.requirements ?? {},
      rewardConfig: opts?.rewardConfig ?? null,
      status: "PENDING_APPROVAL",
    })
    .returning();
  return row!;
}

export async function approveFetch(fetchId: string, approverId: string) {
  const [row] = await db
    .update(fetches)
    .set({ status: "APPROVED", approvedById: approverId, approvedAt: new Date() })
    .where(eq(fetches.id, fetchId))
    .returning();
  return row!;
}

export async function rejectFetch(fetchId: string) {
  const [row] = await db
    .update(fetches)
    .set({ status: "REJECTED" })
    .where(eq(fetches.id, fetchId))
    .returning();
  return row!;
}

/**
 * Verifica i limiti di frequenza per una fetch (limitPerDay, limitPerWeek).
 */
async function checkFrequencyLimits(characterId: string, requirements: FetchRequirements): Promise<boolean> {
  if (!requirements.limitPerDay && !requirements.limitPerWeek) {
    return true; // Nessun limite
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Inizio settimana (domenica)

  // Conta le fetch assegnate oggi
  if (requirements.limitPerDay) {
    const todayAssignments = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(fetchAssignments)
      .innerJoin(fetches, eq(fetchAssignments.fetchId, fetches.id))
      .where(
        and(
          eq(fetchAssignments.characterId, characterId),
          gte(fetchAssignments.assignedAt, todayStart),
          eq(fetches.status, 'APPROVED')
        )
      );

    if (todayAssignments[0]?.count && todayAssignments[0].count >= requirements.limitPerDay) {
      return false;
    }
  }

  // Conta le fetch assegnate questa settimana
  if (requirements.limitPerWeek) {
    const weekAssignments = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(fetchAssignments)
      .innerJoin(fetches, eq(fetchAssignments.fetchId, fetches.id))
      .where(
        and(
          eq(fetchAssignments.characterId, characterId),
          gte(fetchAssignments.assignedAt, weekStart),
          eq(fetches.status, 'APPROVED')
        )
      );

    if (weekAssignments[0]?.count && weekAssignments[0].count >= requirements.limitPerWeek) {
      return false;
    }
  }

  return true;
}

export async function assignFetchToSelf(fetchId: string, characterId: string) {
  const f = await getFetch(fetchId);
  if (!f) throw new Error("Fetch non trovata");
  if (f.status !== "APPROVED") throw new Error("Solo fetch approvate sono assegnabili");
  if (f.assignedTo) throw new Error("Fetch già assegnata");

  const ok = await meetsRequirements(characterId, f.requirements);
  if (!ok) throw new Error("Requisiti non soddisfatti");

  // Verifica limiti di frequenza
  const frequencyOk = await checkFrequencyLimits(characterId, f.requirements);
  if (!frequencyOk) {
    throw new Error("Limite di frequenza raggiunto per questa fetch");
  }

  const [row] = await db
    .insert(fetchAssignments)
    .values({ fetchId, characterId })
    .returning();
  return row!;
}

export async function getAssignmentForCharacter(characterId: string): Promise<Fetch | null> {
  const [a] = await db
    .select({ fetchId: fetchAssignments.fetchId })
    .from(fetchAssignments)
    .where(eq(fetchAssignments.characterId, characterId))
    .limit(1);
  if (!a) return null;
  return getFetch(a.fetchId);
}

/**
 * Marca una fetch come completata (dopo che i premi finali sono stati assegnati).
 */
export async function markFetchAsCompleted(fetchId: string) {
  const [row] = await db
    .update(fetches)
    .set({
      completionStatus: 'COMPLETED',
    })
    .where(eq(fetches.id, fetchId))
    .returning();
  return row!;
}
