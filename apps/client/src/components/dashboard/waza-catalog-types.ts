"use client";

import type { SkiruSheet } from "@domain/skiru";
import type { WazaPersonalValues } from "@domain/combat/waza-resolve";
import {
  resolveWazaCatalogFamily,
  type WazaCatalogFamily,
} from "@domain/progression/waza-catalog-family";
import type { WazaResolveExtras } from "@/hooks/useDoMechanicsSnapshot";

export type CatalogWaza = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  costExp: number | null;
  isPassive?: boolean;
  owned: boolean;
  canPurchase?: boolean;
  hexagonBlockedReason?: string | null;
  branchUnlocked?: boolean;
  keystoneOwned?: boolean;
  styleId?: string | null;
  madoshoId?: string | null;
  poolId?: string | null;
  rank?: string | null;
};

export type StyleHexRow = {
  id: string;
  label: string;
  unlocked: boolean;
  ownedWaza: number;
  isPrimary: boolean;
};

export type StyleHexState = {
  primaryStyleId: string | null;
  unlockedStyleIds: string[];
  styles: StyleHexRow[];
};

export type WazaCatalogSharedProps = {
  expSpendable: number;
  charKeys?: number;
  skiruSheet?: SkiruSheet | Record<string, number> | null;
  onCharUpdate?: () => void;
  fullHeight?: boolean;
  catalog: CatalogWaza[];
  hex: StyleHexState | null;
  loading: boolean;
  error: string | null;
  onReload: () => Promise<void>;
  csPreview: number;
  setCsPreview: (n: number) => void;
  resolveExtras?: WazaResolveExtras;
  charMadoshoId?: string | null;
};

export function filterCatalogByFamily(
  catalog: CatalogWaza[],
  family: WazaCatalogFamily,
): CatalogWaza[] {
  return catalog.filter((w) => resolveWazaCatalogFamily(w) === family);
}

export type { WazaCatalogFamily, WazaPersonalValues };
