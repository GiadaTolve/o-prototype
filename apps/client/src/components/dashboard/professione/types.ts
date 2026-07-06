import type { SocialClassDef, SocialClassId, SocialClassTag } from "@domain/shakai-kaikyu/types";

export type SocialSubclassEntry = {
  id: string;
  role: "keystone" | "path" | "capstone";
  nameRomaji: string;
  nameJa?: string;
  labelItalian: string;
  xpCost: number;
  description: string;
  tradeoffs?: string;
  unlocked: boolean;
  canUnlock: boolean;
  unlockErrors: string[];
};

export type SocialBudgetMetric = { max: number; used: number; remaining: number };

export type SocialClassState = {
  socialClass: SocialClassId | null;
  socialClassChosenAt: string | null;
  socialClassTag: SocialClassTag | null;
  socialSubclassSheet: Record<string, boolean>;
  expSpendable: number;
  classDef: SocialClassDef | null;
  subclasses: SocialSubclassEntry[];
  dailyBudget: {
    healHp: SocialBudgetMetric;
    integrity: SocialBudgetMetric;
    gather: SocialBudgetMetric;
    pactWeight: SocialBudgetMetric;
    pactActive: SocialBudgetMetric;
    ofudaPower: SocialBudgetMetric;
    ofudaActive: SocialBudgetMetric;
  } | null;
  dayKey: string;
  toolUx: { classId: SocialClassId; panelA: string; panelB?: string; summary: string } | null;
  catalog: SocialClassDef[];
};
